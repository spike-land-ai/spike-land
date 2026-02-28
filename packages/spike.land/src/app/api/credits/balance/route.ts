import { auth } from "@/lib/auth";
import { WorkspaceCreditManager } from "@/lib/credits/workspace-credit-manager";
import { NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";

/**
 * GET /api/credits/balance
 *
 * Returns the current user's workspace AI credit balance.
 *
 * Response:
 * {
 *   remaining: number,  // Credits available
 *   limit: number,      // Monthly limit
 *   used: number,       // Credits used this month
 *   tier: string,       // Subscription tier
 *   workspaceId: string // Active workspace ID
 * }
 */
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const balance = await WorkspaceCreditManager.getBalance(session.user.id);

  if (!balance) {
    return NextResponse.json(
      { error: "Unable to retrieve credit balance" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    remaining: balance.remaining,
    limit: balance.limit,
    used: balance.used,
    tier: balance.tier,
    workspaceId: balance.workspaceId,
  });
}
