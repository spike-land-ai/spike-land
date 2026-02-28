#!/usr/bin/env tsx
/**
 * Code Review Agent — Standalone MCP Server
 *
 * Convention-based code review and PR review tools.
 */

import { connectStdio, createAppServer } from "../shared/index";
import type { AppServerFactory, ServerContext } from "../shared/types";
import { codeReviewAgentTools } from "./tools";

const createServer: AppServerFactory = async (ctx: ServerContext) => {
  return createAppServer("code-review-agent", "0.1.0", codeReviewAgentTools, ctx);
};
createServer.tools = codeReviewAgentTools;
createServer.meta = {
  name: "Code Review Agent",
  slug: "code-review-agent",
  version: "0.1.0",
  toolCount: codeReviewAgentTools.length,
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
