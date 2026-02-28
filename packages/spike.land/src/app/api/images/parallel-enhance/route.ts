import { auth } from "@/lib/auth";
import { getUserFriendlyError } from "@/lib/errors/error-messages";
import { generateRequestId, logger } from "@/lib/errors/structured-logger";
import prisma from "@/lib/prisma";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { WorkspaceCreditManager } from "@/lib/credits/workspace-credit-manager";
import { ENHANCEMENT_COSTS } from "@/lib/credits/costs";
import { tryCatch } from "@/lib/try-catch";
import {
  enhanceImageDirect,
  type EnhanceImageInput,
} from "@/workflows/enhance-image.direct";
import type { EnhancementTier } from "@prisma/client";
import { JobStatus } from "@prisma/client";
import type { NextRequest } from "next/server";
import { after, NextResponse } from "next/server";

// Force dynamic rendering - skip static page data collection
export const dynamic = "force-dynamic";

// Allow longer execution time for parallel 4K image enhancements (10 minutes)
export const maxDuration = 600;

interface ParallelEnhanceRequest {
  imageId: string;
  tiers: EnhancementTier[];
}

interface JobResponse {
  jobId: string;
  tier: EnhancementTier;
  tokenCost: number;
  status: "PROCESSING";
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const requestLogger = logger.child({
    requestId,
    route: "/api/images/parallel-enhance",
  });

  requestLogger.info("Parallel enhancement request received");

  const session = await auth();
  if (!session?.user?.id) {
    requestLogger.warn("Unauthorized parallel enhancement attempt");
    const errorMessage = getUserFriendlyError(new Error("Unauthorized"), 401);
    return NextResponse.json(
      {
        error: errorMessage.message,
        title: errorMessage.title,
        suggestion: errorMessage.suggestion,
      },
      { status: 401 },
    );
  }

  requestLogger.info("User authenticated", { userId: session.user.id });

