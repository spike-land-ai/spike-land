import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

interface RouteContext {
  params: Promise<{ jobId: string; }>;
}

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

/**
 * GET /api/jobs/[jobId]/download
 *
 * Download endpoint for job results.
 * Validates ownership for non-anonymous jobs.
 * Anonymous jobs are publicly accessible with IP-based rate limiting.
 *
 * Response:
 * - Success: Image blob with Content-Disposition header
 * - Error: JSON with error message
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { data: params, error: paramsError } = await tryCatch(context.params);
  if (paramsError) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }
  const { jobId } = params;

  // Fetch job first to check if it's anonymous
  const { data: job, error: dbError } = await tryCatch(
    prisma.imageEnhancementJob.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        userId: true,
        status: true,
        enhancedUrl: true,
        isAnonymous: true,
        image: {
          select: {
            name: true,
          },
        },
      },
    }),
  );

  if (dbError) {
    logger.error("Database error:", dbError);
    return NextResponse.json(
      { error: "Failed to download image" },
      { status: 500 },
    );
  }

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Rate limiting based on anonymous status
  let rateLimitResult: {
    isLimited: boolean;
    remaining: number;
    resetAt: number;
  } | null = null;

  if (job.isAnonymous) {
    // For anonymous jobs, rate limit by IP
    const clientIP = getClientIP(request);
    const { data: result, error: rateLimitError } = await tryCatch(
      checkRateLimit(
        `anonymous-download:${clientIP}`,
        rateLimitConfigs.anonymousDownload,
      ),
    );
    if (rateLimitError) {
      logger.error("Rate limit check failed:", rateLimitError);
    }
    rateLimitResult = result ?? null;
  } else {
    // For non-anonymous jobs, require authentication and ownership
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    if (job.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Rate limit by user ID
    const { data: result, error: rateLimitError } = await tryCatch(
      checkRateLimit(
        `job-download:${session.user.id}`,
        rateLimitConfigs.general,
      ),
    );
    if (rateLimitError) {
      logger.error("Rate limit check failed:", rateLimitError);
    }
    rateLimitResult = result ?? null;
  }

  if (rateLimitResult?.isLimited) {
    return NextResponse.json(
      {
        error: "Too many download requests",
        retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
          ),
        },
      },
    );
  }

  // Check job is completed
  if (job.status !== "COMPLETED" || !job.enhancedUrl) {
    return NextResponse.json(
      { error: "Image not available for download" },
      { status: 404 },
    );
  }

  // Proxy the download
  const { data: imageResponse, error: fetchError } = await tryCatch(
    fetch(job.enhancedUrl),
  );

  if (fetchError || !imageResponse.ok) {
    logger.error("Fetch error:", fetchError);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 502 },
    );
  }

  // Get content type from response or default to jpeg
  const contentType = imageResponse.headers.get("Content-Type") || "image/jpeg";

  // Determine file extension from content type
  const extensionMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const extension = extensionMap[contentType] || "jpg";

  // Build filename
  const baseName = job.image?.name || "mix";
  const sanitizedFilename = baseName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `${sanitizedFilename}-${job.id.slice(-6)}.${extension}`;

  // Return the image with download headers
  return new NextResponse(imageResponse.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=3600",
      "X-RateLimit-Remaining": String(rateLimitResult?.remaining ?? 0),
    },
  });
}
