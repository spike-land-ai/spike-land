/**
 * Single Workflow API
 *
 * GET /api/workspaces/[workspaceId]/workflows/[workflowId] - Get workflow
 * PATCH /api/workspaces/[workspaceId]/workflows/[workflowId] - Update workflow
 * DELETE /api/workspaces/[workspaceId]/workflows/[workflowId] - Delete workflow
 */

import { auth } from "@/lib/auth";
import {
  hasWorkspacePermission,
  requireWorkspaceMembership,
} from "@/lib/permissions/workspace-middleware";
import { tryCatch } from "@/lib/try-catch";
import {
  deleteWorkflow,
  getWorkflow,
  updateWorkflow,
} from "@/lib/workflows/workflow-service";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ workspaceId: string; workflowId: string; }>;
}

const updateWorkflowSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long")
    .optional(),
  description: z.string().max(500, "Description too long").nullable()
    .optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
});

/**
 * GET /api/workspaces/[workspaceId]/workflows/[workflowId]
 *
 * Get a single workflow with all its versions and steps.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const { workspaceId, workflowId } = await params;

  // Check membership
  const { error: authError } = await tryCatch(
    requireWorkspaceMembership(session, workspaceId),
  );

  if (authError) {
    const status = authError.message.includes("Unauthorized") ? 401 : 403;
    return NextResponse.json({ error: authError.message }, { status });
  }

  // Fetch workflow
  const { data: workflow, error: fetchError } = await tryCatch(
    getWorkflow(workflowId, workspaceId),
  );

  if (fetchError) {
    logger.error("Failed to fetch workflow:", fetchError);
    return NextResponse.json(
      { error: "Failed to fetch workflow" },
      { status: 500 },
    );
  }

  if (!workflow) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }

  return NextResponse.json({ workflow });
}

/**
 * PATCH /api/workspaces/[workspaceId]/workflows/[workflowId]
 *
 * Update a workflow's metadata (name, description, status).
 * To update steps, create a new version instead.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const { workspaceId, workflowId } = await params;

  // Check membership
  const { error: authError } = await tryCatch(
    requireWorkspaceMembership(session, workspaceId),
  );

  if (authError) {
    const status = authError.message.includes("Unauthorized") ? 401 : 403;
    return NextResponse.json({ error: authError.message }, { status });
  }

  // Parse and validate body
  const { data: body, error: parseError } = await tryCatch(request.json());

  if (parseError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validation = updateWorkflowSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0]?.message || "Invalid input" },
      { status: 400 },
    );
  }

  // Check if anything to update
  if (Object.keys(validation.data).length === 0) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 },
    );
  }

  // Update workflow
  const { data: workflow, error: updateError } = await tryCatch(
    updateWorkflow(workflowId, workspaceId, validation.data),
  );

  if (updateError) {
    if (updateError.message === "Workflow not found") {
      return NextResponse.json({ error: "Workflow not found" }, {
        status: 404,
      });
    }
    logger.error("Failed to update workflow:", updateError);
    return NextResponse.json(
      { error: "Failed to update workflow" },
      { status: 500 },
    );
  }

  return NextResponse.json({ workflow });
}

/**
 * DELETE /api/workspaces/[workspaceId]/workflows/[workflowId]
 *
 * Delete a workflow and all its versions/runs.
 * Requires admin or owner role.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const { workspaceId, workflowId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin permission for delete
  const hasAccess = await hasWorkspacePermission(
    session.user.id,
    workspaceId,
    "workspace:settings:write",
  );

  if (!hasAccess) {
    return NextResponse.json(
      { error: "You don't have permission to delete workflows" },
      { status: 403 },
    );
  }

  // Delete workflow
  const { error: deleteError } = await tryCatch(
    deleteWorkflow(workflowId, workspaceId),
  );

  if (deleteError) {
    if (deleteError.message === "Workflow not found") {
      return NextResponse.json({ error: "Workflow not found" }, {
        status: 404,
      });
    }
    logger.error("Failed to delete workflow:", deleteError);
    return NextResponse.json(
      { error: "Failed to delete workflow" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
