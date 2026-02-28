import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { tryCatch } from "@/lib/try-catch";
import { JobStatus } from "@prisma/client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

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

async function getJobHandler(jobId: string, userId: string | null) {
  const job = await prisma.imageEnhancementJob.findUnique({
    where: { id: jobId },
    include: {
      image: true,
    },
  });

  if (!job) {
    return { notFound: true as const };
  }

  // For anonymous jobs, allow public access
  // For non-anonymous jobs, require ownership
  if (!job.isAnonymous && job.userId !== userId) {
    return { notFound: true as const };
  }

  return {
    notFound: false as const,
    job: {
      id: job.id,
      status: job.status,
      tier: job.tier,
      creditsCost: job.creditsCost,
      enhancedUrl: job.enhancedUrl,
      enhancedWidth: job.enhancedWidth,
      enhancedHeight: job.enhancedHeight,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt,
      processingStartedAt: job.processingStartedAt,
      processingCompletedAt: job.processingCompletedAt,
      isAnonymous: job.isAnonymous,
      image: {
        id: job.image.id,
        name: job.image.name,
        originalUrl: job.image.originalUrl,
        originalWidth: job.image.originalWidth,
        originalHeight: job.image.originalHeight,
      },
    },
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string; }>; },
) {
  const { jobId } = await params;

  // First, check if this is an anonymous job (without fetching full job details)
  const { data: jobCheck, error: jobCheckError } = await tryCatch(
    prisma.imageEnhancementJob.findUnique({
      where: { id: jobId },
      select: { isAnonymous: true, userId: true },
    }),
  );

  if (jobCheckError) {
    logger.error("Error checking job:", jobCheckError);
    return NextResponse.json(
      {
        error: jobCheckError instanceof Error
          ? jobCheckError.message
          : "Failed to check job",
      },
      { status: 500 },
    );
  }

  if (!jobCheck) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // For anonymous jobs, rate limit by IP
  if (jobCheck.isAnonymous) {
    const clientIP = getClientIP(request);
    const rateLimitResult = await checkRateLimit(
      `anonymous-job-status:${clientIP}`,
      rateLimitConfigs.general,
    );
    if (rateLimitResult.isLimited) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 },
      );
    }
  } else {
    // For non-anonymous jobs, require authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (jobCheck.userId !== session.user.id) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
  }

  const session = await auth();
  const { data, error } = await tryCatch(
    getJobHandler(jobId, session?.user?.id || null),
  );

  if (error) {
    logger.error("Error fetching job:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch job" },
      { status: 500 },
    );
  }

  if (data.notFound) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(data.job);
}

type DeleteJobResult =
  | { status: "notFound"; }
  | { status: "invalidStatus"; jobStatus: JobStatus; }
  | { status: "success"; };

async function deleteJobHandler(
  jobId: string,
  userId: string,
): Promise<DeleteJobResult> {
  const job = await prisma.imageEnhancementJob.findUnique({
    where: { id: jobId },
  });

  if (!job || job.userId !== userId) {
    return { status: "notFound" };
  }

  if (
    job.status !== JobStatus.COMPLETED
    && job.status !== JobStatus.FAILED
    && job.status !== JobStatus.CANCELLED
    && job.status !== JobStatus.REFUNDED
  ) {
    return { status: "invalidStatus", jobStatus: job.status };
  }

  await prisma.imageEnhancementJob.delete({
    where: { id: jobId },
  });

  return { status: "success" };
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string; }>; },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await params;

  const { data, error } = await tryCatch(
    deleteJobHandler(jobId, session.user.id),
  );

  if (error) {
    logger.error("Error deleting job:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete job",
      },
      { status: 500 },
    );
  }

  if (data.status === "notFound") {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (data.status === "invalidStatus") {
    return NextResponse.json(
      {
        error:
          `Cannot delete job with status: ${data.jobStatus}. Only COMPLETED, FAILED, CANCELLED, or REFUNDED jobs can be deleted.`,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    message: "Job deleted successfully",
  });
}
