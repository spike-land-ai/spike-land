import { auth } from "@/lib/auth";
import { getUserFriendlyError } from "@/lib/errors/error-messages";
import { generateRequestId, logger } from "@/lib/errors/structured-logger";
import prisma from "@/lib/prisma";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { processAndUploadImage } from "@/lib/storage/upload-handler";
import { WorkspaceCreditManager } from "@/lib/credits/workspace-credit-manager";
import { ENHANCEMENT_COSTS, type EnhancementTier } from "@/lib/credits/costs";
import { tryCatch } from "@/lib/try-catch";
import { isSecureFilename } from "@/lib/upload/validation";
import {
  enhanceImageDirect,
  type EnhanceImageInput,
} from "@/workflows/enhance-image.direct";
import { JobStatus } from "@prisma/client";
import type { NextRequest } from "next/server";
import { after, NextResponse } from "next/server";

// Force dynamic rendering - skip static page data collection
export const dynamic = "force-dynamic";

// Allow longer execution time for image processing
export const maxDuration = 300;

async function handleUpload(
  request: NextRequest,
  requestId: string,
  requestLogger: ReturnType<typeof logger.child>,
): Promise<NextResponse> {
  requestLogger.info("Upload request received");

  const session = await auth();
  if (!session?.user?.id) {
    requestLogger.warn("Unauthorized upload attempt");
    const errorMessage = getUserFriendlyError(new Error("Unauthorized"), 401);
    return NextResponse.json(
      {
        error: errorMessage.message,
        title: errorMessage.title,
        suggestion: errorMessage.suggestion,
      },
      { status: 401, headers: { "X-Request-ID": requestId } },
    );
  }

  requestLogger.info("User authenticated", { userId: session.user.id });

  // Check rate limit before processing
  const rateLimitResult = await checkRateLimit(
    `upload:${session.user.id}`,
    rateLimitConfigs.imageUpload,
  );

  if (rateLimitResult.isLimited) {
    requestLogger.warn("Rate limit exceeded", { userId: session.user.id });
    const errorMessage = getUserFriendlyError(new Error("Rate limit"), 429);
    const retryAfter = Math.ceil(
      (rateLimitResult.resetAt - Date.now()) / 1000,
    );
    return NextResponse.json(
      {
        error: errorMessage.message,
        title: errorMessage.title,
        suggestion: errorMessage.suggestion,
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
  const albumId = formData.get("albumId") as string | null;

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

  // albumId is optional - if not provided, use TIER_1K as default
  let album = null;
  let defaultTier: EnhancementTier = "TIER_1K"; // Default for non-album uploads
  let pipelineId: string | null = null;

  if (albumId) {
    // Validate album exists and belongs to user
    album = await prisma.album.findFirst({
      where: {
        id: albumId,
        userId: session.user.id,
      },
    });

    if (!album) {
      requestLogger.warn("Invalid album ID", {
        albumId,
        userId: session.user.id,
      });
      const errorMessage = getUserFriendlyError(
        new Error("Invalid input"),
        400,
      );
      return NextResponse.json(
        {
          error: errorMessage.message,
          title: errorMessage.title,
          suggestion: "Album not found or you don't have access to it.",
        },
        { status: 400, headers: { "X-Request-ID": requestId } },
      );
    }

    defaultTier = album.defaultTier as EnhancementTier;
    pipelineId = album.pipelineId;
  }

  // Validate that the tier has a defined cost
  const tokenCost = ENHANCEMENT_COSTS[defaultTier];
  if (tokenCost === undefined) {
    requestLogger.error(
      "Invalid enhancement tier",
      new Error(`Unknown tier: ${defaultTier}`),
    );
    return NextResponse.json(
      { error: "Invalid enhancement tier configuration" },
      { status: 500, headers: { "X-Request-ID": requestId } },
    );
  }

  // Consume credits FIRST (prepay model) to prevent race conditions
  // If upload fails later, we'll refund the credits
  const consumeResult = await WorkspaceCreditManager.consumeCredits({
    userId: session.user.id,
    amount: tokenCost,
    source: "image_upload_enhancement",
    sourceId: `pending-${requestId}`,
  });

  if (!consumeResult.success) {
    const balance = await WorkspaceCreditManager.getBalance(session.user.id);
    requestLogger.warn("Insufficient credits for upload", {
      userId: session.user.id,
      required: tokenCost,
      available: balance?.remaining ?? 0,
    });
    const errorMessage = getUserFriendlyError(
      new Error("Insufficient credits"),
      402,
    );
    return NextResponse.json(
      {
        error: errorMessage.message,
        title: errorMessage.title,
        suggestion: `You need ${tokenCost} credits to upload and enhance this image. You have ${
          balance?.remaining ?? 0
        } credits.`,
        required: tokenCost,
        balance: balance?.remaining ?? 0,
      },
      { status: 402, headers: { "X-Request-ID": requestId } },
    );
  }

  requestLogger.info("Credits consumed upfront", {
    tokenCost,
    newBalance: consumeResult.remaining,
  });

  requestLogger.info("Processing file upload", {
    filename: file.name,
    fileSize: file.size,
    userId: session.user.id,
  });

  // Ensure user exists in database (upsert for JWT-based auth)
  // Note: email is excluded to avoid unique constraint errors - email is set by auth callback
  await prisma.user.upsert({
    where: { id: session.user.id },
    update: {
      name: session.user.name,
      image: session.user.image,
    },
    create: {
      id: session.user.id,
      name: session.user.name,
      image: session.user.image,
    },
  });

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Process and upload image
  const result = await processAndUploadImage({
    buffer,
    originalFilename: file.name,
    userId: session.user.id,
  });

  if (!result.success) {
    // Refund credits since upload failed
    await WorkspaceCreditManager.refundCredits(session.user.id, tokenCost);
    requestLogger.info("Credits refunded due to upload failure", { tokenCost });

    requestLogger.error(
      "Upload processing failed",
      new Error(result.error || "Unknown error"),
      {
        filename: file.name,
        userId: session.user.id,
      },
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

  // Create database record
  const enhancedImage = await prisma.enhancedImage.create({
    data: {
      userId: session.user.id,
      name: file.name,
      originalUrl: result.url,
      originalR2Key: result.r2Key,
      originalWidth: result.width,
      originalHeight: result.height,
      originalSizeBytes: result.sizeBytes,
      originalFormat: result.format,
      isPublic: false,
    },
  });

  // Create junction record to link image to album (if album was specified)
  if (albumId && album) {
    await prisma.albumImage.create({
      data: {
        albumId,
        imageId: enhancedImage.id,
      },
    });
  }

  // Tokens were already consumed upfront (prepay model)
  // Create enhancement job
  const job = await prisma.imageEnhancementJob.create({
    data: {
      imageId: enhancedImage.id,
      userId: session.user.id,
      tier: defaultTier,
      creditsCost: tokenCost,
      status: JobStatus.PROCESSING,
      processingStartedAt: new Date(),
      pipelineId: pipelineId,
    },
  });

  requestLogger.info("Enhancement job created for upload", {
    jobId: job.id,
    tier: defaultTier,
  });

  // Start enhancement using Next.js after() for background processing
  const enhancementInput: EnhanceImageInput = {
    jobId: job.id,
    imageId: enhancedImage.id,
    userId: session.user.id,
    originalR2Key: result.r2Key,
    tier: defaultTier,
    tokensCost: tokenCost,
  };

  requestLogger.info("Starting enhancement (direct mode with after())", {
    jobId: job.id,
  });

  after(async () => {
    const { error: enhanceError } = await tryCatch(
      enhanceImageDirect(enhancementInput),
    );
    if (enhanceError) {
      requestLogger.error(
        "Upload enhancement job failed",
        enhanceError instanceof Error ? enhanceError : new Error(String(enhanceError)),
        { jobId: job.id },
      );
    }
  });

  requestLogger.info("Upload completed successfully with auto-enhancement", {
    imageId: enhancedImage.id,
    jobId: job.id,
    filename: file.name,
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
        size: enhancedImage.originalSizeBytes,
        format: enhancedImage.originalFormat,
      },
      enhancement: {
        jobId: job.id,
        tier: defaultTier,
        tokenCost,
        newBalance: consumeResult.remaining,
      },
    },
    { headers: { "X-Request-ID": requestId } },
  );
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const requestLogger = logger.child({
    requestId,
    route: "/api/images/upload",
  });

  const { data: response, error } = await tryCatch(
    handleUpload(request, requestId, requestLogger),
  );

  if (error) {
    requestLogger.error(
      "Unexpected error in upload API",
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
