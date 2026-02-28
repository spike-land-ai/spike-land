import { auth } from "@/lib/auth";
import { getUserFriendlyError } from "@/lib/errors/error-messages";
import { generateRequestId, logger } from "@/lib/errors/structured-logger";
import prisma from "@/lib/prisma";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { deleteFromR2 } from "@/lib/storage/r2-client";
import { processAndUploadImage } from "@/lib/storage/upload-handler";
import { WorkspaceCreditManager } from "@/lib/credits/workspace-credit-manager";
import type { EnhancementTier } from "@/lib/credits/costs";
import { ENHANCEMENT_COSTS } from "@/lib/credits/costs";
import { tryCatch } from "@/lib/try-catch";
import { isSecureFilename } from "@/lib/upload/validation";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const MAX_BATCH_SIZE = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_TOTAL_BATCH_SIZE = 50 * 1024 * 1024; // 50MB total

interface UploadResult {
  success: boolean;
  filename: string;
  imageId?: string;
  url?: string;
  width?: number;
  height?: number;
  size?: number;
  format?: string;
  error?: string;
  errorType?: "validation" | "upload" | "database" | "unknown";
}

interface UploadedFileData {
  filename: string;
  r2Key: string;
  url: string;
  width: number;
  height: number;
  sizeBytes: number;
  format: string;
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const requestLogger = logger.child({
    requestId,
    route: "/api/images/batch-upload",
  });

  const { data: mainResult, error: mainError } = await tryCatch(
    handleBatchUpload(request, requestId, requestLogger),
  );

  if (mainError) {
    requestLogger.error(
      "Unexpected error in batch upload API",
      mainError instanceof Error ? mainError : new Error(String(mainError)),
    );
    const errorMessage = getUserFriendlyError(
      mainError instanceof Error ? mainError : new Error("Batch upload failed"),
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

  return mainResult;
}

async function handleBatchUpload(
  request: NextRequest,
  requestId: string,
  requestLogger: ReturnType<typeof logger.child>,
): Promise<NextResponse> {
  requestLogger.info("Batch upload request received");

  const session = await auth();
  if (!session?.user?.id) {
    requestLogger.warn("Unauthorized batch upload attempt");
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
  const files = formData.getAll("files") as File[];
  const albumId = formData.get("albumId") as string | null;

  // albumId is optional - if not provided, use TIER_1K as default
  let album: { id: string; userId: string; defaultTier: string; } | null = null;
  let defaultTier: EnhancementTier = "TIER_1K"; // Default for non-album uploads

  if (albumId) {
    album = await prisma.album.findUnique({
      where: { id: albumId },
      select: {
        id: true,
        userId: true,
        defaultTier: true,
      },
    });

    if (!album || album.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Album not found or access denied." },
        { status: 404, headers: { "X-Request-ID": requestId } },
      );
    }

    defaultTier = album.defaultTier as EnhancementTier;
  }

  // Validate that the tier has a defined cost
  const costPerImage = ENHANCEMENT_COSTS[defaultTier];
  if (costPerImage === undefined) {
    requestLogger.error(
      "Invalid enhancement tier",
      new Error(`Unknown tier: ${defaultTier}`),
    );
    return NextResponse.json(
      { error: "Invalid enhancement tier configuration" },
      { status: 500, headers: { "X-Request-ID": requestId } },
    );
  }

  // Calculate cost
  const totalCost = files.length * costPerImage;

  // Check balance
  const balance = await WorkspaceCreditManager.getBalance(session.user.id);
  if (!balance || balance.remaining < totalCost) {
    return NextResponse.json(
      {
        error: `Insufficient credits. You need ${totalCost} credits but have ${
          balance?.remaining ?? 0
        }.`,
        title: "Insufficient Credits",
        suggestion: "Please upgrade your plan to continue uploading.",
      },
      { status: 402, headers: { "X-Request-ID": requestId } },
    );
  }

  // Deduct credits upfront
  // If R2 fails for ALL, we refund.
  await WorkspaceCreditManager.consumeCredits({
    userId: session.user.id,
    amount: totalCost,
    source: "BATCH_UPLOAD",
    sourceId: requestId,
  });

  if (!files || files.length === 0) {
    requestLogger.warn("No files provided");
    const errorMessage = getUserFriendlyError(new Error("Invalid input"), 400);
    return NextResponse.json(
      {
        error: errorMessage.message,
        title: errorMessage.title,
        suggestion: "Please provide files to upload.",
      },
      { status: 400, headers: { "X-Request-ID": requestId } },
    );
  }

  if (files.length > MAX_BATCH_SIZE) {
    requestLogger.warn("Batch size exceeded", {
      fileCount: files.length,
      maxAllowed: MAX_BATCH_SIZE,
    });
    const errorMessage = getUserFriendlyError(new Error("Invalid input"), 400);
    return NextResponse.json(
      {
        error: errorMessage.message,
        title: errorMessage.title,
        suggestion: `Please upload a maximum of ${MAX_BATCH_SIZE} files per batch.`,
      },
      { status: 400, headers: { "X-Request-ID": requestId } },
    );
  }

  // Validate filenames for security (prevent path traversal, hidden files, etc.)
  const invalidFilenames = files
    .filter(f => !isSecureFilename(f.name))
    .map(f => f.name);
  if (invalidFilenames.length > 0) {
    requestLogger.warn("Invalid filenames detected", { invalidFilenames });
    return NextResponse.json(
      { error: "Invalid filenames detected", invalidFilenames },
      { status: 400, headers: { "X-Request-ID": requestId } },
    );
  }

  // Validate all files before processing
  let totalSize = 0;
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      requestLogger.warn("File size exceeded", {
        filename: file.name,
        size: file.size,
      });
      const errorMessage = getUserFriendlyError(
        new Error("Invalid input"),
        400,
      );
      return NextResponse.json(
        {
          error: errorMessage.message,
          title: errorMessage.title,
          suggestion: `File "${file.name}" exceeds maximum size of 10MB.`,
        },
        { status: 400, headers: { "X-Request-ID": requestId } },
      );
    }
    totalSize += file.size;
  }

