import { broadcastCodeUpdated } from "@/app/api/apps/[id]/messages/stream/route";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// POST /api/apps/[id]/versions/[versionId]/restore - Restore a code version
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string; versionId: string; }>; },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: appId, versionId } = await context.params;

  // Verify ownership
  const app = await prisma.app.findFirst({
    where: { id: appId, userId: session.user.id },
    select: { id: true, codespaceId: true },
  });

  if (!app) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  if (!app.codespaceId) {
    return NextResponse.json(
      { error: "App has no codespace" },
      { status: 400 },
    );
  }

  // Get the version to restore
  const version = await prisma.appCodeVersion.findFirst({
    where: { id: versionId, appId },
    select: { id: true, code: true, createdAt: true },
  });

  if (!version) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  try {
    // Update code in the codespace with timeout
    const RESTORE_TIMEOUT_MS = 10000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), RESTORE_TIMEOUT_MS);

    const response = await fetch(
      `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/api/codespace/${app.codespaceId}/code`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: version.code }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error("Failed to update codespace");
    }

    // Create a SYSTEM message noting the restore
    const restoredAt = new Date(version.createdAt).toLocaleString();
    await prisma.appMessage.create({
      data: {
        appId,
        role: "SYSTEM",
        content: `Restored to version from ${restoredAt}`,
      },
    });

    // Broadcast code update to SSE clients
    try {
      await broadcastCodeUpdated(appId);
    } catch (e) {
      logger.error("Failed to broadcast code update:", e);
    }

    return NextResponse.json({
      success: true,
      message: `Restored to version from ${restoredAt}`,
    });
  } catch (error) {
    logger.error("Failed to restore version:", error);
    return NextResponse.json(
      { error: "Failed to restore version" },
      { status: 500 },
    );
  }
}
