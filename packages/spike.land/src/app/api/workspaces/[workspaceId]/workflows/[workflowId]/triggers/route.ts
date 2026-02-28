import logger from "@/lib/logger";

/**
 * Workflow Triggers API
 *
 * GET /api/workspaces/[workspaceId]/workflows/[workflowId]/triggers - Get all triggers
 * POST /api/workspaces/[workspaceId]/workflows/[workflowId]/triggers - Create a trigger
 * DELETE /api/workspaces/[workspaceId]/workflows/[workflowId]/triggers?type=...&id=... - Delete a trigger
 */

import { auth } from "@/lib/auth";
import { requireWorkspaceMembership } from "@/lib/permissions/workspace-middleware";
import { tryCatch } from "@/lib/try-catch";
import {
  createEventSubscription,
  createScheduleTrigger,
  createWebhookTrigger,
  deleteEventSubscription,
  deleteScheduleTrigger,
  deleteWebhookTrigger,
  getWorkflowEventSubscriptions,
  getWorkflowSchedules,
  getWorkflowWebhooks,
  updateEventSubscription,
  updateScheduleTrigger,
  updateWebhookTrigger,
} from "@/lib/workflows/triggers";
import type { WorkflowEventType } from "@prisma/client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ workspaceId: string; workflowId: string; }>;
}

// Validation schemas
const createScheduleSchema = z.object({
  type: z.literal("schedule"),
  cronExpression: z.string().min(1, "Cron expression is required"),
  timezone: z.string().optional(),
});

const createWebhookSchema = z.object({
  type: z.literal("webhook"),
  secret: z.string().optional(),
});

const createEventSchema = z.object({
  type: z.literal("event"),
  eventType: z.enum([
    "MENTION_RECEIVED",
    "ENGAGEMENT_THRESHOLD",
    "FOLLOWER_MILESTONE",
    "CRISIS_DETECTED",
    "POST_PUBLISHED",
    "INBOX_ITEM_RECEIVED",
  ]),
  filterConfig: z.record(z.string(), z.unknown()).optional(),
});

const createTriggerSchema = z.discriminatedUnion("type", [
  createScheduleSchema,
  createWebhookSchema,
  createEventSchema,
]);

const updateScheduleSchema = z.object({
  cronExpression: z.string().optional(),
  timezone: z.string().optional(),
  isActive: z.boolean().optional(),
});

