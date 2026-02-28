/**
 * Jules Status Polling API
 *
 * GET: Poll Jules session status for a specific plan.
 */

import { auth } from "@/lib/auth";
import { verifyAdminAccess } from "@/lib/auth/admin-middleware";
import { getSession, isJulesAvailable } from "@/lib/jules/client";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { TicketPlanStatus } from "@/generated/prisma";

export async function GET(request: NextRequest) {
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

  const planId = request.nextUrl.searchParams.get("planId");
  if (!planId) {
    return NextResponse.json({ error: "planId is required" }, { status: 400 });
  }

  // Load plan
  const { data: plan, error: findError } = await tryCatch(
    prisma.ticketPlan.findFirst({
      where: {
        id: planId,
        userId: session.user.id,
        julesSessionId: { not: null },
      },
    }),
  );

  if (findError || !plan || !plan.julesSessionId) {
    return NextResponse.json(
      { error: "Plan not found or no Jules session" },
      { status: 404 },
    );
  }

  if (!isJulesAvailable()) {
    return NextResponse.json({ error: "Jules API not configured" }, {
      status: 503,
    });
  }

  // Fetch Jules session status
  const { data: julesSession, error: julesError } = await getSession(
    plan.julesSessionId,
    { includeActivities: true },
  );

  if (julesError || !julesSession) {
    return NextResponse.json({
      plan: {
        id: plan.id,
        status: plan.status,
        julesLastState: plan.julesLastState,
        julesLastChecked: plan.julesLastChecked?.toISOString(),
      },
      error: julesError || "Failed to fetch Jules status",
    });
  }

  // Map Jules state to our status
  const stateMap: Record<string, TicketPlanStatus> = {
    QUEUED: "SENT_TO_JULES",
    PLANNING: "SENT_TO_JULES",
    AWAITING_PLAN_APPROVAL: "JULES_REVIEW",
    IN_PROGRESS: "JULES_WORKING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
  };

  const newStatus = stateMap[julesSession.state] || plan.status;

  // Update local status
  if (newStatus !== plan.status || julesSession.state !== plan.julesLastState) {
    await tryCatch(
      prisma.ticketPlan.update({
        where: { id: plan.id },
        data: {
          status: newStatus,
          julesLastState: julesSession.state,
          julesLastChecked: new Date(),
          julesSessionUrl: julesSession.url ?? plan.julesSessionUrl,
        },
      }),
    );
  }

  return NextResponse.json({
    plan: {
      id: plan.id,
      status: newStatus,
      julesSessionId: plan.julesSessionId,
      julesSessionUrl: julesSession.url ?? plan.julesSessionUrl,
      julesLastState: julesSession.state,
      julesLastChecked: new Date().toISOString(),
    },
    jules: {
      state: julesSession.state,
      title: julesSession.title,
      url: julesSession.url,
      planSummary: julesSession.planSummary,
      activities: julesSession.activities || [],
    },
  });
}
