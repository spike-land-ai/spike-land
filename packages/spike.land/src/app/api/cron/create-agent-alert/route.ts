export const maxDuration = 60;

/**
 * Create Agent Alert Cron Job
 *
 * GET /api/cron/create-agent-alert
 *
 * Runs hourly to check create-agent health metrics.
 * Emits structured alerts via logger.error when thresholds are breached.
 */

import logger from "@/lib/logger";
import prisma from "@/lib/prisma";
import { validateCronSecret } from "@/lib/cron-auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

interface AlertCheck {
  alertType: string;
  triggered: boolean;
  value: number;
  threshold: number;
  message: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const alerts: AlertCheck[] = [];

  try {
    // Check 1: Success rate in last hour
    const successRateResult = await prisma.$queryRaw<
      Array<{ total: bigint; successes: bigint; }>
    >`
      SELECT
        COUNT(*)::bigint as total,
        COUNT(*) FILTER (WHERE success = true)::bigint as successes
      FROM "GenerationAttempt"
      WHERE "createdAt" >= ${oneHourAgo}
    `;

    const total = Number(successRateResult[0]?.total ?? 0);
    const successes = Number(successRateResult[0]?.successes ?? 0);
    const successRate = total > 0 ? (successes / total) * 100 : 100;

    alerts.push({
      alertType: "low_success_rate",
      triggered: total > 0 && successRate < 50,
      value: Math.round(successRate * 100) / 100,
      threshold: 50,
      message: `Success rate ${successRate.toFixed(1)}% (${successes}/${total}) in last hour`,
    });

    // Check 2: p95 latency in last hour
    const latencyResult = await prisma.$queryRaw<
      Array<{ p95: number | null; }>
    >`
      SELECT
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "totalDurationMs") as p95
      FROM "GenerationAttempt"
      WHERE "createdAt" >= ${oneHourAgo}
    `;

    const p95 = Number(latencyResult[0]?.p95 ?? 0);
    const p95Seconds = p95 / 1000;

    alerts.push({
      alertType: "high_latency",
      triggered: total > 0 && p95Seconds > 90,
      value: Math.round(p95Seconds * 100) / 100,
      threshold: 90,
      message: `p95 latency ${p95Seconds.toFixed(1)}s in last hour`,
    });

    // Check 3: Consecutive failures
    const recentAttempts = await prisma.$queryRaw<
      Array<{ success: boolean; }>
    >`
      SELECT success
      FROM "GenerationAttempt"
      WHERE "createdAt" >= ${oneHourAgo}
      ORDER BY "createdAt" DESC
      LIMIT 10
    `;

    let consecutiveFailures = 0;
    for (const attempt of recentAttempts) {
      if (!attempt.success) {
        consecutiveFailures++;
      } else {
        break;
      }
    }

    alerts.push({
      alertType: "consecutive_failures",
      triggered: consecutiveFailures >= 5,
      value: consecutiveFailures,
      threshold: 5,
      message: `${consecutiveFailures} consecutive failures in last hour`,
    });

    // Emit alerts
    const triggeredAlerts = alerts.filter(a => a.triggered);
    for (const alert of triggeredAlerts) {
      logger.error("ALERT", {
        alertType: alert.alertType,
        value: alert.value,
        threshold: alert.threshold,
        message: alert.message,
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      checks: alerts.map(({ alertType, triggered, value, threshold }) => ({
        alertType,
        triggered,
        value,
        threshold,
      })),
      alertsTriggered: triggeredAlerts.length,
    });
  } catch (error) {
    logger.error("Create agent alert cron failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: "Alert check failed",
      },
      { status: 500 },
    );
  }
}
