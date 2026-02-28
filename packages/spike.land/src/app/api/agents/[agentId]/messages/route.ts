/**
 * Agent Messages API
 *
 * GET /api/agents/[agentId]/messages
 * List messages for an agent (paginated)
 *
 * POST /api/agents/[agentId]/messages
 * Send a message to an agent
 */

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import {
  type AgentMessageResponse,
  type AgentMessagesListResponse,
  messageListQuerySchema,
  validateAgentMessage,
} from "@/lib/validations/agent";
import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * GET - List messages for an agent
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string; }>; },
) {
  // Authenticate the user
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const userId = session.user.id;
  const { agentId } = await params;

  // Verify agent belongs to user
  const { data: agent, error: agentError } = await tryCatch(
    prisma.claudeCodeAgent.findUnique({
      where: { id: agentId },
      select: { userId: true },
    }),
  );

  if (agentError || !agent) {
    return NextResponse.json(
      { error: "Agent not found" },
      { status: 404 },
    );
  }

  if (agent.userId !== userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 },
    );
  }

  // Parse query params
  const url = new URL(req.url);
  const queryResult = messageListQuerySchema.safeParse({
    limit: url.searchParams.get("limit"),
    offset: url.searchParams.get("offset"),
    unreadOnly: url.searchParams.get("unreadOnly"),
  });

  const { limit, offset, unreadOnly } = queryResult.success
    ? queryResult.data
    : { limit: 50, offset: 0, unreadOnly: false };

  // Build query
  const where: Record<string, unknown> = { agentId };
  if (unreadOnly) {
    where.isRead = false;
  }

  // Fetch messages
  const { data: messages, error: messagesError } = await tryCatch(
    prisma.agentMessage.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip: offset,
      take: limit,
    }),
  );

  if (messagesError) {
    logger.error("Failed to fetch messages:", messagesError);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }

  // Get total count
  const { data: total } = await tryCatch(
    prisma.agentMessage.count({ where }),
  );

  const response: AgentMessagesListResponse = {
    messages: (messages || []).map(m => ({
      id: m.id,
      agentId: m.agentId,
      role: m.role as "USER" | "AGENT" | "SYSTEM",
      content: m.content,
      isRead: m.isRead,
      metadata: m.metadata as Record<string, unknown> | null,
      createdAt: m.createdAt.toISOString(),
    })),
    pagination: {
      total: total || 0,
      limit,
      offset,
      hasMore: (total || 0) > offset + limit,
    },
  };

  return NextResponse.json(response, { status: 200 });
}

/**
 * POST - Send a message to an agent
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string; }>; },
) {
  // Authenticate the user
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const userId = session.user.id;
  const { agentId } = await params;

  // Verify agent belongs to user
  const { data: agent, error: agentError } = await tryCatch(
    prisma.claudeCodeAgent.findUnique({
      where: { id: agentId },
      select: { userId: true },
    }),
  );

  if (agentError || !agent) {
    return NextResponse.json(
      { error: "Agent not found" },
      { status: 404 },
    );
  }

  if (agent.userId !== userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 },
    );
  }

  // Parse and validate request body
  const { data: body, error: jsonError } = await tryCatch(req.json());
  if (jsonError) {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const validation = validateAgentMessage(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 },
    );
  }

  const { content, role } = validation.data;

  // Create message
  const { data: message, error: createError } = await tryCatch(
    prisma.agentMessage.create({
      data: {
        agentId,
        role,
        content,
        isRead: false,
      },
    }),
  );

  if (createError || !message) {
    logger.error("Failed to create message:", createError);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }

  const response: AgentMessageResponse = {
    id: message.id,
    agentId: message.agentId,
    role: message.role as "USER" | "AGENT" | "SYSTEM",
    content: message.content,
    isRead: message.isRead,
    metadata: message.metadata as Record<string, unknown> | null,
    createdAt: message.createdAt.toISOString(),
  };

  return NextResponse.json({ message: response }, { status: 201 });
}
