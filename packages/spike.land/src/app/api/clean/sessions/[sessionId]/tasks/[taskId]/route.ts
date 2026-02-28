import { auth } from "@/lib/auth";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * PATCH /api/clean/sessions/[sessionId]/tasks/[taskId]
 * Update task status (COMPLETED, SKIPPED, VERIFIED)
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string; taskId: string; }>; },
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

  const { status, skippedReason } = body ?? {};
  const validStatuses = ["COMPLETED", "SKIPPED", "VERIFIED"] as const;
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: "Status must be COMPLETED, SKIPPED, or VERIFIED" },
      { status: 400 },
    );
  }

  const prisma = (await import("@/lib/prisma")).default;

  // Verify session ownership
  const { data: cleaningSession, error: sessionError } = await tryCatch(
    prisma.cleaningSession.findFirst({
      where: { id: params.sessionId, userId: session.user.id },
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

  // Find the task
  const { data: task, error: taskError } = await tryCatch(
    prisma.cleaningTask.findFirst({
      where: { id: params.taskId, sessionId: params.sessionId },
    }),
  );

  if (taskError) {
    logger.error("Error fetching task:", taskError);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const { data: updated, error: updateError } = await tryCatch(
    prisma.$transaction(async tx => {
      const updatedTask = await tx.cleaningTask.update({
        where: { id: params.taskId },
        data: {
          status,
          completedAt: status === "COMPLETED" || status === "VERIFIED"
            ? new Date()
            : undefined,
          skippedReason: status === "SKIPPED"
            ? (skippedReason ?? null)
            : undefined,
        },
      });

      // Update session counters based on status transition
      if (status === "COMPLETED" || status === "VERIFIED") {
        if (task.status !== "COMPLETED" && task.status !== "VERIFIED") {
          await tx.cleaningSession.update({
            where: { id: params.sessionId },
            data: { completedTasks: { increment: 1 } },
          });
        }
      }

      if (status === "SKIPPED") {
        if (task.status !== "SKIPPED") {
          await tx.cleaningSession.update({
            where: { id: params.sessionId },
            data: { skippedTasks: { increment: 1 } },
          });
        }
      }

      return updatedTask;
    }),
  );

  if (updateError) {
    logger.error("Error updating task:", updateError);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  return NextResponse.json(updated);
}
