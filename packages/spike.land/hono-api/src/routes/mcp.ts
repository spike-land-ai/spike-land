/**
 * Streamable HTTP MCP Endpoint (Hono)
 *
 * Ported from Next.js route handler. Uses standard Web APIs.
 * POST /api/mcp -- Handle MCP JSON-RPC requests
 * GET /api/mcp -- Returns 405
 * DELETE /api/mcp -- Session termination
 */
import { Hono } from "hono";
import { createMcpServer } from "@/lib/mcp/server/mcp-server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { logger } from "@/lib/logger";
import { authenticateRequest } from "../middleware/auth.js";

export const mcpRoute = new Hono();

function getMcpBaseUrl(): string {
  if (process.env.APP_ENV === "production") return "https://spike.land";
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  return "https://spike.land";
}

function unauthorizedResponse() {
  const baseUrl = getMcpBaseUrl();
  return Response.json(
    {
      error: "Unauthorized",
      message: "Bearer token required. Use an API key or OAuth 2.1.",
      help: {
        api_key: `${baseUrl}/settings?tab=api-keys`,
        oauth_discovery: `${baseUrl}/.well-known/oauth-authorization-server`,
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

mcpRoute.post("/", async c => {
  const request = c.req.raw;

  // Check for authentication
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return unauthorizedResponse();
  }

  // Authenticate the request
  const authResult = await authenticateRequest(request);
  if (!authResult.success || !authResult.userId) {
    return unauthorizedResponse();
  }

  // Rate limiting (import from existing code)
  const { checkRateLimit, rateLimitConfigs } = await import(
    "@/lib/rate-limiter"
  );
  const { isLimited, resetAt } = await checkRateLimit(
    `mcp-rpc:${authResult.userId}`,
    rateLimitConfigs.mcpJsonRpc,
  );
  if (isLimited) {
    return c.json(
      {
        jsonrpc: "2.0",
        error: { code: -32000, message: "Rate limit exceeded" },
        id: null,
      },
      429,
      { "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)) },
    );
  }

  // Parse JSON-RPC request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return c.json(
      {
        jsonrpc: "2.0",
        error: { code: -32700, message: "Parse error" },
        id: null,
      },
      400,
    );
  }

  // Create MCP server for this user
  const mcpServer = createMcpServer(authResult.userId);

  // Determine response format
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

  // Create stateless Web Standard transport
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: !acceptsSSE,
  });

  await mcpServer.connect(transport);

  try {
    const response = await transport.handleRequest(mcpRequest, {
      parsedBody: body,
    });

    return new Response(response.body, {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    });
  } catch (error) {
    logger.error("MCP request error", error);
    return c.json(
      {
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal error" },
        id: null,
      },
      500,
    );
  } finally {
    await mcpServer.close();
  }
});

mcpRoute.get("/", c => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    return unauthorizedResponse();
  }
  return c.json(
    {
      error: "SSE server-initiated notifications require session mode.",
      hint: "Send POST requests with Accept: text/event-stream for streaming responses.",
    },
    405,
  );
});

mcpRoute.delete("/", _c => {
  return Response.json({ ok: true });
});
