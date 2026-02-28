import logger from "@/lib/logger";

export const maxDuration = 60;

/**
 * Error Log Cleanup Cron Job
 *
 * GET /api/cron/cleanup-errors - Clean up old error logs
 *
 * This endpoint is designed to be called by Vercel Cron daily at 4 AM.
 * It deletes error logs older than 30 days to prevent database bloat.
 *
 * Security: Protected by CRON_SECRET header validation
 */

import prisma from "@/lib/prisma";
import { validateCronSecret } from "@/lib/cron-auth";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const RETENTION_DAYS = 30;

/**
 * Calculate the cutoff date for data retention
 */
function getCutoffDate(days: number = RETENTION_DAYS): Date {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  return cutoff;
}

/**
 * Clean up old error logs
 */
async function cleanupErrorLogs(): Promise<{ errorLogs: number; }> {
  const cutoffDate = getCutoffDate();

  logger.info(
    `Error cleanup: Deleting error logs older than ${cutoffDate.toISOString()}`,
  );

  const result = await prisma.errorLog.deleteMany({
    where: {
      timestamp: {
        lt: cutoffDate,
      },
    },
  });

  return {
    errorLogs: result.count,
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  // Validate cron secret
  if (!validateCronSecret(request)) {
    logger.error("Cleanup errors cron: Invalid or missing CRON_SECRET");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  logger.info("Cleanup errors cron: Starting cleanup...");

  // Run the cleanup
  const { data: stats, error } = await tryCatch(cleanupErrorLogs());

  if (error) {
    const duration = Date.now() - startTime;
    logger.error("Cleanup errors cron: Failed", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        durationMs: duration,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }

  const duration = Date.now() - startTime;

  const response = {
    success: true,
    retentionDays: RETENTION_DAYS,
    deleted: stats,
    totalDeleted: stats.errorLogs,
    durationMs: duration,
    timestamp: new Date().toISOString(),
  };

  logger.info(
    `Cleanup errors cron: Completed. Deleted ${stats.errorLogs} error logs in ${duration}ms`,
  );

  return NextResponse.json(response);
}
