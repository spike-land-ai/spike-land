import { NextResponse } from "next/server";

import { redis } from "@/lib/upstash/client";

const TIMEOUT_MS = 5000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ]);
}

/**
 * Readiness endpoint — verifies DB and Redis connectivity.
 * Used by ECS/ALB for deeper health probes during deployments.
 * Unlike /api/health (shallow, for ALB polling), this confirms
 * all critical dependencies are reachable before accepting traffic.
 */
export async function GET() {
  const checks: Record<string, string> = {};
  let allHealthy = true;

  // Check database
  try {
    const prisma = (await import("@/lib/prisma")).default;
    await withTimeout(prisma.$queryRaw`SELECT 1`, TIMEOUT_MS);
    checks.database = "connected";
  } catch {
    checks.database = "unreachable";
    allHealthy = false;
  }

  // Check Redis
  const hasRedisConfigured = !!(
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  );

  if (hasRedisConfigured) {
    try {
      await withTimeout(redis.ping(), TIMEOUT_MS);
      checks.redis = "connected";
    } catch {
      checks.redis = "unreachable";
      allHealthy = false;
    }
  } else {
    checks.redis = "not_configured";
  }

  return NextResponse.json(
    { status: allHealthy ? "ready" : "not_ready", checks },
    { status: allHealthy ? 200 : 503 },
  );
}
