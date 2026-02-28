import {
  getOrCreateAnonymousUser,
  isAnonymousUserId,
} from "@/lib/anonymous-user";
import { getUserFriendlyError } from "@/lib/errors/error-messages";
import { generateRequestId, logger } from "@/lib/errors/structured-logger";
import prisma from "@/lib/prisma";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { processAndUploadImage } from "@/lib/storage/upload-handler";
import { tryCatch } from "@/lib/try-catch";
import {
  enhanceImageDirect,
  type EnhanceImageInput,
} from "@/workflows/enhance-image.direct";
import { JobStatus } from "@prisma/client";
import type { NextRequest } from "next/server";
import { after, NextResponse } from "next/server";

// Force dynamic rendering - skip static page data collection
export const dynamic = "force-dynamic";

// Allow longer execution time for image enhancements
export const maxDuration = 300;

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

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const requestLogger = logger.child({
    requestId,
    route: "/api/images/anonymous-enhance",
  });

  requestLogger.info("Anonymous enhancement request received");

  const clientIP = getClientIP(request);

  // Check rate limit by IP
  const rateLimitResult = await checkRateLimit(
    `anonymous-mix:${clientIP}`,
    rateLimitConfigs.anonymousMix,
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
        suggestion: "Please wait before creating more mixes.",
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

  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    requestLogger.error(
      "Failed to parse request body",
      jsonError instanceof Error ? jsonError : new Error(String(jsonError)),
    );
    const errorMessage = getUserFriendlyError(
      jsonError instanceof Error ? jsonError : new Error("Invalid JSON"),
      400,
    );
    return NextResponse.json(
      {
        error: errorMessage.message,
        title: errorMessage.title,
        suggestion: "Please provide a valid JSON request body.",
      },
      { status: 400, headers: { "X-Request-ID": requestId } },
    );
  }

  const { imageId, blendSource } = body as {
    imageId: string;
    /** Blend source for image mixing (required for anonymous mix) */
    blendSource: {
      base64?: string;
      mimeType?: string;
      imageId?: string;
    };
  };

  // Anonymous mixes are forced to FREE tier only
  const tier = "FREE";

  if (!imageId) {
    requestLogger.warn("Missing required imageId");
    const errorMessage = getUserFriendlyError(
      new Error("Invalid input"),
      400,
    );
    return NextResponse.json(
      {
        error: errorMessage.message,
        title: errorMessage.title,
        suggestion: "Please provide an imageId.",
      },
      { status: 400, headers: { "X-Request-ID": requestId } },
    );
  }

  if (!blendSource) {
    requestLogger.warn("Missing required blendSource for anonymous mix");
    return NextResponse.json(
      {
        error: "Blend source is required for mix",
        title: "Missing blend source",
        suggestion: "Please provide a second image for mixing.",
      },
      { status: 400, headers: { "X-Request-ID": requestId } },
    );
  }

  // Get or create anonymous user
  const anonymousUserId = await getOrCreateAnonymousUser();

  // Find the target image (must be owned by anonymous user for anonymous mixes)
  const image = await prisma.enhancedImage.findUnique({
    where: { id: imageId },
  });

  if (!image) {
    requestLogger.warn("Image not found", { imageId });
    const errorMessage = getUserFriendlyError(new Error("Not found"), 404);
    return NextResponse.json(
      {
        error: errorMessage.message,
        title: errorMessage.title,
        suggestion: "The image could not be found. Please upload again.",
      },
      { status: 404, headers: { "X-Request-ID": requestId } },
    );
  }

  // For anonymous mixes, the image must belong to the anonymous user
  if (!isAnonymousUserId(image.userId)) {
    requestLogger.warn("Image does not belong to anonymous user", {
      imageId,
      imageUserId: image.userId,
    });
    return NextResponse.json(
      {
        error: "Image not accessible",
        title: "Access denied",
        suggestion: "Please upload the image again using the anonymous upload.",
      },
      { status: 403, headers: { "X-Request-ID": requestId } },
    );
  }

  // Variables to track blend source for job creation
  let resolvedBlendSource: { base64: string; mimeType: string; } | null = null;
  let sourceImageId: string | null = null;

  // Handle blend source - for anonymous, we only support base64 uploads
  if (blendSource.base64) {
    if (typeof blendSource.base64 !== "string") {
      requestLogger.warn("Invalid blend source - invalid base64 data");
      return NextResponse.json(
        {
          error: "Invalid blend image data",
          title: "Invalid blend",
          suggestion: "Please try dropping the image again.",
        },
        { status: 400, headers: { "X-Request-ID": requestId } },
      );
    }

    if (!blendSource.mimeType || !blendSource.mimeType.startsWith("image/")) {
      requestLogger.warn("Invalid blend source - invalid mimeType", {
        mimeType: blendSource.mimeType,
      });
      return NextResponse.json(
        {
          error: "Invalid blend image type",
          title: "Invalid blend",
          suggestion: "Please use a valid image file (JPEG, PNG, WebP, or GIF).",
        },
        { status: 400, headers: { "X-Request-ID": requestId } },
      );
    }

    // Validate base64 size (rough estimate: base64 adds ~33% overhead)
    const estimatedSize = (blendSource.base64.length * 3) / 4;
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (estimatedSize > maxSize) {
      requestLogger.warn("Blend source too large", {
        estimatedSize,
        maxSize,
      });
      return NextResponse.json(
        {
          error: "Blend image is too large",
          title: "File too large",
          suggestion: "Please use an image smaller than 20MB.",
        },
        { status: 400, headers: { "X-Request-ID": requestId } },
      );
    }

    // Upload blend source to R2 and create EnhancedImage record
    const buffer = Buffer.from(blendSource.base64, "base64");
    const extension = blendSource.mimeType.split("/")[1] || "jpg";

    const { data: uploadResult, error: uploadError } = await tryCatch(
      processAndUploadImage({
        buffer,
        originalFilename: `blend-source-anon-${Date.now()}.${extension}`,
        userId: anonymousUserId,
      }),
    );

    if (uploadError || !uploadResult?.success) {
      requestLogger.error(
        "Failed to upload blend source image",
        uploadError instanceof Error
          ? uploadError
          : new Error(uploadResult?.error || "Upload failed"),
        { targetImageId: imageId, clientIP },
      );
      return NextResponse.json(
        {
          error: "Failed to save blend source image",
          title: "Upload failed",
          suggestion: "Please try again with the same image.",
        },
        { status: 500, headers: { "X-Request-ID": requestId } },
      );
    }

    // Create EnhancedImage record for the blend source
    const { data: blendSourceImage, error: createError } = await tryCatch(
      prisma.enhancedImage.create({
        data: {
          userId: anonymousUserId,
          name: "Blend Source",
          originalUrl: uploadResult.url,
          originalR2Key: uploadResult.r2Key,
          originalWidth: uploadResult.width,
          originalHeight: uploadResult.height,
          originalSizeBytes: uploadResult.sizeBytes,
          originalFormat: uploadResult.format,
          isPublic: true, // Anonymous images are public
        },
      }),
    );

    if (createError || !blendSourceImage) {
      requestLogger.error(
        "Failed to create blend source image record",
        createError instanceof Error
          ? createError
          : new Error("Failed to create record"),
        { targetImageId: imageId, uploadResult },
      );
      return NextResponse.json(
        {
          error: "Failed to save blend source image",
          title: "Database error",
          suggestion: "Please try again.",
        },
        { status: 500, headers: { "X-Request-ID": requestId } },
      );
    }

    resolvedBlendSource = {
      base64: blendSource.base64,
      mimeType: blendSource.mimeType,
    };
    sourceImageId = blendSourceImage.id;

    requestLogger.info("Anonymous blend: uploaded file stored", {
      mimeType: blendSource.mimeType,
      targetImageId: imageId,
      sourceImageId: blendSourceImage.id,
      clientIP,
    });
  } else if (blendSource.imageId) {
    // For imageId-based blending, verify the image belongs to anonymous user
    const { data: sourceImage, error: sourceError } = await tryCatch(
      prisma.enhancedImage.findUnique({
        where: { id: blendSource.imageId },
        select: {
          id: true,
          userId: true,
          originalUrl: true,
          originalFormat: true,
        },
      }),
    );

    if (sourceError || !sourceImage) {
      requestLogger.warn("Blend source image not found", {
        sourceImageId: blendSource.imageId,
      });
      return NextResponse.json(
        {
          error: "Blend source image not found",
          title: "Image not found",
          suggestion: "The selected image may have been deleted.",
        },
        { status: 404, headers: { "X-Request-ID": requestId } },
      );
    }

    // Verify the source image belongs to anonymous user
    if (!isAnonymousUserId(sourceImage.userId)) {
      requestLogger.warn("Blend source not owned by anonymous user", {
        sourceImageId: blendSource.imageId,
      });
      return NextResponse.json(
        {
          error: "Access denied to blend source image",
          title: "Access denied",
          suggestion: "Please upload the image again.",
        },
        { status: 403, headers: { "X-Request-ID": requestId } },
      );
    }

    // Fetch the image from R2 and convert to base64
    const { data: fetchResponse, error: fetchError } = await tryCatch(
      fetch(sourceImage.originalUrl, {
        headers: { Accept: "image/*" },
      }),
    );

    if (fetchError || !fetchResponse || !fetchResponse.ok) {
      requestLogger.error(
        "Failed to fetch blend source image from R2",
        fetchError instanceof Error ? fetchError : new Error("Fetch failed"),
        { sourceImageId: blendSource.imageId, url: sourceImage.originalUrl },
      );
      return NextResponse.json(
        {
          error: "Failed to load blend source image",
          title: "Image load failed",
          suggestion: "Please try again or select a different image.",
        },
        { status: 500, headers: { "X-Request-ID": requestId } },
      );
    }

    const { data: arrayBuffer, error: bufferError } = await tryCatch(
      fetchResponse.arrayBuffer(),
    );

    if (bufferError || !arrayBuffer) {
      requestLogger.error(
        "Failed to read blend source image data",
        bufferError instanceof Error
          ? bufferError
          : new Error("Buffer read failed"),
        { sourceImageId: blendSource.imageId },
      );
      return NextResponse.json(
        {
          error: "Failed to process blend source image",
          title: "Processing failed",
          suggestion: "Please try again or select a different image.",
        },
        { status: 500, headers: { "X-Request-ID": requestId } },
      );
    }

    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = fetchResponse.headers.get("content-type")
      || `image/${sourceImage.originalFormat || "jpeg"}`;

    resolvedBlendSource = { base64, mimeType };
    sourceImageId = sourceImage.id;

    requestLogger.info("Anonymous blend: stored image resolved", {
      sourceImageId: sourceImage.id,
      targetImageId: imageId,
      mimeType,
      clientIP,
    });
  } else {
    requestLogger.warn("Invalid blend source - no imageId or base64 provided");
    return NextResponse.json(
      {
        error: "Invalid blend source",
        title: "Invalid blend",
        suggestion: "Please provide either an image ID or base64 data.",
      },
      { status: 400, headers: { "X-Request-ID": requestId } },
    );
  }

  // Create enhancement job with isAnonymous flag
  // FREE tier costs 0 tokens
  const tokenCost = 0;

  const { data: job, error: jobError } = await tryCatch(
    prisma.imageEnhancementJob.create({
      data: {
        imageId,
        userId: anonymousUserId,
        tier,
        creditsCost: tokenCost,
        status: JobStatus.PROCESSING,
        processingStartedAt: new Date(),
        sourceImageId: sourceImageId,
        isBlend: true,
        isAnonymous: true, // Mark as anonymous job for public access
      },
    }),
  );

  if (jobError || !job) {
    requestLogger.error(
      "Failed to create enhancement job",
      jobError instanceof Error ? jobError : new Error(String(jobError)),
      { imageId, clientIP },
    );
    const errorMessage = getUserFriendlyError(
      jobError instanceof Error ? jobError : new Error("Failed to create job"),
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

  requestLogger.info("Anonymous enhancement job created", {
    jobId: job.id,
    tier,
    sourceImageId,
    clientIP,
  });

  const enhancementInput: EnhanceImageInput = {
    jobId: job.id,
    imageId: image.id,
    userId: anonymousUserId,
    originalR2Key: image.originalR2Key,
    tier,
    tokensCost: tokenCost,
    blendSource: resolvedBlendSource,
  };

  // Use Next.js after() for background processing
  requestLogger.info(
    "Starting anonymous enhancement (direct mode with after())",
    {
      jobId: job.id,
    },
  );

  after(async () => {
    const { error } = await tryCatch(enhanceImageDirect(enhancementInput));
    if (error) {
      requestLogger.error(
        "Anonymous enhancement job failed",
        error instanceof Error ? error : new Error(String(error)),
        { jobId: job.id },
      );
    }
  });

  return NextResponse.json(
    {
      success: true,
      jobId: job.id,
      tier,
    },
    { headers: { "X-Request-ID": requestId } },
  );
}
