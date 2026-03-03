/**
 * MultiplexerServer: wraps an MCP Server that aggregates tools from all upstream clients.
 * Serves via StdioServerTransport by default.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  type CallToolResult,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { ServerManager } from "./server-manager.js";

export class MultiplexerServer {
  private server: Server;
  private manager: ServerManager;

  constructor(manager: ServerManager) {
    this.manager = manager;

    this.server = new Server(
      { name: "spike-multiplexer", version: "1.0.0" },
      { capabilities: { tools: {} } },
    );

    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = this.manager.getAllTools().map((t) => ({
        name: t.namespacedName,
        description: `[${t.serverName}] ${t.description ?? ""}`,
        inputSchema: t.inputSchema,
      }));
      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (req, _extra) => {
      const { name, arguments: args } = req.params;
      try {
        const result = await this.manager.callTool(name, (args ?? {}) as Record<string, unknown>);
        return result as unknown as CallToolResult;
      } catch (err) {
        return {
          content: [{ type: "text", text: String(err) }],
          isError: true,
        } as CallToolResult;
      }
    });
  }

  async serve(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  async close(): Promise<void> {
    await this.server.close();
  }
}
