/**
 * Direct Image Enhancement (Primary Execution Mode)
 *
 * This module provides the primary image enhancement execution path using
 * plain JavaScript with built-in retry logic and error handling.
 *
 * **Features:**
 * - Automatic retries with exponential backoff for transient failures
 * - Retry logic for R2 operations (download/upload)
 * - Retry logic for Gemini API calls (analysis and enhancement)
 * - Full error handling with token refunds on failure
 * - No native dependencies (sharp removed for Yarn PnP compatibility)
 *
 * **Execution Model:**
 * - Uses Next.js `after()` for background processing (fire-and-forget)
 * - Response returns immediately with job ID
 * - Client polls job status for completion
 */

import {
  analyzeImageV2,
  buildBlendEnhancementPrompt,
  buildDynamicEnhancementPrompt,
  DEFAULT_MODEL,
  DEFAULT_TEMPERATURE,
  enhanceImageWithGemini,
  getModelForTier,
  type ReferenceImageData,
} from "@/lib/ai/gemini-client";
import { logger } from "@/lib/errors/structured-logger";
import { retryWithBackoff } from "@/lib/errors/retry-logic";
import { applyAutoTags } from "@/lib/images/auto-tagger";
import {
  detectMimeType,
  getDefaultDimensions,
  getImageDimensionsFromBuffer,
} from "@/lib/images/image-dimensions";
import prisma from "@/lib/prisma";
import { downloadFromR2, uploadToR2 } from "@/lib/storage/r2-client";
import { WorkspaceCreditManager } from "@/lib/credits/workspace-credit-manager";
import { tryCatch } from "@/lib/try-catch";
import { JobStatus, PipelineStage } from "@prisma/client";
import {
  calculateCropRegion,
  calculateTargetDimensions,
  cropDimensionsToPixels,
  DEFAULT_IMAGE_DIMENSION,
  type EnhanceImageInput,
  generateEnhancedR2Key,
  TIER_TO_SIZE,
  validateCropDimensions,
  validateEnhanceImageInput,
} from "./enhance-image.shared";

export type { EnhanceImageInput };

/**
 * Retry configuration for different operation types
 */
const RETRY_CONFIG = {
  // R2 operations - retry on network/timeout errors
  r2: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 5000,
    shouldRetry: (error: Error) => {
      const msg = error.message.toLowerCase();
      return (
        msg.includes("network")
        || msg.includes("timeout")
        || msg.includes("fetch failed")
        || msg.includes("econnrefused")
        || msg.includes("503")
        || msg.includes("502")
        || msg.includes("500")
      );
    },
  },
  // Gemini API - retry on transient errors, not on API key/quota issues
  gemini: {
    maxAttempts: 3,
    initialDelayMs: 2000,
    maxDelayMs: 10000,
    shouldRetry: (error: Error) => {
      const msg = error.message.toLowerCase();
      // Don't retry on permanent errors
      if (
        msg.includes("api key")
        || msg.includes("quota")
        || msg.includes("invalid")
        || msg.includes("not found")
      ) {
        return false;
      }
      // Retry on transient errors
      return (
        msg.includes("timeout")
        || msg.includes("network")
        || msg.includes("503")
        || msg.includes("502")
        || msg.includes("overloaded")
        || msg.includes("rate limit")
      );
    },
  },
};

/**
 * Download from R2 with retry logic
 */
async function downloadFromR2WithRetry(r2Key: string): Promise<Buffer | null> {
  const result = await retryWithBackoff(
    () => downloadFromR2(r2Key),
    {
      ...RETRY_CONFIG.r2,
      onRetry: (error, attempt, delayMs) => {
        logger.info(
          `[Direct Enhancement] R2 download retry ${attempt} after ${delayMs}ms`,
          { error: error.message, attempt, delayMs },
        );
      },
    },
  );

  if (!result.success) {
    logger.error(
      `[Direct Enhancement] R2 download failed after ${result.attempts} attempts`,
      result.error instanceof Error ? result.error : undefined,
      { attempts: result.attempts },
    );
    return null;
  }

  return result.data ?? null;
}

/**
 * Upload to R2 with retry logic
 */
