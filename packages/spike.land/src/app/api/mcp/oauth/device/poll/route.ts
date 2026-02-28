/**
 * Device Code Polling Endpoint (RFC 8628)
 *
 * POST /api/mcp/oauth/device/poll — Poll for device code approval status
 * No auth required (the device_code itself acts as the credential).
 */

import logger from "@/lib/logger";
import { pollDeviceCode } from "@/lib/mcp/oauth/device-auth-service";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/security/ip";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const DEVICE_CODE_GRANT_TYPE = "urn:ietf:params:oauth:grant-type:device_code";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { isLimited, resetAt } = await checkRateLimit(
    `device-poll:${ip}`,
    rateLimitConfigs.devicePoll,
  );
  if (isLimited) {
    return NextResponse.json(
      {
        error: "too_many_requests",
        error_description: "Rate limit exceeded",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  // Parse body (dual content-type support)
  let body: Record<string, string>;
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await request.text();
    body = Object.fromEntries(new URLSearchParams(text));
  } else if (contentType.includes("application/json")) {
    body = await request.json();
  } else {
    const text = await request.text();
    body = Object.fromEntries(new URLSearchParams(text));
  }

  const grantType = body.grant_type;
  const deviceCode = body.device_code;
  const clientId = body.client_id;

  if (grantType !== DEVICE_CODE_GRANT_TYPE) {
    return NextResponse.json(
      {
        error: "unsupported_grant_type",
        error_description: `grant_type must be ${DEVICE_CODE_GRANT_TYPE}`,
      },
      { status: 400 },
    );
  }

  if (!deviceCode) {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: "device_code is required",
      },
      { status: 400 },
    );
  }

  if (!clientId) {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: "client_id is required",
      },
      { status: 400 },
    );
  }

  let result;
  try {
    result = await pollDeviceCode(deviceCode, clientId);
  } catch (error) {
    logger.error("Failed to poll device code", { error });
    return NextResponse.json(
      {
        error: "server_error",
        error_description: "Internal server error",
      },
      { status: 500 },
    );
  }

  switch (result.status) {
    case "authorization_pending":
      return NextResponse.json(
        {
          error: "authorization_pending",
          error_description: "The authorization request is still pending. Continue polling.",
        },
        { status: 400 },
      );

    case "slow_down":
      return NextResponse.json(
        {
          error: "slow_down",
          error_description: `Polling too frequently. Use interval: ${result.interval}s`,
          interval: result.interval,
        },
        { status: 400 },
      );

    case "access_denied":
      return NextResponse.json(
        {
          error: "access_denied",
          error_description: "The user denied the authorization request.",
        },
        { status: 400 },
      );

    case "expired_token":
      return NextResponse.json(
        {
          error: "expired_token",
          error_description: "The device code has expired. Start a new authorization flow.",
        },
        { status: 400 },
      );

    case "approved":
      return NextResponse.json(
        {
          access_token: result.accessToken,
          token_type: result.tokenType,
          expires_in: result.expiresIn,
          refresh_token: result.refreshToken,
          scope: result.scope,
        },
        {
          headers: {
            "Cache-Control": "no-store",
            Pragma: "no-cache",
          },
        },
      );
  }
}
