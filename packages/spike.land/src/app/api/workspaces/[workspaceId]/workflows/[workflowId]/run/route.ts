/**
 * Workflow Manual Run API
 *
 * POST /api/workspaces/[workspaceId]/workflows/[workflowId]/run - Manually trigger workflow
 */

import { auth } from "@/lib/auth";
import { requireWorkspaceMembership } from "@/lib/permissions/workspace-middleware";
import { tryCatch } from "@/lib/try-catch";
import { triggerWorkflowManually } from "@/lib/workflows/workflow-executor";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ workspaceId: string; workflowId: string; }>;
}

const runWorkflowSchema = z.object({
  params: z.record(z.string(), z.unknown()).optional(),
});

/**
 * POST /api/workspaces/[workspaceId]/workflows/[workflowId]/run
 *
 * Manually trigger a workflow execution.
 *
 * Body:
 * - params: Optional parameters to pass to the workflow
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

  // Parse body (optional)
  let runParams: Record<string, unknown> | undefined;

  const contentType = request.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    const { data: body, error: parseError } = await tryCatch(request.json());

    if (!parseError && body) {
      const validation = runWorkflowSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error.issues[0]?.message || "Invalid input" },
          { status: 400 },
        );
      }

      runParams = validation.data.params;
    }
  }

  // Trigger the workflow
  const { data: result, error: execError } = await tryCatch(
    triggerWorkflowManually(workflowId, workspaceId, runParams),
  );

  if (execError) {
    if (execError.message === "Workflow not found") {
      return NextResponse.json({ error: "Workflow not found" }, {
        status: 404,
      });
    }
    if (execError.message === "Workflow is not active") {
      return NextResponse.json(
        { error: "Workflow must be active to run. Publish a version first." },
        { status: 400 },
      );
    }
    logger.error("Workflow execution failed:", execError);
    return NextResponse.json(
      { error: "Workflow execution failed", message: execError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    run: {
      id: result.runId,
      status: result.status,
      startedAt: result.startedAt,
      endedAt: result.endedAt,
      stepResults: result.stepResults,
      error: result.error,
    },
  });
}
