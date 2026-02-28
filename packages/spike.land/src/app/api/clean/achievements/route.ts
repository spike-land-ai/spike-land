import { auth } from "@/lib/auth";
import { ACHIEVEMENTS } from "@/lib/clean/gamification";
import { tryCatch } from "@/lib/try-catch";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * GET /api/clean/achievements
 * List all achievements for the user, including unlock status.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = (await import("@/lib/prisma")).default;

  const { data: unlocked, error } = await tryCatch(
    prisma.cleaningAchievement.findMany({
      where: { userId: session.user.id },
    }),
  );

  if (error) {
    logger.error("Error fetching achievements:", error);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  const unlockedMap = new Map(
    unlocked.map(a => [a.achievementType, a.unlockedAt]),
  );

  const achievements = ACHIEVEMENTS.map(a => ({
    type: a.type,
    name: a.name,
    description: a.description,
    unlocked: unlockedMap.has(a.type),
    unlockedAt: unlockedMap.get(a.type) ?? null,
  }));

  return NextResponse.json({ achievements });
}
