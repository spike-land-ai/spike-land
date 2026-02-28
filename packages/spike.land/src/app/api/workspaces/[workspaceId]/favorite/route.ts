/**
 * Workspace Favorite Toggle API
 *
 * POST /api/workspaces/[workspaceId]/favorite - Toggle favorite status
 * GET /api/workspaces/[workspaceId]/favorite - Get favorite status
 */

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import { toggleWorkspaceFavorite } from "@/lib/workspace/aggregate-queries";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ workspaceId: string; }>;
}

/**
 * GET /api/workspaces/[workspaceId]/favorite
 *
 * Check if a workspace is favorited by the current user.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await params;

  // Verify user has access to the workspace
  const { data: membership, error: membershipError } = await tryCatch(
    prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: session.user.id,
        },
        joinedAt: { not: null },
      },
    }),
  );

  if (membershipError) {
    logger.error("Failed to check workspace membership:", membershipError);
    return NextResponse.json(
      { error: "Failed to check workspace access" },
      { status: 500 },
    );
  }

  if (!membership) {
    return NextResponse.json(
      { error: "Workspace not found or access denied" },
      { status: 404 },
    );
  }

  // Check favorite status
  const { data: favorite, error: favoriteError } = await tryCatch(
    prisma.workspaceFavorite.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId,
        },
      },
    }),
  );

  if (favoriteError) {
    logger.error("Failed to check favorite status:", favoriteError);
    return NextResponse.json(
      { error: "Failed to check favorite status" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    isFavorite: !!favorite,
    favoritedAt: favorite?.createdAt || null,
  });
}

/**
 * POST /api/workspaces/[workspaceId]/favorite
 *
 * Toggle favorite status for a workspace.
 * Returns the new favorite state (true = now favorited, false = removed).
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await params;

  // Verify user has access to the workspace
  const { data: membership, error: membershipError } = await tryCatch(
    prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: session.user.id,
        },
        joinedAt: { not: null },
      },
    }),
  );

  if (membershipError) {
    logger.error("Failed to check workspace membership:", membershipError);
    return NextResponse.json(
      { error: "Failed to check workspace access" },
      { status: 500 },
    );
  }

  if (!membership) {
    return NextResponse.json(
      { error: "Workspace not found or access denied" },
      { status: 404 },
    );
  }

  // Toggle the favorite status
  const { data: isFavorite, error: toggleError } = await tryCatch(
    toggleWorkspaceFavorite(session.user.id, workspaceId),
  );

  if (toggleError) {
    logger.error("Failed to toggle favorite:", toggleError);
    return NextResponse.json(
      { error: "Failed to toggle favorite status" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    isFavorite,
    message: isFavorite
      ? "Workspace added to favorites"
      : "Workspace removed from favorites",
  });
}
