/**
 * Workspace API
 *
 * GET /api/workspaces/[workspaceId] - Get workspace details
 * PATCH /api/workspaces/[workspaceId] - Update workspace settings
 */

import { auth } from "@/lib/auth";
import { hasWorkspacePermission } from "@/lib/permissions/workspace-middleware";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ workspaceId: string; }>;
}

// Validation schema for workspace updates
const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters")
    .optional(),
  description: z
    .string()
    .max(200, "Description must be at most 200 characters")
    .nullable()
    .optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

// GET /api/workspaces/[workspaceId] - Get workspace details
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const { workspaceId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user has access to this workspace (any member can view basic details)
  const hasAccess = await hasWorkspacePermission(
    session.user.id,
    workspaceId,
    "members:list",
  );

  if (!hasAccess) {
    return NextResponse.json(
      { error: "Workspace not found or access denied" },
      { status: 404 },
    );
  }

  // Fetch workspace details
  const { data: workspace, error } = await tryCatch(
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        avatarUrl: true,
        isPersonal: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  );

  if (error || !workspace) {
    logger.error("Failed to fetch workspace:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspace" },
      { status: 500 },
    );
  }

  return NextResponse.json({ workspace });
}

// PATCH /api/workspaces/[workspaceId] - Update workspace settings
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const { workspaceId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user has write permission (owner or admin)
  const hasAccess = await hasWorkspacePermission(
    session.user.id,
    workspaceId,
    "workspace:settings:write",
  );

  if (!hasAccess) {
    return NextResponse.json(
      { error: "You don't have permission to update this workspace" },
      { status: 403 },
    );
  }

  // Parse and validate request body
  const { data: body, error: parseError } = await tryCatch(request.json());

  if (parseError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validation = updateWorkspaceSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0]?.message || "Invalid input" },
      { status: 400 },
    );
  }

  const { name, description, avatarUrl } = validation.data;

  // Build update data only for provided fields
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

  // Check if there's anything to update
  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 },
    );
  }

  // Update workspace
  const { data: workspace, error: updateError } = await tryCatch(
    prisma.workspace.update({
      where: { id: workspaceId },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        avatarUrl: true,
        isPersonal: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  );

  if (updateError || !workspace) {
    logger.error("Failed to update workspace:", updateError);
    return NextResponse.json(
      { error: "Failed to update workspace" },
      { status: 500 },
    );
  }

  return NextResponse.json({ workspace });
}
