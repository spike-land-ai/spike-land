import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ slug: string; }>;
}

// GET /api/workspaces/by-slug/[slug]
// Get workspace ID from slug
export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  // Find workspace by slug
  const { data: workspace, error } = await tryCatch(
    prisma.workspace.findUnique({
      where: { slug },
      select: { id: true, slug: true, name: true },
    }),
  );

  if (error) {
    logger.error("Failed to fetch workspace:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspace" },
      { status: 500 },
    );
  }

  if (!workspace) {
    return NextResponse.json(
      { error: "Workspace not found" },
      { status: 404 },
    );
  }

  // Verify user has access to this workspace
  const { data: membership } = await tryCatch(
    prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: session.user.id,
        },
      },
    }),
  );

  if (!membership) {
    return NextResponse.json(
      { error: "Access denied" },
      { status: 403 },
    );
  }

  return NextResponse.json(workspace);
}
