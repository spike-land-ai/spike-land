/**
 * MCP (Model Context Protocol) JSON-RPC 2.0 Endpoint
 *
 * POST /api/codespace/[codeSpace]/mcp  -- JSON-RPC request
 * GET  /api/codespace/[codeSpace]/mcp  -- Server info + capabilities
 * OPTIONS                               -- CORS preflight
 *
 * Migrated from the Cloudflare Worker backend MCP handler.
 */

import { CORS_HEADERS, corsOptions } from "@/lib/codespace/cors";
import {
  handleMcpRequest,
  type McpRequest,
  type McpResponse,
  WRITE_TOOL_NAMES,
} from "@/lib/codespace/mcp-tools";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// OPTIONS — CORS preflight
// ---------------------------------------------------------------------------

export function OPTIONS() {
  return corsOptions();
}

// ---------------------------------------------------------------------------
// GET — Server info and capabilities
// ---------------------------------------------------------------------------

export function GET() {
  return Response.json(
    {
      jsonrpc: "2.0",
      result: {
        capabilities: {
          tools: { listChanged: true },
        },
        serverInfo: {
          name: "spike.land-mcp-server",
          version: "1.0.1",
        },
      },
    },
    { headers: CORS_HEADERS },
  );
}

// ---------------------------------------------------------------------------
// POST — JSON-RPC dispatch
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ codeSpace: string; }>; },
) {
  const { data: params, error: paramsError } = await tryCatch(context.params);
  if (paramsError) {
    return Response.json(
      { error: "Invalid route parameters" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const { codeSpace } = params;

  // Derive origin from the request for transpilation
  const origin = deriveOrigin(request);

  // Parse JSON-RPC body
  const { data: mcpRequest, error: parseError } = await tryCatch(
    request.json() as Promise<McpRequest>,
  );

  if (parseError) {
    const errorResponse: McpResponse = {
      jsonrpc: "2.0",
      id: 0,
      error: {
        code: -32700,
        message: "Parse error",
        data: "Failed to parse JSON-RPC request body",
      },
    };
    return Response.json(errorResponse, {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  // Require authentication for write operations (update_code, edit_code, search_and_replace)
  if (
    mcpRequest.method === "tools/call"
    && typeof mcpRequest.params?.name === "string"
    && WRITE_TOOL_NAMES.has(mcpRequest.params.name)
  ) {
    const { authenticateMcpRequest } = await import("@/lib/mcp/auth");
    const authResult = await authenticateMcpRequest(request);
    if (!authResult.success) {
      const errorResponse: McpResponse = {
        jsonrpc: "2.0",
        id: mcpRequest.id,
        error: {
          code: -32600,
          message: "Authentication required for write operations",
        },
      };
      return Response.json(errorResponse, {
        status: 401,
        headers: CORS_HEADERS,
      });
    }
  }

  const response = await handleMcpRequest(mcpRequest, codeSpace, origin);

  return Response.json(response, { headers: CORS_HEADERS });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Attempt to derive a useful origin from the incoming request.
 * Falls back to "https://spike.land" when nothing better is available.
 */
function deriveOrigin(request: NextRequest): string {
  const originHeader = request.headers.get("origin");
  if (originHeader) return originHeader;

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const url = new URL(referer);
      return url.origin;
    } catch {
      // ignore malformed referer
    }
  }

  return "https://spike.land";
}
