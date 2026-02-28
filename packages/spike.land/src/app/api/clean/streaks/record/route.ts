import { auth } from "@/lib/auth";
import {
  calculateLevel,
  isConsecutiveDay,
  isSameDay,
} from "@/lib/clean/gamification";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * POST /api/clean/streaks/record
 * Record a completed session and update streak data.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { session_id, points_earned, tasks_completed } = body ?? {};

  if (!session_id || typeof session_id !== "string") {
    return NextResponse.json({ error: "session_id is required" }, {
      status: 400,
    });
  }

  if (typeof points_earned !== "number" || points_earned < 0) {
    return NextResponse.json({
      error: "points_earned must be a non-negative number",
    }, { status: 400 });
  }

  if (typeof tasks_completed !== "number" || tasks_completed < 0) {
    return NextResponse.json({
      error: "tasks_completed must be a non-negative number",
    }, { status: 400 });
  }

  const prisma = (await import("@/lib/prisma")).default;

  // Verify session ownership
  const { data: cleaningSession, error: sessionError } = await tryCatch(
    prisma.cleaningSession.findFirst({
      where: { id: session_id, userId: session.user.id },
      select: { id: true, status: true },
    }),
  );

  if (sessionError) {
    logger.error("Error fetching session:", sessionError);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  if (!cleaningSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: updated, error: updateError } = await tryCatch(
    prisma.$transaction(async tx => {
      // Upsert streak
      const existing = await tx.cleaningStreak.findUnique({
        where: { userId: session.user.id },
      });

      const now = new Date();

      if (!existing) {
        return tx.cleaningStreak.create({
          data: {
            userId: session.user.id,
            currentStreak: 1,
            bestStreak: 1,
            totalPoints: points_earned,
            totalSessions: 1,
            totalTasks: tasks_completed,
            level: calculateLevel(points_earned),
            lastSessionDate: now,
          },
        });
      }

      let newStreak = existing.currentStreak;

      if (existing.lastSessionDate) {
        if (isSameDay(now, existing.lastSessionDate)) {
          // Same day: don't increment streak
        } else if (isConsecutiveDay(now, existing.lastSessionDate)) {
          newStreak += 1;
        } else {
          // Streak broken, reset to 1
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      const newTotalPoints = existing.totalPoints + points_earned;
      const newBestStreak = Math.max(existing.bestStreak, newStreak);
      const newLevel = calculateLevel(newTotalPoints);

      return tx.cleaningStreak.update({
        where: { userId: session.user.id },
        data: {
          currentStreak: newStreak,
          bestStreak: newBestStreak,
          totalPoints: newTotalPoints,
          totalSessions: { increment: 1 },
          totalTasks: { increment: tasks_completed },
          level: newLevel,
          lastSessionDate: now,
        },
      });
    }),
  );

  if (updateError) {
    logger.error("Error recording streak:", updateError);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  return NextResponse.json(updated);
}
