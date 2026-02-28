import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { tryCatch } from "@/lib/try-catch";
import type { EnhancementTier, JobStatus } from "@prisma/client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

type EnhancementJob = {
  id: string;
  tier: EnhancementTier;
  status: JobStatus;
  creditsCost: number;
  enhancedUrl: string | null;
  enhancedWidth: number | null;
  enhancedHeight: number | null;
  enhancedSizeBytes: number | null;
  createdAt: Date;
  processingStartedAt: Date | null;
  processingCompletedAt: Date | null;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; }>; },
) {
  const { data: session, error: authError } = await tryCatch(auth());
  if (authError) {
    logger.error("Error in GET versions API:", authError);
    return NextResponse.json(
      {
        error: authError instanceof Error
          ? authError.message
          : "Failed to fetch versions",
      },
      { status: 500 },
    );
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Apply rate limiting
  const { data: rateLimitResult, error: rateLimitError } = await tryCatch(
    checkRateLimit(`versions-${session.user.id}`, rateLimitConfigs.general),
  );

  if (rateLimitError) {
    logger.error("Error in GET versions API:", rateLimitError);
    return NextResponse.json(
      {
        error: rateLimitError instanceof Error
          ? rateLimitError.message
          : "Failed to fetch versions",
      },
      { status: 500 },
    );
  }

  if (rateLimitResult.isLimited) {
    return NextResponse.json(
      {
        error: "Too many requests",
        resetAt: rateLimitResult.resetAt,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": rateLimitConfigs.general.maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": rateLimitResult.resetAt.toString(),
        },
      },
    );
  }

  const { data: resolvedParams, error: paramsError } = await tryCatch(params);
  if (paramsError) {
    logger.error("Error in GET versions API:", paramsError);
    return NextResponse.json(
      {
        error: paramsError instanceof Error
          ? paramsError.message
          : "Failed to fetch versions",
      },
      { status: 500 },
    );
  }

  const { id } = resolvedParams;

  // Find the image with all enhancement jobs
  const { data: image, error: dbError } = await tryCatch(
    prisma.enhancedImage.findUnique({
      where: { id },
      include: {
        enhancementJobs: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    }),
  );

  if (dbError) {
    logger.error("Error in GET versions API:", dbError);
    return NextResponse.json(
      {
        error: dbError instanceof Error
          ? dbError.message
          : "Failed to fetch versions",
      },
      { status: 500 },
    );
  }

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  // Check if user has access (owner or public image)
  if (image.userId !== session.user.id && !image.isPublic) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Calculate processing time for each job
  const versions = image.enhancementJobs
    .filter((job: EnhancementJob) => job.status === "COMPLETED")
    .map((job: EnhancementJob) => {
      const processingTimeMs = job.processingStartedAt && job.processingCompletedAt
        ? job.processingCompletedAt.getTime()
          - job.processingStartedAt.getTime()
        : null;

      return {
        jobId: job.id,
        tier: job.tier,
        status: job.status,
        resultUrl: job.enhancedUrl,
        creditsSpent: job.creditsCost,
        createdAt: job.createdAt,
        processingTimeMs,
        width: job.enhancedWidth,
        height: job.enhancedHeight,
        sizeBytes: job.enhancedSizeBytes,
      };
    });

  return NextResponse.json(
    {
      success: true,
      imageId: image.id,
      imageName: image.name,
      originalUrl: image.originalUrl,
      versions,
    },
    {
      headers: {
        "X-RateLimit-Limit": rateLimitConfigs.general.maxRequests.toString(),
        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
        "X-RateLimit-Reset": rateLimitResult.resetAt.toString(),
      },
    },
  );
}
