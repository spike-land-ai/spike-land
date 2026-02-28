import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/security/ip";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * GET /api/content/stats?path=/blog/some-slug
 *
 * Returns total page views and unique visitors for a given path.
 * Uses existing PageView + VisitorSession tracking data.
 * Public endpoint — aggregate view counts are not sensitive data.
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const { isLimited } = await checkRateLimit(
    `content-stats:${ip}`,
    { maxRequests: 60, windowMs: 60_000 },
  );
  if (isLimited) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 },
    );
  }

  const path = request.nextUrl.searchParams.get("path");

  if (!path) {
    return NextResponse.json(
      { error: "Missing 'path' query parameter" },
      { status: 400 },
    );
  }

  const { data: totalViews, error: viewError } = await tryCatch(
    prisma.pageView.count({
      where: { path },
    }),
  );

  if (viewError) {
    // Gracefully handle missing table (e.g. migration not yet applied)
    return NextResponse.json({
      path,
      totalViews: 0,
      uniqueVisitors: 0,
    });
  }

  // Count distinct visitor IDs from sessions that have page views on this path
  const { data: uniqueResult, error: uniqueError } = await tryCatch(
    prisma.$queryRaw<[{ count: bigint; }]>`
      SELECT COUNT(DISTINCT vs."visitorId") as count
      FROM page_views pv
      JOIN visitor_sessions vs ON vs.id = pv."sessionId"
      WHERE pv.path = ${path}
    `,
  );

  if (uniqueError) {
    // If the raw query fails (e.g. table not migrated), return views only
    return NextResponse.json({
      path,
      totalViews: totalViews ?? 0,
      uniqueVisitors: 0,
    });
  }

  const uniqueVisitors = Number(uniqueResult?.[0]?.count ?? 0);

  return NextResponse.json({
    path,
    totalViews: totalViews ?? 0,
    uniqueVisitors,
  });
}
