/**
 * POST /api/errors/report
 *
 * Receives error reports from frontend and stores them in the database.
 * Rate limited to prevent abuse.
 */

import { reportErrorsBatchToDatabase } from "@/lib/errors/error-reporter.server";
import { checkRateLimit } from "@/lib/rate-limiter";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

interface ErrorReport {
  message: string;
  stack?: string;
  sourceFile?: string;
  sourceLine?: number;
  sourceColumn?: number;
  callerName?: string;
  errorType?: string;
  errorCode?: string;
  route?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
  environment?: "FRONTEND" | "BACKEND";
}

interface RequestBody {
  errors: ErrorReport[];
}

// Max errors per request to prevent abuse
const MAX_ERRORS_PER_REQUEST = 20;

/**
 * Noise filter patterns — errors matching these are dropped before DB insertion.
 * Migrated from the former Sentry beforeSend() filters.
 */
const NOISE_PATTERNS = [
  "aborted",
  "abortIncoming",
  "AbortError",
  "Skipped ViewTransition",
  "selectNode",
  "useSetFinishViewTransition",
  "was instantiated because it was required from module",
  "ECONNRESET",
  "EPIPE",
  "socket hang up",
  "Connection terminated",
  "Failed to fetch apps",
  "Failed to fetch created apps",
  "Failed to find Server Action",
  "Hydration",
  "Minified React error #418",
  "Minified React error #423",
  "ResizeObserver loop",
  "Non-Error promise rejection",
  "another transition starting",
];

function isNoisyError(message: string): boolean {
  return NOISE_PATTERNS.some(pattern => message.includes(pattern));
}

export async function POST(request: Request) {
  try {
    // Get IP for rate limiting
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

    // Rate limit: 20 requests per minute per IP
    const { isLimited, remaining } = await checkRateLimit(
      `error-report:${ip}`,
      { maxRequests: 20, windowMs: 60000 },
    );

    if (isLimited) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        {
          status: 429,
          headers: { "X-RateLimit-Remaining": remaining.toString() },
        },
      );
    }

    // Parse request body
    const body: RequestBody = await request.json();

    if (!body.errors || !Array.isArray(body.errors)) {
      return NextResponse.json(
        { error: "Invalid request body: errors array required" },
        { status: 400 },
      );
    }

    // Limit errors per request
    const errorsToProcess = body.errors.slice(0, MAX_ERRORS_PER_REQUEST);
    let failCount = 0;

    // Validate and sanitize all errors first
    const validErrors: Array<{
      error: {
        message: string;
        stack?: string;
        sourceFile?: string;
        sourceLine?: number;
        sourceColumn?: number;
        callerName?: string;
        errorType?: string;
        errorCode?: string;
        route?: string;
        userId?: string;
        metadata?: Record<string, unknown>;
        timestamp: string;
      };
      environment: "FRONTEND" | "BACKEND";
    }> = [];

    for (const error of errorsToProcess) {
      // Validate required fields
      if (!error.message || typeof error.message !== "string") {
        failCount++;
        continue;
      }

      // Filter noisy errors before DB insertion
      if (isNoisyError(error.message)) {
        continue;
      }

      const env: "FRONTEND" | "BACKEND" = error.environment === "BACKEND"
        ? "BACKEND"
        : "FRONTEND";

      validErrors.push({
        error: {
          message: error.message.slice(0, 10000),
          stack: error.stack?.slice(0, 50000),
          sourceFile: error.sourceFile?.slice(0, 500),
          sourceLine: typeof error.sourceLine === "number"
            ? error.sourceLine
            : undefined,
          sourceColumn: typeof error.sourceColumn === "number"
            ? error.sourceColumn
            : undefined,
          callerName: error.callerName?.slice(0, 200),
          errorType: error.errorType?.slice(0, 100),
          errorCode: error.errorCode?.slice(0, 100),
          route: error.route?.slice(0, 500),
          userId: error.userId?.slice(0, 100),
          metadata: typeof error.metadata === "object"
            ? error.metadata
            : undefined,
          timestamp: error.timestamp || new Date().toISOString(),
        },
        environment: env,
      });
    }

    // Batch insert all valid errors in a single query
    let successCount = 0;
    try {
      await reportErrorsBatchToDatabase(validErrors);
      successCount = validErrors.length;
    } catch (dbError) {
      failCount += validErrors.length;
      logger.error(
        "[ErrorReport API] Database write failed:",
        dbError instanceof Error ? dbError.message : dbError,
      );
    }

    return NextResponse.json(
      {
        success: true,
        received: successCount,
        failed: failCount,
        truncated: body.errors.length > MAX_ERRORS_PER_REQUEST,
      },
      {
        headers: { "X-RateLimit-Remaining": remaining.toString() },
      },
    );
  } catch (error) {
    logger.error("[ErrorReport API] Failed to process request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
