/**
 * GET /api/agent/capabilities
 *
 * Agent checks own capability token status.
 * Requires Bearer token authentication with a cap_ token.
 */

import { logger } from "@/lib/logger";
import { authenticateMcpRequest } from "@/lib/mcp/auth";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateMcpRequest(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { error: authResult.error ?? "Authentication required" },
        { status: 401 },
      );
    }

    // If no capability token, this is a regular user session
    if (!authResult.capabilityTokenId) {
      return NextResponse.json({
        mode: "full_access",
        message: "No capability token. Operating with full user permissions.",
      });
    }

    const prisma = (await import("@/lib/prisma")).default;

    const token = await prisma.agentCapabilityToken.findUnique({
      where: { id: authResult.capabilityTokenId },
      select: {
        id: true,
        allowedTools: true,
        allowedCategories: true,
        deniedTools: true,
        workspaceIds: true,
        maxTokenBudget: true,
        usedTokenBudget: true,
        maxApiCalls: true,
        usedApiCalls: true,
        delegationDepth: true,
        maxDelegationDepth: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        agent: {
          select: { id: true, displayName: true },
        },
      },
    });

    if (!token) {
      return NextResponse.json(
        { error: "Capability token not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      mode: "capability_restricted",
      token: {
        id: token.id,
        status: token.status,
        agent: token.agent,
        allowedTools: token.allowedTools,
        allowedCategories: token.allowedCategories,
        deniedTools: token.deniedTools,
        workspaceIds: token.workspaceIds,
        budget: {
          apiCalls: {
            used: token.usedApiCalls,
            max: token.maxApiCalls,
            remaining: token.maxApiCalls - token.usedApiCalls,
          },
          tokens: {
            used: token.usedTokenBudget,
            max: token.maxTokenBudget,
            remaining: token.maxTokenBudget - token.usedTokenBudget,
          },
        },
        delegation: {
          depth: token.delegationDepth,
          maxDepth: token.maxDelegationDepth,
        },
        expiresAt: token.expiresAt,
        createdAt: token.createdAt,
      },
    });
  } catch (error) {
    logger.error("[agent/capabilities] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
