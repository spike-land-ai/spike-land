import { verifyAgentAuth } from "@/lib/auth/agent";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * GET /api/agent/apps/[appId]/context
 * Returns app context and chat history for agent processing
 * Used by vibe-dev Docker container to get context without direct DB access
 *
 * Headers:
 *   Authorization: Bearer <AGENT_API_KEY>
 *
 * Query params:
 *   - historyLimit: number (default: 10) - Number of messages to return
 *
 * Rate Limiting Consideration:
 * This endpoint is protected by AGENT_API_KEY authentication, which limits access
 * to trusted internal services (vibe-dev Docker container). The agent polls at
 * controlled intervals, so request volume is predictable. If public access is ever
 * needed, add rate limiting middleware (e.g., Upstash Ratelimit) to prevent abuse.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ appId: string; }>; },
) {
  // Verify agent authorization
  if (!verifyAgentAuth(request)) {
    return NextResponse.json(
      { error: "Unauthorized - Invalid or missing agent API key" },
      { status: 401 },
    );
  }

  const { data: params, error: paramsError } = await tryCatch(context.params);
  if (paramsError) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }
  const { appId } = params;

  // Parse query params
  const { searchParams } = new URL(request.url);
  const historyLimit = Math.min(
    parseInt(searchParams.get("historyLimit") || "10", 10),
    50, // Cap at 50 messages
  );

  // Fetch app with requirements and recent messages
  const { data: app, error: fetchError } = await tryCatch(
    prisma.app.findUnique({
      where: { id: appId },
      include: {
        requirements: {
          select: {
            id: true,
            description: true,
            priority: true,
            status: true,
          },
          orderBy: { priority: "asc" },
        },
        messages: {
          take: historyLimit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
            isRead: true,
            attachments: {
              select: {
                image: {
                  select: {
                    id: true,
                    originalUrl: true,
                    aiDescription: true,
                    tags: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
  );

  if (fetchError) {
    logger.error("Error fetching app context:", fetchError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  if (!app) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  // Reverse messages to chronological order (oldest first)
  const messages = [...app.messages].reverse();

  return NextResponse.json({
    app: {
      id: app.id,
      name: app.name,
      description: app.description,
      status: app.status,
      codespaceId: app.codespaceId,
      codespaceUrl: app.codespaceUrl,
      isPublic: app.isPublic,
      slug: app.slug,
    },
    requirements: app.requirements,
    chatHistory: messages,
  });
}
