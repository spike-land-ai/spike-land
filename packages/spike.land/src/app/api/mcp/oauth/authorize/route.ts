/**
 * OAuth Authorization Endpoint
 *
 * Handles the authorization code flow for MCP clients.
 * If the user is authenticated, auto-approves and redirects with code.
 * If not authenticated, redirects to sign-in first.
 */

import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { getClient } from "@/lib/mcp/oauth/clients-store";
import { generateAuthorizationCode } from "@/lib/mcp/oauth/token-service";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/security/ip";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Rate limit by IP
  const ip = getClientIp(request);
  const { isLimited } = await checkRateLimit(
    `oauth-authorize:${ip}`,
    rateLimitConfigs.oauthAuthorize,
  );
  if (isLimited) {
    return NextResponse.json(
      { error: "too_many_requests", error_description: "Rate limit exceeded" },
      { status: 429 },
    );
  }

  const { searchParams } = request.nextUrl;

  const responseType = searchParams.get("response_type");
  const clientId = searchParams.get("client_id");
  const redirectUri = searchParams.get("redirect_uri");
  const codeChallenge = searchParams.get("code_challenge");
  const codeChallengeMethod = searchParams.get("code_challenge_method");
  const state = searchParams.get("state");
  const scope = searchParams.get("scope") || "mcp";
  const resource = searchParams.get("resource");

  // Validate required params
  if (responseType !== "code") {
    return NextResponse.json(
      {
        error: "unsupported_response_type",
        error_description: "Only 'code' is supported",
      },
      { status: 400 },
    );
  }

  if (!clientId) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "client_id is required" },
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

  if (!codeChallenge) {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: "code_challenge is required (PKCE)",
      },
      { status: 400 },
    );
  }

  if (codeChallengeMethod && codeChallengeMethod !== "S256") {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: "Only S256 code_challenge_method is supported",
      },
      { status: 400 },
    );
  }

  // Verify client exists
  const client = await getClient(clientId);
  if (!client) {
    return NextResponse.json(
      { error: "invalid_client", error_description: "Unknown client_id" },
      { status: 400 },
    );
  }

  // Validate redirect URI matches registered URIs
  if (!client.redirectUris.includes(redirectUri)) {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: "redirect_uri does not match registered URIs",
      },
      { status: 400 },
    );
  }

  // Check if user is authenticated
  const session = await auth();

  if (!session?.user?.id) {
    // Redirect to sign-in with callback back to this authorize endpoint
    const callbackUrl = request.nextUrl.toString();
    const signInUrl = new URL("/auth/signin", request.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(signInUrl);
  }

  // User is authenticated — auto-approve (v1: no consent screen)
  let code: string;
  try {
    code = await generateAuthorizationCode({
      clientId,
      userId: session.user.id,
      redirectUri,
      codeChallenge,
      codeChallengeMethod: codeChallengeMethod || "S256",
      scope,
      state: state || undefined,
      resource: resource || undefined,
    });
  } catch (error) {
    logger.error("[oauth/authorize] Code generation error:", error);
    return NextResponse.json(
      { error: "server_error", error_description: "Failed to generate authorization code" },
      { status: 500 },
    );
  }

  // Redirect to client with code
  const redirectUrl = new URL(redirectUri);
  redirectUrl.searchParams.set("code", code);
  if (state) {
    redirectUrl.searchParams.set("state", state);
  }

  return NextResponse.redirect(redirectUrl);
}
