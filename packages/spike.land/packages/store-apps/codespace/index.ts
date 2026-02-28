#!/usr/bin/env tsx
/**
 * Codespace — Standalone MCP Server Entry Point
 *
 * Live React application management, virtual filesystem, and template tools.
 */

import { createAppServer } from "../shared/standalone-registry";
import { connectStdio } from "../shared/transport";
import type { ServerContext } from "../shared/types";
import { codespaceTools } from "./tools";

const ctx: ServerContext = {
  userId: process.env.USER_ID || "standalone-user",
  env: process.env as Record<string, string | undefined>,
  calledTools: new Set<string>(),
};

const server = createAppServer("codespace", "0.1.0", codespaceTools, ctx);
await connectStdio(server);
