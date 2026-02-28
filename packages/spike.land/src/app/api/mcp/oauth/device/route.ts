/**
 * Device Authorization Endpoint (RFC 8628)
 *
 * POST /api/mcp/oauth/device — Request a device code + user code
 * No auth required (public endpoint, like /oauth/register).
 */

import { getClient } from "@/lib/mcp/oauth/clients-store";
import { generateDeviceCode } from "@/lib/mcp/oauth/device-auth-service";
import { getMcpBaseUrl } from "@/lib/mcp/get-base-url";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/security/ip";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { isLimited, resetAt } = await checkRateLimit(
    `device-auth:${ip}`,
    rateLimitConfigs.deviceAuthorization,
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

  const clientId = body.client_id;

  if (!clientId) {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: "client_id is required",
      },
      { status: 400 },
    );
  }

  const client = await getClient(clientId);
  if (!client) {
    return NextResponse.json(
      { error: "invalid_client", error_description: "Unknown client" },
      { status: 400 },
    );
  }

  const baseUrl = getMcpBaseUrl();
  const result = await generateDeviceCode(clientId, baseUrl);

  return NextResponse.json(
    {
      device_code: result.deviceCode,
      user_code: result.userCode,
      verification_uri: result.verificationUri,
      verification_uri_complete: result.verificationUriComplete,
      expires_in: result.expiresIn,
      interval: result.interval,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
