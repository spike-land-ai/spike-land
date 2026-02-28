import { auth } from "@/lib/auth";
import {
  type AchievementStats,
  checkNewAchievements,
} from "@/lib/clean/gamification";
import { tryCatch } from "@/lib/try-catch";
import type { AchievementType } from "@prisma/client";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * POST /api/clean/achievements/check
 * Check for new achievement unlocks based on current user stats.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = (await import("@/lib/prisma")).default;

  // Fetch streak data
  const { data: streak, error: streakError } = await tryCatch(
    prisma.cleaningStreak.findUnique({
      where: { userId: session.user.id },
    }),
  );

  if (streakError) {
    logger.error("Error fetching streak:", streakError);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  if (!streak) {
    return NextResponse.json({ newAchievements: [] });
  }

  // Fetch the most recent completed session for session-specific stats
  const { data: recentSession, error: sessionError } = await tryCatch(
    prisma.cleaningSession.findFirst({
      where: { userId: session.user.id, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      include: { tasks: true },
    }),
  );

  if (sessionError) {
    logger.error("Error fetching recent session:", sessionError);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  // Calculate session-specific stats
  let sessionDurationMinutes = 0;
  let sessionHour = 0;
  let sessionSkips = 0;
  let sessionTotalTasks = 0;

  if (recentSession) {
    if (recentSession.completedAt && recentSession.startedAt) {
      sessionDurationMinutes = Math.floor(
        (recentSession.completedAt.getTime()
          - recentSession.startedAt.getTime()) / 60000,
      );
    }
    sessionHour = recentSession.startedAt.getHours();
    sessionSkips = recentSession.skippedTasks;
    sessionTotalTasks = recentSession.totalTasks;
  }

  // Calculate days since last session (before the most recent)
  let daysSinceLastSession = 0;
  if (streak.lastSessionDate) {
    daysSinceLastSession = Math.floor(
      (Date.now() - streak.lastSessionDate.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  const stats: AchievementStats = {
    totalSessions: streak.totalSessions,
    currentStreak: streak.currentStreak,
    bestStreak: streak.bestStreak,
    totalTasks: streak.totalTasks,
    level: streak.level,
    sessionSkips,
    sessionTotalTasks,
    sessionDurationMinutes,
    sessionHour,
    daysSinceLastSession,
  };

  // Get already unlocked achievements
  const { data: existing, error: existingError } = await tryCatch(
    prisma.cleaningAchievement.findMany({
      where: { userId: session.user.id },
      select: { achievementType: true },
    }),
  );

  if (existingError) {
    logger.error("Error fetching existing achievements:", existingError);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  const alreadyUnlocked = new Set(existing.map(a => a.achievementType));
  const newlyUnlocked = checkNewAchievements(stats, alreadyUnlocked);

  if (newlyUnlocked.length === 0) {
    return NextResponse.json({ newAchievements: [] });
  }

  // Create achievement records
  const { data: created, error: createError } = await tryCatch(
    prisma.cleaningAchievement.createManyAndReturn({
      data: newlyUnlocked.map(a => ({
        userId: session.user.id,
        achievementType: a.type as AchievementType,
        metadata: { name: a.name, description: a.description },
      })),
    }),
  );

  if (createError) {
    logger.error("Error creating achievements:", createError);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  const newAchievements = newlyUnlocked.map(a => ({
    type: a.type,
    name: a.name,
    description: a.description,
    unlockedAt: created.find(c => c.achievementType === a.type)?.unlockedAt
      ?? new Date(),
  }));

  return NextResponse.json({ newAchievements });
}
