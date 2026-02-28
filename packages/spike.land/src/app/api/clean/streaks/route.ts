import { auth } from "@/lib/auth";
import { calculateLevel, pointsToNextLevel } from "@/lib/clean/gamification";
import { tryCatch } from "@/lib/try-catch";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * GET /api/clean/streaks
 * Get current streak for the authenticated user. Upserts if not exists.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = (await import("@/lib/prisma")).default;

  const { data: streak, error } = await tryCatch(
    prisma.cleaningStreak.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        currentStreak: 0,
        bestStreak: 0,
        totalPoints: 0,
        totalSessions: 0,
        totalTasks: 0,
        level: 1,
      },
      update: {},
    }),
  );

  if (error) {
    logger.error("Error fetching streak:", error);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  const level = calculateLevel(streak.totalPoints);
  const nextLevel = pointsToNextLevel(streak.totalPoints);

  return NextResponse.json({
    ...streak,
    level,
    nextLevel,
  });
}
