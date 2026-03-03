/**
 * Mock MCP server for testing.
 * Delegates to @spike-land-ai/mcp-server-base createMockServer, adding vi.fn() spy.
 */

import { vi } from "vitest";
import {
  type CallToolResult,
  createMockServer as createBaseServer,
  type ToolHandler,
} from "@spike-land-ai/mcp-server-base";

export interface MockMcpServer {
  tool: ReturnType<typeof vi.fn>;
  handlers: Map<string, ToolHandler>;
  call: (name: string, args: Record<string, unknown>) => Promise<CallToolResult>;
}

export function createMockServer(): MockMcpServer {
  const base = createBaseServer();
  const toolFn = vi.fn(base.tool);
  return { ...base, tool: toolFn };
}
