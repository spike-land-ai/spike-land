#!/usr/bin/env tsx
/**
 * State Machine — Standalone MCP Server Entry Point
 *
 * Create, simulate, visualize, and export statecharts.
 */

import { createAppServer } from "../shared/standalone-registry";
import { connectStdio } from "../shared/transport";
import type { ServerContext } from "../shared/types";
import { stateMachineTools } from "./tools";

const ctx: ServerContext = {
  userId: process.env.USER_ID || "standalone-user",
  env: process.env as Record<string, string | undefined>,
  calledTools: new Set<string>(),
};

const server = createAppServer("state-machine", "0.1.0", stateMachineTools, ctx);
await connectStdio(server);
