/**
 * Dashboard Issues API
 *
 * GET: Returns GitHub issues enriched with local plan status.
 */

import { auth } from "@/lib/auth";
import { verifyAdminAccess } from "@/lib/auth/admin-middleware";
import { listIssues } from "@/lib/agents/github-issues";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import { NextResponse } from "next/server";

export async function GET() {
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

  const userId = session.user.id;

  // Fetch GitHub issues
  const { data: issues, error: ghError } = await listIssues({
    state: "open",
    limit: 50,
  });

  if (ghError || !issues) {
    return NextResponse.json(
      { error: ghError || "Failed to fetch issues" },
      { status: 502 },
    );
  }

  // Fetch local plans for this user
  const { data: plans } = await tryCatch(
    prisma.ticketPlan.findMany({
      where: { userId },
      select: {
        id: true,
        githubIssueNumber: true,
        status: true,
        planVersion: true,
        julesSessionId: true,
        julesLastState: true,
        updatedAt: true,
      },
    }),
  );

  const plansByIssue = new Map(
    (plans || []).map(p => [p.githubIssueNumber, p]),
  );

  // Merge issues with plan status
  const enrichedIssues = issues.map(issue => {
    const plan = plansByIssue.get(issue.number);
    return {
      ...issue,
      plan: plan
        ? {
          id: plan.id,
          status: plan.status,
          planVersion: plan.planVersion,
          julesSessionId: plan.julesSessionId,
          julesLastState: plan.julesLastState,
          updatedAt: plan.updatedAt.toISOString(),
        }
        : null,
    };
  });

  return NextResponse.json({ issues: enrichedIssues });
}
