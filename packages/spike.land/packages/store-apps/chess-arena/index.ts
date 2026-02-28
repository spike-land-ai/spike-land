#!/usr/bin/env tsx
/**
 * Chess Arena — Standalone MCP Server Entry Point
 *
 * Run directly: `npx tsx packages/store-apps/chess-arena/index.ts`
 * Or import the factory for aggregation.
 */

import { connectStdio, createAppServer } from "../shared/index";
import type { AppServerFactory, ServerContext } from "../shared/types";
import { chessArenaTools } from "./tools";

const createServer: AppServerFactory = async (ctx: ServerContext) => {
  return createAppServer("chess-arena", "0.1.0", chessArenaTools, ctx);
};
createServer.tools = chessArenaTools;
createServer.meta = {
  name: "Chess Arena",
  slug: "chess-arena",
  version: "0.1.0",
  toolCount: chessArenaTools.length,
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
