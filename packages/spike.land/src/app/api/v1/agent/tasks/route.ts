import { authenticateMcpRequest } from "@/lib/mcp/auth";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { tryCatch } from "@/lib/try-catch";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";

// Schema for task result update
const taskResultSchema = z.object({
  taskId: z.string(),
  status: z.enum(["COMPLETED", "FAILED", "PROCESSING"]),
  result: z.record(z.string(), z.unknown()).optional(),
  error: z.string().optional(),
});

// GET /api/v1/agent/tasks?boxId=...
// Fetch pending tasks for a specific box
export async function GET(req: NextRequest) {
  // Authenticate first before processing any parameters
  const authResult = await authenticateMcpRequest(req);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const boxId = searchParams.get("boxId");

  if (!boxId) {
    return NextResponse.json({ error: "Missing boxId" }, { status: 400 });
  }

  // Verify box ownership
  const { data: box, error: boxError } = await tryCatch(
    prisma.box.findUnique({
      where: { id: boxId },
      select: { userId: true },
    }),
  );

  if (boxError) {
    logger.error("Database error (box lookup):", boxError);
    return NextResponse.json({ error: "Internal Server Error" }, {
      status: 500,
    });
  }

  if (!box) {
    return NextResponse.json({ error: "Box not found" }, { status: 404 });
  }

  if (box.userId !== authResult.userId) {
    return NextResponse.json({ error: "Unauthorized access to box" }, {
      status: 403,
    });
  }

  const { data: tasks, error: tasksError } = await tryCatch(
    prisma.agentTask.findMany({
      where: {
        boxId,
        status: "PENDING",
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
  );

  if (tasksError) {
    logger.error("Failed to fetch agent tasks:", tasksError);
    return NextResponse.json({ error: "Internal Server Error" }, {
      status: 500,
    });
  }

  return NextResponse.json({ tasks });
}

// POST /api/v1/agent/tasks
// Update task status key/result
export async function POST(req: NextRequest) {
  const authResult = await authenticateMcpRequest(req);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const { data: body, error: jsonError } = await tryCatch(req.json());
  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = taskResultSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json({
      error: "Invalid request body",
      details: parseResult.error.flatten(),
    }, {
      status: 400,
    });
  }

  const { taskId, status, result, error } = parseResult.data;

  // Verify task ownership
  const { data: task, error: taskError } = await tryCatch(
    prisma.agentTask.findUnique({
      where: { id: taskId },
      include: { box: true },
    }),
  );

  if (taskError) {
    logger.error("Database error (task lookup):", taskError);
    return NextResponse.json({ error: "Internal Server Error" }, {
      status: 500,
    });
  }

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (task.box.userId !== authResult.userId) {
    return NextResponse.json({ error: "Unauthorized access to task" }, {
      status: 403,
    });
  }

  const { data: updatedTask, error: updateError } = await tryCatch(
    prisma.agentTask.update({
      where: { id: taskId },
      data: {
        status,
        result: result
          ? (JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue)
          : undefined,
        error: error ? error : undefined,
      },
    }),
  );

  if (updateError) {
    logger.error("Failed to update agent task:", updateError);
    return NextResponse.json({ error: "Internal Server Error" }, {
      status: 500,
    });
  }

  return NextResponse.json({ success: true, task: updatedTask });
}
