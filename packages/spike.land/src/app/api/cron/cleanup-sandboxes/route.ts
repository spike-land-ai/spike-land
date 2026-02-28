/**
 * Sandbox Cleanup Cron Job
 *
 * Called by cron every 15 minutes. Finds stale sandbox jobs (PENDING, SPAWNING,
 * or RUNNING beyond the timeout threshold) and marks them as TIMEOUT, notifying
 * users via app messages and real-time broadcasts.
 */

import { broadcastToApp } from "@/app/api/apps/[id]/messages/stream/route";
import { validateCronSecret } from "@/lib/cron-auth";
import { logger } from "@/lib/errors/structured-logger";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import { setAgentWorking } from "@/lib/upstash/client";
import { NextResponse } from "next/server";

// Cron jobs should complete quickly
export const maxDuration = 30;

// Timeout threshold in minutes (configurable via environment variable)
const TIMEOUT_MINUTES = parseInt(
  process.env.SANDBOX_TIMEOUT_MINUTES || "10",
  10,
);

/**
 * GET /api/cron/cleanup-sandboxes
 *
 * Called by cron every 15 minutes. Cleans up stale sandbox jobs in the DB
 * (marks them as TIMEOUT and notifies users).
 */
export async function GET(request: Request) {
  // Verify cron secret — timing-safe comparison prevents brute-force
  if (!validateCronSecret(request)) {
    logger.warn("[cleanup-sandboxes] Unauthorized cron request", {
      route: "/api/cron/cleanup-sandboxes",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  logger.info("[cleanup-sandboxes] Starting cleanup job", {
    route: "/api/cron/cleanup-sandboxes",
  });

  const timeoutThreshold = new Date(Date.now() - TIMEOUT_MINUTES * 60 * 1000);

  // Find stale jobs
  const { data: staleJobs, error: findError } = await tryCatch(
    prisma.sandboxJob.findMany({
      where: {
        status: {
          in: ["PENDING", "SPAWNING", "RUNNING"],
        },
        startedAt: {
          lt: timeoutThreshold,
        },
      },
      include: {
        app: {
          select: {
            id: true,
            name: true,
            userId: true,
          },
        },
      },
    }),
  );

  if (findError) {
    logger.error(
      "[cleanup-sandboxes] Failed to find stale jobs",
      findError instanceof Error ? findError : undefined,
      { route: "/api/cron/cleanup-sandboxes" },
    );
    return NextResponse.json(
      { error: "Failed to query stale jobs" },
      { status: 500 },
    );
  }

  if (!staleJobs || staleJobs.length === 0) {
    logger.info("[cleanup-sandboxes] No stale jobs found", {
      route: "/api/cron/cleanup-sandboxes",
    });
    return NextResponse.json({
      success: true,
      message: "No stale jobs found",
      processed: 0,
    });
  }

  logger.info("[cleanup-sandboxes] Found stale jobs", {
    count: staleJobs.length,
    route: "/api/cron/cleanup-sandboxes",
  });

  let processed = 0;
  let errors = 0;

  for (const job of staleJobs) {
    try {
      logger.info("[cleanup-sandboxes] Processing stale job", {
        jobId: job.id,
        status: job.status,
        sandboxId: job.sandboxId,
        route: "/api/cron/cleanup-sandboxes",
      });

      // Update job to TIMEOUT status
      await prisma.sandboxJob.update({
        where: { id: job.id },
        data: {
          status: "TIMEOUT",
          error: `Job timed out after ${TIMEOUT_MINUTES} minutes`,
          completedAt: new Date(),
        },
      });

      // Create a system message to notify the user
      await prisma.appMessage.create({
        data: {
          appId: job.appId,
          role: "SYSTEM",
          content:
            `The agent took too long to respond and was stopped after ${TIMEOUT_MINUTES} minutes. Please try again with a simpler request.`,
        },
      });

      // Clear agent working status
      await setAgentWorking(job.appId, false);

      // Broadcast updates to connected clients
      broadcastToApp(job.appId, {
        type: "status",
        data: {
          error: true,
          message: "Agent request timed out. Please try again.",
        },
      });

      broadcastToApp(job.appId, {
        type: "agent_working",
        data: { isWorking: false },
      });

      processed++;
    } catch (error) {
      logger.error(
        "[cleanup-sandboxes] Error processing job",
        error instanceof Error ? error : undefined,
        { jobId: job.id, route: "/api/cron/cleanup-sandboxes" },
      );
      errors++;
    }
  }

  logger.info("[cleanup-sandboxes] Cleanup complete", {
    processed,
    errors,
    route: "/api/cron/cleanup-sandboxes",
  });

  return NextResponse.json({
    success: true,
    message: `Processed ${processed} stale jobs`,
    processed,
    errors,
  });
}
