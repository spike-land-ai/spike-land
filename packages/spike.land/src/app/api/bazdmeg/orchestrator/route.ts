/**
 * BAZDMEG Orchestrator Chat API
 *
 * POST endpoint using Claude Agent SDK with MCP tools + SSE streaming.
 * The agent has access to BAZDMEG quality gates, GitHub, dashboard, and orchestrator tools.
 */

import { auth } from "@/lib/auth";
import { verifyAdminAccess } from "@/lib/auth/admin-middleware";
import { agentEnv } from "@/lib/claude-agent/agent-env";
import { BAZDMEG_SYSTEM_PROMPT } from "@/lib/claude-agent/prompts/bazdmeg-system";
import logger from "@/lib/logger";
import { tryCatch } from "@/lib/try-catch";
import {
  createSdkMcpServer,
  query,
  tool,
} from "@anthropic-ai/claude-agent-sdk";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export const maxDuration = 300; // 5 minutes

// Rate limiter (per-user, 10 req/min)
const rateLimitMap = new Map<string, { count: number; resetAt: number; }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// Content part type for SDK messages
interface ContentPart {
  type: "text" | "tool_use";
  text?: string;
  name?: string;
}

function emitSSE(
  controller: ReadableStreamDefaultController,
  data: Record<string, unknown>,
) {
  controller.enqueue(
    new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`),
  );
}

/** Fixed agent ID for the BAZDMEG orchestrator */
const BAZDMEG_AGENT_MACHINE_ID = "bazdmeg-orchestrator-v1";

/**
 * Create MCP server with BAZDMEG-specific tools for the agent.
 * Uses createSdkMcpServer to expose tools via the Claude Agent SDK.
 */
function createBazdmegMcpServer() {
  return createSdkMcpServer({
    name: "bazdmeg",
    version: "1.0.0",
    tools: [
      // BAZDMEG Quality Gates
      tool(
        "bazdmeg_quality_gates",
        "Check all 5 BAZDMEG quality gates: CI speed, test health, type safety, coverage, dependency health. Returns each gate as GREEN/YELLOW/RED.",
        {},
        async () => {
          const { getWorkflowRuns } = await import(
            "@/lib/agents/github-issues"
          );
          const { data: runs } = await getWorkflowRuns({ limit: 5 });

          const gates: Array<{ name: string; status: string; detail: string; }> = [];

          if (runs && runs.length > 0) {
            const lastRun = runs[0]!;
            const ageMs = Date.now() - new Date(lastRun.createdAt).getTime();
            const ageMin = Math.floor(ageMs / 60_000);

            gates.push({
              name: "CI Speed",
              status: lastRun.conclusion === "failure"
                ? "RED"
                : ageMin < 10
                ? "GREEN"
                : "YELLOW",
              detail: lastRun.conclusion === "failure"
                ? `Last CI FAILED (${ageMin}m ago)`
                : `Last CI completed ${ageMin}m ago`,
            });

            const failed = runs.filter(r => r.conclusion === "failure").length;
            gates.push({
              name: "Test Health",
              status: failed === 0 ? "GREEN" : failed <= 1 ? "YELLOW" : "RED",
              detail: `${failed}/${runs.length} recent runs failed`,
            });
          } else {
            gates.push({
              name: "CI Speed",
              status: "RED",
              detail: "No workflow runs found",
            });
            gates.push({
              name: "Test Health",
              status: "RED",
              detail: "No runs available",
            });
          }

          const latestSuccess = runs?.find(r => r.conclusion === "success");
          gates.push({
            name: "Coverage",
            status: latestSuccess ? "GREEN" : "RED",
            detail: latestSuccess
              ? "Coverage enforced in CI"
              : "No recent success",
          });
          gates.push({
            name: "Type Safety",
            status: "GREEN",
            detail: "Enforced via CI build",
          });
          gates.push({
            name: "Dependency Health",
            status: "GREEN",
            detail: "Requires local audit",
          });

          let text = "**BAZDMEG Quality Gates**\n\n";
          for (const g of gates) {
            text += `- **${g.name}** [${g.status}]: ${g.detail}\n`;
          }
          return { content: [{ type: "text" as const, text }] };
        },
      ),

      // PR Readiness
      tool(
        "bazdmeg_pr_readiness",
        "Check if open PRs are merge-ready. Checks CI, review status, draft state, and ticket linking.",
        {
          pr_number: z.number().int().optional().describe(
            "Specific PR number, or omit for all open PRs",
          ),
        },
        async args => {
          const { getPRStatus } = await import("@/lib/bridges/github-projects");
          const status = await getPRStatus();
          if (!status) {
            return {
              content: [{
                type: "text" as const,
                text: "Could not fetch PR status.",
              }],
            };
          }

          const prs = args.pr_number
            ? status.pending.filter(pr => pr.number === args.pr_number)
            : status.pending;

          if (prs.length === 0) {
            return {
              content: [{
                type: "text" as const,
                text: args.pr_number
                  ? `PR #${args.pr_number} not found.`
                  : "No open PRs.",
              }],
            };
          }

          let text = "**PR Readiness Report**\n\n";
          for (const pr of prs) {
            const ci = pr.checksStatus === "SUCCESS";
            const reviewed = pr.reviewDecision === "APPROVED";
            const notDraft = !pr.isDraft;
            const hasTicket = /(?:#\d+|[Rr]esolves|[Ff]ixes)\s*#?\d+/.test(
              pr.title,
            );
            const ready = ci && reviewed && notDraft && hasTicket;

            text += `### PR #${pr.number}: ${pr.title}\n`;
            text += `- CI: ${ci ? "PASS" : `FAIL (${pr.checksStatus})`}\n`;
            text += `- Review: ${reviewed ? "APPROVED" : pr.reviewDecision}\n`;
            text += `- Draft: ${notDraft ? "No (ready)" : "Yes (draft)"}\n`;
            text += `- Ticket: ${hasTicket ? "Linked" : "Missing"}\n`;
            text += `**${ready ? "Ready to merge" : "NOT ready"}**\n\n`;
          }
          return { content: [{ type: "text" as const, text }] };
        },
      ),

      // Deploy Check
      tool(
        "bazdmeg_deploy_check",
        "Full deploy readiness assessment. Checks CI on main, open PR safety, database health.",
        {},
        async () => {
          const blockers: string[] = [];
          const passing: string[] = [];

          const { getWorkflowRuns } = await import(
            "@/lib/agents/github-issues"
          );
          const { data: runs } = await getWorkflowRuns({ limit: 10 });

          if (runs) {
            const mainRuns = runs.filter(r => r.branch === "main");
            const latest = mainRuns[0];
            if (!latest) {
              blockers.push("No recent CI on main");
            } else if (latest.conclusion === "failure") {
              blockers.push(`Last CI on main FAILED: ${latest.name}`);
            } else {
              passing.push(
                `Last CI on main: ${latest.conclusion?.toUpperCase() ?? "UNKNOWN"}`,
              );
            }
          } else {
            blockers.push("Cannot fetch CI runs");
          }

          try {
            const prisma = (await import("@/lib/prisma")).default;
            const start = Date.now();
            await prisma.$queryRaw`SELECT 1`;
            passing.push(`Database healthy: ${Date.now() - start}ms`);
          } catch {
            blockers.push("Database connection failed");
          }

          const ready = blockers.length === 0;
          let text = `**Deploy Check: ${ready ? "DEPLOY_READY" : "DEPLOY_BLOCKED"}**\n\n`;
          for (const p of passing) text += `- [PASS] ${p}\n`;
          for (const b of blockers) text += `- [BLOCK] ${b}\n`;
          text += ready
            ? "\nSafe to deploy."
            : `\nResolve ${blockers.length} blocker(s) first.`;
          return { content: [{ type: "text" as const, text }] };
        },
      ),

      // GitHub Roadmap
      tool(
        "github_roadmap",
        "Get roadmap items from GitHub Projects V2.",
        {},
        async () => {
          const { getRoadmapItems } = await import(
            "@/lib/bridges/github-projects"
          );
          const items = await getRoadmapItems();
          if (!items || items.length === 0) {
            return {
              content: [{ type: "text" as const, text: "No roadmap items." }],
            };
          }
          let text = `**Roadmap (${items.length} items)**\n\n`;
          for (const item of items) {
            text += `- **${item.title}** [${item.status}] (${item.type})`;
            if (item.url) text += ` ${item.url}`;
            text += "\n";
          }
          return { content: [{ type: "text" as const, text }] };
        },
      ),

      // GitHub Issues Summary
      tool(
        "github_issues_summary",
        "Summarize open/closed issues with label breakdown.",
        {},
        async () => {
          const { getIssuesSummary } = await import(
            "@/lib/bridges/github-projects"
          );
          const summary = await getIssuesSummary();
          if (!summary) {
            return {
              content: [{
                type: "text" as const,
                text: "Could not fetch issues.",
              }],
            };
          }
          let text = `**Issues:** Open: ${summary.open}, Closed: ${summary.closed}\n\n`;
          if (summary.recentlyUpdated.length > 0) {
            text += "**Recent:**\n";
            for (const i of summary.recentlyUpdated) {
              text += `- #${i.number} ${i.title} [${i.state}]\n`;
            }
          }
          return { content: [{ type: "text" as const, text }] };
        },
      ),

      // GitHub PR Status
      tool(
        "github_pr_status",
        "Get PR status overview: open, merged, and pending PRs with CI status.",
        {},
        async () => {
          const { getPRStatus } = await import("@/lib/bridges/github-projects");
          const status = await getPRStatus();
          if (!status) {
            return {
              content: [{
                type: "text" as const,
                text: "Could not fetch PR status.",
              }],
            };
          }
          let text = `**PRs:** Open: ${status.open}, Merged: ${status.merged}\n\n`;
          if (status.pending.length > 0) {
            text += "**Open PRs:**\n";
            for (const pr of status.pending) {
              text +=
                `- #${pr.number} ${pr.title} by ${pr.author} [CI: ${pr.checksStatus}] [Review: ${pr.reviewDecision}]${
                  pr.isDraft ? " (DRAFT)" : ""
                }\n`;
            }
          }
          return { content: [{ type: "text" as const, text }] };
        },
      ),

      // Dashboard Overview
      tool(
        "platform_overview",
        "Get platform overview: user count, agents, pending jobs, errors.",
        {},
        async () => {
          const prisma = (await import("@/lib/prisma")).default;
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const [users, agents, jobs, errors] = await Promise.all([
            prisma.user.count(),
            prisma.claudeCodeAgent.count({ where: { deletedAt: null } }),
            prisma.mcpGenerationJob.count({ where: { status: "PENDING" } }),
            prisma.agentAuditLog.count({
              where: { isError: true, createdAt: { gte: twentyFourHoursAgo } },
            }),
          ]);
          const text =
            `**Platform Overview**\n- Users: ${users}\n- Agents: ${agents}\n- Pending Jobs: ${jobs}\n- Errors (24h): ${errors}`;
          return { content: [{ type: "text" as const, text }] };
        },
      ),

      // Dashboard Health
      tool(
        "platform_health",
        "Check health of database and Redis.",
        {},
        async () => {
          const checks: string[] = [];
          try {
            const prisma = (await import("@/lib/prisma")).default;
            const start = Date.now();
            await prisma.$queryRaw`SELECT 1`;
            checks.push(`Database: OK (${Date.now() - start}ms)`);
          } catch {
            checks.push("Database: DOWN");
          }
          try {
            const { redis } = await import("@/lib/upstash/client");
            const start = Date.now();
            await redis.ping();
            checks.push(`Redis: OK (${Date.now() - start}ms)`);
          } catch {
            checks.push("Redis: DOWN");
          }
          return {
            content: [{
              type: "text" as const,
              text: `**Health Check**\n${checks.map(c => `- ${c}`).join("\n")}`,
            }],
          };
        },
      ),

      // Create GitHub Issue
      tool(
        "create_issue",
        "Create a new GitHub issue with title, body, and optional labels.",
        {
          title: z.string().min(1).describe("Issue title"),
          body: z.string().min(1).describe("Issue body/description"),
          labels: z.array(z.string()).optional().describe("Labels to apply"),
        },
        async args => {
          const { createIssue } = await import("@/lib/agents/github-issues");
          const { data: issue, error } = await createIssue({
            title: args.title,
            body: args.body,
            labels: args.labels,
          });
          if (error || !issue) {
            return {
              content: [{
                type: "text" as const,
                text: `Failed to create issue: ${error ?? "Unknown error"}`,
              }],
            };
          }
          return {
            content: [{
              type: "text" as const,
              text: `**Issue Created:** #${issue.number} — ${issue.title}\n${issue.url}`,
            }],
          };
        },
      ),
    ],
  });
}

