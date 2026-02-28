/**
 * Approve Plan API
 *
 * POST: Approve a ticket plan, transitioning it to APPROVED status.
 */

import { auth } from "@/lib/auth";
import { verifyAdminAccess } from "@/lib/auth/admin-middleware";
import prisma from "@/lib/prisma";
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

  const { planId } = await params;

  // Verify ownership and status
  const { data: plan, error: findError } = await tryCatch(
    prisma.ticketPlan.findFirst({
      where: {
        id: planId,
        userId: session.user.id,
        status: { in: ["PLANNING", "PLAN_READY"] },
      },
    }),
  );

  if (findError || !plan) {
    return NextResponse.json(
      { error: "Plan not found or not in approvable state" },
      { status: 404 },
    );
  }

  if (!plan.planContent) {
    return NextResponse.json(
      { error: "Cannot approve a plan with no content" },
      { status: 400 },
    );
  }

  const { data: updated, error: updateError } = await tryCatch(
    prisma.ticketPlan.update({
      where: { id: planId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
      },
    }),
  );

  if (updateError) {
    return NextResponse.json({ error: "Failed to approve plan" }, {
      status: 500,
    });
  }

  return NextResponse.json({ plan: updated });
}
