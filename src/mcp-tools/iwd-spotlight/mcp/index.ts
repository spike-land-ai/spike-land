#!/usr/bin/env node
/**
 * IWD Spotlight MCP Server — Orchestrator for International Women's Day 2026.
 *
 * Composes existing MCP tools (Image Studio, HackerNews, Stripe, GA4, Code Review)
 * into a celebration-themed toolkit. Pure orchestrator — no database, no state.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { wrapServerWithLogging, registerFeedbackTool } from "@spike-land-ai/mcp-server-base";
import type { ToolClient } from "./types.js";

import { registerSpotlightTools } from "../core-logic/spotlight.js";
import { registerCampaignTools } from "../core-logic/campaign.js";
import { registerAmplifierTools } from "../core-logic/amplifier.js";
import { registerStorytellingTools } from "../core-logic/storytelling.js";
import { registerDashboardTools } from "../core-logic/dashboard.js";
import { registerContributorTools } from "../core-logic/contributors.js";

const SERVER_NAME = "iwd-spotlight";
const SERVER_VERSION = "0.1.0";

const server = new McpServer({
  name: SERVER_NAME,
  version: SERVER_VERSION,
});

wrapServerWithLogging(server, SERVER_NAME);

// ToolClient that delegates to the MCP server's own tool call mechanism.
// In production, this would be wired to a multiplexer like spike-cli.
// For now, it provides the interface; callers configure their own client.
const toolClient: ToolClient = {
  async callTool(name: string, args: Record<string, unknown>) {
    // In a composed MCP setup, the host (e.g. spike-cli) routes these calls
    // to the appropriate downstream MCP server. This stub logs the intent.
    process.stderr.write(`[iwd-spotlight] Delegating to tool: ${name}\n`);
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ tool: name, args }) }],
    };
  },
};

// Register all tool groups
registerSpotlightTools(server, toolClient);
registerCampaignTools(server, toolClient);
registerAmplifierTools(server, toolClient);
registerStorytellingTools(server, toolClient);
registerDashboardTools(server, toolClient);
registerContributorTools(server, toolClient);
registerFeedbackTool(server, { serviceName: SERVER_NAME, toolName: "iwd_feedback" });

// Start server on stdio
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`${SERVER_NAME} MCP Server v${SERVER_VERSION} running on stdio.\n`);
}

main();
