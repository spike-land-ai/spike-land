/**
 * OAuth Authorization Server Metadata (RFC 8414)
 *
 * Returns metadata about the OAuth authorization server endpoints.
 * MCP clients use this to discover authorization, token, and registration endpoints.
 */

import { getMcpBaseUrl } from "@/lib/mcp/get-base-url";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const baseUrl = getMcpBaseUrl();

  return NextResponse.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/mcp/oauth/authorize`,
    token_endpoint: `${baseUrl}/api/mcp/oauth/token`,
    registration_endpoint: `${baseUrl}/api/mcp/oauth/register`,
    device_authorization_endpoint: `${baseUrl}/api/mcp/oauth/device`,
    response_types_supported: ["code"],
    grant_types_supported: [
      "authorization_code",
      "refresh_token",
      "urn:ietf:params:oauth:grant-type:device_code",
    ],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_post"],
    scopes_supported: ["mcp"],
    service_documentation: `${baseUrl}/mcp`,
  });
}
