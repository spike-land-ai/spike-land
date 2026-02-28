/**
 * Send to Jules API
 *
 * POST: Hand off an approved plan to Jules for async implementation.
 */

import { auth } from "@/lib/auth";
import { verifyAdminAccess } from "@/lib/auth/admin-middleware";
import { createSession, isJulesAvailable } from "@/lib/jules/client";
import prisma from "@/lib/prisma";
import logger from "@/lib/logger";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ planId: string; }>; },
) {
  const { data: session, error: authError } = await tryCatch(auth());
  if (authError || !session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, {
      status: 401,
    });
  }

  const isAdmin = await verifyAdminAccess(session);
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, {
      status: 403,
    });
  }

  if (!isJulesAvailable()) {
    return NextResponse.json({ error: "Jules API not configured" }, {
      status: 503,
    });
  }

  const { planId } = await params;

  // Verify ownership and status
  const { data: plan, error: findError } = await tryCatch(
    prisma.ticketPlan.findFirst({
      where: {
        id: planId,
        userId: session.user.id,
        status: "APPROVED",
      },
    }),
  );

  if (findError || !plan) {
    return NextResponse.json(
      { error: "Plan not found or not in approved state" },
      { status: 404 },
    );
  }

  // Create Jules session with the plan content
  const task = `## Ticket: ${plan.githubIssueTitle}

### Issue Description
${plan.githubIssueBody || "No description provided."}

### Implementation Plan
${plan.planContent}

### Instructions
- Follow the implementation plan above precisely
- Create a PR when done
- Reference issue #${plan.githubIssueNumber} in the PR`;

  const { data: julesSession, error: julesError } = await createSession({
    title: `#${plan.githubIssueNumber}: ${plan.githubIssueTitle}`,
    task,
  });

  if (julesError || !julesSession) {
    logger.error("[dashboard] Jules session creation failed:", {
      error: julesError,
    });
    return NextResponse.json(
      { error: julesError || "Failed to create Jules session" },
      { status: 502 },
    );
  }

  // Update plan with Jules session info
  const { data: updated, error: updateError } = await tryCatch(
    prisma.ticketPlan.update({
      where: { id: planId },
      data: {
        status: "SENT_TO_JULES",
        julesSessionId: julesSession.name,
        julesSessionUrl: julesSession.url ?? null,
        julesLastState: julesSession.state,
        julesLastChecked: new Date(),
      },
    }),
  );

  if (updateError) {
    logger.error("[dashboard] Failed to update plan after Jules handoff:", {
      error: updateError,
    });
  }

  return NextResponse.json({
    plan: updated,
    julesSession: {
      name: julesSession.name,
      state: julesSession.state,
      url: julesSession.url,
    },
  });
}
