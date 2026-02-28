/**
 * Box Status Sync Cron Job
 *
 * GET /api/cron/sync-box-status
 *
 * Automatically triggered by cron to reconcile box statuses in the database
 * with the actual state of their EC2 instances. Handles boxes in transient
 * states (CREATING, STARTING, RUNNING, STOPPING) that have an EC2 instance.
 *
 * This endpoint is protected by the CRON_SECRET to prevent unauthorized access.
 */

import { validateCronSecret } from "@/lib/cron-auth";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import { BoxStatus } from "@prisma/client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ACTIVE_STATUSES: BoxStatus[] = [
  BoxStatus.CREATING,
  BoxStatus.STARTING,
  BoxStatus.RUNNING,
  BoxStatus.STOPPING,
];

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Require CRON_SECRET to be configured; reject requests that do not present it.
  // Unlike some other cron routes this one interacts with live AWS infrastructure,
  // so we intentionally do NOT allow unauthenticated access even in development.
  if (!validateCronSecret(req)) {
    logger.warn("[CronSync] Unauthorized request to sync-box-status", {
      route: "/api/cron/sync-box-status",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  logger.info("[CronSync] Starting box status sync", {
    route: "/api/cron/sync-box-status",
  });

  const { data: boxes, error: boxesError } = await tryCatch(
    prisma.box.findMany({
      where: {
        status: { in: ACTIVE_STATUSES },
        ec2InstanceId: { not: null },
        deletedAt: null,
      },
      select: { id: true },
    }),
  );

  if (boxesError) {
    logger.error(
      "[CronSync] Failed to fetch active boxes",
      boxesError,
      { route: "/api/cron/sync-box-status" },
    );
    return NextResponse.json({ error: "Failed to fetch boxes" }, { status: 500 });
  }

  if (!boxes.length) {
    logger.info("[CronSync] No active boxes to sync", {
      route: "/api/cron/sync-box-status",
    });
    return NextResponse.json({ synced: 0, errors: 0, durationMs: Date.now() - startTime });
  }

  // Dynamic import avoids loading the AWS SDK when there are no boxes to process.
  const { syncBoxStatus } = await import("@/lib/boxes/ec2-actions");

  let synced = 0;
  let errors = 0;

  for (const box of boxes) {
    const { error: syncError } = await tryCatch(syncBoxStatus(box.id));
    if (syncError) {
      logger.error("[CronSync] Failed to sync box", syncError, { boxId: box.id });
      errors++;
    } else {
      synced++;
    }
  }

  const durationMs = Date.now() - startTime;

  logger.info("[CronSync] Box status sync complete", {
    synced,
    errors,
    durationMs,
    route: "/api/cron/sync-box-status",
  });

  return NextResponse.json({ synced, errors, durationMs });
}
