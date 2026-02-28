/**
 * POST /api/permissions/respond
 *
 * Approve or deny a permission request.
 */

import { authenticateMcpOrSession } from "@/lib/mcp/auth";
import { createCapabilityToken } from "@/lib/agents/capability-token-service";
import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

interface RespondBody {
  requestId: string;
  action: "approve" | "deny";
  denialReason?: string;
  customTools?: string[];
  customCategories?: string[];
  customBudget?: number;
}

export async function POST(request: NextRequest) {
  const authResult = await authenticateMcpOrSession(request);
  if (!authResult.success || !authResult.userId) {
    return NextResponse.json(
      { error: authResult.error ?? "Authentication required" },
      { status: 401 },
    );
  }

  const body = (await request.json()) as RespondBody;

  if (!body.requestId || !body.action) {
    return NextResponse.json(
      { error: "requestId and action are required" },
      { status: 400 },
    );
  }

  if (body.action !== "approve" && body.action !== "deny") {
    return NextResponse.json(
      { error: "action must be 'approve' or 'deny'" },
      { status: 400 },
    );
  }

  try {
    const prisma = (await import("@/lib/prisma")).default;

    // Fetch the request and verify ownership
    const permRequest = await prisma.permissionRequest.findUnique({
      where: { id: body.requestId },
      select: {
        id: true,
        userId: true,
        agentId: true,
        status: true,
        requestType: true,
        requestPayload: true,
        templateId: true,
        template: {
          select: {
            allowedTools: true,
            allowedCategories: true,
            deniedTools: true,
            maxTokenBudget: true,
            maxApiCalls: true,
          },
        },
      },
    });

    if (!permRequest) {
      return NextResponse.json(
        { error: "Permission request not found" },
        { status: 404 },
      );
    }

    if (permRequest.userId !== authResult.userId) {
      return NextResponse.json(
        { error: "Not authorized to respond to this request" },
        { status: 403 },
      );
    }

    if (permRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: `Request already ${permRequest.status.toLowerCase()}` },
        { status: 409 },
      );
    }

    if (body.action === "deny") {
      await prisma.permissionRequest.update({
        where: { id: body.requestId },
        data: {
          status: "DENIED",
          denialReason: body.denialReason ?? "Denied by user",
        },
      });

      return NextResponse.json({ status: "denied", requestId: body.requestId });
    }

    // Approve: create a capability token for the agent
    const payload = permRequest.requestPayload as Record<string, unknown>;
    const tools = body.customTools
      ?? (payload.tools as string[] | undefined)
      ?? permRequest.template?.allowedTools
      ?? [];
    const categories = body.customCategories
      ?? (payload.categories as string[] | undefined)
      ?? permRequest.template?.allowedCategories
      ?? [];
    const budget = body.customBudget ?? permRequest.template?.maxTokenBudget
      ?? 100000;

    const { tokenId } = await createCapabilityToken({
      agentId: permRequest.agentId,
      grantedByUserId: authResult.userId,
      allowedTools: tools,
      allowedCategories: categories,
      deniedTools: permRequest.template?.deniedTools ?? [],
      maxTokenBudget: budget,
      maxApiCalls: permRequest.template?.maxApiCalls ?? 1000,
    });

    await prisma.permissionRequest.update({
      where: { id: body.requestId },
      data: {
        status: "APPROVED",
        grantedTokenId: tokenId,
      },
    });

    return NextResponse.json({
      status: "approved",
      requestId: body.requestId,
      grantedTokenId: tokenId,
    });
  } catch (error) {
    logger.error("Database error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
