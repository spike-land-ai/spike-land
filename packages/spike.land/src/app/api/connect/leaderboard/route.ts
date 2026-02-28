/**
 * GET /api/connect/leaderboard - Top ELO rankings
 */

import { cacheLeaderboard, getCachedLeaderboard } from "@/lib/arena/redis";
import type { ArenaLeaderboardEntry } from "@/lib/arena/types";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get("limit") || "50", 10),
    100,
  );
  const offset = parseInt(
    request.nextUrl.searchParams.get("offset") || "0",
    10,
  );

  // Try cache for default params
  if (limit === 50 && offset === 0) {
    const cached = await getCachedLeaderboard<ArenaLeaderboardEntry[]>();
    if (cached) {
      return NextResponse.json(cached);
    }
  }

  const { data: entries, error } = await tryCatch(
    prisma.arenaElo.findMany({
      orderBy: { elo: "desc" },
      take: limit,
      skip: offset,
      include: {
        user: { select: { name: true, image: true } },
      },
    }),
  );

  if (error) {
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  const leaderboard: ArenaLeaderboardEntry[] = (entries ?? []).map((
    entry,
    i,
  ) => ({
    rank: offset + i + 1,
    userId: entry.userId,
    userName: entry.user.name,
    userImage: entry.user.image,
    elo: entry.elo,
    wins: entry.wins,
    losses: entry.losses,
    draws: entry.draws,
    streak: entry.streak,
    bestElo: entry.bestElo,
  }));

  // Cache default query
  if (limit === 50 && offset === 0) {
    await cacheLeaderboard(leaderboard).catch(err =>
      logger.error("[leaderboard] Failed to cache leaderboard:", err)
    );
  }

  return NextResponse.json(leaderboard);
}