  // Validate total batch size
  if (totalSize > MAX_TOTAL_BATCH_SIZE) {
    requestLogger.warn("Total batch size exceeded", {
      totalSize,
      maxAllowed: MAX_TOTAL_BATCH_SIZE,
    });
    const errorMessage = getUserFriendlyError(new Error("Invalid input"), 400);
    return NextResponse.json(
      {
        error: errorMessage.message,
        title: errorMessage.title,
        suggestion: `Total batch size exceeds maximum of 50MB (current: ${
          Math.round(totalSize / 1024 / 1024)
        }MB).`,
      },
      { status: 400, headers: { "X-Request-ID": requestId } },
    );
  }

  requestLogger.info("Processing batch upload", {
    fileCount: files.length,
    totalSize,
    userId: session.user.id,
  });

  // Ensure user exists in database (upsert for JWT-based auth)
  await prisma.user.upsert({
    where: { id: session.user.id },
    update: {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    },
    create: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    },
  });

  // PHASE 1: Upload all files to R2 first
  requestLogger.info("Starting R2 upload phase");
  const uploadedFiles: (UploadedFileData & { index: number; })[] = [];
  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file) continue;

    // Convert File to Buffer
    const { data: arrayBuffer, error: bufferError } = await tryCatch(
      file.arrayBuffer(),
    );

    if (bufferError) {
      results[i] = {
        success: false,
        filename: file.name,
        error: bufferError instanceof Error
          ? bufferError.message
          : "Failed to read file",
        errorType: "unknown",
      };
      continue;
    }

    const buffer = Buffer.from(arrayBuffer);

    // Process and upload image to R2
    const { data: result, error: uploadError } = await tryCatch(
      processAndUploadImage({
        buffer,
        originalFilename: file.name,
        userId: session.user.id,
      }),
    );

    if (uploadError) {
      results[i] = {
        success: false,
        filename: file.name,
        error: uploadError instanceof Error
          ? uploadError.message
          : "Upload failed",
        errorType: "unknown",
      };
      continue;
    }

    if (!result.success) {
      results[i] = {
        success: false,
        filename: file.name,
        error: result.error || "Failed to upload image",
        errorType: "upload",
      };
      continue;
    }

    // Track successfully uploaded files for later database transaction
    uploadedFiles.push({
      index: i,
      filename: file.name,
      r2Key: result.r2Key,
      url: result.url,
      width: result.width,
      height: result.height,
      sizeBytes: result.sizeBytes,
      format: result.format,
    });

    // Placeholder - will be filled after transaction
    results[i] = {
      success: false,
      filename: file.name,
      error: "Pending database creation",
      errorType: "database",
    };
  }

  // If all files failed during upload, return early without database transaction
  if (uploadedFiles.length === 0) {
    requestLogger.warn("All files failed during R2 upload phase", {
      failureCount: results.filter(r => !r.success).length,
    });
    // Refund credits if all failed
    await WorkspaceCreditManager.refundCredits(session.user.id, totalCost);

    return NextResponse.json(
      {
        success: true,
        results,
        summary: {
          total: files.length,
          successful: 0,
          failed: results.length,
        },
      },
      { headers: { "X-Request-ID": requestId } },
    );
  }

  // Refund for failed individual files (if any)
  const failedR2Count = results.filter(r => !r.success).length;
  if (failedR2Count > 0) {
    await WorkspaceCreditManager.refundCredits(
      session.user.id,
      failedR2Count * costPerImage,
    );
  }

  // PHASE 2: Create all database records in a single transaction
  requestLogger.info("Starting database transaction phase", {
    uploadedCount: uploadedFiles.length,
  });

  const { data: enhancedImages, error: transactionError } = await tryCatch(
    prisma.$transaction(async tx => {
      const images = [];
      // Get max sort order for album (if album specified)
      let currentSort = 0;
      if (album) {
        const maxSort = await tx.albumImage.aggregate({
          where: { albumId: album.id },
          _max: { sortOrder: true },
        });
        currentSort = (maxSort._max.sortOrder ?? -1) + 1;
      }

      for (const fileData of uploadedFiles) {
        // Create enhanced image
        const img = await tx.enhancedImage.create({
          data: {
            userId: session.user.id,
            name: fileData.filename,
            originalUrl: fileData.url,
            originalR2Key: fileData.r2Key,
            originalWidth: fileData.width,
            originalHeight: fileData.height,
            originalSizeBytes: fileData.sizeBytes,
            originalFormat: fileData.format,
            isPublic: false, // Default to private
          },
        });

        // Link to album (if album specified)
        if (album) {
          await tx.albumImage.create({
            data: {
              albumId: album.id,
              imageId: img.id,
              sortOrder: currentSort++,
            },
          });
        }

        // Create Enhancement Job
        await tx.imageEnhancementJob.create({
          data: {
            userId: session.user.id,
            imageId: img.id,
            tier: defaultTier,
            status: "PENDING",
            creditsCost: costPerImage,
          },
        });

        images.push(img);
      }
      return images;
    }),
  );

  if (transactionError) {
    // Transaction failed - rollback ALL R2 uploads
    requestLogger.error(
      "Database transaction failed, cleaning up R2 files",
      transactionError instanceof Error
        ? transactionError
        : new Error(String(transactionError)),
      { uploadedFileCount: uploadedFiles.length },
    );

    const cleanupPromises = uploadedFiles.map(fileData =>
      deleteFromR2(fileData.r2Key).catch(deleteError => {
        requestLogger.error(
          "Failed to cleanup R2 file",
          deleteError instanceof Error
            ? deleteError
            : new Error(String(deleteError)),
          { r2Key: fileData.r2Key },
        );
        return { success: false };
      })
    );

    await Promise.allSettled(cleanupPromises);

    // Update results at correct indices for transaction failures
    for (const fileData of uploadedFiles) {
      results[fileData.index] = {
        success: false,
        filename: fileData.filename,
        error: transactionError instanceof Error
          ? transactionError.message
          : "Database transaction failed",
        errorType: "database" as const,
      };
    }
  } else {
    // Transaction succeeded - update results at correct indices
    for (let i = 0; i < enhancedImages.length; i++) {
      const img = enhancedImages[i];
      const fileData = uploadedFiles[i];
      if (!img || !fileData) continue;
      results[fileData.index] = {
        success: true,
        filename: img.name,
        imageId: img.id,
        url: img.originalUrl,
        width: img.originalWidth,
        height: img.originalHeight,
        size: img.originalSizeBytes,
        format: img.originalFormat,
      };
    }

    requestLogger.info("Database transaction completed successfully", {
      successCount: enhancedImages.length,
    });
  }

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;

  requestLogger.info("Batch upload completed", {
    total: files.length,
    successful: successCount,
    failed: failureCount,
  });

  return NextResponse.json(
    {
      success: successCount > 0, // Partial success is still success
      results,
      summary: {
        total: files.length,
        successful: successCount,
        failed: failureCount,
      },
    },
    { headers: { "X-Request-ID": requestId } },
  );
}
