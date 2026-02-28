/**
 * BAZDMEG Orchestrator Page
 *
 * Server component — auth check + conversation history load.
 * Requires ADMIN or SUPER_ADMIN role.
 */

import { auth } from "@/lib/auth";
import { verifyAdminAccess } from "@/lib/auth/admin-middleware";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import { redirect } from "next/navigation";
import { BazdmegChatClient } from "@/components/bazdmeg/BazdmegChatClient";

const BAZDMEG_AGENT_MACHINE_ID = "bazdmeg-orchestrator-v1";

export default async function OrchestratorPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const hasAccess = await verifyAdminAccess(session);
  if (!hasAccess) {
    redirect("/");
  }

  // Load conversation history
  const { data: agent } = await tryCatch(
    prisma.claudeCodeAgent.findFirst({
      where: {
        userId: session.user.id,
        machineId: BAZDMEG_AGENT_MACHINE_ID,
        deletedAt: null,
      },
      select: { id: true },
    }),
  );

  let initialMessages: Array<{
    id: string;
    role: "USER" | "AGENT" | "SYSTEM";
    content: string;
    createdAt: string;
  }> = [];

  if (agent) {
    const { data: messages } = await tryCatch(
      prisma.agentMessage.findMany({
        where: { agentId: agent.id },
        orderBy: { createdAt: "asc" },
        take: 50,
        select: {
          id: true,
          role: true,
          content: true,
          createdAt: true,
        },
      }),
    );

    if (messages) {
      initialMessages = messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      }));
    }
  }

  return (
    <BazdmegChatClient
      initialMessages={initialMessages}
      userName={session.user.name ?? "Admin"}
    />
  );
}
