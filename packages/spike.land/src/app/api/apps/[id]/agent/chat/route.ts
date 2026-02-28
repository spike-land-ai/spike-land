import { auth } from "@/lib/auth";
import { logger } from "@/lib/errors/structured-logger";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { streamAgentChat } from "@/lib/apps/agent-chat-service";

export const maxDuration = 300; // 5 minutes

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
      where: { id, userId: session.user.id, status: { not: "ARCHIVED" } },
      select: { id: true, codespaceId: true, codespaceUrl: true, status: true },
    }),
  );

  if (appError) {
    logger.error(
      "Error fetching app",
      appError instanceof Error ? appError : undefined,
      { route: "/api/apps/agent/chat" },
    );
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  if (!app) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  if (!app.codespaceId) {
    return NextResponse.json({
      error: "App does not have a codespace configured",
    }, { status: 400 });
  }

  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { content } = body;
  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  }

  return streamAgentChat(id, { codespaceId: app.codespaceId }, content);
}
