import { verifyAgentAuth } from "@/lib/auth/agent";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import { setAgentWorking } from "@/lib/upstash";
import { agentAppUpdateSchema } from "@/lib/validations/app";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  broadcastAgentWorking,
  broadcastMessage,
  broadcastStatus,
} from "../messages/stream/route";
import { logger } from "@/lib/logger";

/**
 * PATCH /api/apps/[id]/agent
 * Agent endpoint to update app properties, status, and send messages
 *
 * Headers:
 *   Authorization: Bearer <AGENT_API_KEY>
 *
 * Body:
 *   - name?: string - Update app name
 *   - description?: string - Update app description
 *   - status?: AppBuildStatus - Update app status
 *   - statusMessage?: string - Message for status history
 *   - codespaceId?: string - Link to codespace
 *   - isPublic?: boolean - Set public visibility
 *   - isCurated?: boolean - Set curated status (admin only in production)
 *   - agentMessage?: string - Add an agent message to chat
 *   - systemMessage?: string - Add a system message to chat
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; }>; },
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
  const { id } = params;

  // Verify app exists
  const { data: existingApp, error: fetchError } = await tryCatch(
    prisma.app.findUnique({
      where: { id },
      select: { id: true, status: true, codespaceId: true, slug: true },
    }),
  );

  if (fetchError) {
    logger.error("Error fetching app for agent update:", fetchError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  if (!existingApp) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  // Parse and validate request body
  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = agentAppUpdateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Validation error", details: parseResult.error.issues },
      { status: 400 },
    );
  }

  const {
    name,
    description,
    status,
    statusMessage,
    codespaceId,
    isPublic,
    isCurated,
    agentMessage,
    systemMessage,
  } = parseResult.data;

  // Build update data
  const updateData: Record<string, unknown> = {
    lastAgentActivity: new Date(),
  };

  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (isPublic !== undefined) updateData.isPublic = isPublic;
  if (isCurated !== undefined) updateData.isCurated = isCurated;

  // Handle codespace linking
  if (codespaceId !== undefined) {
    updateData.codespaceId = codespaceId;
    updateData.codespaceUrl = `/api/codespace/${codespaceId}/embed`;
    // Also update slug if not already set
    if (!existingApp.slug) {
      updateData.slug = codespaceId;
    }
  }

  // Handle status update (with history)
  if (status !== undefined) {
    updateData.status = status;
  }

  // Execute database operations
  const { error: updateError } = await tryCatch(
    prisma.$transaction(async tx => {
      // Update app
      await tx.app.update({
        where: { id },
        data: updateData,
      });

      // Create status history entry if status changed
      if (status !== undefined && status !== existingApp.status) {
        await tx.appStatusHistory.create({
          data: {
            appId: id,
            status,
            message: statusMessage || `Agent changed status to ${status}`,
          },
        });
      }

      // Add agent message if provided
      if (agentMessage) {
        await tx.appMessage.create({
          data: {
            appId: id,
            role: "AGENT",
            content: agentMessage,
          },
        });
      }

      // Add system message if provided
      if (systemMessage) {
        await tx.appMessage.create({
          data: {
            appId: id,
            role: "SYSTEM",
            content: systemMessage,
          },
        });
      }
    }),
  );

  if (updateError) {
    logger.error("Error updating app via agent:", updateError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  // Broadcast updates to connected clients via SSE
  if (status !== undefined && status !== existingApp.status) {
    broadcastStatus(
      id,
      status,
      statusMessage || `Agent changed status to ${status}`,
    );
  }

  if (agentMessage) {
    // Fetch the created message to get its ID
    const { data: newMessage } = await tryCatch(
      prisma.appMessage.findFirst({
        where: { appId: id, role: "AGENT" },
        orderBy: { createdAt: "desc" },
      }),
    );
    if (newMessage) {
      broadcastMessage(id, {
        id: newMessage.id,
        role: "AGENT",
        content: agentMessage,
        createdAt: newMessage.createdAt,
      });
    }
  }

  if (systemMessage) {
    const { data: newMessage } = await tryCatch(
      prisma.appMessage.findFirst({
        where: { appId: id, role: "SYSTEM" },
        orderBy: { createdAt: "desc" },
      }),
    );
    if (newMessage) {
      broadcastMessage(id, {
        id: newMessage.id,
        role: "SYSTEM",
        content: systemMessage,
        createdAt: newMessage.createdAt,
      });
    }
  }

  // Fetch and return updated app
  const { data: updatedApp, error: refetchError } = await tryCatch(
    prisma.app.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        codespaceId: true,
        codespaceUrl: true,
        isPublic: true,
        isCurated: true,
        lastAgentActivity: true,
      },
    }),
  );

  if (refetchError || !updatedApp) {
    return NextResponse.json({ success: true, id });
  }

  return NextResponse.json(updatedApp);
}

/**
 * POST /api/apps/[id]/agent/working
 * Set or clear agent working status
 *
 * Body:
 *   - isWorking: boolean
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; }>; },
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
  const { id } = params;

  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { isWorking } = body as { isWorking?: boolean; };
  if (typeof isWorking !== "boolean") {
    return NextResponse.json(
      { error: "isWorking must be a boolean" },
      { status: 400 },
    );
  }

  // Update Redis flag
  const { error: redisError } = await tryCatch(setAgentWorking(id, isWorking));
  if (redisError) {
    logger.error("Error setting agent working status:", redisError);
    return NextResponse.json(
      { error: "Failed to update agent status" },
      { status: 500 },
    );
  }

  // Update database
  if (isWorking) {
    await tryCatch(
      prisma.app.update({
        where: { id },
        data: { lastAgentActivity: new Date() },
      }),
    );
  }

  // Broadcast to connected clients
  broadcastAgentWorking(id, isWorking);

  return NextResponse.json({ success: true, isWorking });
}
