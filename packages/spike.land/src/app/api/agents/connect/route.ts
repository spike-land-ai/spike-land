/**
 * Agent Connection API
 *
 * POST /api/agents/connect
 * Called when a Claude Code agent starts up to register with the platform.
 */

import { auth } from "@/lib/auth";
import { type AgentRedisData, registerAgent } from "@/lib/agents/redis-client";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import {
  type AgentConnectResponse,
  generateAgentId,
  validateAgentConnect,
} from "@/lib/validations/agent";
import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  // Authenticate the request
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const userId = session.user.id;

  // Parse and validate request body
  const { data: body, error: jsonError } = await tryCatch(req.json());
  if (jsonError) {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const validation = validateAgentConnect(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 },
    );
  }

  const { machineId, sessionId, displayName, projectPath, workingDirectory } = validation.data;

  // Generate agent ID
  const agentId = generateAgentId(machineId, sessionId);

  // Generate display name if not provided
  const finalDisplayName = displayName || `Agent-${machineId.slice(0, 8)}`;

  // Upsert agent in database for persistence
  const { error: dbError } = await tryCatch(
    prisma.claudeCodeAgent.upsert({
      where: { id: agentId },
      update: {
        displayName: finalDisplayName,
        projectPath,
        workingDirectory,
        lastSeenAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null, // Reactivate if previously soft-deleted
      },
      create: {
        id: agentId,
        userId,
        machineId,
        sessionId,
        displayName: finalDisplayName,
        projectPath,
        workingDirectory,
        lastSeenAt: new Date(),
      },
    }),
  );

  if (dbError) {
    logger.error("Failed to upsert agent in database:", dbError);
    return NextResponse.json(
      { error: "Failed to register agent" },
      { status: 500 },
    );
  }

  // Register in Redis for real-time tracking
  const redisData: AgentRedisData = {
    agentId,
    userId,
    machineId,
    sessionId,
    displayName: finalDisplayName,
    projectPath,
    workingDirectory,
    connectedAt: Date.now(),
    lastHeartbeat: Date.now(),
  };

  const { error: redisError } = await tryCatch(registerAgent(redisData));
  if (redisError) {
    // Log but don't fail - Redis is for real-time, DB is source of truth
    logger.warn("Failed to register agent in Redis", { error: redisError });
  }

  const response: AgentConnectResponse = {
    success: true,
    agentId,
    displayName: finalDisplayName,
    message: "Agent connected successfully",
  };

  return NextResponse.json(response, { status: 200 });
}
