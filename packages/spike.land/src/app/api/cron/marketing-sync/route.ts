import logger from "@/lib/logger";

export const maxDuration = 60;

/**
 * Marketing Sync Cron Job
 *
 * GET /api/cron/marketing-sync - Sync external campaign data from marketing platforms
 *
 * This endpoint is designed to be called by Vercel Cron on an hourly schedule.
 * It syncs campaign metrics from connected Facebook and Google Ads accounts
 * for ROI calculation.
 *
 * Security: Protected by CRON_SECRET header validation
 */

import { syncExternalCampaigns } from "@/lib/marketing/campaign-sync";
import { validateCronSecret } from "@/lib/cron-auth";
import { cleanupExpiredCache } from "@/lib/tracking/metrics-cache";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { tryCatch } from "@/lib/try-catch";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  // Validate cron secret
  if (!validateCronSecret(request)) {
    logger.error("Marketing sync cron: Invalid or missing CRON_SECRET");
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  logger.info("Marketing sync cron: Starting sync...");

  // Run the sync
  const { data: syncResult, error: syncError } = await tryCatch(
    syncExternalCampaigns(),
  );

  if (syncError) {
    const duration = Date.now() - startTime;
    logger.error("Marketing sync cron: Failed", syncError);
    return NextResponse.json(
      {
        success: false,
        error: syncError instanceof Error ? syncError.message : "Unknown error",
        durationMs: duration,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }

  // Also cleanup expired cache entries
  const { data: expiredCacheCleanedUp, error: cleanupError } = await tryCatch(
    cleanupExpiredCache(),
  );

  if (cleanupError) {
    logger.warn(
      "Marketing sync cron: Failed to cleanup expired cache",
      {
        error: cleanupError instanceof Error
          ? cleanupError.message
          : String(cleanupError),
      },
    );
    // Don't fail the whole job if cache cleanup fails
  }

  const duration = Date.now() - startTime;

  const response = {
    success: true,
    synced: syncResult?.synced || 0,
    errors: syncResult?.errors || [],
    cacheCleanedUp: expiredCacheCleanedUp || 0,
    durationMs: duration,
    timestamp: new Date().toISOString(),
  };

  if (syncResult && syncResult.errors.length > 0) {
    logger.warn(
      `Marketing sync cron: Completed with ${syncResult.errors.length} errors`,
      { errors: syncResult.errors },
    );
  } else {
    logger.info(
      `Marketing sync cron: Completed successfully. Synced ${
        syncResult?.synced || 0
      } campaigns in ${duration}ms`,
    );
  }

  return NextResponse.json(response);
}
