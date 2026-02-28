/**
 * Agent Detail Page
 *
 * Full chat interface for a specific Claude Code agent.
 * Shows agent info, status, and message history with real-time updates.
 */

import { auth } from "@/lib/auth";
import {
  getAgentActivity,
  getAgentStatus,
  getAgentToolStats,
} from "@/lib/agents/redis-client";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import type { AgentResponse } from "@/lib/validations/agent";
import { notFound, redirect } from "next/navigation";
import { AgentChatPage } from "./agent-chat-page";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ agentId: string; }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { agentId } = await params;
  const { data: agent } = await tryCatch(
    prisma.claudeCodeAgent.findUnique({
      where: { id: agentId },
      select: { displayName: true },
    }),
  );

  return {
    title: agent ? `${agent.displayName} | spike.land` : "Agent | spike.land",
    description: "Chat with your Claude Code agent",
  };
}

export default async function AgentDetailPage({ params }: PageProps) {
  const { agentId } = await params;

  // Authenticate the user
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/?auth=required&callbackUrl=/agents/${agentId}`);
  }

  const userId = session.user.id;

  // Fetch agent from database
  const { data: agent, error: dbError } = await tryCatch(
    prisma.claudeCodeAgent.findUnique({
      where: { id: agentId },
    }),
  );

  if (dbError || !agent) {
    notFound();
  }

  // Verify ownership
  if (agent.userId !== userId) {
    notFound();
  }

  // Check if soft-deleted
  if (agent.deletedAt) {
    notFound();
  }

  // Get real-time status from Redis
  const { data: redisStatus } = await tryCatch(getAgentStatus(agentId));
  const status: "online" | "sleeping" | "offline" = redisStatus || "offline";

  // Get recent activity
  const { data: activity } = await tryCatch(getAgentActivity(agentId, 10));

  // Get tool stats
  const { data: toolStats } = await tryCatch(getAgentToolStats(agentId));

  const agentResponse: AgentResponse = {
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

  return (
    <main className="container max-w-4xl px-4 pt-24 pb-8">
      <AgentChatPage agent={agentResponse} />
    </main>
  );
}
