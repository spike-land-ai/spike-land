import { getOrCreateAnonymousUser } from "@/lib/anonymous-user";
import { getUserFriendlyError } from "@/lib/errors/error-messages";
import { generateRequestId, logger } from "@/lib/errors/structured-logger";
import prisma from "@/lib/prisma";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { processAndUploadImage } from "@/lib/storage/upload-handler";
import { tryCatch } from "@/lib/try-catch";
import { isSecureFilename } from "@/lib/upload/validation";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Force dynamic rendering - skip static page data collection
export const dynamic = "force-dynamic";

// Allow longer execution time for image processing
export const maxDuration = 120;

/**
 * Get client IP address from request headers.
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIP = forwarded.split(",")[0];
    if (firstIP) {
      return firstIP.trim();
    }
  }
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  return "unknown";
}

async function handleAnonymousUpload(
  request: NextRequest,
  requestId: string,
  requestLogger: ReturnType<typeof logger.child>,
): Promise<NextResponse> {
  requestLogger.info("Anonymous upload request received");

  const clientIP = getClientIP(request);

  // Check rate limit by IP
  const rateLimitResult = await checkRateLimit(
    `anonymous-upload:${clientIP}`,
    rateLimitConfigs.anonymousUpload,
  );

  if (rateLimitResult.isLimited) {
    requestLogger.warn("Anonymous rate limit exceeded", { clientIP });
    const errorMessage = getUserFriendlyError(new Error("Rate limit"), 429);
    const retryAfter = Math.ceil(
      (rateLimitResult.resetAt - Date.now()) / 1000,
    );
    return NextResponse.json(
      {
        error: errorMessage.message,
        title: errorMessage.title,
        suggestion: "Please wait before uploading more images.",
        retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rateLimitResult.resetAt),
          "X-Request-ID": requestId,
        },
      },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    requestLogger.warn("No file provided");
    const errorMessage = getUserFriendlyError(
      new Error("Invalid input"),
      400,
    );
    return NextResponse.json(
      {
        error: errorMessage.message,
        title: errorMessage.title,
        suggestion: "Please provide a file to upload.",
      },
      { status: 400, headers: { "X-Request-ID": requestId } },
    );
  }

  // Validate filename for security (path traversal, hidden files)
  if (!isSecureFilename(file.name)) {
    requestLogger.warn("Insecure filename rejected", { filename: file.name });
    return NextResponse.json(
      {
        error:
          "Invalid filename. Filenames cannot contain path traversal characters or be hidden files.",
      },
      { status: 400, headers: { "X-Request-ID": requestId } },
    );
  }

  // Get or create the anonymous system user
  const anonymousUserId = await getOrCreateAnonymousUser();

  requestLogger.info("Processing anonymous file upload", {
    filename: file.name,
    fileSize: file.size,
    clientIP,
  });

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Process and upload image
  const result = await processAndUploadImage({
    buffer,
    originalFilename: file.name,
    userId: anonymousUserId,
  });

  if (!result.success) {
    requestLogger.error(
      "Anonymous upload processing failed",
      new Error(result.error || "Unknown error"),
      { filename: file.name, clientIP },
    );
    const errorMessage = getUserFriendlyError(
      new Error(result.error || "Upload processing failed"),
      500,
    );
    return NextResponse.json(
      {
        error: errorMessage.message,
        title: errorMessage.title,
        suggestion: errorMessage.suggestion,
      },
      { status: 500, headers: { "X-Request-ID": requestId } },
    );
  }

  // Create database record with isPublic: true for anonymous images
  const enhancedImage = await prisma.enhancedImage.create({
    data: {
      userId: anonymousUserId,
      name: file.name,
      originalUrl: result.url,
      originalR2Key: result.r2Key,
      originalWidth: result.width,
      originalHeight: result.height,
      originalSizeBytes: result.sizeBytes,
      originalFormat: result.format,
      isPublic: true, // Anonymous images are public by default
    },
  });

  requestLogger.info("Anonymous upload completed successfully", {
    imageId: enhancedImage.id,
    filename: file.name,
    clientIP,
  });

  return NextResponse.json(
    {
      success: true,
      image: {
        id: enhancedImage.id,
        name: enhancedImage.name,
        url: enhancedImage.originalUrl,
        width: enhancedImage.originalWidth,
        height: enhancedImage.originalHeight,
      },
    },
    { headers: { "X-Request-ID": requestId } },
  );
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const requestLogger = logger.child({
    requestId,
    route: "/api/images/anonymous-upload",
  });

  const { data: response, error } = await tryCatch(
    handleAnonymousUpload(request, requestId, requestLogger),
  );

  if (error) {
    requestLogger.error(
      "Unexpected error in anonymous upload API",
      error instanceof Error ? error : new Error(String(error)),
    );
    const errorMessage = getUserFriendlyError(
      error instanceof Error ? error : new Error("Upload failed"),
      500,
    );
    return NextResponse.json(
      {
        error: errorMessage.message,
        title: errorMessage.title,
        suggestion: errorMessage.suggestion,
      },
      { status: 500, headers: { "X-Request-ID": requestId } },
    );
  }

  return response;
}
