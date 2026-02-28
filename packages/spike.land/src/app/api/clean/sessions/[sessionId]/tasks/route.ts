import { auth } from "@/lib/auth";
import { tryCatch } from "@/lib/try-catch";
import type {
  CleaningTaskCategory,
  CleaningTaskDifficulty,
} from "@prisma/client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

const VALID_CATEGORIES: CleaningTaskCategory[] = [
  "PICKUP",
  "DISHES",
  "LAUNDRY",
  "SURFACES",
  "FLOORS",
  "TRASH",
  "ORGANIZE",
  "OTHER",
];

const VALID_DIFFICULTIES: CleaningTaskDifficulty[] = [
  "QUICK",
  "EASY",
  "MEDIUM",
  "EFFORT",
];

/**
 * GET /api/clean/sessions/[sessionId]/tasks
 * List tasks in a session
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

  // Verify ownership
  const { data: cleaningSession, error: sessionError } = await tryCatch(
    prisma.cleaningSession.findFirst({
      where: { id: params.sessionId, userId: session.user.id },
      select: { id: true },
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

  const { data: tasks, error } = await tryCatch(
    prisma.cleaningTask.findMany({
      where: { sessionId: params.sessionId },
      orderBy: { orderIndex: "asc" },
    }),
  );

  if (error) {
    logger.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  return NextResponse.json({ tasks });
}

interface TaskInput {
  description: string;
  category: CleaningTaskCategory;
  difficulty: CleaningTaskDifficulty;
  pointsValue?: number;
}

/**
 * POST /api/clean/sessions/[sessionId]/tasks
 * Add tasks to a session
 */
export async function POST(
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

  const { tasks } = body ?? {};
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return NextResponse.json({ error: "tasks array is required" }, {
      status: 400,
    });
  }

  // Validate each task
  for (const task of tasks as TaskInput[]) {
    if (!task.description || typeof task.description !== "string") {
      return NextResponse.json({ error: "Each task needs a description" }, {
        status: 400,
      });
    }
    if (!VALID_CATEGORIES.includes(task.category)) {
      return NextResponse.json(
        { error: `Invalid category: ${task.category}` },
        { status: 400 },
      );
    }
    if (!VALID_DIFFICULTIES.includes(task.difficulty)) {
      return NextResponse.json({
        error: `Invalid difficulty: ${task.difficulty}`,
      }, { status: 400 });
    }
  }

  const prisma = (await import("@/lib/prisma")).default;

  // Verify ownership + active status
  const { data: cleaningSession, error: sessionError } = await tryCatch(
    prisma.cleaningSession.findFirst({
      where: {
        id: params.sessionId,
        userId: session.user.id,
        status: "ACTIVE",
      },
      select: { id: true },
    }),
  );

  if (sessionError) {
    logger.error("Error fetching session:", sessionError);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  if (!cleaningSession) {
    return NextResponse.json({ error: "Active session not found" }, {
      status: 404,
    });
  }

  // Get current max orderIndex
  const { data: maxTask, error: maxError } = await tryCatch(
    prisma.cleaningTask.findFirst({
      where: { sessionId: params.sessionId },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    }),
  );

  if (maxError) {
    logger.error("Error fetching max order:", maxError);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  let nextOrder = (maxTask?.orderIndex ?? -1) + 1;
  const taskInputs = tasks as TaskInput[];

  const { data: result, error: createError } = await tryCatch(
    prisma.$transaction(async tx => {
      const created = await tx.cleaningTask.createManyAndReturn({
        data: taskInputs.map(t => ({
          sessionId: params.sessionId,
          description: t.description.trim(),
          category: t.category,
          difficulty: t.difficulty,
          pointsValue: t.pointsValue ?? 10,
          orderIndex: nextOrder++,
        })),
      });

      await tx.cleaningSession.update({
        where: { id: params.sessionId },
        data: { totalTasks: { increment: taskInputs.length } },
      });

      return created;
    }),
  );

  if (createError) {
    logger.error("Error creating tasks:", createError);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  return NextResponse.json({ tasks: result }, { status: 201 });
}