async function uploadToR2WithRetry(params: {
  key: string;
  buffer: Buffer;
  contentType: string;
  metadata?: Record<string, string>;
}): Promise<{ success: boolean; url?: string; }> {
  const result = await retryWithBackoff(
    () => uploadToR2(params),
    {
      ...RETRY_CONFIG.r2,
      onRetry: (error, attempt, delayMs) => {
        logger.info(
          `[Direct Enhancement] R2 upload retry ${attempt} after ${delayMs}ms`,
          { error: error.message, attempt, delayMs },
        );
      },
    },
  );

  if (!result.success || !result.data?.success) {
    logger.error(
      `[Direct Enhancement] R2 upload failed after ${result.attempts} attempts`,
      result.error instanceof Error ? result.error : undefined,
      { attempts: result.attempts },
    );
    return { success: false };
  }

  return result.data;
}

/**
 * Analyze image with retry logic
 */
async function analyzeImageWithRetry(
  imageBase64: string,
  mimeType: string,
): Promise<Awaited<ReturnType<typeof analyzeImageV2>>> {
  const result = await retryWithBackoff(
    () => analyzeImageV2(imageBase64, mimeType),
    {
      ...RETRY_CONFIG.gemini,
      onRetry: (error, attempt, delayMs) => {
        logger.info(
          `[Direct Enhancement] Image analysis retry ${attempt} after ${delayMs}ms`,
          { error: error.message, attempt, delayMs },
        );
      },
    },
  );

  if (!result.success) {
    throw result.error || new Error("Image analysis failed after retries");
  }

  return result.data!;
}

/**
 * Enhance with Gemini with retry logic
 */
async function enhanceWithGeminiRetry(
  params: Parameters<typeof enhanceImageWithGemini>[0],
): Promise<Buffer> {
  const result = await retryWithBackoff(
    () => enhanceImageWithGemini(params),
    {
      ...RETRY_CONFIG.gemini,
      onRetry: (error, attempt, delayMs) => {
        logger.info(
          `[Direct Enhancement] Gemini enhancement retry ${attempt} after ${delayMs}ms`,
          { error: error.message, attempt, delayMs },
        );
      },
    },
  );

  if (!result.success) {
    throw result.error || new Error("Gemini enhancement failed after retries");
  }

  return result.data!;
}

/**
 * Safely update the job's current stage with error handling.
 * Stage updates are non-critical - failures are logged but don't block processing.
 */
async function updateJobStage(
  jobId: string,
  stage: PipelineStage,
): Promise<void> {
  const { error } = await tryCatch(
    prisma.imageEnhancementJob.update({
      where: { id: jobId },
      data: { currentStage: stage },
    }),
  );

  if (error) {
    logger.warn(
      `[Direct Enhancement] Failed to update stage to ${stage} for job ${jobId}`,
      {
        stage,
        jobId,
        error: error instanceof Error ? error.message : String(error),
      },
    );
    // Continue processing - stage update is non-critical for functionality
  }
}

/**
 * Core enhancement processing logic.
 * Separated from main function to enable tryCatch wrapping.
 *
 * Note: This version doesn't use sharp for image processing.
 * - Dimensions are read from image headers
 * - Auto-cropping is included in the enhancement prompt
 * - Gemini output is used directly (no post-processing resize)
 */
