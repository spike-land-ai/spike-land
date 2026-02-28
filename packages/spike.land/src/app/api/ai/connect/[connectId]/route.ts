/**
 * Agent Connection API
 *
 * POST /api/ai/connect/[connectId]
 * Register a new connection request (called by agent script)
 *
 * GET /api/ai/connect/[connectId]
 * Check connection status (polled by agent script)
 *
 * PUT /api/ai/connect/[connectId]
 * Complete connection (called when user authenticates)
 */

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import {
  type ConnectionCompleteResponse,
  type ConnectionStatusResponse,
  generateAgentId,
  validateConnectionRequest,
} from "@/lib/validations/agent";
import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// Connection requests expire after 10 minutes
const CONNECTION_EXPIRY_MS = 10 * 60 * 1000;

/**
 * POST - Register a connection request (called by agent script)
 * No auth required - this is the first step before user authenticates
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ connectId: string; }>; },
) {
  const { connectId } = await params;

  // Parse and validate request body
  const { data: body, error: jsonError } = await tryCatch(req.json());
  if (jsonError) {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const validation = validateConnectionRequest(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 },
    );
  }

  const { machineId, sessionId, displayName, projectPath } = validation.data;

  // Check if connectId already exists
  const { data: existing } = await tryCatch(
    prisma.agentConnectionRequest.findUnique({
      where: { connectId },
    }),
  );

  if (existing) {
    // Return existing status if already registered
    const response: ConnectionStatusResponse = {
      status: existing.status === "CONNECTED"
        ? "connected"
        : existing.expiresAt < new Date()
        ? "expired"
        : "pending",
      connectId: existing.connectId,
      agentId: existing.agentId || undefined,
      displayName: existing.displayName || undefined,
      expiresAt: existing.expiresAt.toISOString(),
    };
    return NextResponse.json(response, { status: 200 });
  }

  // Create new connection request
  const expiresAt = new Date(Date.now() + CONNECTION_EXPIRY_MS);

  const { data: created, error: createError } = await tryCatch(
    prisma.agentConnectionRequest.create({
      data: {
        connectId,
        machineId,
        sessionId,
        displayName: displayName || `Agent ${machineId.slice(0, 8)}`,
        projectPath,
        status: "PENDING",
        expiresAt,
      },
    }),
  );

  if (createError) {
    logger.error("Failed to create connection request:", createError);
    return NextResponse.json(
      { error: "Failed to create connection request" },
      { status: 500 },
    );
  }

  const response: ConnectionStatusResponse = {
    status: "pending",
    connectId: created.connectId,
    displayName: created.displayName || undefined,
    expiresAt: created.expiresAt.toISOString(),
  };

  return NextResponse.json(response, { status: 201 });
}

/**
 * GET - Check connection status (polled by agent script)
 * No auth required - agent polls this to know when user authenticated
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ connectId: string; }>; },
) {
  const { connectId } = await params;

  const { data: request, error } = await tryCatch(
    prisma.agentConnectionRequest.findUnique({
      where: { connectId },
    }),
  );

  if (error) {
    logger.error("Failed to fetch connection request:", error);
    return NextResponse.json(
      { error: "Failed to fetch connection status" },
      { status: 500 },
    );
  }

  if (!request) {
    return NextResponse.json(
      { error: "Connection request not found" },
      { status: 404 },
    );
  }

  // Check if expired
  const isExpired = request.expiresAt < new Date();
  if (isExpired && request.status === "PENDING") {
    // Update status to expired
    await tryCatch(
      prisma.agentConnectionRequest.update({
        where: { id: request.id },
        data: { status: "EXPIRED" },
      }),
    );
  }

  const response: ConnectionStatusResponse = {
    status: request.status === "CONNECTED"
      ? "connected"
      : isExpired
      ? "expired"
      : "pending",
    connectId: request.connectId,
    agentId: request.agentId || undefined,
    displayName: request.displayName || undefined,
    expiresAt: request.expiresAt.toISOString(),
  };

  return NextResponse.json(response, { status: 200 });
}

/**
 * PUT - Complete connection (called from browser after user authenticates)
 * Requires user authentication
 */
export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ connectId: string; }>; },
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
  const { connectId } = await params;

  // Find the connection request
  const { data: request, error: fetchError } = await tryCatch(
    prisma.agentConnectionRequest.findUnique({
      where: { connectId },
    }),
  );

  if (fetchError) {
    logger.error("Failed to fetch connection request:", fetchError);
    return NextResponse.json(
      { error: "Failed to fetch connection request" },
      { status: 500 },
    );
  }

  if (!request) {
    return NextResponse.json(
      { error: "Connection request not found" },
      { status: 404 },
    );
  }

  // Check if already connected
  if (request.status === "CONNECTED") {
    return NextResponse.json(
      { error: "Connection already completed" },
      { status: 400 },
    );
  }

  // Check if expired
  if (request.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Connection request expired" },
      { status: 410 },
    );
  }

  // Generate agent ID
  const agentId = generateAgentId(request.machineId, request.sessionId);
  const displayName = request.displayName
    || `Agent ${request.machineId.slice(0, 8)}`;

  // Create or update the agent in the database
  const { error: agentError } = await tryCatch(
    prisma.claudeCodeAgent.upsert({
      where: { id: agentId },
      create: {
        id: agentId,
        userId,
        machineId: request.machineId,
        sessionId: request.sessionId,
        displayName,
        projectPath: request.projectPath,
        lastSeenAt: new Date(),
      },
      update: {
        userId, // Update user in case agent reconnects with different user
        displayName,
        projectPath: request.projectPath,
        lastSeenAt: new Date(),
        deletedAt: null, // Reactivate if previously deleted
      },
    }),
  );

  if (agentError) {
    logger.error("Failed to create/update agent:", agentError);
    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 },
    );
  }

  // Mark connection as complete
  const { error: updateError } = await tryCatch(
    prisma.agentConnectionRequest.update({
      where: { id: request.id },
      data: {
        status: "CONNECTED",
        userId,
        agentId,
        completedAt: new Date(),
      },
    }),
  );

  if (updateError) {
    logger.error("Failed to update connection request:", updateError);
    // Don't fail - agent was already created
  }

  // Create a system message to mark the connection
  await tryCatch(
    prisma.agentMessage.create({
      data: {
        agentId,
        role: "SYSTEM",
        content: `Agent connected via browser authentication`,
        isRead: true,
      },
    }),
  );

  const response: ConnectionCompleteResponse = {
    success: true,
    agentId,
    displayName,
    message: "Agent connected successfully",
  };

  return NextResponse.json(response, { status: 200 });
}
