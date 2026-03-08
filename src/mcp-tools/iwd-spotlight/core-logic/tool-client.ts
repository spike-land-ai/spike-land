/**
 * ToolClient factory + mock helper for tests.
 */

import type { ToolClient } from "../mcp/types.js";
import type { CallToolResult } from "@spike-land-ai/mcp-server-base";

/**
 * Create a mock ToolClient for testing.
 * Provide a map of tool name → result. Unknown tools return an error result.
 */
export function createMockToolClient(
  responses: Record<string, CallToolResult> = {},
): ToolClient {
  return {
    async callTool(name: string, _args: Record<string, unknown>): Promise<CallToolResult> {
      const response = responses[name];
      if (response) return response;
      return {
        content: [{ type: "text", text: `Mock: no response configured for "${name}"` }],
        isError: true,
      };
    },
  };
}
