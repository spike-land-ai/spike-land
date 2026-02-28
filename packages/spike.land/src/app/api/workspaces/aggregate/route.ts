import logger from "@/lib/logger";

/**
 * Aggregate Dashboard API
 *
 * GET /api/workspaces/aggregate - Get aggregated KPIs across all workspaces
 * POST /api/workspaces/aggregate - Get aggregated KPIs with filters
 */

import { auth } from "@/lib/auth";
import { tryCatch } from "@/lib/try-catch";
import {
  getAggregateKPIs,
  getUserWorkspaceIds,
  getWorkspaceSummaries,
} from "@/lib/workspace/aggregate-queries";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for aggregate request
const aggregateRequestSchema = z.object({
  workspaceIds: z.array(z.string()).optional(),
  dateRange: z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  }).optional(),
  includeSummaries: z.boolean().optional().default(true),
});

/**
 * GET /api/workspaces/aggregate
 *
 * Get aggregated KPIs across all user's workspaces.
 * Uses default date range (last 30 days) if not specified.
 */
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  const includeSummaries = searchParams.get("includeSummaries") !== "false";

  // Build date range (default to last 30 days)
  const endDate = endDateParam ? new Date(endDateParam) : new Date();
  const startDate = startDateParam
    ? new Date(startDateParam)
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  const dateRange = { startDate, endDate };

  // Get user's workspace IDs
  const { data: workspaceIds, error: wsError } = await tryCatch(
    getUserWorkspaceIds(session.user.id),
  );

  if (wsError) {
    logger.error("Failed to get user workspaces:", wsError);
    return NextResponse.json(
      { error: "Failed to get workspaces" },
      { status: 500 },
    );
  }

  // Fetch KPIs and optionally summaries in parallel
  const [kpisResult, summariesResult] = await Promise.all([
    tryCatch(getAggregateKPIs(workspaceIds, dateRange)),
    includeSummaries
      ? tryCatch(getWorkspaceSummaries(workspaceIds, dateRange))
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (kpisResult.error) {
    logger.error("Failed to get aggregate KPIs:", kpisResult.error);
    return NextResponse.json(
      { error: "Failed to aggregate KPIs" },
      { status: 500 },
    );
  }

  if (summariesResult.error) {
    logger.error("Failed to get workspace summaries:", summariesResult.error);
    return NextResponse.json(
      { error: "Failed to get workspace summaries" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    kpis: kpisResult.data,
    workspaceSummaries: summariesResult.data,
    dateRange,
  });
}

/**
 * POST /api/workspaces/aggregate
 *
 * Get aggregated KPIs with custom filters.
 * Allows specifying specific workspaces and date ranges.
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse and validate request body
  const { data: body, error: parseError } = await tryCatch(request.json());

  if (parseError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validation = aggregateRequestSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0]?.message || "Invalid input" },
      { status: 400 },
    );
  }

  const { workspaceIds: requestedIds, dateRange, includeSummaries } = validation.data;

  // Get user's accessible workspace IDs
  const { data: userWorkspaceIds, error: wsError } = await tryCatch(
    getUserWorkspaceIds(session.user.id),
  );

  if (wsError) {
    logger.error("Failed to get user workspaces:", wsError);
    return NextResponse.json(
      { error: "Failed to get workspaces" },
      { status: 500 },
    );
  }

  // Filter requested IDs to only include accessible workspaces
  const accessibleIds = new Set(userWorkspaceIds);
  const filteredIds = requestedIds
    ? requestedIds.filter(id => accessibleIds.has(id))
    : userWorkspaceIds;

  // Default date range to last 30 days if not specified
  const effectiveDateRange = dateRange || {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  };

  // Fetch KPIs and optionally summaries in parallel
  const [kpisResult, summariesResult] = await Promise.all([
    tryCatch(getAggregateKPIs(filteredIds, effectiveDateRange)),
    includeSummaries
      ? tryCatch(getWorkspaceSummaries(filteredIds, effectiveDateRange))
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (kpisResult.error) {
    logger.error("Failed to get aggregate KPIs:", kpisResult.error);
    return NextResponse.json(
      { error: "Failed to aggregate KPIs" },
      { status: 500 },
    );
  }

  if (summariesResult.error) {
    logger.error("Failed to get workspace summaries:", summariesResult.error);
    return NextResponse.json(
      { error: "Failed to get workspace summaries" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    kpis: kpisResult.data,
    workspaceSummaries: summariesResult.data,
    dateRange: effectiveDateRange,
    filteredWorkspaceCount: filteredIds.length,
    totalAccessibleWorkspaces: userWorkspaceIds.length,
  });
}
