/**
 * Dashboard Plan CRUD API
 *
 * GET: Load a ticket plan by issue number
 * PUT: Create or update a ticket plan
 */

import { auth } from "@/lib/auth";
import { verifyAdminAccess } from "@/lib/auth/admin-middleware";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

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

  const issueNumber = request.nextUrl.searchParams.get("issueNumber");
  if (!issueNumber) {
    return NextResponse.json({ error: "issueNumber is required" }, {
      status: 400,
    });
  }

  const { data: plan, error } = await tryCatch(
    prisma.ticketPlan.findUnique({
      where: {
        userId_githubIssueNumber: {
          userId: session.user.id,
          githubIssueNumber: parseInt(issueNumber, 10),
        },
      },
      include: {
        chatMessages: {
          orderBy: { createdAt: "asc" },
          take: 100,
        },
      },
    }),
  );

  if (error) {
    return NextResponse.json({ error: "Failed to load plan" }, { status: 500 });
  }

  return NextResponse.json({ plan });
}

export async function PUT(request: NextRequest) {
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

  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    githubIssueNumber,
    githubIssueTitle,
    githubIssueUrl,
    githubIssueBody,
    planContent,
    status,
  } = body as {
    githubIssueNumber: number;
    githubIssueTitle: string;
    githubIssueUrl: string;
    githubIssueBody?: string;
    planContent?: string;
    status?: string;
  };

  if (!githubIssueNumber || !githubIssueTitle || !githubIssueUrl) {
    return NextResponse.json({ error: "Missing required fields" }, {
      status: 400,
    });
  }

  // Validate status against allowlist to prevent workflow bypass
  const ALLOWED_CREATE_STATUSES = ["UNPLANNED", "PLANNING"] as const;
  const ALLOWED_UPDATE_STATUSES = ["PLANNING", "PLAN_READY"] as const;
  type CreateStatus = (typeof ALLOWED_CREATE_STATUSES)[number];
  type UpdateStatus = (typeof ALLOWED_UPDATE_STATUSES)[number];

  const validatedCreateStatus: CreateStatus =
    status && (ALLOWED_CREATE_STATUSES as readonly string[]).includes(status)
      ? (status as CreateStatus)
      : "PLANNING";

  const validatedUpdateStatus: Record<string, string> | Record<string, never> =
    status && (ALLOWED_UPDATE_STATUSES as readonly string[]).includes(status)
      ? { status: status as UpdateStatus }
      : {};

  const userId = session.user.id;

  const { data: plan, error } = await tryCatch(
    prisma.ticketPlan.upsert({
      where: {
        userId_githubIssueNumber: {
          userId,
          githubIssueNumber,
        },
      },
      create: {
        userId,
        githubIssueNumber,
        githubIssueTitle,
        githubIssueUrl,
        githubIssueBody: githubIssueBody ?? null,
        planContent: planContent ?? null,
        status: validatedCreateStatus,
      },
      update: {
        githubIssueTitle,
        githubIssueUrl,
        githubIssueBody: githubIssueBody ?? undefined,
        planContent: planContent ?? undefined,
        ...validatedUpdateStatus,
        planVersion: { increment: planContent ? 1 : 0 },
      },
    }),
  );

  if (error) {
    return NextResponse.json({ error: "Failed to save plan" }, { status: 500 });
  }

  return NextResponse.json({ plan });
}
