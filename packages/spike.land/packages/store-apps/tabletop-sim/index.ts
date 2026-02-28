#!/usr/bin/env tsx
/**
 * Tabletop Simulator — Standalone MCP Server Entry Point
 *
 * Run directly: `npx tsx packages/store-apps/tabletop-sim/index.ts`
 * Or import the factory for aggregation.
 */

import { connectStdio, createAppServer } from "../shared/index";
import type { AppServerFactory, ServerContext } from "../shared/types";
import { tabletopSimTools } from "./tools";

const createServer: AppServerFactory = async (ctx: ServerContext) => {
  return createAppServer("tabletop-sim", "0.1.0", tabletopSimTools, ctx);
};
createServer.tools = tabletopSimTools;
createServer.meta = {
  name: "Tabletop Simulator",
  slug: "tabletop-sim",
  version: "0.1.0",
  toolCount: tabletopSimTools.length,
};

export default createServer;

// Self-running when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const ctx: ServerContext = {
    userId: process.env.USER_ID ?? "anonymous",
    env: process.env as Record<string, string | undefined>,
    calledTools: new Set<string>(),
  };
  const server = await createServer(ctx);
  await connectStdio(server);
}
