import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import { appStatusUpdateSchema } from "@/lib/validations/app";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { broadcastStatus } from "../messages/stream/route";
import { logger } from "@/lib/logger";

/**
 * GET /api/apps/[id]/status
 * Get current app status with history
 */
export async function GET(
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

  const { data: app, error: appError } = await tryCatch(
    prisma.app.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        id: true,
        status: true,
        lastAgentActivity: true,
        statusHistory: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            status: true,
            message: true,
            createdAt: true,
          },
        },
      },
    }),
  );

  if (appError) {
    logger.error("Error fetching app status:", appError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  if (!app) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  return NextResponse.json(app);
}

/**
 * PATCH /api/apps/[id]/status
 * Update app build status (for user-initiated changes like archive)
 */
export async function PATCH(
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

  const parseResult = appStatusUpdateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Validation error", details: parseResult.error.issues },
      { status: 400 },
    );
  }

  const { status, message } = parseResult.data;

  // Users can only set certain statuses directly
  const allowedUserStatuses = ["ARCHIVED", "PROMPTING"] as const;
  if (
    !allowedUserStatuses.includes(
      status as (typeof allowedUserStatuses)[number],
    )
  ) {
    return NextResponse.json(
      { error: "You can only archive or restart apps" },
      { status: 403 },
    );
  }

  const { data: updatedApp, error: updateError } = await tryCatch(
    prisma.$transaction([
      prisma.app.update({
        where: { id },
        data: { status },
        select: {
          id: true,
          status: true,
          lastAgentActivity: true,
        },
      }),
      prisma.appStatusHistory.create({
        data: {
          appId: id,
          status,
          message: message || `User changed status to ${status}`,
        },
      }),
    ]),
  );

  if (updateError) {
    logger.error("Error updating app status:", updateError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  // Broadcast status change to connected clients
  broadcastStatus(id, status, message || `User changed status to ${status}`);

  return NextResponse.json(updatedApp[0]);
}