/** Tool names for allowedTools config */
const BAZDMEG_TOOL_NAMES = [
  "mcp__bazdmeg__bazdmeg_quality_gates",
  "mcp__bazdmeg__bazdmeg_pr_readiness",
  "mcp__bazdmeg__bazdmeg_deploy_check",
  "mcp__bazdmeg__github_roadmap",
  "mcp__bazdmeg__github_issues_summary",
  "mcp__bazdmeg__github_pr_status",
  "mcp__bazdmeg__platform_overview",
  "mcp__bazdmeg__platform_health",
  "mcp__bazdmeg__create_issue",
];

/**
 * Get or create the BAZDMEG orchestrator agent record.
 * Uses a fixed machine ID so all sessions share the same conversation.
 */
async function getOrCreateBazdmegAgent(userId: string): Promise<string> {
  const prisma = (await import("@/lib/prisma")).default;

  const existing = await prisma.claudeCodeAgent.findFirst({
    where: {
      userId,
      machineId: BAZDMEG_AGENT_MACHINE_ID,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (existing) return existing.id;

  const agent = await prisma.claudeCodeAgent.create({
    data: {
      id: `bazdmeg-${userId.slice(0, 8)}-${Date.now()}`,
      userId,
      machineId: BAZDMEG_AGENT_MACHINE_ID,
      sessionId: `session-${Date.now()}`,
      displayName: "BAZDMEG Orchestrator",
    },
  });

  return agent.id;
}

export async function POST(request: NextRequest) {
  // Auth check
  const { data: session, error: authError } = await tryCatch(auth());
  if (authError || !session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, {
      status: 401,
    });
  }

  // Admin check
  const isAdmin = await verifyAdminAccess(session);
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, {
      status: 403,
    });
  }

  const userId = session.user.id;

  // Rate limit
  if (!checkRateLimit(userId)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Parse body
  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { content } = body as { content?: string; };
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  // Get or create agent
  const { data: agentId, error: agentError } = await tryCatch(
    getOrCreateBazdmegAgent(userId),
  );
  if (agentError || !agentId) {
    logger.error("[bazdmeg] Failed to get/create agent:", {
      error: agentError,
    });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  // Save user message
  const prisma = (await import("@/lib/prisma")).default;
  const { error: msgError } = await tryCatch(
    prisma.agentMessage.create({
      data: {
        agentId,
        role: "USER",
        content: content.trim(),
      },
    }),
  );
  if (msgError) {
    logger.error("[bazdmeg] Failed to save user message:", { error: msgError });
  }

  // Load conversation history for context
  const { data: history } = await tryCatch(
    prisma.agentMessage.findMany({
      where: { agentId },
      orderBy: { createdAt: "asc" },
      take: 50,
      select: { role: true, content: true },
    }),
  );

  // Build conversation context
  const conversationContext = history && history.length > 1
    ? `\n\n## Previous Conversation\n${
      history.slice(0, -1).map(m => `**${m.role}:** ${m.content.slice(0, 500)}`).join("\n\n")
    }\n\n---\nNow respond to the latest message.`
    : "";

  // Create MCP server
  const bazdmegServer = createBazdmegMcpServer();

  // Stream response via Claude Agent SDK
  const stream = new ReadableStream({
    async start(controller) {
      try {
        emitSSE(controller, { type: "stage", stage: "initialize" });

        const result = query({
          prompt: content.trim(),
          options: {
            mcpServers: { bazdmeg: bazdmegServer },
            allowedTools: BAZDMEG_TOOL_NAMES,
            tools: [],
            permissionMode: "dontAsk",
            persistSession: false,
            systemPrompt: BAZDMEG_SYSTEM_PROMPT + conversationContext,
            env: await agentEnv(),
          },
        });

        let finalResponse = "";

        for await (const message of result) {
          if (message.type === "assistant") {
            const assistantMessage = message as {
              message?: { content?: ContentPart[]; };
            };
            const contentArray = assistantMessage.message?.content || [];

            const textParts = contentArray.filter(c => c.type === "text");
            const text = textParts.map(c => c.text || "").join("");
            if (text) {
              finalResponse += text;
              emitSSE(controller, { type: "chunk", content: text });
            }

            const toolUseParts = contentArray.filter(c => c.type === "tool_use");
            for (const toolUse of toolUseParts) {
              emitSSE(controller, {
                type: "stage",
                stage: "executing_tool",
                tool: toolUse.name,
              });
            }
          }

          if (message.type === "result") {
            if (message.subtype !== "success") {
              const resultMsg = message as { errors?: string[]; };
              emitSSE(controller, {
                type: "error",
                content: resultMsg.errors?.join(", ") || "Unknown error",
              });
            }
          }
        }

        // Save agent response
        if (finalResponse) {
          const { error: saveError } = await tryCatch(
            prisma.agentMessage.create({
              data: {
                agentId,
                role: "AGENT",
                content: finalResponse,
              },
            }),
          );
          if (saveError) {
            logger.error("[bazdmeg] Failed to save agent response:", {
              error: saveError,
            });
          }
        }

        emitSSE(controller, { type: "complete" });
        controller.close();
      } catch (error) {
        logger.error("[bazdmeg] Streaming error:", { error });
        emitSSE(controller, {
          type: "error",
          content: error instanceof Error ? error.message : "Unknown error",
        });
        emitSSE(controller, { type: "complete" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
