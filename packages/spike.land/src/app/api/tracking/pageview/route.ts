import logger from "@/lib/logger";

/**
 * Page View Tracking API Route
 *
 * Records individual page views within a session.
 * Public endpoint - no authentication required.
 * Rate limited to prevent abuse.
 */

import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limiter";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

// Rate limit config: 200 requests per minute per IP (higher for page views)
const pageViewRateLimit = {
  maxRequests: 200,
  windowMs: 60 * 1000, // 1 minute
};

// Maximum request body size (2KB should be plenty)
const MAX_BODY_SIZE = 2048;

// Input validation schema
const pageViewRequestSchema = z.object({
  sessionId: z.string().min(1).max(128),
  path: z.string().min(1).max(2048),
  title: z.string().max(512).optional(),
  timeOnPage: z.number().int().min(0).max(86400).optional(), // Max 24 hours in seconds
  scrollDepth: z.number().int().min(0).max(100).optional(), // 0-100 percentage
});

/**
 * Get client IP address from request headers
 */
function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0];
    return firstIp ? firstIp.trim() : "unknown";
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  return "unknown";
}

import { tryCatch } from "@/lib/try-catch";

export async function POST(request: NextRequest) {
  // Check content length to prevent oversized payloads
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  // Rate limiting by IP address
  const clientIP = getClientIP(request);
  const { data: rateLimitResult, error: rateLimitError } = await tryCatch(
    checkRateLimit(`tracking_pageview:${clientIP}`, pageViewRateLimit),
  );

  if (rateLimitError) {
    logger.error("[Tracking] Rate limit check error:", rateLimitError);
    // Proceed if rate limit check fails (fail open) or block? Failing open usually better for tracking
    // But let's follow existing pattern if any. The previous code didn't catch specific errors from checkRateLimit outside the main try block.
    // Assuming checkRateLimit might throw.
  }

  if (rateLimitResult?.isLimited) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
          ),
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
        },
      },
    );
  }

  // Parse and validate request body
  const { data: body, error: jsonError } = await tryCatch(request.json());

  if (jsonError) {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parseResult = pageViewRequestSchema.safeParse(body);
  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0];
    return NextResponse.json(
      {
        error: `Invalid input: ${firstError?.path.join(".")} - ${firstError?.message}`,
      },
      { status: 400 },
    );
  }

  const data = parseResult.data;

  // Verify session exists
  const { data: session, error: sessionError } = await tryCatch(
    prisma.visitorSession.findUnique({
      where: { id: data.sessionId },
    }),
  );

  if (sessionError) {
    logger.error("[Tracking] Session lookup error:", sessionError);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  if (!session) {
    return NextResponse.json(
      { error: "Session not found" },
      { status: 404 },
    );
  }

  // Create page view and update session in a transaction
  const { error: txError } = await tryCatch(
    prisma.$transaction(async tx => {
      // Create the page view record
      await tx.pageView.create({
        data: {
          sessionId: data.sessionId,
          path: data.path,
          title: data.title || null,
          timeOnPage: data.timeOnPage || null,
          scrollDepth: data.scrollDepth || null,
        },
      });

      // Update session with new page view count and exit page
      await tx.visitorSession.update({
        where: { id: data.sessionId },
        data: {
          pageViewCount: { increment: 1 },
          exitPage: data.path,
          sessionEnd: new Date(), // Update activity timestamp
        },
      });
    }),
  );

  if (txError) {
    logger.error("[Tracking] Page view tracking error:", txError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  logger.info(
    `[Tracking] Recorded page view for session ${data.sessionId}: ${data.path}`,
  );

  return NextResponse.json(
    { success: true },
    { status: 200 },
  );
}
