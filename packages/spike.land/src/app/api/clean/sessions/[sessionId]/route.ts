import { auth } from "@/lib/auth";
import { calculateSessionPoints } from "@/lib/clean/gamification";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * GET /api/clean/sessions/[sessionId]
 * Get session details with tasks
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ sessionId: string; }>; },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: params, error: paramsError } = await tryCatch(context.params);
  if (paramsError) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const prisma = (await import("@/lib/prisma")).default;

  const { data: cleaningSession, error } = await tryCatch(
    prisma.cleaningSession.findFirst({
      where: { id: params.sessionId, userId: session.user.id },
      include: {
        tasks: { orderBy: { orderIndex: "asc" } },
      },
    }),
  );

  if (error) {
    logger.error("Error fetching cleaning session:", error);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  if (!cleaningSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json(cleaningSession);
}

/**
 * PATCH /api/clean/sessions/[sessionId]
 * End a session (COMPLETED or ABANDONED)
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string; }>; },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: params, error: paramsError } = await tryCatch(context.params);
  if (paramsError) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { status } = body ?? {};
  if (status !== "COMPLETED" && status !== "ABANDONED") {
    return NextResponse.json(
      { error: "Status must be COMPLETED or ABANDONED" },
      { status: 400 },
    );
  }

  const prisma = (await import("@/lib/prisma")).default;

  const { data: cleaningSession, error: fetchError } = await tryCatch(
    prisma.cleaningSession.findFirst({
      where: {
        id: params.sessionId,
        userId: session.user.id,
        status: "ACTIVE",
      },
      include: { tasks: true },
    }),
  );

  if (fetchError) {
    logger.error("Error fetching cleaning session:", fetchError);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  if (!cleaningSession) {
    return NextResponse.json({ error: "Active session not found" }, {
      status: 404,
    });
  }

  let pointsEarned = 0;
  if (status === "COMPLETED") {
    const taskPoints = cleaningSession.tasks
      .filter(t => t.status === "COMPLETED" || t.status === "VERIFIED")
      .reduce((sum, t) => sum + t.pointsValue, 0);

    const zeroSkips = cleaningSession.skippedTasks === 0;
    const allTasksDone = cleaningSession.totalTasks > 0
      && cleaningSession.completedTasks === cleaningSession.totalTasks;
    const hasVerificationPhoto = cleaningSession.tasks.some(t => t.status === "VERIFIED");

    const streak = await prisma.cleaningStreak.findUnique({
      where: { userId: session.user.id },
    });

    const result = calculateSessionPoints({
      taskPoints,
      currentStreak: streak?.currentStreak ?? 0,
      hasVerificationPhoto,
      zeroSkips,
      allTasksDone,
    });

    pointsEarned = result.total;
  }

  const { data: updated, error: updateError } = await tryCatch(
    prisma.cleaningSession.update({
      where: { id: params.sessionId },
      data: {
        status,
        pointsEarned,
        completedAt: new Date(),
      },
      include: { tasks: { orderBy: { orderIndex: "asc" } } },
    }),
  );

  if (updateError) {
    logger.error("Error updating cleaning session:", updateError);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  return NextResponse.json(updated);
}