const updateWebhookSchema = z.object({
  secret: z.string().optional(),
  regenerateToken: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const updateEventSchema = z.object({
  filterConfig: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/workspaces/[workspaceId]/workflows/[workflowId]/triggers
 *
 * Get all triggers for a workflow.
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

  // Fetch all triggers
  const [schedulesResult, webhooksResult, subscriptionsResult] = await Promise
    .all([
      tryCatch(getWorkflowSchedules(workflowId, workspaceId)),
      tryCatch(getWorkflowWebhooks(workflowId, workspaceId)),
      tryCatch(getWorkflowEventSubscriptions(workflowId, workspaceId)),
    ]);

  // Check for workflow not found errors
  if (schedulesResult.error?.message === "Workflow not found") {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }

  if (
    schedulesResult.error || webhooksResult.error || subscriptionsResult.error
  ) {
    logger.error("Failed to fetch triggers:", {
      schedules: schedulesResult.error,
      webhooks: webhooksResult.error,
      subscriptions: subscriptionsResult.error,
    });
    return NextResponse.json(
      { error: "Failed to fetch triggers" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    triggers: {
      schedules: schedulesResult.data ?? [],
      webhooks: webhooksResult.data ?? [],
      eventSubscriptions: subscriptionsResult.data ?? [],
    },
  });
}

/**
 * POST /api/workspaces/[workspaceId]/workflows/[workflowId]/triggers
 *
 * Create a new trigger for a workflow.
 *
 * Body:
 * - type: "schedule" | "webhook" | "event"
 * - For schedule: cronExpression, timezone (optional)
 * - For webhook: secret (optional)
 * - For event: eventType, filterConfig (optional)
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

  // Parse body
  const { data: body, error: parseError } = await tryCatch(request.json());

  if (parseError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validation = createTriggerSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0]?.message || "Invalid input" },
      { status: 400 },
    );
  }

  const input = validation.data;

  // Create the appropriate trigger type
  switch (input.type) {
    case "schedule": {
      const { data: schedule, error } = await tryCatch(
        createScheduleTrigger(workflowId, workspaceId, {
          cronExpression: input.cronExpression,
          timezone: input.timezone,
        }),
      );

      if (error) {
        if (error.message === "Workflow not found") {
          return NextResponse.json({ error: "Workflow not found" }, {
            status: 404,
          });
        }
        if (error.message.includes("Invalid cron")) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        logger.error("Failed to create schedule:", error);
        return NextResponse.json(
          { error: "Failed to create schedule trigger" },
          { status: 500 },
        );
      }

      return NextResponse.json({ trigger: schedule }, { status: 201 });
    }

    case "webhook": {
      const { data: webhook, error } = await tryCatch(
        createWebhookTrigger(workflowId, workspaceId, {
          secret: input.secret,
        }),
      );

      if (error) {
        if (error.message === "Workflow not found") {
          return NextResponse.json({ error: "Workflow not found" }, {
            status: 404,
          });
        }
        logger.error("Failed to create webhook:", error);
        return NextResponse.json(
          { error: "Failed to create webhook trigger" },
          { status: 500 },
        );
      }

      return NextResponse.json({ trigger: webhook }, { status: 201 });
    }

    case "event": {
      const { data: subscription, error } = await tryCatch(
        createEventSubscription(workflowId, workspaceId, {
          eventType: input.eventType as WorkflowEventType,
          filterConfig: input.filterConfig,
        }),
      );

      if (error) {
        if (error.message === "Workflow not found") {
          return NextResponse.json({ error: "Workflow not found" }, {
            status: 404,
          });
        }
        if (error.message.includes("already exists")) {
          return NextResponse.json({ error: error.message }, { status: 409 });
        }
        logger.error("Failed to create event subscription:", error);
        return NextResponse.json(
          { error: "Failed to create event subscription" },
          { status: 500 },
        );
      }

      return NextResponse.json({ trigger: subscription }, { status: 201 });
    }
  }
}

/**
 * PATCH /api/workspaces/[workspaceId]/workflows/[workflowId]/triggers
 *
 * Update a trigger.
 *
 * Query params:
 * - type: "schedule" | "webhook" | "event"
 * - id: The trigger ID
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

  const triggerType = request.nextUrl.searchParams.get("type");
  const triggerId = request.nextUrl.searchParams.get("id");

  if (!triggerType || !triggerId) {
    return NextResponse.json(
      { error: "Missing type or id query parameter" },
      { status: 400 },
    );
  }

  // Parse body
  const { data: body, error: parseError } = await tryCatch(request.json());

  if (parseError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  switch (triggerType) {
    case "schedule": {
      const validation = updateScheduleSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error.issues[0]?.message || "Invalid input" },
          { status: 400 },
        );
      }

      const { data: schedule, error } = await tryCatch(
        updateScheduleTrigger(
          triggerId,
          workflowId,
          workspaceId,
          validation.data,
        ),
      );

      if (error) {
        if (
          error.message === "Workflow not found"
          || error.message === "Schedule not found"
        ) {
          return NextResponse.json({ error: error.message }, { status: 404 });
        }
        logger.error("Failed to update schedule:", error);
        return NextResponse.json({ error: "Failed to update schedule" }, {
          status: 500,
        });
      }

      return NextResponse.json({ trigger: schedule });
    }

    case "webhook": {
      const validation = updateWebhookSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error.issues[0]?.message || "Invalid input" },
          { status: 400 },
        );
      }

      const { data: webhook, error } = await tryCatch(
        updateWebhookTrigger(
          triggerId,
          workflowId,
          workspaceId,
          validation.data,
        ),
      );

      if (error) {
        if (
          error.message === "Workflow not found"
          || error.message === "Webhook not found"
        ) {
          return NextResponse.json({ error: error.message }, { status: 404 });
        }
        logger.error("Failed to update webhook:", error);
        return NextResponse.json({ error: "Failed to update webhook" }, {
          status: 500,
        });
      }

      return NextResponse.json({ trigger: webhook });
    }

    case "event": {
      const validation = updateEventSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error.issues[0]?.message || "Invalid input" },
          { status: 400 },
        );
      }

      const { data: subscription, error } = await tryCatch(
        updateEventSubscription(
          triggerId,
          workflowId,
          workspaceId,
          validation.data,
        ),
      );

      if (error) {
        if (
          error.message === "Workflow not found"
          || error.message === "Subscription not found"
        ) {
          return NextResponse.json({ error: error.message }, { status: 404 });
        }
        logger.error("Failed to update event subscription:", error);
        return NextResponse.json({ error: "Failed to update subscription" }, {
          status: 500,
        });
      }

      return NextResponse.json({ trigger: subscription });
    }

    default:
      return NextResponse.json({ error: "Invalid trigger type" }, {
        status: 400,
      });
  }
}

/**
 * DELETE /api/workspaces/[workspaceId]/workflows/[workflowId]/triggers
 *
 * Delete a trigger.
 *
 * Query params:
 * - type: "schedule" | "webhook" | "event"
 * - id: The trigger ID
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

  const triggerType = request.nextUrl.searchParams.get("type");
  const triggerId = request.nextUrl.searchParams.get("id");

  if (!triggerType || !triggerId) {
    return NextResponse.json(
      { error: "Missing type or id query parameter" },
      { status: 400 },
    );
  }

  let deleteError: Error | null = null;

  switch (triggerType) {
    case "schedule":
      ({ error: deleteError } = await tryCatch(
        deleteScheduleTrigger(triggerId, workflowId, workspaceId),
      ));
      break;

    case "webhook":
      ({ error: deleteError } = await tryCatch(
        deleteWebhookTrigger(triggerId, workflowId, workspaceId),
      ));
      break;

    case "event":
      ({ error: deleteError } = await tryCatch(
        deleteEventSubscription(triggerId, workflowId, workspaceId),
      ));
      break;

    default:
      return NextResponse.json({ error: "Invalid trigger type" }, {
        status: 400,
      });
  }

  if (deleteError) {
    if (
      deleteError.message === "Workflow not found"
      || deleteError.message === "Schedule not found"
      || deleteError.message === "Webhook not found"
      || deleteError.message === "Subscription not found"
    ) {
      return NextResponse.json({ error: deleteError.message }, { status: 404 });
    }
    logger.error(`Failed to delete ${triggerType}:`, deleteError);
    return NextResponse.json(
      { error: `Failed to delete ${triggerType}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
