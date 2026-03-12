import { createLogger } from "@spike-land-ai/shared";
import type { Env } from "../core-logic/env.js";

const log = createLogger("spike-edge-cron");

export async function handleScheduled(env: Env): Promise<void> {
  const nowMs = Date.now();
  const fifteenMinAgo = nowMs - 15 * 60 * 1000;

  try {
    const result = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM error_logs WHERE created_at >= ? AND severity IN ('error', 'fatal')",
    )
      .bind(fifteenMinAgo)
      .first<{ count: number }>();

    const errorCount = result?.count ?? 0;
    log.info("Error rate check", { errorCount, since: fifteenMinAgo });

    // Write error rate metric so the analytics dashboard can display it
    try {
      const minuteBucket = Math.floor(nowMs / 60_000);
      await env.DB.prepare(
        `INSERT INTO status_service_minute_metrics (service_name, minute_bucket, request_count, error_count, p50_ms, p95_ms, p99_ms)
         VALUES (?, ?, 0, ?, 0, 0, 0)
         ON CONFLICT (service_name, minute_bucket) DO UPDATE SET error_count = error_count + excluded.error_count`,
      )
        .bind("spike-edge", minuteBucket, errorCount)
        .run();
    } catch (metricErr) {
      // status_service_minute_metrics may not exist yet — don't fail the cron
      log.warn("Failed to write error rate metric", { error: String(metricErr) });
    }

    if (errorCount > 50) {
      // Check if we alerted recently (within last hour) to avoid spam
      const lastAlert = await env.DB.prepare(
        "SELECT created_at FROM error_logs WHERE message = 'ERROR_RATE_ALERT_SENT' ORDER BY created_at DESC LIMIT 1",
      ).first<{ created_at: number }>();

      const oneHourAgo = nowMs - 60 * 60 * 1000;
      if (!lastAlert || lastAlert.created_at < oneHourAgo) {
        log.error("Error rate spike detected", { errorCount, threshold: 50, window: "15m" });

        // Record that we sent an alert
        await env.DB.prepare(
          "INSERT INTO error_logs (service_name, error_code, message, severity) VALUES (?, ?, ?, ?)",
        )
          .bind("cron", "ALERT", "ERROR_RATE_ALERT_SENT", "info")
          .run();
      }
    }
  } catch (err) {
    log.error("Cron error rate check failed", { error: String(err) });
  }
}
