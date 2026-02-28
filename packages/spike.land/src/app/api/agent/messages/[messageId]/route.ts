import { verifyAgentAuth } from "@/lib/auth/agent";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * GET /api/agent/messages/[messageId]
 * Returns message content by ID
 * Used by vibe-dev Docker container to get message details without direct DB access
 *
 * Headers:
 *   Authorization: Bearer <AGENT_API_KEY>
 *
 * Rate Limiting Consideration:
 * This endpoint is protected by AGENT_API_KEY authentication, which limits access
 * to trusted internal services (vibe-dev Docker container). The agent processes
 * messages sequentially at controlled intervals, so request volume is predictable.
 * If public access is ever needed, add rate limiting middleware (e.g., Upstash
 * Ratelimit) to prevent abuse.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ messageId: string; }>; },
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
  const { messageId } = params;

  // Fetch message with attachments
  const { data: message, error: fetchError } = await tryCatch(
    prisma.appMessage.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        appId: true,
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
    }),
  );

  if (fetchError) {
    logger.error("Error fetching message:", fetchError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  return NextResponse.json(message);
}

/**
 * PATCH /api/agent/messages/[messageId]
 * Mark message as read
 * Used by vibe-dev Docker container after processing a message
 *
 * Headers:
 *   Authorization: Bearer <AGENT_API_KEY>
 *
 * Body:
 *   - isRead: boolean
 *
 * Rate Limiting Consideration:
 * This endpoint is protected by AGENT_API_KEY authentication, which limits access
 * to trusted internal services (vibe-dev Docker container). The agent only marks
 * messages as read after processing, so request volume is tied to message processing
 * rate. If public access is ever needed, add rate limiting middleware.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ messageId: string; }>; },
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
  const { messageId } = params;

  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { isRead } = body as { isRead?: boolean; };
  if (typeof isRead !== "boolean") {
    return NextResponse.json(
      { error: "isRead must be a boolean" },
      { status: 400 },
    );
  }

  // Update message
  const { data: updated, error: updateError } = await tryCatch(
    prisma.appMessage.update({
      where: { id: messageId },
      data: { isRead },
      select: { id: true, isRead: true },
    }),
  );

  if (updateError) {
    logger.error("Error updating message:", updateError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  return NextResponse.json(updated);
}
