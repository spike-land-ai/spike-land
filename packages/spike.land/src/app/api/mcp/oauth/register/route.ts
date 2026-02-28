/**
 * OAuth Dynamic Client Registration Endpoint (RFC 7591)
 *
 * Allows MCP clients to register themselves dynamically.
 * No authentication required for registration.
 */

import { registerClient } from "@/lib/mcp/oauth/clients-store";
import { getClientIp } from "@/lib/security/ip";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "invalid_client_metadata",
        error_description: "Invalid JSON body",
      },
      { status: 400 },
    );
  }

  // Extract client IP for rate limiting
  const clientIp = getClientIp(request);

  const result = await registerClient(
    {
      client_name: body.client_name as string,
      redirect_uris: body.redirect_uris as string[],
      grant_types: body.grant_types as string[] | undefined,
      token_endpoint_auth_method: body.token_endpoint_auth_method as
        | string
        | undefined,
    },
    clientIp,
  );

  if ("error" in result) {
    return NextResponse.json(
      { error: "invalid_client_metadata", error_description: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result, { status: 201 });
}
