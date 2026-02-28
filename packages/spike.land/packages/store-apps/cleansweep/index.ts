#!/usr/bin/env node
/**
 * CleanSweep — Standalone MCP Server Entry Point
 *
 * Gamified cleaning with photo analysis, AI scanning, task lifecycle,
 * streaks, reminders, verification, motivation, and room management.
 */

import { createAppServer } from "../shared/standalone-registry";
import { connectStdio } from "../shared/transport";
import type { ServerContext } from "../shared/types";
import { cleansweepTools } from "./tools";

const ctx: ServerContext = {
  userId: process.env.USER_ID ?? "anonymous",
  env: process.env as Record<string, string | undefined>,
  calledTools: new Set<string>(),
};

const server = createAppServer("cleansweep", "0.1.0", cleansweepTools, ctx);
await connectStdio(server);
