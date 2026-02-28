/**
 * OAuth Protected Resource Metadata (RFC 9728)
 *
 * Tells MCP clients where to find the authorization server for this resource.
 */

import { getMcpBaseUrl } from "@/lib/mcp/get-base-url";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const baseUrl = getMcpBaseUrl();

  return NextResponse.json({
    resource: `${baseUrl}/api/mcp`,
    authorization_servers: [baseUrl],
    scopes_supported: ["mcp"],
    bearer_methods_supported: ["header"],
  });
}
