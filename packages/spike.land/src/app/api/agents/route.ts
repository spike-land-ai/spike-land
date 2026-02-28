/**
 * Agent List API
 *
 * GET /api/agents
 * Returns all agents for the authenticated user with their status.
 */

import { auth } from "@/lib/auth";
import {
  getAgentActivity,
  getAgentStatus,
  getAgentToolStats,
  getUserAgents,
} from "@/lib/agents/redis-client";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import {
  agentListQuerySchema,
  type AgentListResponse,
  type AgentResponse,
} from "@/lib/validations/agent";
import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Authenticate the request
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const userId = session.user.id;

  // Parse query parameters
  const { searchParams } = new URL(req.url);
  const queryResult = agentListQuerySchema.safeParse({
    status: searchParams.get("status") || undefined,
    limit: searchParams.get("limit") || undefined,
    offset: searchParams.get("offset") || undefined,
  });

  if (!queryResult.success) {
    return NextResponse.json(
      { error: "Invalid query parameters" },
      { status: 400 },
    );
  }

  const { status: statusFilter, limit, offset } = queryResult.data;

  // Get agents from database (source of truth for persistence)
  const { data: dbAgents, error: dbError } = await tryCatch(
    prisma.claudeCodeAgent.findMany({
      where: {
        userId,
        deletedAt: null, // Only active agents
      },
      orderBy: { lastSeenAt: "desc" },
    }),
  );

  if (dbError) {
    logger.error("Failed to fetch agents from database:", dbError);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 },
    );
  }

  const agents = dbAgents || [];

  // Get real-time status and activity from Redis
  const { data: redisAgents } = await tryCatch(getUserAgents(userId));

  // Create a map of Redis data for quick lookup
  const redisMap = new Map(
    (redisAgents || []).map(a => [a.agentId, a]),
  );

  // Pre-fetch all Redis data in parallel to avoid N+1 queries
  const agentIds = agents.map(a => a.id);
  const missingStatusIds = agentIds.filter(id => !redisMap.has(id));

  const [statusResults, activityResults, toolStatsResults] = await Promise.all([
    Promise.all(missingStatusIds.map(id => tryCatch(getAgentStatus(id)))),
    Promise.all(agentIds.map(id => tryCatch(getAgentActivity(id, 10)))),
    Promise.all(agentIds.map(id => tryCatch(getAgentToolStats(id)))),
  ]);

  const fallbackStatusMap = new Map(
    missingStatusIds.map((
      id,
      i,
    ) => [id, statusResults[i]?.data || "offline" as const]),
  );

  // Build response with combined DB and Redis data
  const agentResponses: AgentResponse[] = agents.map((agent, i) => {
    const redisData = redisMap.get(agent.id);
    const status: "online" | "sleeping" | "offline" = redisData
      ? redisData.status
      : (fallbackStatusMap.get(agent.id) ?? "offline");

    return {
      id: agent.id,
      userId: agent.userId,
      machineId: agent.machineId,
      sessionId: agent.sessionId,
      displayName: agent.displayName,
      projectPath: agent.projectPath,
      workingDirectory: agent.workingDirectory,
      status,
      createdAt: agent.createdAt.toISOString(),
      updatedAt: agent.updatedAt.toISOString(),
      lastSeenAt: agent.lastSeenAt?.toISOString() || null,
      totalTokensUsed: agent.totalTokensUsed,
      totalTasksCompleted: agent.totalTasksCompleted,
      totalSessionTime: agent.totalSessionTime,
      recentActivity: activityResults[i]?.data || [],
      toolStats: toolStatsResults[i]?.data || {},
    };
  });

  // Filter by status if specified
  const filteredAgents = statusFilter === "all"
    ? agentResponses
    : agentResponses.filter(a => a.status === statusFilter);

  // Calculate stats
  const stats = {
    online: agentResponses.filter(a => a.status === "online").length,
    sleeping: agentResponses.filter(a => a.status === "sleeping").length,
    offline: agentResponses.filter(a => a.status === "offline").length,
    total: agentResponses.length,
  };

  // Apply pagination
  const paginatedAgents = filteredAgents.slice(offset, offset + limit);

  const response: AgentListResponse = {
    agents: paginatedAgents,
    pagination: {
      total: filteredAgents.length,
      limit,
      offset,
      hasMore: offset + limit < filteredAgents.length,
    },
    stats,
  };

  return NextResponse.json(response, { status: 200 });
}
