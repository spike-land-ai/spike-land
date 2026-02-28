/**
 * Device Code Browser Verification API
 *
 * GET  /api/mcp/oauth/device/verify?user_code=XXXX-XXXX — Check user code validity
 * POST /api/mcp/oauth/device/verify — Approve or deny a user code
 *
 * Both require an authenticated NextAuth session.
 */

import { auth } from "@/lib/auth";
import logger from "@/lib/logger";
import {
  approveDeviceCode,
  denyDeviceCode,
  verifyUserCode,
} from "@/lib/mcp/oauth/device-auth-service";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

const verifyBodySchema = z.object({
  user_code: z.string().min(1).max(9),
  action: z.enum(["approve", "deny"]),
});

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const userCode = request.nextUrl.searchParams.get("user_code");
  if (!userCode) {
    return NextResponse.json(
      { error: "user_code query parameter is required" },
      { status: 400 },
    );
  }

  try {
    const result = await verifyUserCode(userCode);
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Failed to verify user code", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = verifyBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "user_code (string) and action ('approve' | 'deny') are required" },
      { status: 400 },
    );
  }

  const { user_code, action } = parsed.data;

  try {
    if (action === "approve") {
      const success = await approveDeviceCode(user_code, session.user.id);
      if (!success) {
        return NextResponse.json(
          { error: "Code is invalid, expired, or already used" },
          { status: 400 },
        );
      }
      return NextResponse.json({ success: true, message: "Device authorized" });
    }

    const success = await denyDeviceCode(user_code);
    if (!success) {
      return NextResponse.json(
        { error: "Code is invalid or already processed" },
        { status: 400 },
      );
    }
    return NextResponse.json({
      success: true,
      message: "Authorization denied",
    });
  } catch (error) {
    logger.error("Failed to process device verification action", { action, error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
