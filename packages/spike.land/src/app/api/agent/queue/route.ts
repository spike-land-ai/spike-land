import { verifyAgentAuth } from "@/lib/auth/agent";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import { getAppsWithPending, getPendingCount } from "@/lib/upstash";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * GET /api/agent/queue
 * Get all apps that have pending messages needing agent attention
 * Requires agent API key authentication
 */
export async function GET(request: NextRequest) {
  if (!verifyAgentAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get app IDs with pending messages from Redis
  const { data: appIds, error: redisError } = await tryCatch(
    getAppsWithPending(),
  );

  if (redisError) {
    logger.error("Error fetching pending apps from Redis:", redisError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  if (!appIds || appIds.length === 0) {
    return NextResponse.json({ apps: [] });
  }

  // Fetch app details for all pending apps
  const { data: apps, error: dbError } = await tryCatch(
    prisma.app.findMany({
      where: {
        id: { in: appIds },
        status: { notIn: ["ARCHIVED", "FAILED"] },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        codespaceId: true,
        codespaceUrl: true,
        lastAgentActivity: true,
        _count: {
          select: {
            messages: {
              where: { isRead: false, role: "USER" },
            },
          },
        },
      },
      orderBy: { lastAgentActivity: "asc" }, // Oldest activity first (priority)
    }),
  );

  if (dbError) {
    logger.error("Error fetching apps:", dbError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  // Enrich with pending counts from Redis
  const enrichedApps = await Promise.all(
    apps.map(async app => {
      const pendingCount = await getPendingCount(app.id);
      return {
        ...app,
        pendingCount,
        unreadMessages: app._count.messages,
      };
    }),
  );

  return NextResponse.json({
    apps: enrichedApps,
    totalPending: enrichedApps.reduce((sum, app) => sum + app.pendingCount, 0),
  });
}
