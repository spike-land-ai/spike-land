import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";

// GET /api/apps/[id]/versions - List code versions for an app
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; }>; },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: appId } = await context.params;

    // Verify ownership
    const app = await prisma.app.findFirst({
      where: { id: appId, userId: session.user.id },
      select: { id: true },
    });

    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    // Pagination with NaN handling
    const searchParams = request.nextUrl.searchParams;
    const parsedLimit = parseInt(searchParams.get("limit") || "20");
    const limit = Math.min(Number.isNaN(parsedLimit) ? 20 : parsedLimit, 50);
    const cursor = searchParams.get("cursor");

    const versions = await prisma.appCodeVersion.findMany({
      where: { appId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        hash: true,
        description: true,
        createdAt: true,
        messageId: true,
        message: {
          select: {
            content: true,
          },
        },
      },
    });

    const hasMore = versions.length > limit;
    const items = hasMore ? versions.slice(0, -1) : versions;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return NextResponse.json({
      versions: items,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    logger.error("[apps/versions] Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve app versions" },
      { status: 500 },
    );
  }
}
