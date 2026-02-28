import logger from "@/lib/logger";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { WorkspaceCreditManager } from "@/lib/credits/workspace-credit-manager";
import { ENHANCEMENT_COSTS } from "@/lib/credits/costs";
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

type RouteParams = { params: Promise<{ id: string; }>; };

async function handleEnhanceRequest(
  request: NextRequest,
  albumId: string,
): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check rate limit
  const rateLimitKey = `album-batch-enhance:${session.user.id}`;
  const rateLimitResult = await checkRateLimit(
    rateLimitKey,
    rateLimitConfigs.albumBatchEnhancement,
  );
  if (rateLimitResult.isLimited) {
    const retryAfter = Math.ceil(
      (rateLimitResult.resetAt - Date.now()) / 1000,
    );
    return NextResponse.json(
      {
        error: "Rate limit exceeded for batch enhancement",
        retryAfter: rateLimitResult.resetAt - Date.now(),
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rateLimitResult.resetAt),
          "Retry-After": String(retryAfter),
        },
      },
    );
  }

  const body = await request.json();
  const { tier, skipAlreadyEnhanced = true } = body as {
    tier: EnhancementTier;
    skipAlreadyEnhanced?: boolean;
  };

  // Validate tier
  if (!tier || !Object.keys(ENHANCEMENT_COSTS).includes(tier)) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  // Verify album exists and belongs to user
  const album = await prisma.album.findUnique({
    where: { id: albumId },
    select: { userId: true },
  });

  if (!album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  if (album.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // First, count total images in the album (lightweight query)
  const totalAlbumImagesCount = await prisma.albumImage.count({
    where: { albumId },
  });

  if (totalAlbumImagesCount === 0) {
    return NextResponse.json(
      { error: "No images found in album" },
      { status: 404 },
    );
  }

  // Count images that need enhancement (based on skipAlreadyEnhanced flag)
  const imagesToEnhanceCount = skipAlreadyEnhanced
    ? await prisma.albumImage.count({
      where: {
        albumId,
        image: {
          enhancementJobs: {
            none: {
              status: "COMPLETED",
              tier,
            },
          },
        },
      },
    })
    : totalAlbumImagesCount;

  const skippedCount = totalAlbumImagesCount - imagesToEnhanceCount;

  // Early return if nothing to enhance
  if (imagesToEnhanceCount === 0) {
    const balance = await WorkspaceCreditManager.getBalance(session.user.id);
    return NextResponse.json({
      success: true,
      totalImages: totalAlbumImagesCount,
      skipped: skippedCount,
      queued: 0,
      totalCost: 0,
      newBalance: balance?.remaining ?? 0,
      jobs: [],
    });
  }

  // Check batch size limit BEFORE fetching data (optimization for large albums)
  if (imagesToEnhanceCount > MAX_BATCH_SIZE) {
    return NextResponse.json(
      {
        error:
          `Maximum ${MAX_BATCH_SIZE} images allowed per batch enhancement. This album has ${imagesToEnhanceCount} images to enhance. Please enhance in smaller batches.`,
        totalImages: totalAlbumImagesCount,
        toEnhance: imagesToEnhanceCount,
        maxBatchSize: MAX_BATCH_SIZE,
      },
      { status: 400 },
    );
  }

  // Now fetch only the images we need with minimal fields (optimized query)
  const albumImages = await prisma.albumImage.findMany({
    where: skipAlreadyEnhanced
      ? {
        albumId,
        image: {
          enhancementJobs: {
            none: {
              status: "COMPLETED",
              tier,
            },
          },
        },
      }
      : { albumId },
    select: {
      image: {
        select: {
          id: true,
          originalR2Key: true,
        },
      },
    },
    orderBy: { sortOrder: "asc" },
    take: MAX_BATCH_SIZE,
  });

  const imagesToEnhance = albumImages;

  // Calculate total cost
  const tokenCost = ENHANCEMENT_COSTS[tier];
  const totalCost = tokenCost * imagesToEnhance.length;

  // Check if user has enough credits
  const hasEnough = await WorkspaceCreditManager.hasEnoughCredits(
    session.user.id,
    totalCost,
  );

  if (!hasEnough) {
    return NextResponse.json(
      {
        error: "Insufficient credits",
        required: totalCost,
        toEnhance: imagesToEnhance.length,
      },
      { status: 402 },
    );
  }

  // Consume credits upfront for the entire batch
  const batchId = `album-${albumId}-${Date.now()}`;
  const consumeResult = await WorkspaceCreditManager.consumeCredits({
    userId: session.user.id,
    amount: totalCost,
    source: "album_batch_enhancement",
    sourceId: batchId,
  });

  if (!consumeResult.success) {
    return NextResponse.json(
      { error: consumeResult.error || "Failed to consume credits" },
      { status: 500 },
    );
  }

  /**
   * Refund Policy:
   * - If workflow fails to start: Full refund immediately
   * - If individual jobs fail: Refunded per-job after batch completes
   * - Successful jobs: No refund (tokens consumed as expected)
   */

  // Prepare images data for the workflow
  const imagesData = imagesToEnhance.map(ai => ({
    imageId: ai.image.id,
    originalR2Key: ai.image.originalR2Key,
  }));

  const batchInput: BatchEnhanceInput = {
    batchId,
    userId: session.user.id,
    images: imagesData,
    tier,
  };

  // Start enhancement using Next.js after() for background processing
  logger.info("Starting album batch enhancement (direct mode with after())", {
    batchId,
    albumId,
    imageCount: imagesToEnhance.length,
  });

  after(async () => {
    const { error } = await tryCatch(batchEnhanceImagesDirect(batchInput));
    if (error) {
      logger.error(`[Album Enhancement] Batch ${batchId} failed:`, error);
    }
  });

  return NextResponse.json({
    success: true,
    totalImages: totalAlbumImagesCount,
    skipped: skippedCount,
    queued: imagesToEnhance.length,
    totalCost,
    newBalance: consumeResult.remaining,
    jobs: imagesData.map(img => ({
      imageId: img.imageId,
      jobId: batchId, // Individual job IDs will be created by the workflow
    })),
  });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: albumId } = await params;

  const { data: response, error } = await tryCatch(
    handleEnhanceRequest(request, albumId),
  );

  if (error) {
    logger.error("Error in album batch enhance API:", error);
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : "Album batch enhancement failed",
      },
      { status: 500 },
    );
  }

  return response;
}
