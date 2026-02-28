/**
 * Direct Batch Image Enhancement
 *
 * This module provides batch image enhancement logic that runs directly
 * using Next.js after() for background processing.
 *
 * **Note:**
 * - Uses retry logic with exponential backoff for resilience
 * - Processes images sequentially to avoid rate limits
 * - Job status is tracked in the database for client polling
 */

import prisma from "@/lib/prisma";
import { ENHANCEMENT_COSTS } from "@/lib/credits/costs";
import { tryCatch } from "@/lib/try-catch";
import type { EnhancementTier } from "@prisma/client";
import { JobStatus } from "@prisma/client";
import { enhanceImageDirect } from "./enhance-image.direct";
import { logger } from "@/lib/logger";

export interface BatchEnhanceInput {
  batchId: string;
  userId: string;
  images: Array<{
    imageId: string;
    originalR2Key: string;
  }>;
  tier: EnhancementTier;
}

interface BatchResult {
  imageId: string;
  jobId?: string;
  success: boolean;
  refunded?: boolean;
  error?: string;
}

/**
 * Validates batch enhancement input parameters
 */
function validateBatchEnhanceInput(input: BatchEnhanceInput): void {
  if (!input.batchId || typeof input.batchId !== "string") {
    throw new Error("Invalid batchId: must be a non-empty string");
  }

  if (!input.userId || typeof input.userId !== "string") {
    throw new Error("Invalid userId: must be a non-empty string");
  }

  if (!Array.isArray(input.images) || input.images.length === 0) {
    throw new Error("Invalid images: must be a non-empty array");
  }

  const validTiers: EnhancementTier[] = ["TIER_1K", "TIER_2K", "TIER_4K"];
  if (!validTiers.includes(input.tier)) {
    throw new Error(`Invalid tier: must be one of ${validTiers.join(", ")}`);
  }

  // Validate each image entry
  for (let i = 0; i < input.images.length; i++) {
    const image = input.images[i];
    if (!image || !image.imageId || typeof image.imageId !== "string") {
      throw new Error(
        `Invalid imageId at index ${i}: must be a non-empty string`,
      );
    }
    if (!image.originalR2Key || typeof image.originalR2Key !== "string") {
      throw new Error(
        `Invalid originalR2Key at index ${i}: must be a non-empty string`,
      );
    }
  }
}

/**
 * Direct batch enhancement execution for dev mode.
 * This runs the enhancement synchronously without workflow infrastructure.
 */
export async function batchEnhanceImagesDirect(
  input: BatchEnhanceInput,
): Promise<{
  batchId: string;
  results: BatchResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}> {
  // Validate input parameters
  validateBatchEnhanceInput(input);

  const { batchId, userId, images, tier } = input;
  const tokenCost = ENHANCEMENT_COSTS[tier];
  const results: BatchResult[] = [];

  logger.info(
    `[Dev Batch Enhancement] Starting batch ${batchId} with ${images.length} images`,
  );

  // Process each image sequentially to avoid rate limits
  for (const image of images) {
    // Create job for this image
    const jobResult = await tryCatch(
      prisma.imageEnhancementJob.create({
        data: {
          imageId: image.imageId,
          userId,
          tier,
          creditsCost: tokenCost,
          status: JobStatus.PROCESSING,
          processingStartedAt: new Date(),
        },
      }),
    );

    if (jobResult.error) {
      const errorMessage = jobResult.error instanceof Error
        ? jobResult.error.message
        : String(jobResult.error);
      // Include full error stack trace for better debugging
      logger.error(
        `[Dev Batch Enhancement] Failed to process image ${image.imageId}:`,
        jobResult.error,
      );
      results.push({
        imageId: image.imageId,
        success: false,
        refunded: false, // No job was created, no refund needed
        error: errorMessage,
      });
      continue;
    }

    const job = jobResult.data;

    logger.info(
      `[Dev Batch Enhancement] Processing image ${image.imageId} (job ${job.id})`,
    );

    // Run the single image enhancement directly
    const enhanceResult = await tryCatch(
      enhanceImageDirect({
        jobId: job.id,
        imageId: image.imageId,
        userId,
        originalR2Key: image.originalR2Key,
        tier,
        tokensCost: tokenCost,
      }),
    );

    if (enhanceResult.error) {
      const errorMessage = enhanceResult.error instanceof Error
        ? enhanceResult.error.message
        : String(enhanceResult.error);
      // Include full error stack trace for better debugging
      logger.error(
        `[Dev Batch Enhancement] Failed to process image ${image.imageId}:`,
        enhanceResult.error,
      );
      results.push({
        imageId: image.imageId,
        success: false,
        refunded: false, // Enhancement threw an exception, no automatic refund from enhanceImageDirect
        error: errorMessage,
      });
      continue;
    }

    const result = enhanceResult.data;

    results.push({
      imageId: image.imageId,
      jobId: job.id,
      success: result.success,
      refunded: !result.success, // Refund happens immediately in enhanceImageDirect on failure
      error: result.error,
    });
  }

  // Calculate summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const refunded = results.filter(r => r.refunded).length;

  logger.info(
    `[Dev Batch Enhancement] Batch ${batchId} completed: ${successful} successful, ${failed} failed, ${refunded} refunded`,
  );

  // Note: Individual job refunds are handled immediately in enhanceImageDirect when jobs fail
  // No batch-level refund needed here to avoid double-refunds

  return {
    batchId,
    results,
    summary: {
      total: images.length,
      successful,
      failed,
    },
  };
}
