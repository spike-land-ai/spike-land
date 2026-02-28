#!/usr/bin/env tsx
/**
 * AI Orchestrator — Standalone MCP Server
 *
 * Swarm management + monitoring tools for AI agent coordination.
 */

import { connectStdio, createAppServer } from "../shared/index";
import type { AppServerFactory, ServerContext } from "../shared/types";
import { aiOrchestratorTools } from "./tools";

const createServer: AppServerFactory = async (ctx: ServerContext) => {
  return createAppServer("ai-orchestrator", "0.1.0", aiOrchestratorTools, ctx);
};
createServer.tools = aiOrchestratorTools;
createServer.meta = {
  name: "AI Orchestrator",
  slug: "ai-orchestrator",
  version: "0.1.0",
  toolCount: aiOrchestratorTools.length,
};

export default createServer;

if (import.meta.url === `file://${process.argv[1]}`) {
  const ctx: ServerContext = {
    userId: process.env.USER_ID ?? "anonymous",
    env: process.env as Record<string, string | undefined>,
    calledTools: new Set<string>(),
  };
  const server = await createServer(ctx);
  await connectStdio(server);
}
