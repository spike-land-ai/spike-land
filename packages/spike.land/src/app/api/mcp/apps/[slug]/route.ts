/**
 * Per-App MCP Endpoint
 *
 * POST /api/mcp/apps/[slug] — MCP JSON-RPC for a specific store app
 *
 * Each store app IS its own MCP server. This dynamic route creates a
 * scoped MCP server that only exposes the app's declared tools.
 *
 * Example: POST /api/mcp/apps/chess-arena → only chess tools (21)
 *          POST /api/mcp/apps/cleansweep  → only clean-* tools (14)
 */

import { authenticateMcpRequest } from "@/lib/mcp/auth";
import { getMcpBaseUrl } from "@/lib/mcp/get-base-url";
import { createAppMcpServer } from "@/lib/mcp/server/app-mcp-server";
import { getAppBySlug } from "@/app/store/data/store-apps";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function unauthorizedResponse(): NextResponse {
  const baseUrl = getMcpBaseUrl();
  return NextResponse.json(
    {
      error: "Unauthorized",
      message: "Bearer token required. Use an API key or OAuth 2.1.",
      help: {
        api_key: `${baseUrl}/settings?tab=api-keys`,
        oauth_discovery: `${baseUrl}/.well-known/oauth-authorization-server`,
        device_authorization: `${baseUrl}/api/mcp/oauth/device`,
        documentation: `${baseUrl}/mcp`,
      },
    },
    {
      status: 401,
      headers: {
        "WWW-Authenticate":
          `Bearer resource_metadata="${baseUrl}/.well-known/oauth-protected-resource/mcp"`,
      },
    },
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; }>; },
) {
  const { slug } = await params;

  // Validate app exists
  const app = getAppBySlug(slug);
  if (!app) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: { code: -32600, message: `App not found: ${slug}` },
        id: null,
      },
      { status: 404 },
    );
  }

  // Check for authentication
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return unauthorizedResponse();
  }

  const authResult = await authenticateMcpRequest(request);
  if (!authResult.success || !authResult.userId) {
    return unauthorizedResponse();
  }

  // Rate limit by userId + app slug
  const { isLimited, resetAt } = await checkRateLimit(
    `mcp-app:${slug}:${authResult.userId}`,
    rateLimitConfigs.mcpJsonRpc,
  );
  if (isLimited) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: { code: -32000, message: "Rate limit exceeded" },
        id: null,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  // Parse the JSON-RPC request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: { code: -32700, message: "Parse error" },
        id: null,
      },
      { status: 400 },
    );
  }

  // Create app-scoped MCP server
  const mcpServer = createAppMcpServer(slug, authResult.userId);

  // Determine response format from client Accept header
  const acceptsSSE = request.headers.get("Accept")?.includes("text/event-stream") ?? false;

  // Ensure Accept header satisfies MCP spec
  const headers = new Headers(request.headers);
  const accept = headers.get("Accept") ?? "";
  if (
    !accept.includes("application/json")
    || !accept.includes("text/event-stream")
  ) {
    headers.set("Accept", "application/json, text/event-stream");
  }

  const mcpRequest = new Request(request.url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: !acceptsSSE,
  });

  await mcpServer.connect(transport);

  try {
    const response = await transport.handleRequest(mcpRequest, {
      parsedBody: body,
    });

    return new NextResponse(response.body, {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    });
  } catch (error) {
    logger.error(`MCP app request error (${slug}):`, error);
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal error" },
        id: null,
      },
      { status: 500 },
    );
  } finally {
    await mcpServer.close();
  }
}

export async function GET() {
  return NextResponse.json(
    {
      error: "Use POST for MCP JSON-RPC requests.",
      hint: "Send POST requests with Accept: text/event-stream for streaming responses.",
    },
    { status: 405 },
  );
}

export async function DELETE() {
  return NextResponse.json({ ok: true });
}
