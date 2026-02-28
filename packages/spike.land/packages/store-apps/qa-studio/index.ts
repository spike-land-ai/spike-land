#!/usr/bin/env tsx
/**
 * QA Studio — Standalone MCP Server Entry Point
 *
 * Browser automation, testing, performance auditing, and accessibility tools.
 */

import { createAppServer } from "../shared/standalone-registry";
import { connectStdio } from "../shared/transport";
import type { ServerContext } from "../shared/types";
import { qaStudioTools } from "./tools";

const ctx: ServerContext = {
  userId: process.env.USER_ID || "standalone-user",
  env: process.env as Record<string, string | undefined>,
  calledTools: new Set<string>(),
};

const server = createAppServer("qa-studio", "0.1.0", qaStudioTools, ctx);
await connectStdio(server);
