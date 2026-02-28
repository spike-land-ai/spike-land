import { authenticateMcpOrSession } from "@/lib/mcp/auth";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { WorkspaceCreditManager } from "@/lib/credits/workspace-credit-manager";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// Force dynamic rendering - skip static page data collection
export const dynamic = "force-dynamic";

/**
 * GET /api/mcp/balance
 *
 * Get the current AI credit balance for the authenticated user
 *
 * Headers:
 *   Authorization: Bearer <api_key>
 *
 * Response:
 *   {
 *     remaining: number,
 *     limit: number,
 *     used: number,
 *     tier: string,
 *     workspaceId: string
 *   }
 */
export async function GET(request: NextRequest) {
  // Authenticate via API key or session
  const authResult = await authenticateMcpOrSession(request);
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: 401 },
    );
  }

  const { userId } = authResult;

  // Rate limiting
  const rateLimitResult = await checkRateLimit(
    `mcp:balance:${userId}`,
    rateLimitConfigs.mcpJobStatus, // Use job status limit (60/min) for balance checks
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

  const { data: balanceInfo, error } = await tryCatch(
    WorkspaceCreditManager.getBalance(userId!),
  );

  if (error || !balanceInfo) {
    logger.error("Failed to get balance:", error);
    return NextResponse.json(
      { error: "Failed to get credit balance" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    remaining: balanceInfo.remaining,
    limit: balanceInfo.limit,
    used: balanceInfo.used,
    tier: balanceInfo.tier,
    workspaceId: balanceInfo.workspaceId,
  });
}
