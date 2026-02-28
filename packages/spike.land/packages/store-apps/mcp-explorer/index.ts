#!/usr/bin/env node
/**
 * MCP Explorer — Standalone MCP Server Entry Point
 */

import { createAppServer } from "../shared/standalone-registry";
import { connectStdio } from "../shared/transport";
import type { ServerContext } from "../shared/types";
import { mcpExplorerTools } from "./tools";

const ctx: ServerContext = {
  userId: process.env.USER_ID ?? "anonymous",
  env: process.env as Record<string, string | undefined>,
  calledTools: new Set(),
};

const server = createAppServer("mcp-explorer", "0.1.0", mcpExplorerTools, ctx);
await connectStdio(server);
