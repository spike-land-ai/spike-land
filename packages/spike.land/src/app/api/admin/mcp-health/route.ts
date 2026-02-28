/**
 * MCP Health & Metrics API Route
 *
 * Serves aggregated MCP observability data for the admin dashboard.
 * Requires ADMIN or SUPER_ADMIN role.
 */

import { auth } from "@/lib/auth";
import { verifyAdminAccess } from "@/lib/auth/admin-middleware";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

interface ToolMetricRow {
  tool: string;
  call_count: bigint;
  error_count: bigint;
  avg_duration: number;
  p50_duration: number;
  p95_duration: number;
  p99_duration: number;
  total_tokens: bigint;
}

interface UserSummaryRow {
  userId: string;
  call_count: bigint;
  total_tokens: bigint;
  error_count: bigint;
  unique_tools: bigint;
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasAccess = await verifyAdminAccess(session);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") ?? "metrics";
  const periodHours = Math.min(
    Math.max(parseInt(searchParams.get("period") ?? "24", 10) || 24, 1),
    720,
  );
  const since = new Date(Date.now() - periodHours * 60 * 60 * 1000);

  const prisma = (await import("@/lib/prisma")).default;

  try {
    switch (tab) {
      case "metrics": {
        const rows = await prisma.$queryRaw<ToolMetricRow[]>`SELECT
            tool,
            COUNT(*)::bigint AS call_count,
            SUM(CASE WHEN "isError" THEN 1 ELSE 0 END)::bigint AS error_count,
            AVG("durationMs")::float AS avg_duration,
            PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY "durationMs")::float AS p50_duration,
            PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "durationMs")::float AS p95_duration,
            PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY "durationMs")::float AS p99_duration,
            COALESCE(SUM("tokensConsumed"), 0)::bigint AS total_tokens
          FROM tool_invocations
          WHERE "createdAt" >= ${since}
          GROUP BY tool
          ORDER BY call_count DESC
          LIMIT 50`;

        const metrics = rows.map(row => {
          const calls = Number(row.call_count);
          const errors = Number(row.error_count);
          return {
            tool: row.tool,
            calls,
            errors,
            errorRate: calls > 0
              ? parseFloat(((errors / calls) * 100).toFixed(1))
              : 0,
            avgMs: Math.round(row.avg_duration),
            p50Ms: Math.round(row.p50_duration),
            p95Ms: Math.round(row.p95_duration),
            p99Ms: Math.round(row.p99_duration),
            tokens: Number(row.total_tokens),
          };
        });

        return NextResponse.json({ metrics });
      }

      case "health": {
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const last1h = new Date(Date.now() - 60 * 60 * 1000);

        const [dbHealth, redisHealth, stats, errorCount, activeTools] = await Promise.all([
          (async () => {
            try {
              const start = Date.now();
              await prisma.$queryRaw`SELECT 1`;
              return { status: "HEALTHY", latencyMs: Date.now() - start };
            } catch {
              return { status: "DOWN", latencyMs: -1 };
            }
          })(),
          (async () => {
            try {
              const { redis } = await import("@/lib/upstash/client");
              const start = Date.now();
              await redis.ping();
              return { status: "HEALTHY", latencyMs: Date.now() - start };
            } catch {
              return { status: "DOWN", latencyMs: -1 };
            }
          })(),
          prisma.toolInvocation.aggregate({
            where: { createdAt: { gte: last24h } },
            _count: true,
            _sum: { tokensConsumed: true },
            _avg: { durationMs: true },
          }).catch(() => ({
            _count: 0,
            _sum: { tokensConsumed: null },
            _avg: { durationMs: null },
          })),
          prisma.toolInvocation.count({
            where: { createdAt: { gte: last24h }, isError: true },
          }).catch(() => 0),
          prisma.toolInvocation.groupBy({
            by: ["tool"],
            where: { createdAt: { gte: last1h } },
            _count: true,
          }).catch(() => []),
        ]);

        const totalCalls = stats._count ?? 0;

        return NextResponse.json({
          health: {
            database: dbHealth,
            redis: redisHealth,
            invocations24h: totalCalls,
            errors24h: errorCount,
            errorRate: totalCalls > 0
              ? ((errorCount / totalCalls) * 100).toFixed(2)
              : "0.00",
            avgLatency: Math.round(stats._avg?.durationMs ?? 0),
            totalTokens: stats._sum?.tokensConsumed ?? 0,
            activeTools: activeTools.length,
          },
        });
      }

      case "users": {
        const rows = await prisma.$queryRaw<UserSummaryRow[]>`SELECT
            "userId",
            COUNT(*)::bigint AS call_count,
            COALESCE(SUM("tokensConsumed"), 0)::bigint AS total_tokens,
            SUM(CASE WHEN "isError" THEN 1 ELSE 0 END)::bigint AS error_count,
            COUNT(DISTINCT tool)::bigint AS unique_tools
          FROM tool_invocations
          WHERE "createdAt" >= ${since}
          GROUP BY "userId"
          ORDER BY total_tokens DESC
          LIMIT 50`;

        const users = rows.map(row => ({
          userId: row.userId,
          calls: Number(row.call_count),
          tokens: Number(row.total_tokens),
          errors: Number(row.error_count),
          uniqueTools: Number(row.unique_tools),
        }));

        return NextResponse.json({ users });
      }

      default:
        return NextResponse.json({ error: "Invalid tab parameter" }, {
          status: 400,
        });
    }
  } catch (err) {
    logger.error("MCP health API error:", err);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }
}
