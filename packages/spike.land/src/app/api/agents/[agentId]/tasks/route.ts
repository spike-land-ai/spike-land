/**
 * Agent Tasks API
 *
 * POST /api/agents/[agentId]/tasks
 * Send a task to an agent for execution.
 */

import { auth } from "@/lib/auth";
import {
  logAgentActivity,
  publishAgentEvent,
  sendTaskToAgent,
} from "@/lib/agents/redis-client";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import {
  type SendTaskResponse,
  validateSendTask,
} from "@/lib/validations/agent";
import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

interface RouteContext {
  params: Promise<{ agentId: string; }>;
}

export async function POST(
  req: NextRequest,
  context: RouteContext,
) {
  // Authenticate the request
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const userId = session.user.id;
  const { agentId } = await context.params;

  // Parse and validate request body
  const { data: body, error: jsonError } = await tryCatch(req.json());
  if (jsonError) {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const validation = validateSendTask(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 },
    );
  }

  const { prompt } = validation.data;

  // Verify agent exists and belongs to user
  const { data: agent, error: findError } = await tryCatch(
    prisma.claudeCodeAgent.findUnique({
      where: { id: agentId },
      select: { userId: true, displayName: true },
    }),
  );

  if (findError) {
    logger.error("Failed to find agent:", findError);
    return NextResponse.json(
      { error: "Failed to send task" },
      { status: 500 },
    );
  }

  if (!agent) {
    return NextResponse.json(
      { error: "Agent not found" },
      { status: 404 },
    );
  }

  if (agent.userId !== userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 },
    );
  }

  // Generate task ID with strong uniqueness guarantee
  const taskId = `task_${crypto.randomUUID()}`;

  // Send task to agent via Redis queue
  const { error: taskError } = await tryCatch(
    sendTaskToAgent(agentId, {
      id: taskId,
      prompt,
      createdAt: Date.now(),
    }),
  );

  if (taskError) {
    logger.error("Failed to send task to agent:", taskError);
    return NextResponse.json(
      { error: "Failed to send task" },
      { status: 500 },
    );
  }

  // Log activity
  const { error: activityError } = await tryCatch(
    logAgentActivity(agentId, {
      type: "task_received",
      description: `Task queued: ${prompt.slice(0, 50)}${prompt.length > 50 ? "..." : ""}`,
      timestamp: Date.now(),
      metadata: { taskId },
    }),
  );

  if (activityError) {
    logger.warn("Failed to log task activity", { error: activityError });
  }

  // Publish SSE event
  const { error: sseError } = await tryCatch(
    publishAgentEvent(userId, {
      type: "task_update",
      agentId,
      data: {
        taskId,
        status: "pending",
        prompt: prompt.slice(0, 100),
      },
      timestamp: Date.now(),
    }),
  );

  if (sseError) {
    logger.warn("Failed to publish task SSE event", { error: sseError });
  }

  const response: SendTaskResponse = {
    success: true,
    taskId,
    message: `Task sent to ${agent.displayName}`,
  };

  return NextResponse.json(response, { status: 200 });
}
