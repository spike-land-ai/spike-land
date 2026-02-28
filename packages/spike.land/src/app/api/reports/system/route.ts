/**
 * System Report API
 *
 * GET /api/reports/system
 *
 * Generates a comprehensive system report aggregating data from:
 * - Internal admin APIs (database)
 * - Vercel Analytics API (external)
 * - Meta Marketing API (external)
 *
 * Authentication: Admin required (via session or API key)
 *
 * Query Parameters:
 *   period: "7d" | "30d" | "90d" (default: "30d")
 *   include: comma-separated list of sections to include
 *            (platform,users,tokens,health,marketing,errors,vercel,meta)
 *   format: "json" | "summary" (default: "json")
 */

import { requireAdminByUserId } from "@/lib/auth/admin-middleware";
import { authenticateMcpOrSession } from "@/lib/mcp/auth";
import {
  generateSystemReport,
  generateSystemReportSummary,
} from "@/lib/reports/system-report";
import type {
  PartialSystemReport,
  ReportFormat,
  ReportPeriodOption,
  ReportSection,
  SystemReport,
  SystemReportSummary,
} from "@/lib/reports/types";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";

/**
 * Valid report sections
 */
const VALID_SECTIONS: ReportSection[] = [
  "platform",
  "users",
  "tokens",
  "health",
  "marketing",
  "errors",
  "meta",
];

/**
 * Request validation schema
 */
const querySchema = z.object({
  period: z.enum(["7d", "30d", "90d"]).optional().default("30d"),
  include: z.string().optional(),
  format: z.enum(["json", "summary"]).optional().default("json"),
});

/**
 * Parse and validate sections from include parameter
 */
function parseSections(include?: string): ReportSection[] {
  if (!include) {
    return VALID_SECTIONS;
  }

  const requested = include.split(",").map(s => s.trim().toLowerCase());
  const valid = requested.filter((s): s is ReportSection =>
    VALID_SECTIONS.includes(s as ReportSection)
  );

  return valid.length > 0 ? valid : VALID_SECTIONS;
}

/**
 * GET /api/reports/system
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Authenticate request (API key or session)
  const authResult = await authenticateMcpOrSession(request);

  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error || "Authentication required" },
      { status: 401 },
    );
  }

  // Verify admin access
  const { error: adminError } = await tryCatch(
    requireAdminByUserId(authResult.userId!),
  );

  if (adminError) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  // Parse query parameters
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const { data: params, error: parseError } = await tryCatch(
    Promise.resolve(querySchema.parse(searchParams)),
  );

  if (parseError || !params) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parseError?.message },
      { status: 400 },
    );
  }

  const period = params.period as ReportPeriodOption;
  const format = params.format as ReportFormat;
  const sections = parseSections(params.include);

  // Generate report
  const { data: report, error: reportError } = await tryCatch<
    SystemReport | PartialSystemReport | SystemReportSummary
  >(
    format === "summary"
      ? generateSystemReportSummary(period)
      : generateSystemReport(period, sections),
  );

  if (reportError) {
    logger.error("Failed to generate system report:", reportError);
    return NextResponse.json(
      { error: "Failed to generate report", details: reportError.message },
      { status: 500 },
    );
  }

  // Set cache headers (5 minutes)
  const headers = new Headers();
  headers.set("Cache-Control", "private, max-age=300");
  headers.set("Content-Type", "application/json");

  return NextResponse.json(report, { headers });
}
