/**
 * Transport helpers for standalone MCP servers.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

/**
 * Create a stdio transport and connect to the server.
 * Used by standalone entry points for CLI execution.
 */
export async function connectStdio(
  server: import("@modelcontextprotocol/sdk/server/mcp.js").McpServer,
): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
