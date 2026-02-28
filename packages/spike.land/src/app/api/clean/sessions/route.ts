import { auth } from "@/lib/auth";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * GET /api/clean/sessions
 * List user's cleaning sessions (paginated, recent first)
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const cursor = searchParams.get("cursor");

  const prisma = (await import("@/lib/prisma")).default;

  const { data: sessions, error } = await tryCatch(
    prisma.cleaningSession.findMany({
      where: { userId: session.user.id },
      orderBy: { startedAt: "desc" },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        _count: { select: { tasks: true } },
      },
    }),
  );

  if (error) {
    logger.error("Error fetching cleaning sessions:", error);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  const hasMore = sessions.length > limit;
  const results = hasMore ? sessions.slice(0, -1) : sessions;
  const nextCursor = hasMore ? results[results.length - 1]?.id : null;

  return NextResponse.json({ sessions: results, nextCursor, hasMore });
}

/**
 * POST /api/clean/sessions
 * Start a new cleaning session
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const roomLabel = typeof body?.roomLabel === "string"
    ? body.roomLabel.trim()
    : null;

  const prisma = (await import("@/lib/prisma")).default;

  const { data: newSession, error } = await tryCatch(
    prisma.cleaningSession.create({
      data: {
        userId: session.user.id,
        status: "ACTIVE",
        roomLabel,
      },
    }),
  );

  if (error) {
    logger.error("Error creating cleaning session:", error);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  return NextResponse.json(newSession, { status: 201 });
}
