import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

const MAX_JOB_IDS = 50;

interface BatchStatusRequest {
  jobIds: string[];
}

interface JobStatusResponse {
  id: string;
  status: string;
  errorMessage: string | null;
}

/**
 * Batch status endpoint for fetching multiple job statuses in a single request.
 * Reduces database load by consolidating N individual requests into 1.
 *
 * POST /api/jobs/batch-status
 * Body: { jobIds: string[] }
 * Response: { jobs: Array<{ id, status, errorMessage }> }
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: body, error: parseError } = await tryCatch<BatchStatusRequest>(
    request.json(),
  );

  if (parseError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { jobIds } = body;

  // Validate jobIds
  if (!Array.isArray(jobIds) || jobIds.length === 0) {
    return NextResponse.json(
      { error: "jobIds must be a non-empty array" },
      { status: 400 },
    );
  }

  if (jobIds.length > MAX_JOB_IDS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_JOB_IDS} job IDs allowed per request` },
      { status: 400 },
    );
  }

  // Validate all jobIds are strings
  if (!jobIds.every(id => typeof id === "string" && id.length > 0)) {
    return NextResponse.json(
      { error: "All jobIds must be non-empty strings" },
      { status: 400 },
    );
  }

  // Fetch all jobs in a single query, filtering by userId for security
  const { data: jobs, error: dbError } = await tryCatch(
    prisma.imageEnhancementJob.findMany({
      where: {
        id: { in: jobIds },
        userId: session.user.id,
      },
      select: {
        id: true,
        status: true,
        errorMessage: true,
      },
    }),
  );

  if (dbError) {
    logger.error("Error fetching batch job statuses:", dbError);
    return NextResponse.json(
      { error: "Failed to fetch job statuses" },
      { status: 500 },
    );
  }

  // Create a map for quick lookup
  const jobMap = new Map(jobs.map(job => [job.id, job]));

  // Build response maintaining the order of requested jobIds
  // Jobs not found or not owned by user will be excluded
  const response: JobStatusResponse[] = jobIds
    .map(id => jobMap.get(id))
    .filter((job): job is NonNullable<typeof job> => job !== undefined)
    .map(job => ({
      id: job.id,
      status: job.status,
      errorMessage: job.errorMessage,
    }));

  return NextResponse.json({ jobs: response });
}
