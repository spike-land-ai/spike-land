import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { WorkspaceCreditManager } from "@/lib/credits/workspace-credit-manager";
import { tryCatch } from "@/lib/try-catch";
import { JobStatus } from "@prisma/client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

async function cancelJob(
  params: Promise<{ jobId: string; }>,
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await params;

  const job = await prisma.imageEnhancementJob.findUnique({
    where: { id: jobId },
  });

  if (!job || job.userId !== session.user.id) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (
    job.status !== JobStatus.PENDING && job.status !== JobStatus.PROCESSING
  ) {
    return NextResponse.json(
      { error: `Cannot cancel job with status: ${job.status}` },
      { status: 400 },
    );
  }

  // Note: With direct execution, jobs run in-process and cannot be cancelled mid-flight
  // The job status update below will prevent the job from being processed if it hasn't started yet

  const updatedJob = await prisma.imageEnhancementJob.update({
    where: { id: jobId },
    data: {
      status: JobStatus.CANCELLED,
    },
  });

  const refundSuccess = await WorkspaceCreditManager.refundCredits(
    session.user.id,
    job.creditsCost,
  );

  if (!refundSuccess) {
    logger.error("Failed to refund credits");
    return NextResponse.json(
      {
        error: "Job cancelled but credit refund failed. Please contact support.",
        job: updatedJob,
      },
      { status: 500 },
    );
  }

  const newBalance = await WorkspaceCreditManager.getBalance(session.user.id);

  return NextResponse.json({
    success: true,
    job: updatedJob,
    creditsRefunded: job.creditsCost,
    newBalance: newBalance?.remaining ?? 0,
  });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string; }>; },
) {
  const { data, error } = await tryCatch(cancelJob(params));

  if (error) {
    logger.error("Error cancelling job:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to cancel job",
      },
      { status: 500 },
    );
  }

  return data;
}