async function processEnhancement(input: EnhanceImageInput): Promise<string> {
  const { jobId, originalR2Key, tier, blendSource } = input;

  const isBlendMode = !!blendSource;
  logger.info(`[Direct Enhancement] Starting job ${jobId}`, {
    jobId,
    tier,
    isBlendMode,
  });

  // Step 1: Download original image (with retry)
  logger.info(`[Direct Enhancement] Downloading from R2`, {
    jobId,
    r2Key: originalR2Key,
  });
  const imageBuffer = await downloadFromR2WithRetry(originalR2Key);
  if (!imageBuffer) {
    throw new Error("Failed to download original image from R2");
  }

  // Step 1b: Prepare blend source data (if provided - already base64 from client upload)
  let sourceImageData: ReferenceImageData | null = null;
  if (blendSource) {
    logger.info(`[Direct Enhancement] Using uploaded blend source`, {
      jobId,
      mimeType: blendSource.mimeType,
    });
    sourceImageData = {
      imageData: blendSource.base64,
      mimeType: blendSource.mimeType,
      description: "Image to blend/merge with target",
    };
  }

  // Step 2: Get image metadata using lightweight header parsing
  logger.debug(`[Direct Enhancement] Getting image metadata`, { jobId });
  const dimensions = getImageDimensionsFromBuffer(imageBuffer)
    || getDefaultDimensions();
  const originalWidth = dimensions.width || DEFAULT_IMAGE_DIMENSION;
  const originalHeight = dimensions.height || DEFAULT_IMAGE_DIMENSION;
  const mimeType = detectMimeType(imageBuffer);

  logger.info(`[Direct Enhancement] Image dimensions`, {
    jobId,
    width: originalWidth,
    height: originalHeight,
    format: dimensions.format,
  });

  // Step 3: STAGE 1 - Analyze image with vision model (with retry)
  logger.info(
    `[Direct Enhancement] Stage 1: Analyzing image with vision model`,
    { jobId },
  );
  await updateJobStage(jobId, PipelineStage.ANALYZING);
  const imageBase64ForAnalysis = imageBuffer.toString("base64");
  const analysisResult = await analyzeImageWithRetry(
    imageBase64ForAnalysis,
    mimeType,
  );

  // Save analysis to database
  await prisma.imageEnhancementJob.update({
    where: { id: jobId },
    data: {
      analysisResult: JSON.parse(
        JSON.stringify(analysisResult.structuredAnalysis),
      ),
      analysisSource: DEFAULT_MODEL,
    },
  });
  logger.info(`[Direct Enhancement] Analysis saved`, {
    jobId,
    defects: analysisResult.structuredAnalysis.defects,
  });

  // Step 4: Check if cropping is needed (store info but don't actually crop)
  let wasCropped = false;
  let cropDimensionsUsed = null;

  await updateJobStage(jobId, PipelineStage.CROPPING);

  if (
    analysisResult.structuredAnalysis.cropping.isCroppingNeeded
    && analysisResult.structuredAnalysis.cropping.suggestedCrop
    && validateCropDimensions(
      analysisResult.structuredAnalysis.cropping.suggestedCrop,
    )
  ) {
    logger.info(`[Direct Enhancement] Stage 2: Crop suggested`, {
      jobId,
      cropReason: analysisResult.structuredAnalysis.cropping.cropReason,
    });

    const cropRegion = cropDimensionsToPixels(
      analysisResult.structuredAnalysis.cropping.suggestedCrop,
      originalWidth,
      originalHeight,
    );

    if (cropRegion.width > 0 && cropRegion.height > 0) {
      // Store crop info but don't actually crop - let Gemini handle it via prompt
      wasCropped = true;
      cropDimensionsUsed = cropRegion;
      logger.info(`[Direct Enhancement] Crop region stored`, {
        jobId,
        cropWidth: cropRegion.width,
        cropHeight: cropRegion.height,
      });
    }
  }

  // Update job with crop info
  if (wasCropped) {
    await prisma.imageEnhancementJob.update({
      where: { id: jobId },
      data: {
        wasCropped: true,
        cropDimensions: cropDimensionsUsed
          ? JSON.parse(JSON.stringify(cropDimensionsUsed))
          : null,
      },
    });
  }

  // Step 5: STAGE 3 - Build enhancement prompt (blend or dynamic)
  logger.info(`[Direct Enhancement] Stage 3: Building enhancement prompt`, {
    jobId,
    promptType: sourceImageData ? "blend" : "dynamic",
  });
  await updateJobStage(jobId, PipelineStage.PROMPTING);
  const dynamicPrompt = sourceImageData
    ? buildBlendEnhancementPrompt(analysisResult.structuredAnalysis)
    : buildDynamicEnhancementPrompt(analysisResult.structuredAnalysis);

  // Step 6: Prepare image for Gemini
  // Note: We send the image directly without padding - Gemini handles aspect ratios
  logger.debug(`[Direct Enhancement] Preparing image for Gemini`, { jobId });
  const imageBase64 = imageBuffer.toString("base64");

  // Step 7: STAGE 4 - Enhance with Gemini using dynamic prompt (with retry)
  const modelToUse = getModelForTier(tier);
  logger.info(`[Direct Enhancement] Stage 4: Calling Gemini API`, {
    jobId,
    size: TIER_TO_SIZE[tier],
    isBlend: !!sourceImageData,
    model: modelToUse,
  });
  await updateJobStage(jobId, PipelineStage.GENERATING);
  const enhancedBuffer = await enhanceWithGeminiRetry({
    imageData: imageBase64,
    mimeType,
    tier: TIER_TO_SIZE[tier],
    originalWidth,
    originalHeight,
    promptOverride: dynamicPrompt,
    referenceImages: sourceImageData ? [sourceImageData] : undefined,
    model: modelToUse,
  });

  // Step 8: Get dimensions of enhanced image
  logger.debug(`[Direct Enhancement] Processing enhanced image`, { jobId });
  const enhancedDimensions = getImageDimensionsFromBuffer(enhancedBuffer)
    || getDefaultDimensions();
  const geminiWidth = enhancedDimensions.width;
  const geminiHeight = enhancedDimensions.height;

  if (!geminiWidth || !geminiHeight) {
    throw new Error("Failed to get Gemini output dimensions");
  }

  logger.info(`[Direct Enhancement] Gemini output dimensions`, {
    jobId,
    geminiWidth,
    geminiHeight,
    originalWidth,
    originalHeight,
  });

  // Calculate expected dimensions based on tier
  const { targetWidth, targetHeight } = calculateTargetDimensions(
    tier,
    originalWidth,
    originalHeight,
  );

  // Calculate crop region if needed to restore aspect ratio
  const { extractLeft, extractTop, extractWidth, extractHeight } = calculateCropRegion(
    geminiWidth,
    geminiHeight,
    originalWidth,
    originalHeight,
  );

  logger.info(`[Direct Enhancement] Target and extract region`, {
    jobId,
    targetWidth,
    targetHeight,
    extractWidth,
    extractHeight,
    extractLeft,
    extractTop,
  });

  // Step 9: Generate R2 key and upload
  // Note: We upload Gemini's output directly without additional processing
  // The image quality is controlled by Gemini's output settings
  const enhancedR2Key = generateEnhancedR2Key(originalR2Key, jobId);

  // Upload to R2 (with retry)
  const uploadResult = await uploadToR2WithRetry({
    key: enhancedR2Key,
    buffer: enhancedBuffer,
    contentType: "image/jpeg",
    metadata: {
      tier,
      jobId,
    },
  });

  if (!uploadResult.success || !uploadResult.url) {
    throw new Error("Failed to upload enhanced image to R2");
  }

  // Step 10: Update job as completed
  logger.info(`[Direct Enhancement] Job completed successfully`, { jobId });
  await prisma.imageEnhancementJob.update({
    where: { id: jobId },
    data: {
      status: JobStatus.COMPLETED,
      currentStage: null, // Clear stage on completion
      enhancedUrl: uploadResult.url,
      enhancedR2Key: enhancedR2Key,
      enhancedWidth: geminiWidth,
      enhancedHeight: geminiHeight,
      enhancedSizeBytes: enhancedBuffer.length,
      processingCompletedAt: new Date(),
      geminiModel: modelToUse,
      geminiTemp: DEFAULT_TEMPERATURE,
    },
  });

  // Step 11: Auto-tag the image
  logger.info(`[Direct Enhancement] Auto-tagging image`, {
    jobId,
    imageId: input.imageId,
  });
  await applyAutoTags(input.imageId);

  return uploadResult.url;
}

