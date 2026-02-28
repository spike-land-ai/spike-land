/**
 * Dashboard Chat Streaming API
 *
 * POST: SSE streaming chat with per-ticket context.
 * Uses Claude Opus 4.6 via the shared client.
 */

import { auth } from "@/lib/auth";
import { verifyAdminAccess } from "@/lib/auth/admin-middleware";
import { getClaudeClient } from "@/lib/ai/claude-client";
import prisma from "@/lib/prisma";
import logger from "@/lib/logger";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const maxDuration = 120;

import { checkRateLimit } from "@/lib/rate-limiter";

const MAX_MESSAGE_LENGTH = 10_000;
const RATE_LIMIT_CONFIG = { maxRequests: 10, windowMs: 60_000 };

function emitSSE(
  controller: ReadableStreamDefaultController,
  data: Record<string, unknown>,
) {
  controller.enqueue(
    new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`),
  );
}

function buildSystemPrompt(
  issue: {
    title: string;
    body: string | null;
    url: string;
    labels: string[];
  },
  plan: string | null,
  chatHistory: Array<{ role: string; content: string; }>,
): string {
  const historyContext = chatHistory.length > 0
    ? `\n\n## Previous Discussion\n${
      chatHistory.map(m => `**${m.role}:** ${m.content.slice(0, 500)}`).join(
        "\n\n",
      )
    }`
    : "";

  return `You are the BAZDMEG Development Planner, an expert at creating detailed implementation plans for software tickets.

## Current Ticket
**Title:** ${issue.title}
**URL:** ${issue.url}
**Labels:** ${issue.labels.join(", ") || "none"}

${issue.body ? `## Issue Description\n${issue.body.slice(0, 3000)}` : ""}

${
    plan
      ? `## Current Plan Draft\n${plan}`
      : "## No Plan Yet\nHelp the user create an implementation plan."
  }
${historyContext}

## Your Role
- Help create detailed, actionable implementation plans for this ticket
- Plans should include: files to modify, approach, edge cases, testing strategy
- Be specific about code changes — reference actual file paths and function names
- Format plans in Markdown with clear sections
- When the user is satisfied, suggest they mark the plan as "ready for approval"
- Keep responses focused on the current ticket`;
}

export async function POST(request: NextRequest) {
  const { data: session, error: authError } = await tryCatch(auth());
  if (authError || !session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, {
      status: 401,
    });
  }

  const isAdmin = await verifyAdminAccess(session);
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, {
      status: 403,
    });
  }

  const userId = session.user.id;

  const { isLimited } = await checkRateLimit(
    `bazdmeg-chat:${userId}`,
    RATE_LIMIT_CONFIG,
  );
  if (isLimited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { content, planId } = body as { content?: string; planId?: string; };
  if (!content || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }
  if (content.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` },
      { status: 400 },
    );
  }
  if (!planId) {
    return NextResponse.json({ error: "planId is required" }, { status: 400 });
  }

  // Load the plan with chat history
  const { data: plan, error: planError } = await tryCatch(
    prisma.ticketPlan.findFirst({
      where: { id: planId, userId },
      include: {
        chatMessages: {
          orderBy: { createdAt: "asc" },
          take: 50,
        },
      },
    }),
  );

  if (planError || !plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  // Save user message
  await tryCatch(
    prisma.ticketChatMessage.create({
      data: {
        ticketPlanId: plan.id,
        role: "USER",
        content: content.trim(),
      },
    }),
  );

  const systemPrompt = buildSystemPrompt(
    {
      title: plan.githubIssueTitle,
      body: plan.githubIssueBody,
      url: plan.githubIssueUrl,
      labels: [],
    },
    plan.planContent,
    plan.chatMessages.map(m => ({ role: m.role, content: m.content })),
  );

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const client = await getClaudeClient();

        const messageStream = client.messages.stream({
          model: "claude-opus-4-6",
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: "user", content: content.trim() }],
        });

        let fullResponse = "";

        messageStream.on("text", text => {
          fullResponse += text;
          emitSSE(controller, { type: "chunk", content: text });
        });

        messageStream.on("error", error => {
          logger.error("[dashboard-chat] Stream error:", { error });
          emitSSE(controller, {
            type: "error",
            content: error instanceof Error ? error.message : "Stream error",
          });
        });

        const finalMessage = await messageStream.finalMessage();

        // Save agent response
        if (fullResponse) {
          await tryCatch(
            prisma.ticketChatMessage.create({
              data: {
                ticketPlanId: plan.id,
                role: "AGENT",
                content: fullResponse,
                inputTokens: finalMessage.usage.input_tokens,
                outputTokens: finalMessage.usage.output_tokens,
              },
            }),
          );
        }

        emitSSE(controller, { type: "complete" });
        controller.close();
      } catch (error) {
        logger.error("[dashboard-chat] Error:", { error });
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
      Connection: "keep-alive",
    },
  });
}
