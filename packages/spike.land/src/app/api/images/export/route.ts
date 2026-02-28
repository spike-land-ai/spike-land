import { auth } from "@/lib/auth";
import { detectMimeType } from "@/lib/images/image-dimensions";
import prisma from "@/lib/prisma";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { downloadFromR2 } from "@/lib/storage/r2-client";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * Valid export formats
 */
type ExportFormat = "png" | "jpeg" | "webp";

function isValidFormat(format: string): format is ExportFormat {
  return ["png", "jpeg", "webp"].includes(format);
}

function getFileExtension(format: ExportFormat): string {
  return format === "jpeg" ? "jpg" : format;
}

function getMimeType(format: ExportFormat): string {
  return `image/${format}`;
}

/**
 * POST /api/images/export
 *
 * Exports an enhanced image. Format conversion is handled client-side.
 * This endpoint downloads and returns the stored enhanced image.
 *
 * Request body:
 * - imageId: string - ID of the enhanced image
 * - format: 'png' | 'jpeg' | 'webp' - Desired output format (for filename)
 * - quality?: number - Quality hint (passed to client for conversion)
 *
 * Response:
 * - Success: Image blob with Content-Type header
 * - Error: JSON with error message
 *
 * Note: Server-side format conversion removed for PnP compatibility.
 * Enhanced images are returned as stored. Use client-side Canvas API
 * for format conversion if needed.
 */
export async function POST(request: NextRequest) {
  // Authenticate user
  const { data: session, error: authError } = await tryCatch(auth());
  if (authError) {
    logger.error("Error in export API:", authError);
    return NextResponse.json(
      {
        error: authError instanceof Error
          ? authError.message
          : "Failed to export image",
      },
      { status: 500 },
    );
  }
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting
  const { data: rateLimitResult, error: rateLimitError } = await tryCatch(
    checkRateLimit(`export:${session.user.id}`, rateLimitConfigs.general),
  );

  if (rateLimitError) {
    logger.error("Error in export API:", rateLimitError);
    return NextResponse.json(
      {
        error: rateLimitError instanceof Error
          ? rateLimitError.message
          : "Failed to export image",
      },
      { status: 500 },
    );
  }

  if (rateLimitResult.isLimited) {
    return NextResponse.json(
      {
        error: "Too many export requests",
        retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
          ),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rateLimitResult.resetAt),
        },
      },
    );
  }

  // Parse request body
  const { data: body, error: parseError } = await tryCatch(request.json());
  if (parseError) {
    logger.error("Error in export API:", parseError);
    return NextResponse.json(
      {
        error: parseError instanceof Error
          ? parseError.message
          : "Failed to export image",
      },
      { status: 500 },
    );
  }
  const { imageId, format } = body as {
    imageId: string;
    format: string;
    quality?: number;
  };

  // Validate required parameters
  if (!imageId || !format) {
    return NextResponse.json(
      { error: "Missing imageId or format" },
      { status: 400 },
    );
  }

  // Validate format
  if (!isValidFormat(format)) {
    return NextResponse.json(
      { error: "Invalid format. Must be png, jpeg, or webp" },
      { status: 400 },
    );
  }

  // Find the enhancement job
  const { data: job, error: jobError } = await tryCatch(
    prisma.imageEnhancementJob.findFirst({
      where: {
        id: imageId,
        userId: session.user.id,
        status: "COMPLETED",
      },
      include: {
        image: true,
      },
    }),
  );

  if (jobError) {
    logger.error("Error in export API:", jobError);
    return NextResponse.json(
      {
        error: jobError instanceof Error
          ? jobError.message
          : "Failed to export image",
      },
      { status: 500 },
    );
  }

  if (!job || !job.enhancedR2Key) {
    return NextResponse.json(
      { error: "Enhanced image not found" },
      { status: 404 },
    );
  }

  // Download the enhanced image from R2
  const { data: imageBuffer, error: downloadError } = await tryCatch(
    downloadFromR2(job.enhancedR2Key),
  );

  if (downloadError) {
    logger.error("Error in export API:", downloadError);
    return NextResponse.json(
      {
        error: downloadError instanceof Error
          ? downloadError.message
          : "Failed to export image",
      },
      { status: 500 },
    );
  }

  if (!imageBuffer) {
    return NextResponse.json(
      { error: "Failed to download image" },
      { status: 500 },
    );
  }

  // Detect actual mime type from buffer
  const actualMimeType = detectMimeType(imageBuffer);

  // Generate filename with requested format extension
  const originalFilename = job.image.name.replace(/\.[^/.]+$/, "");
  const extension = getFileExtension(format);
  const filename = `${originalFilename}_enhanced_${job.tier.toLowerCase()}.${extension}`;

  // Return the image as stored
  // Note: If format conversion is needed, client should handle via Canvas API
  // Convert Buffer to Uint8Array for NextResponse compatibility
  return new NextResponse(new Uint8Array(imageBuffer), {
    status: 200,
    headers: {
      "Content-Type": format === "png" ? actualMimeType : getMimeType(format),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(imageBuffer.length),
      "Cache-Control": "private, max-age=3600",
      "X-RateLimit-Remaining": String(rateLimitResult.remaining),
      // Hint for client if conversion is needed
      "X-Original-Format": actualMimeType,
      "X-Requested-Format": getMimeType(format),
    },
  });
}
