/**
 * Streamable HTTP MCP Endpoint
 *
 * POST /api/mcp — Handle MCP JSON-RPC requests (JSON or SSE based on Accept header)
 * GET  /api/mcp — Returns 405 (stateless mode, no server-initiated notifications)
 * DELETE /api/mcp — Session termination
 *
 * Stateless mode (sessionIdGenerator: undefined) for Vercel serverless compatibility.
 * Response format determined by client Accept header:
 *   - Accept: text/event-stream → SSE streaming response
 *   - Otherwise → JSON response (default, backward compatible)
 *
 * Authentication: Bearer token (OAuth mcp_ token or API key)
 * If no token provided, returns 401 with WWW-Authenticate header for OAuth discovery.
 */

import { authenticateMcpRequest } from "@/lib/mcp/auth";
import { loadEnabledCategories } from "@/lib/mcp/server/category-persistence";
import { getMcpBaseUrl } from "@/lib/mcp/get-base-url";
import { createMcpServer } from "@/lib/mcp/server/mcp-server";
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

export async function POST(request: NextRequest) {
  // Check for authentication
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return unauthorizedResponse();
  }

  const authResult = await authenticateMcpRequest(request);
  if (!authResult.success || !authResult.userId) {
    logger.error("[MCP_API] authenticateMcpRequest failed", undefined, {
      authResult,
      authHeader: authHeader?.substring(0, 20) + "...",
    });
    return unauthorizedResponse();
  }

  // Rate limit by userId
  const { isLimited, resetAt } = await checkRateLimit(
    `mcp-rpc:${authResult.userId}`,
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

  // Load persisted tool categories from Redis (survives across stateless requests)
  const enabledCategories = await loadEnabledCategories(authResult.userId);

  // Create MCP server for this user with restored category state
  const mcpServer = createMcpServer(authResult.userId, { enabledCategories });

  // Ensure Accept header satisfies MCP spec (requires both application/json and text/event-stream)
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

  // Create a stateless Web Standard transport for this request
  // In stateless mode (sessionIdGenerator: undefined), always use JSON responses.
  // SSE streams in stateless mode never close properly, causing client timeouts.
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless — no session tracking
    enableJsonResponse: true, // Always JSON in stateless mode to avoid hanging SSE streams
  });

  // Connect server to transport
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
    logger.error("MCP request error:", error);
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

export async function GET(request: NextRequest) {
  // For GET requests without auth, return the protected resource metadata hint
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return unauthorizedResponse();
  }

  // In stateless mode, GET for SSE server-initiated notifications is not supported.
  // Clients should use POST with Accept: text/event-stream for streaming responses.
  return NextResponse.json(
    {
      error: "SSE server-initiated notifications require session mode.",
      hint: "Send POST requests with Accept: text/event-stream for streaming responses.",
    },
    { status: 405 },
  );
}

export async function DELETE() {
  // Session termination — stateless mode, nothing to clean up
  return NextResponse.json({ ok: true });
}
