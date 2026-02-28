import { auth } from "@/lib/auth";
import { getUserFriendlyError } from "@/lib/errors/error-messages";
import { generateRequestId, logger } from "@/lib/errors/structured-logger";
import {
  getHttpStatusForError,
  resolveBlendSource,
} from "@/lib/images/blend-source-resolver";
import prisma from "@/lib/prisma";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { WorkspaceCreditManager } from "@/lib/credits/workspace-credit-manager";
import { ENHANCEMENT_COSTS } from "@/lib/credits/costs";
import { attributeConversion } from "@/lib/tracking/attribution";
import { tryCatch } from "@/lib/try-catch";
import {
  validateBase64Size,
  validateEnhanceRequest,
} from "@/lib/validations/enhance-image";
import {
  handleEnhancementFailure,
  startEnhancement,
} from "@/lib/workflows/enhancement-executor";
import type { EnhanceImageInput } from "@/workflows/enhance-image.shared";
import { EnhancementType, JobStatus } from "@prisma/client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Force dynamic rendering - skip static page data collection
export const dynamic = "force-dynamic";

// Allow longer execution time for 4K image enhancements (10 minutes)
export const maxDuration = 600;

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const requestLogger = logger.child({
    requestId,
    route: "/api/images/enhance",
  });

  requestLogger.info("Enhancement request received");

  // 1. Authentication
  const session = await auth();
  if (!session?.user?.id) {
    requestLogger.warn("Unauthorized enhancement attempt");
    return errorResponse(new Error("Unauthorized"), 401, requestId);
  }

  requestLogger.info("User authenticated", { userId: session.user.id });

  // 2. Rate Limiting
  const rateLimitResult = await checkRateLimit(
    `enhance:${session.user.id}`,
    rateLimitConfigs.imageEnhancement,
  );

  if (rateLimitResult.isLimited) {
    requestLogger.warn("Rate limit exceeded", { userId: session.user.id });
    const retryAfter = Math.ceil(
      (rateLimitResult.resetAt - Date.now()) / 1000,
    );
    return NextResponse.json(
      {
        error: "Too many requests",
        title: "Rate limit exceeded",
        suggestion: "Please wait before trying again.",
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

  // 3. JSON Parsing
  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    requestLogger.error(
      "Failed to parse request body",
      jsonError instanceof Error ? jsonError : new Error(String(jsonError)),
    );
    return NextResponse.json(
      {
        error: "Invalid JSON",
        title: "Parse error",
        suggestion: "Please provide a valid JSON request body.",
      },
      { status: 400, headers: { "X-Request-ID": requestId } },
    );
  }

  // 4. Request Validation (Zod)
  const validation = validateEnhanceRequest(body);
  if (!validation.success) {
    requestLogger.warn("Validation failed", { error: validation.error });
    return NextResponse.json(
      {
        error: validation.error,
        title: "Invalid request",
        suggestion: validation.suggestion,
      },
      { status: 400, headers: { "X-Request-ID": requestId } },
    );
  }

  const { imageId, tier, blendSource } = validation.data;

  // 5. Image Ownership Verification
  const image = await prisma.enhancedImage.findUnique({
    where: { id: imageId },
  });

  if (!image || image.userId !== session.user.id) {
    requestLogger.warn("Image not found or access denied", {
      imageId,
      userId: session.user.id,
    });
    return errorResponse(new Error("Not found"), 404, requestId);
  }

  // 6. Blend Source Resolution (if provided)
  let resolvedBlendSource: { base64: string; mimeType: string; } | null = null;
  let sourceImageId: string | null = null;

  if (blendSource) {
    // Validate base64 size if provided
    if (blendSource.base64) {
      const sizeCheck = validateBase64Size(blendSource.base64);
      if (!sizeCheck.valid) {
        requestLogger.warn("Blend source too large", {
          estimatedSize: sizeCheck.estimatedSize,
          maxSize: sizeCheck.maxSize,
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
    }

    const blendResult = await resolveBlendSource(
      blendSource,
      session.user.id,
      imageId,
    );

    if (!blendResult.success) {
      requestLogger.warn("Blend source resolution failed", {
        error: blendResult.error.code,
      });
      return NextResponse.json(
        {
          error: blendResult.error.message,
          title: blendResult.error.code === "ACCESS_DENIED"
            ? "Access denied"
            : blendResult.error.code === "NOT_FOUND"
            ? "Image not found"
            : "Processing failed",
          suggestion: blendResult.error.suggestion,
        },
        {
          status: getHttpStatusForError(blendResult.error.code),
          headers: { "X-Request-ID": requestId },
        },
      );
    }

    resolvedBlendSource = {
      base64: blendResult.data.base64,
      mimeType: blendResult.data.mimeType,
    };
    sourceImageId = blendResult.data.sourceImageId;

    requestLogger.info("Blend source resolved", {
      sourceImageId,
      targetImageId: imageId,
    });
  }

  // 7. Credit Balance Check & Consumption
  const creditCost = ENHANCEMENT_COSTS[tier];
  let resultingBalance = 0;

  if (creditCost > 0) {
    const hasEnough = await WorkspaceCreditManager.hasEnoughCredits(
      session.user.id,
      creditCost,
    );

    if (!hasEnough) {
      requestLogger.warn("Insufficient credits", {
        userId: session.user.id,
        required: creditCost,
      });
      return NextResponse.json(
        {
          error: "Insufficient credits",
          title: "Payment required",
          suggestion: "Please upgrade your plan to continue.",
          required: creditCost,
        },
        { status: 402, headers: { "X-Request-ID": requestId } },
      );
    }

    const consumeResult = await WorkspaceCreditManager.consumeCredits({
      userId: session.user.id,
      amount: creditCost,
      source: "image_enhancement",
      sourceId: imageId,
    });

    if (!consumeResult.success) {
      requestLogger.error(
        "Failed to consume credits",
        new Error(consumeResult.error),
        { userId: session.user.id },
      );
      return errorResponse(
        new Error(consumeResult.error || "Failed to consume credits"),
        500,
        requestId,
      );
    }

    resultingBalance = consumeResult.remaining ?? 0;
  } else {
    const balanceResult = await WorkspaceCreditManager.getBalance(
      session.user.id,
    );
    resultingBalance = balanceResult?.remaining ?? 0;
    requestLogger.info("FREE tier - no credits consumed", {
      userId: session.user.id,
      tier,
    });
  }

  // 8. Job Creation
  const enhancementType: EnhancementType = resolvedBlendSource
    ? EnhancementType.BLEND
    : EnhancementType.STANDARD;

  const { data: job, error: jobError } = await tryCatch(
    prisma.imageEnhancementJob.create({
      data: {
        imageId,
        userId: session.user.id,
        tier,
        enhancementType,
        creditsCost: creditCost,
        status: JobStatus.PROCESSING,
        processingStartedAt: new Date(),
        sourceImageId,
        isBlend: !!resolvedBlendSource,
      },
    }),
  );

  if (jobError || !job) {
    requestLogger.error(
      "Failed to create enhancement job",
      jobError instanceof Error ? jobError : new Error(String(jobError)),
      { userId: session.user.id, imageId },
    );
    // Refund credits if consumed
    if (creditCost > 0) {
      await WorkspaceCreditManager.refundCredits(session.user.id, creditCost);
    }
    return errorResponse(
      new Error("Failed to create job"),
      500,
      requestId,
    );
  }

  requestLogger.info("Enhancement job created", {
    jobId: job.id,
    tier,
    isBlend: !!resolvedBlendSource,
    sourceImageId,
  });

  // 9. Attribution Tracking (fire-and-forget)
  void (async () => {
    const { error } = await tryCatch(
      attributeConversion(session.user.id, "ENHANCEMENT", creditCost),
    );
    if (error) {
      requestLogger.warn("Failed to track enhancement attribution", {
        userId: session.user.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  })();

  // 10. Start Enhancement
  const enhancementInput: EnhanceImageInput = {
    jobId: job.id,
    imageId: image.id,
    userId: session.user.id,
    originalR2Key: image.originalR2Key,
    tier,
    tokensCost: creditCost,
    blendSource: resolvedBlendSource,
  };

  const startResult = await startEnhancement(enhancementInput, requestLogger);

  if (!startResult.success) {
    requestLogger.error(
      "Failed to start enhancement",
      new Error(startResult.error),
      { jobId: job.id },
    );
    await handleEnhancementFailure(
      { jobId: job.id, userId: session.user.id, tokensCost: creditCost },
      "Failed to start workflow",
    );
    return errorResponse(
      new Error("Failed to start workflow"),
      500,
      requestId,
    );
  }

  return NextResponse.json(
    {
      success: true,
      jobId: job.id,
      creditCost,
      newBalance: resultingBalance,
    },
    { headers: { "X-Request-ID": requestId } },
  );
}

/**
 * Helper to create standardized error responses
 */
function errorResponse(
  error: Error,
  status: number,
  requestId: string,
): NextResponse {
  const errorMessage = getUserFriendlyError(error, status);
  return NextResponse.json(
    {
      error: errorMessage.message,
      title: errorMessage.title,
      suggestion: errorMessage.suggestion,
    },
    { status, headers: { "X-Request-ID": requestId } },
  );
}
