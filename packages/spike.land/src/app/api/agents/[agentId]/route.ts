/**
 * Single Agent API
 *
 * GET /api/agents/[agentId] - Get agent details
 * PATCH /api/agents/[agentId] - Update agent (rename)
 * DELETE /api/agents/[agentId] - Disconnect/remove agent
 */

import { auth } from "@/lib/auth";
import {
  disconnectAgent,
  getAgentActivity,
  getAgentStatus,
  getAgentToolStats,
  removeAgent,
} from "@/lib/agents/redis-client";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import { type AgentResponse, agentUpdateSchema } from "@/lib/validations/agent";
import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

interface RouteContext {
  params: Promise<{ agentId: string; }>;
}

export async function GET(
  _req: NextRequest,
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

  // Get agent from database
  const { data: agent, error: dbError } = await tryCatch(
    prisma.claudeCodeAgent.findUnique({
      where: { id: agentId },
    }),
  );

  if (dbError) {
    logger.error("Failed to fetch agent:", dbError);
    return NextResponse.json(
      { error: "Failed to fetch agent" },
      { status: 500 },
    );
  }

  if (!agent) {
    return NextResponse.json(
      { error: "Agent not found" },
      { status: 404 },
    );
  }

  // Verify ownership
  if (agent.userId !== userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 },
    );
  }

  // Get real-time data from Redis
  const [statusResult, activityResult, toolStatsResult] = await Promise.all([
    tryCatch(getAgentStatus(agentId)),
    tryCatch(getAgentActivity(agentId, 50)),
    tryCatch(getAgentToolStats(agentId)),
  ]);

  const response: AgentResponse = {
    id: agent.id,
    userId: agent.userId,
    machineId: agent.machineId,
    sessionId: agent.sessionId,
    displayName: agent.displayName,
    projectPath: agent.projectPath,
    workingDirectory: agent.workingDirectory,
    status: statusResult.data || "offline",
    createdAt: agent.createdAt.toISOString(),
    updatedAt: agent.updatedAt.toISOString(),
    lastSeenAt: agent.lastSeenAt?.toISOString() || null,
    totalTokensUsed: agent.totalTokensUsed,
    totalTasksCompleted: agent.totalTasksCompleted,
    totalSessionTime: agent.totalSessionTime,
    recentActivity: activityResult.data || [],
    toolStats: toolStatsResult.data || {},
  };

  return NextResponse.json(response, { status: 200 });
}

export async function PATCH(
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

  const parseResult = agentUpdateSchema.safeParse(body);
  if (!parseResult.success) {
    const firstIssue = parseResult.error.issues[0];
    return NextResponse.json(
      { error: firstIssue?.message || "Invalid request" },
      { status: 400 },
    );
  }

  const { displayName } = parseResult.data;

  // Verify agent exists and belongs to user
  const { data: existingAgent, error: findError } = await tryCatch(
    prisma.claudeCodeAgent.findUnique({
      where: { id: agentId },
      select: { userId: true },
    }),
  );

  if (findError) {
    logger.error("Failed to find agent:", findError);
    return NextResponse.json(
      { error: "Failed to update agent" },
      { status: 500 },
    );
  }

  if (!existingAgent) {
    return NextResponse.json(
      { error: "Agent not found" },
      { status: 404 },
    );
  }

  if (existingAgent.userId !== userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 },
    );
  }

  // Update agent
  const updateData: Record<string, unknown> = {};
  if (displayName) {
    updateData.displayName = displayName;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 },
    );
  }

  const { data: updatedAgent, error: updateError } = await tryCatch(
    prisma.claudeCodeAgent.update({
      where: { id: agentId },
      data: updateData,
    }),
  );

  if (updateError) {
    logger.error("Failed to update agent:", updateError);
    return NextResponse.json(
      { error: "Failed to update agent" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    agent: {
      id: updatedAgent.id,
      displayName: updatedAgent.displayName,
    },
  }, { status: 200 });
}

export async function DELETE(
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

  // Check for permanent deletion query param
  const { searchParams } = new URL(req.url);
  const permanent = searchParams.get("permanent") === "true";

  // Verify agent exists and belongs to user
  const { data: existingAgent, error: findError } = await tryCatch(
    prisma.claudeCodeAgent.findUnique({
      where: { id: agentId },
      select: { userId: true },
    }),
  );

  if (findError) {
    logger.error("Failed to find agent:", findError);
    return NextResponse.json(
      { error: "Failed to delete agent" },
      { status: 500 },
    );
  }

  if (!existingAgent) {
    return NextResponse.json(
      { error: "Agent not found" },
      { status: 404 },
    );
  }

  if (existingAgent.userId !== userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 },
    );
  }

  if (permanent) {
    // Permanently delete from both database and Redis
    const { error: deleteError } = await tryCatch(
      prisma.claudeCodeAgent.delete({
        where: { id: agentId },
      }),
    );

    if (deleteError) {
      logger.error("Failed to delete agent:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete agent" },
        { status: 500 },
      );
    }

    // Remove from Redis
    const { error: redisError } = await tryCatch(removeAgent(agentId, userId));
    if (redisError) {
      logger.warn("Failed to remove agent from Redis", { error: redisError });
    }

    return NextResponse.json({
      success: true,
      message: "Agent permanently deleted",
    }, { status: 200 });
  } else {
    // Soft delete - disconnect and mark as deleted
    const { error: updateError } = await tryCatch(
      prisma.claudeCodeAgent.update({
        where: { id: agentId },
        data: { deletedAt: new Date() },
      }),
    );

    if (updateError) {
      logger.error("Failed to soft delete agent:", updateError);
      return NextResponse.json(
        { error: "Failed to disconnect agent" },
        { status: 500 },
      );
    }

    // Disconnect in Redis
    const { error: redisError } = await tryCatch(
      disconnectAgent(agentId, userId),
    );
    if (redisError) {
      logger.warn("Failed to disconnect agent in Redis", { error: redisError });
    }

    return NextResponse.json({
      success: true,
      message: "Agent disconnected",
    }, { status: 200 });
  }
}
