import { authenticateMcpOrSession } from "@/lib/mcp/auth";
import { getJobHistory } from "@/lib/mcp/generation-service";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { tryCatch } from "@/lib/try-catch";
import type { McpJobType } from "@prisma/client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// Force dynamic rendering - skip static page data collection
export const dynamic = "force-dynamic";

/**
 * GET /api/mcp/history
 *
 * Get the job history for the authenticated user
 *
 * Headers:
 *   Authorization: Bearer <api_key> (or session cookie)
 *
 * Query Parameters:
 *   limit?: number (default: 20, max: 100)
 *   offset?: number (default: 0)
 *   type?: "GENERATE" | "MODIFY" (optional filter)
 *
 * Response:
 *   {
 *     jobs: Array<{
 *       id: string,
 *       type: "GENERATE" | "MODIFY",
 *       tier: string,
 *       creditsCost: number,
 *       status: string,
 *       prompt: string,
 *       inputImageUrl?: string,
 *       outputImageUrl?: string,
 *       outputWidth?: number,
 *       outputHeight?: number,
 *       createdAt: string,
 *       processingCompletedAt?: string,
 *       apiKeyName?: string
 *     }>,
 *     total: number,
 *     hasMore: boolean
 *   }
 */
export async function GET(request: NextRequest) {
  // Authenticate via API key or session
  const authResult = await authenticateMcpOrSession(request);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const { userId } = authResult;

  // Rate limiting
  const rateLimitResult = await checkRateLimit(
    `mcp:history:${userId}`,
    rateLimitConfigs.mcpJobStatus,
  );

  if (rateLimitResult.isLimited) {
    const retryAfter = Math.ceil(
      (rateLimitResult.resetAt - Date.now()) / 1000,
    );
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        retryAfter,
      },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      },
    );
  }

  // Parse query parameters
  const searchParams = request.nextUrl.searchParams;

  let limit = parseInt(searchParams.get("limit") || "20", 10);
  if (isNaN(limit) || limit < 1) limit = 20;
  if (limit > 100) limit = 100;

  let offset = parseInt(searchParams.get("offset") || "0", 10);
  if (isNaN(offset) || offset < 0) offset = 0;

  const typeParam = searchParams.get("type");
  let type: McpJobType | undefined;
  if (typeParam === "GENERATE" || typeParam === "MODIFY") {
    type = typeParam as McpJobType;
  }

  const { data: result, error } = await tryCatch(
    getJobHistory(userId!, {
      limit,
      offset,
      type,
    }),
  );

  if (error) {
    logger.error("Failed to fetch job history:", error);
    return NextResponse.json(
      { error: "Failed to fetch job history" },
      { status: 500 },
    );
  }

  return NextResponse.json(result);
}
