import logger from "@/lib/logger";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { WorkspaceCreditManager } from "@/lib/credits/workspace-credit-manager";
import { ENHANCEMENT_COSTS } from "@/lib/credits/costs";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { tryCatch } from "@/lib/try-catch";
import {
  batchEnhanceImagesDirect,
  type BatchEnhanceInput,
} from "@/workflows/batch-enhance.direct";
import type { EnhancementTier } from "@prisma/client";
import type { NextRequest } from "next/server";
import { after, NextResponse } from "next/server";

// Force dynamic rendering - skip static page data collection
export const dynamic = "force-dynamic";

const MAX_BATCH_SIZE = 20;

export async function POST(request: NextRequest) {
  const { data: session, error: authError } = await tryCatch(auth());
  if (authError) {
    logger.error("Error in batch enhance API:", authError);
    return NextResponse.json(
      {
        error: authError instanceof Error
          ? authError.message
          : "Batch enhancement failed",
      },
      { status: 500 },
    );
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting
  const rateLimitResult = await checkRateLimit(
    `batch-enhance:${session.user.id}`,
    rateLimitConfigs.albumBatchEnhancement,
  );

  if (rateLimitResult.isLimited) {
    const retryAfter = Math.ceil(
      (rateLimitResult.resetAt - Date.now()) / 1000,
    );
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rateLimitResult.resetAt),
        },
      },
    );
  }

  const { data: body, error: bodyError } = await tryCatch(request.json());
  if (bodyError) {
    logger.error("Error in batch enhance API:", bodyError);
    return NextResponse.json(
      {
        error: bodyError instanceof Error
          ? bodyError.message
          : "Batch enhancement failed",
      },
      { status: 500 },
    );
  }

  const { imageIds, tier } = body as {
    imageIds: string[];
    tier: EnhancementTier;
  };

  // Validate input
  if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
    return NextResponse.json(
      { error: "Missing or invalid imageIds" },
      { status: 400 },
    );
  }

  if (imageIds.length > MAX_BATCH_SIZE) {
    return NextResponse.json(
      {
        error: `Maximum ${MAX_BATCH_SIZE} images allowed per batch enhancement`,
      },
      { status: 400 },
    );
  }

  if (!tier || !Object.keys(ENHANCEMENT_COSTS).includes(tier)) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  // Validate all images belong to user
  const { data: images, error: imagesError } = await tryCatch(
    prisma.enhancedImage.findMany({
      where: {
        id: { in: imageIds },
        userId: session.user.id,
      },
    }),
  );

  if (imagesError) {
    logger.error("Error in batch enhance API:", imagesError);
    return NextResponse.json(
      {
        error: imagesError instanceof Error
          ? imagesError.message
          : "Batch enhancement failed",
      },
      { status: 500 },
    );
  }

  if (images.length !== imageIds.length) {
    return NextResponse.json(
      { error: "One or more images not found or unauthorized" },
      { status: 404 },
    );
  }

  // Calculate total cost
  const tokenCost = ENHANCEMENT_COSTS[tier];
  const totalCost = tokenCost * imageIds.length;

  // Check if user has enough credits
  const { data: hasEnough, error: hasEnoughError } = await tryCatch(
    WorkspaceCreditManager.hasEnoughCredits(session.user.id, totalCost),
  );

  if (hasEnoughError) {
    logger.error("Error in batch enhance API:", hasEnoughError);
    return NextResponse.json(
      {
        error: hasEnoughError instanceof Error
          ? hasEnoughError.message
          : "Batch enhancement failed",
      },
      { status: 500 },
    );
  }

  if (!hasEnough) {
    return NextResponse.json(
      { error: "Insufficient credits", required: totalCost },
      { status: 402 },
    );
  }

  // Consume credits upfront for the entire batch
  const batchId = `batch-${Date.now()}`;
  const { data: consumeResult, error: consumeError } = await tryCatch(
    WorkspaceCreditManager.consumeCredits({
      userId: session.user.id,
      amount: totalCost,
      source: "batch_image_enhancement",
      sourceId: batchId,
    }),
  );

  if (consumeError) {
    logger.error("Error in batch enhance API:", consumeError);
    return NextResponse.json(
      {
        error: consumeError instanceof Error
          ? consumeError.message
          : "Batch enhancement failed",
      },
      { status: 500 },
    );
  }

  if (!consumeResult.success) {
    return NextResponse.json(
      { error: consumeResult.error || "Failed to consume credits" },
      { status: 500 },
    );
  }

  // Prepare images data for the workflow
  const imagesData = images.map(image => ({
    imageId: image.id,
    originalR2Key: image.originalR2Key,
  }));

  const batchInput: BatchEnhanceInput = {
    batchId,
    userId: session.user.id,
    images: imagesData,
    tier,
  };

  // Use Next.js after() for background processing
  // This ensures the batch enhancement continues even after the response is sent
  logger.info("Starting batch enhancement (direct mode with after())", {
    batchId,
    imageCount: imageIds.length,
  });

  after(async () => {
    const { error } = await tryCatch(batchEnhanceImagesDirect(batchInput));
    if (error) {
      logger.error(`[Batch Enhancement] Batch ${batchId} failed:`, error);
    }
  });

  return NextResponse.json({
    success: true,
    batchId,
    summary: {
      total: imageIds.length,
      totalCost,
      newBalance: consumeResult.remaining,
    },
  });
}
