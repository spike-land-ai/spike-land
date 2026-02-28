/**
 * OAuth Token Endpoint
 *
 * Handles authorization_code and refresh_token grant types.
 * Returns access tokens for MCP API access.
 */

import { getClient, verifyClientSecret } from "@/lib/mcp/oauth/clients-store";
import {
  exchangeAuthorizationCode,
  refreshAccessToken,
} from "@/lib/mcp/oauth/token-service";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/security/ip";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Rate limit by IP
  const ip = getClientIp(request);
  const { isLimited, resetAt } = await checkRateLimit(
    `oauth-token:${ip}`,
    rateLimitConfigs.oauthToken,
  );
  if (isLimited) {
    return NextResponse.json(
      { error: "too_many_requests", error_description: "Rate limit exceeded" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
        },
      },
    );
  }
  let body: Record<string, string>;
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await request.text();
    body = Object.fromEntries(new URLSearchParams(text));
  } else if (contentType.includes("application/json")) {
    body = await request.json();
  } else {
    // Try form-urlencoded as default (per OAuth spec)
    const text = await request.text();
    body = Object.fromEntries(new URLSearchParams(text));
  }

  const grantType = body.grant_type;
  const clientId = body.client_id;

  if (!clientId) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "client_id is required" },
      { status: 400 },
    );
  }

  // Verify client exists
  const client = await getClient(clientId);
  if (!client) {
    return NextResponse.json(
      { error: "invalid_client", error_description: "Unknown client" },
      { status: 401 },
    );
  }

  // Verify client secret if required
  if (
    client.tokenEndpointAuthMethod === "client_secret_post"
    && client.clientSecretHash
  ) {
    const clientSecret = body.client_secret;
    if (
      !clientSecret
      || !verifyClientSecret(client.clientSecretHash, clientSecret)
    ) {
      return NextResponse.json(
        {
          error: "invalid_client",
          error_description: "Invalid client credentials",
        },
        { status: 401 },
      );
    }
  }

  if (grantType === "authorization_code") {
    return handleAuthorizationCode(body, clientId);
  }

  if (grantType === "refresh_token") {
    return handleRefreshToken(body, clientId);
  }

  return NextResponse.json(
    {
      error: "unsupported_grant_type",
      error_description: "Supported: authorization_code, refresh_token",
    },
    { status: 400 },
  );
}

async function handleAuthorizationCode(
  body: Record<string, string>,
  clientId: string,
) {
  const code = body.code;
  const codeVerifier = body.code_verifier;
  const redirectUri = body.redirect_uri;

  if (!code) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "code is required" },
      { status: 400 },
    );
  }

  if (!codeVerifier) {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: "code_verifier is required (PKCE)",
      },
      { status: 400 },
    );
  }

  if (!redirectUri) {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: "redirect_uri is required",
      },
      { status: 400 },
    );
  }

  const tokens = await exchangeAuthorizationCode(
    code,
    clientId,
    codeVerifier,
    redirectUri,
  );

  if (!tokens) {
    return NextResponse.json(
      {
        error: "invalid_grant",
        error_description: "Invalid, expired, or already used authorization code",
      },
      { status: 400 },
    );
  }

  // RFC 6749 Section 5.1: token responses must not be cached
  return NextResponse.json(
    {
      access_token: tokens.accessToken,
      token_type: tokens.tokenType,
      expires_in: tokens.expiresIn,
      refresh_token: tokens.refreshToken,
      scope: tokens.scope,
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "Pragma": "no-cache",
      },
    },
  );
}

async function handleRefreshToken(
  body: Record<string, string>,
  clientId: string,
) {
  const refreshToken = body.refresh_token;

  if (!refreshToken) {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: "refresh_token is required",
      },
      { status: 400 },
    );
  }

  const tokens = await refreshAccessToken(refreshToken, clientId);

  if (!tokens) {
    return NextResponse.json(
      {
        error: "invalid_grant",
        error_description: "Invalid or expired refresh token",
      },
      { status: 400 },
    );
  }

  // RFC 6749 Section 5.1: token responses must not be cached
  return NextResponse.json(
    {
      access_token: tokens.accessToken,
      token_type: tokens.tokenType,
      expires_in: tokens.expiresIn,
      refresh_token: tokens.refreshToken,
      scope: tokens.scope,
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "Pragma": "no-cache",
      },
    },
  );
}
