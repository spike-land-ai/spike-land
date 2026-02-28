import { authenticateMcpOrSession } from "@/lib/mcp/auth";
import { getJob } from "@/lib/mcp/generation-service";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// Force dynamic rendering - skip static page data collection
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ jobId: string; }>;
}

/**
 * GET /api/mcp/jobs/[jobId]
 *
 * Get the status of a generation/modification job
 *
 * Headers:
 *   Authorization: Bearer <api_key>
 *
 * Response:
 *   {
 *     id: string,
 *     type: "GENERATE" | "MODIFY",
 *     tier: string,
 *     creditsCost: number,
 *     status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED",
 *     prompt: string,
 *     inputImageUrl?: string,
 *     outputImageUrl?: string,
 *     outputWidth?: number,
 *     outputHeight?: number,
 *     errorMessage?: string,
 *     createdAt: string,
 *     processingStartedAt?: string,
 *     processingCompletedAt?: string
 *   }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  // Authenticate via API key or session
  const authResult = await authenticateMcpOrSession(request);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const { userId } = authResult;

  // Rate limiting (more lenient for status polling)
  const rateLimitResult = await checkRateLimit(
    `mcp:jobs:${userId}`,
    rateLimitConfigs.mcpJobStatus,
  );

  if (rateLimitResult.isLimited) {
    const retryAfter = Math.ceil(
      (rateLimitResult.resetAt - Date.now()) / 1000,
    );
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        retryAfter,
      },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      },
    );
  }

  const { jobId } = await params;

  // Get job - only for the authenticated user
  const { data: job, error } = await tryCatch(getJob(jobId, userId));

  if (error) {
    logger.error("Failed to fetch job:", error);
    return NextResponse.json(
      { error: "Failed to fetch job status" },
      { status: 500 },
    );
  }

  if (!job) {
    return NextResponse.json(
      { error: "Job not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    id: job.id,
    type: job.type,
    tier: job.tier,
    creditsCost: job.creditsCost,
    status: job.status,
    prompt: job.prompt,
    inputImageUrl: job.inputImageUrl || null,
    outputImageUrl: job.outputImageUrl || null,
    outputWidth: job.outputWidth || null,
    outputHeight: job.outputHeight || null,
    errorMessage: job.errorMessage || null,
    createdAt: job.createdAt.toISOString(),
    processingStartedAt: job.processingStartedAt?.toISOString() || null,
    processingCompletedAt: job.processingCompletedAt?.toISOString() || null,
  });
}