  // Check rate limit before processing
  const rateLimitResult = await checkRateLimit(
    `enhance:${session.user.id}`,
    rateLimitConfigs.imageEnhancement,
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

  const { imageId, tiers } = body as ParallelEnhanceRequest;

  // Validate input
  if (!imageId || !tiers || !Array.isArray(tiers)) {
    requestLogger.warn("Missing or invalid required fields", {
      imageId,
      tiers,
    });
    const errorMessage = getUserFriendlyError(
      new Error("Invalid input"),
      400,
    );
    return NextResponse.json(
      {
        error: errorMessage.message,
        title: errorMessage.title,
        suggestion: "Please provide imageId and an array of tiers.",
      },
      { status: 400, headers: { "X-Request-ID": requestId } },
    );
  }

  // Validate tiers array (1-3 unique tiers)
  if (tiers.length === 0 || tiers.length > 3) {
    requestLogger.warn("Invalid tiers array length", {
      tierCount: tiers.length,
    });
    const errorMessage = getUserFriendlyError(
      new Error("Invalid input"),
      400,
    );
    return NextResponse.json(
      {
        error: errorMessage.message,
        title: errorMessage.title,
        suggestion: "Please provide 1-3 enhancement tiers.",
      },
      { status: 400, headers: { "X-Request-ID": requestId } },
    );
  }

  // Check for duplicate tiers
  const uniqueTiers = Array.from(new Set(tiers));
  if (uniqueTiers.length !== tiers.length) {
    requestLogger.warn("Duplicate tiers detected", { tiers });
    const errorMessage = getUserFriendlyError(
      new Error("Invalid input"),
      400,
    );
    return NextResponse.json(
      {
        error: errorMessage.message,
        title: errorMessage.title,
        suggestion: "Each tier can only be selected once.",
      },
      { status: 400, headers: { "X-Request-ID": requestId } },
    );
  }

  // Validate all tiers are valid
  const validTiers = Object.keys(ENHANCEMENT_COSTS) as EnhancementTier[];
  const invalidTiers = tiers.filter(tier => !validTiers.includes(tier));
  if (invalidTiers.length > 0) {
    requestLogger.warn("Invalid tiers", { invalidTiers });
    const errorMessage = getUserFriendlyError(
      new Error("Invalid input"),
      400,
    );
    return NextResponse.json(
      {
        error: errorMessage.message,
        title: errorMessage.title,
        suggestion: "Please select valid enhancement tiers (TIER_1K, TIER_2K, or TIER_4K).",
      },
      { status: 400, headers: { "X-Request-ID": requestId } },
    );
  }

  // Verify image exists and user has access
  const { data: image, error: imageError } = await tryCatch(
    prisma.enhancedImage.findUnique({
      where: { id: imageId },
    }),
  );

  if (imageError) {
    requestLogger.error(
      "Unexpected error in parallel enhance API",
      imageError,
    );
    const errorMessage = getUserFriendlyError(imageError, 500);
    return NextResponse.json(
      {
        error: errorMessage.message,
        title: errorMessage.title,
        suggestion: errorMessage.suggestion,
      },
      { status: 500, headers: { "X-Request-ID": requestId } },
    );
  }

  if (!image || image.userId !== session.user.id) {
    requestLogger.warn("Image not found or access denied", {
      imageId,
      userId: session.user.id,
    });
    const errorMessage = getUserFriendlyError(new Error("Not found"), 404);
    return NextResponse.json(
      {
        error: errorMessage.message,
        title: errorMessage.title,
        suggestion: errorMessage.suggestion,
      },
      { status: 404, headers: { "X-Request-ID": requestId } },
    );
  }

  // Calculate total token cost
  const totalCost = tiers.reduce(
    (sum, tier) => sum + ENHANCEMENT_COSTS[tier],
    0,
  );

  requestLogger.info("Calculated total cost", { totalCost, tiers });

  // Check if user has enough credits for ALL tiers
  const hasEnough = await WorkspaceCreditManager.hasEnoughCredits(
    session.user.id,
    totalCost,
  );

  if (!hasEnough) {
    requestLogger.warn("Insufficient credits for parallel enhancement", {
      userId: session.user.id,
      required: totalCost,
    });
    const errorMessage = getUserFriendlyError(
      new Error("Insufficient credits"),
      402,
    );
    return NextResponse.json(
      {
        error: errorMessage.message,
        title: errorMessage.title,
        suggestion: errorMessage.suggestion,
        required: totalCost,
      },
      { status: 402, headers: { "X-Request-ID": requestId } },
    );
  }

  // Consume credits upfront
  const consumeResult = await WorkspaceCreditManager.consumeCredits({
    userId: session.user.id,
    amount: totalCost,
    source: "parallel_image_enhancement",
    sourceId: imageId,
  });

  if (!consumeResult.success) {
    requestLogger.error(
      "Failed to consume credits",
      new Error(consumeResult.error || "Unknown error"),
    );
    const errorMessage = getUserFriendlyError(
      new Error(consumeResult.error || "Failed to consume credits"),
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

  // Create all jobs in a transaction
  const { data: jobs, error: transactionError } = await tryCatch(
    prisma.$transaction(async tx => {
      // Create all jobs
      const createdJobs = await Promise.all(
        tiers.map(async tier => {
          const job = await tx.imageEnhancementJob.create({
            data: {
              imageId,
              userId: session.user.id,
              tier,
              creditsCost: ENHANCEMENT_COSTS[tier],
              status: JobStatus.PROCESSING,
              processingStartedAt: new Date(),
            },
          });
          return job;
        }),
      );

      return createdJobs;
    }),
  );

  if (transactionError) {
    // Refund credits if job creation failed
    await WorkspaceCreditManager.refundCredits(session.user.id, totalCost);
    requestLogger.error(
      "Unexpected error in parallel enhance API",
      transactionError,
    );
    const errorMessage = getUserFriendlyError(transactionError, 500);
    return NextResponse.json(
      {
        error: errorMessage.message,
        title: errorMessage.title,
        suggestion: errorMessage.suggestion,
      },
      { status: 500, headers: { "X-Request-ID": requestId } },
    );
  }

  requestLogger.info("Parallel enhancement jobs created", {
    jobCount: jobs.length,
    jobIds: jobs.map(j => j.id),
  });

  // Start all enhancement jobs using Next.js after() for background processing
  for (const job of jobs) {
    const enhancementInput: EnhanceImageInput = {
      jobId: job.id,
      imageId: image.id,
      userId: session.user.id,
      originalR2Key: image.originalR2Key,
      tier: job.tier,
      tokensCost: job.creditsCost,
    };

    requestLogger.info("Starting enhancement (direct mode with after())", {
      jobId: job.id,
      tier: job.tier,
    });

    after(async () => {
      const { error } = await tryCatch(enhanceImageDirect(enhancementInput));
      if (error) {
        requestLogger.error(
          "Parallel enhancement job failed",
          error instanceof Error ? error : new Error(String(error)),
          { jobId: job.id, tier: job.tier },
        );
      }
    });
  }

  // Build response
  const jobsResponse: JobResponse[] = jobs.map(job => ({
    jobId: job.id,
    tier: job.tier,
    tokenCost: job.creditsCost,
    status: "PROCESSING" as const,
  }));

  return NextResponse.json(
    {
      success: true,
      jobs: jobsResponse,
      totalCost,
      newBalance: consumeResult.remaining,
    },
    { headers: { "X-Request-ID": requestId } },
  );
}
