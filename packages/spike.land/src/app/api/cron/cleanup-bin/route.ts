export const maxDuration = 60;

/**
 * Cron Bin Cleanup Route
 *
 * GET /api/cron/cleanup-bin
 *
 * Automatically triggered by Vercel Cron daily at 2 AM UTC.
 * Permanently deletes apps that have been in the bin for more than 30 days.
 *
 * This endpoint is protected by Vercel's cron secret to prevent unauthorized access.
 */

import { cleanupExpiredBinApps, getBinStats } from "@/lib/apps/bin-cleanup";
import { validateCronSecret } from "@/lib/cron-auth";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  if (!validateCronSecret(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  // Get pre-cleanup stats
  const { data: preStats } = await tryCatch(getBinStats());

  // Run cleanup with default settings (30 day retention)
  const { data: result, error } = await tryCatch(cleanupExpiredBinApps());

  if (error) {
    logger.error("Cron bin cleanup failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Cleanup failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }

  // Get post-cleanup stats
  const { data: postStats } = await tryCatch(getBinStats());

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    result: {
      totalFound: result.totalFound,
      deleted: result.deleted,
      failed: result.failed,
      errorCount: result.errors.length,
    },
    stats: {
      before: preStats,
      after: postStats,
    },
  });
}