/**
 * Direct enhancement execution for dev mode.
 * This runs the enhancement synchronously without workflow infrastructure.
 */
export async function enhanceImageDirect(input: EnhanceImageInput): Promise<{
  success: boolean;
  enhancedUrl?: string;
  error?: string;
}> {
  // Validate input parameters
  validateEnhanceImageInput(input);

  const { jobId, userId, tokensCost } = input;

  const { data: enhancedUrl, error } = await tryCatch(
    processEnhancement(input),
  );

  if (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Include full error stack trace for better debugging
    logger.error(
      `[Direct Enhancement] Job ${jobId} failed`,
      error instanceof Error ? error : undefined,
      { jobId },
    );

    // Refund credits on failure
    const refundSuccess = await WorkspaceCreditManager.refundCredits(
      userId,
      tokensCost,
    );

    if (!refundSuccess) {
      logger.error("[Direct Enhancement] Failed to refund credits", undefined, {
        jobId,
        userId,
        tokensCost,
      });
    }

    // Update job as failed and refunded
    await prisma.imageEnhancementJob.update({
      where: { id: jobId },
      data: {
        status: JobStatus.REFUNDED,
        errorMessage,
        currentStage: null, // Clear stage on failure
      },
    });

    return { success: false, error: errorMessage };
  }

  return { success: true, enhancedUrl };
}
