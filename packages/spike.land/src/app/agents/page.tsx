/**
 * Agents Page
 *
 * Server component for displaying connected Claude Code agents.
 * Fetches initial data and renders the client component.
 */

import { auth } from "@/lib/auth";
import { AgentCatalog } from "@/components/agents";
import {
  getAgentActivity,
  getAgentStatus,
  getAgentToolStats,
  getUserAgents,
} from "@/lib/agents/redis-client";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import type { AgentListResponse, AgentResponse } from "@/lib/validations/agent";
import { logger } from "@/lib/logger";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Connected Agents | spike.land",
  description: "Manage your Claude Code agents",
};

export default async function AgentsPage() {
  // Authenticate the user
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/?auth=required&callbackUrl=/agents");
  }

  const userId = session.user.id;

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
    logger.error("Failed to fetch agents from database", dbError);
  }

  const agents = dbAgents || [];

  // Get real-time status from Redis
  const { data: redisAgents } = await tryCatch(getUserAgents(userId));

  // Create a map of Redis data for quick lookup
  const redisMap = new Map(
    (redisAgents || []).map(a => [a.agentId, a]),
  );

  // Build response with combined DB and Redis data
  const agentResponses: AgentResponse[] = await Promise.all(
    agents.map(async agent => {
      const redisData = redisMap.get(agent.id);

      // Get status from Redis or default to offline
      let status: "online" | "sleeping" | "offline" = "offline";
      if (redisData) {
        status = redisData.status;
      } else {
        // Fallback: check Redis directly
        const { data: redisStatus } = await tryCatch(getAgentStatus(agent.id));
        status = redisStatus || "offline";
      }

      // Get recent activity
      const { data: activity } = await tryCatch(getAgentActivity(agent.id, 10));

      // Get tool stats
      const { data: toolStats } = await tryCatch(getAgentToolStats(agent.id));

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
        recentActivity: activity || [],
        toolStats: toolStats || {},
      };
    }),
  );

  // Calculate stats
  const stats = {
    online: agentResponses.filter(a => a.status === "online").length,
    sleeping: agentResponses.filter(a => a.status === "sleeping").length,
    offline: agentResponses.filter(a => a.status === "offline").length,
    total: agentResponses.length,
  };

  const initialData: AgentListResponse = {
    agents: agentResponses,
    pagination: {
      total: agentResponses.length,
      limit: 50,
      offset: 0,
      hasMore: false,
    },
    stats,
  };

  return (
    <main className="container max-w-7xl px-4 pt-24 pb-8">
      <AgentCatalog initialData={initialData} />
    </main>
  );
}
