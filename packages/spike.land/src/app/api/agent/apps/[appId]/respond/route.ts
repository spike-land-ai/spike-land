import logger from "@/lib/logger";

import { createHash } from "crypto";

import {
  broadcastCodeUpdated,
  broadcastMessage,
} from "@/app/api/apps/[id]/messages/stream/route";
import { verifyAgentAuth } from "@/lib/auth/agent";
import { getOrCreateSession } from "@/lib/codespace";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import { dequeueMessage } from "@/lib/upstash";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

// Schema for agent response
const agentResponseSchema = z.object({
  content: z.string().min(1).max(50000), // Agent responses can be longer
  codeUpdated: z.boolean().optional().default(false), // Flag if code was updated
  processedMessageIds: z.array(z.string()).optional(), // Messages this responds to
  metadata: z.record(z.string(), z.unknown()).optional(), // Additional metadata (tool calls, etc.)
});

/**
 * POST /api/agent/apps/[appId]/respond
 * Post an agent response to the chat
 * Requires agent API key authentication
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ appId: string; }>; },
) {
  if (!verifyAgentAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: params, error: paramsError } = await tryCatch(context.params);
  if (paramsError) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }
  const { appId } = params;

  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = agentResponseSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Validation error", details: parseResult.error.issues },
      { status: 400 },
    );
  }

  const { content, codeUpdated, processedMessageIds, metadata } = parseResult.data;

  // Verify app exists and is not archived
  const { data: app, error: appError } = await tryCatch(
    prisma.app.findFirst({
      where: {
        id: appId,
        status: { notIn: ["ARCHIVED"] },
      },
      select: { id: true, codespaceId: true },
    }),
  );

  if (appError) {
    logger.error("Error fetching app:", appError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  if (!app) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  // Create agent message and mark processed messages as read
  const { data: result, error: createError } = await tryCatch(
    prisma.$transaction(async tx => {
      // Create the agent message
      const message = await tx.appMessage.create({
        data: {
          appId,
          role: "AGENT",
          content,
          isRead: false, // User hasn't read yet
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        },
      });

      // Mark processed messages as read
      if (processedMessageIds && processedMessageIds.length > 0) {
        await tx.appMessage.updateMany({
          where: {
            id: { in: processedMessageIds },
            appId,
          },
          data: { isRead: true },
        });
      }

      // Update app's last agent activity
      await tx.app.update({
        where: { id: appId },
        data: { lastAgentActivity: new Date() },
      });

      // If code was updated and app has a codespace, create a code version
      let codeVersion: { id: string; createdAt: Date; } | null = null;
      if (codeUpdated && app.codespaceId) {
        try {
          const codespaceSession = await getOrCreateSession(app.codespaceId);
          const code = codespaceSession?.code;

          if (code) {
            const hash = createHash("sha256").update(code).digest("hex");
            const version = await tx.appCodeVersion.create({
              data: {
                appId,
                messageId: message.id,
                code,
                hash,
              },
            });
            codeVersion = { id: version.id, createdAt: version.createdAt };
            logger.info("[respond] Created code version for message:", {
              messageId: message.id,
            });
          }
        } catch (codeVersionError) {
          // Log but don't fail - code version is nice-to-have for UI previews
          logger.warn(
            "[respond] Failed to create code version:",
            {
              error: codeVersionError instanceof Error
                ? codeVersionError.message
                : String(codeVersionError),
            },
          );
        }
      }

      return { message, codeVersion };
    }),
  );

  if (createError || !result) {
    logger.error("Error creating agent response:", createError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  const { message, codeVersion } = result;

  // Dequeue processed messages from Redis
  if (processedMessageIds && processedMessageIds.length > 0) {
    for (const _msgId of processedMessageIds) {
      await tryCatch(dequeueMessage(appId));
    }
  }

  // Broadcast the new message to connected clients (with codeVersion if present)
  broadcastMessage(appId, {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
    ...(codeVersion && { codeVersion }),
  });

  // If code was updated, broadcast code update event (triggers iframe reload)
  if (codeUpdated) {
    broadcastCodeUpdated(appId);
  }

  return NextResponse.json(message, { status: 201 });
}
