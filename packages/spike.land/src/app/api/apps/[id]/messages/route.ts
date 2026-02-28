import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import { appMessageCreateSchema } from "@/lib/validations/app";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { broadcastMessage, broadcastStatus } from "./stream/route";
import { logger } from "@/lib/logger";

/**
 * GET /api/apps/[id]/messages
 * Fetch messages for an app's chat thread
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; }>; },
) {
  const { data: session, error: authError } = await tryCatch(auth());

  if (authError || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: params, error: paramsError } = await tryCatch(context.params);
  if (paramsError) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }
  const { id } = params;

  // Verify user owns this app
  const { data: app, error: appError } = await tryCatch(
    prisma.app.findFirst({
      where: {
        id,
        userId: session.user.id,
        status: { not: "ARCHIVED" },
      },
      select: { id: true },
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

  // Get pagination params
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const cursor = searchParams.get("cursor");

  const { data: messages, error: messagesError } = await tryCatch(
    prisma.appMessage.findMany({
      where: { appId: id, deletedAt: null },
      include: {
        attachments: {
          include: {
            image: {
              select: {
                id: true,
                originalUrl: true,
                width: true,
                height: true,
                format: true,
                tags: true,
                aiDescription: true,
              },
            },
          },
        },
        // Include code version for preview-in-chat feature
        codeVersion: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1, // Fetch one extra to check if there are more
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    }),
  );

  if (messagesError) {
    logger.error("Error fetching messages:", messagesError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  // Check if there are more messages
  const hasMore = messages.length > limit;
  const resultMessages = hasMore ? messages.slice(0, -1) : messages;
  const nextCursor = hasMore
    ? resultMessages[resultMessages.length - 1]?.id
    : null;

  return NextResponse.json({
    messages: resultMessages,
    nextCursor,
    hasMore,
  });
}

/**
 * POST /api/apps/[id]/messages
 * Create a new message in the app's chat thread
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; }>; },
) {
  const { data: session, error: authError } = await tryCatch(auth());

  if (authError || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: params, error: paramsError } = await tryCatch(context.params);
  if (paramsError) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }
  const { id } = params;

  // Verify user owns this app
  const { data: app, error: appError } = await tryCatch(
    prisma.app.findFirst({
      where: {
        id,
        userId: session.user.id,
        status: { not: "ARCHIVED" },
      },
      select: { id: true, status: true },
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

  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = appMessageCreateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Validation error", details: parseResult.error.issues },
      { status: 400 },
    );
  }

  const { content, imageIds } = parseResult.data;

  // Create message with attachments in a transaction
  const { data: message, error: createError } = await tryCatch(
    prisma.$transaction(async tx => {
      // Create the message
      const newMessage = await tx.appMessage.create({
        data: {
          appId: id,
          role: "USER",
          content,
        },
        include: {
          attachments: {
            include: {
              image: {
                select: {
                  id: true,
                  originalUrl: true,
                  width: true,
                  height: true,
                  format: true,
                  tags: true,
                  aiDescription: true,
                },
              },
            },
          },
        },
      });

      // Create attachments if image IDs provided
      if (imageIds && imageIds.length > 0) {
        // Verify images belong to this app
        const validImages = await tx.appImage.findMany({
          where: {
            id: { in: imageIds },
            appId: id,
          },
          select: { id: true },
        });

        if (validImages.length > 0) {
          await tx.appAttachment.createMany({
            data: validImages.map(img => ({
              messageId: newMessage.id,
              imageId: img.id,
            })),
          });
        }

        // Refetch message with attachments
        return tx.appMessage.findUnique({
          where: { id: newMessage.id },
          include: {
            attachments: {
              include: {
                image: {
                  select: {
                    id: true,
                    originalUrl: true,
                    width: true,
                    height: true,
                    format: true,
                    tags: true,
                    aiDescription: true,
                  },
                },
              },
            },
          },
        });
      }

      return newMessage;
    }),
  );

  if (createError || !message) {
    logger.error("Error creating message:", createError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  // Broadcast the new message to connected clients
  broadcastMessage(id, {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
    attachments: message.attachments?.map(a => ({
      imageId: a.image.id,
      url: a.image.originalUrl,
    })),
  });

  // Update app status to WAITING if it was PROMPTING
  if (app.status === "PROMPTING") {
    await tryCatch(
      prisma.$transaction([
        prisma.app.update({
          where: { id },
          data: { status: "WAITING" },
        }),
        prisma.appStatusHistory.create({
          data: {
            appId: id,
            status: "WAITING",
            message: "User submitted initial prompt",
          },
        }),
      ]),
    );
    // Broadcast status change
    broadcastStatus(id, "WAITING", "User submitted initial prompt");
  }

  // Enqueue message removed - Agent processing is now handled by the chat stream endpoint

  return NextResponse.json(message, { status: 201 });
}

/**
 * DELETE /api/apps/[id]/messages
 * Clear all messages for an app's chat thread
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; }>; },
) {
  const { data: session, error: authError } = await tryCatch(auth());

  if (authError || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: params, error: paramsError } = await tryCatch(context.params);
  if (paramsError) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }
  const { id } = params;

  // Verify user owns this app
  const { data: app, error: appError } = await tryCatch(
    prisma.app.findFirst({
      where: {
        id,
        userId: session.user.id,
        status: { not: "ARCHIVED" },
      },
      select: { id: true },
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

  // Delete all messages for this app (attachments will be deleted via cascade)
  const { error: deleteError } = await tryCatch(
    prisma.appMessage.deleteMany({
      where: { appId: id },
    }),
  );

  if (deleteError) {
    logger.error("Error deleting messages:", deleteError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
