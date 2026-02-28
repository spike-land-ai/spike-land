import prisma from "@/lib/prisma";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ token: string; }>;
}

/**
 * GET /api/share/[token]/download
 *
 * Public download endpoint for shared images.
 * Validates share token and proxies the image download.
 *
 * Query params:
 * - type: 'original' | 'enhanced' - Which version to download
 *
 * Response:
 * - Success: Image blob with Content-Disposition header
 * - Error: JSON with error message
 */
import { tryCatch } from "@/lib/try-catch";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest, context: RouteContext) {
  const { data: params, error: paramsError } = await tryCatch(context.params);
  if (paramsError) {
    return NextResponse.json(
      { error: "Invalid parameters" },
      { status: 400 },
    );
  }
  const { token } = params;
  const type = request.nextUrl.searchParams.get("type");

  // Validate type parameter
  if (!type || !["original", "enhanced"].includes(type)) {
    return NextResponse.json(
      { error: "Invalid type. Must be 'original' or 'enhanced'" },
      { status: 400 },
    );
  }

  // Rate limiting by IP (for public access)
  const ip = request.headers.get("x-forwarded-for")
    || request.headers.get("x-real-ip")
    || "unknown";
  const { data: rateLimitResult, error: rateLimitError } = await tryCatch(
    checkRateLimit(
      `share-download:${ip}`,
      rateLimitConfigs.general,
    ),
  );

  if (rateLimitError) {
    logger.error("Rate limit check failed:", rateLimitError);
    // Proceed or block? Let's assume fail-open for now or consistent error
  }

  if (rateLimitResult?.isLimited) {
    return NextResponse.json(
      {
        error: "Too many download requests",
        retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
          ),
        },
      },
    );
  }

  // Validate share token and get image data
  const { data: image, error: dbError } = await tryCatch(
    prisma.enhancedImage.findUnique({
      where: { shareToken: token },
      include: {
        enhancementJobs: {
          where: {
            status: "COMPLETED",
            enhancedUrl: { not: null },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
  );

  if (dbError) {
    logger.error("Database error:", dbError);
    return NextResponse.json(
      { error: "Failed to download image" },
      { status: 500 },
    );
  }

  if (!image) {
    return NextResponse.json(
      { error: "Image not found" },
      { status: 404 },
    );
  }

  // Get the appropriate URL
  let url: string | null = null;
  let filename: string;

  if (type === "enhanced") {
    const latestEnhancement = image.enhancementJobs[0];
    if (!latestEnhancement?.enhancedUrl) {
      return NextResponse.json(
        { error: "Enhanced image not available" },
        { status: 404 },
      );
    }
    url = latestEnhancement.enhancedUrl;
    const tierSuffix = latestEnhancement.tier.toLowerCase().replace(
      "tier_",
      "",
    );
    filename = `${image.name}_enhanced_${tierSuffix}`;
  } else {
    url = image.originalUrl;
    filename = `${image.name}_original`;
  }

  // Proxy the download
  const { data: imageResponse, error: fetchError } = await tryCatch(fetch(url));

  if (fetchError || !imageResponse.ok) {
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 502 },
    );
  }

  // Get content type from response or default to jpeg
  const contentType = imageResponse.headers.get("Content-Type")
    || "image/jpeg";

  // Determine file extension from content type
  const extensionMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const extension = extensionMap[contentType] || "jpg";

  // Sanitize filename
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9_-]/g, "_");

  // Return the image with download headers
  return new NextResponse(imageResponse.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${sanitizedFilename}.${extension}"`,
      "Cache-Control": "private, max-age=3600",
      "X-RateLimit-Remaining": String(rateLimitResult?.remaining ?? 0),
    },
  });
}
