#!/usr/bin/env node
/**
 * beUniq — Standalone MCP Server Entry Point
 *
 * User profiling via AVL tree binary questions, social features,
 * leaderboards, profile sharing, comparison, and personality insights.
 */

import { createAppServer } from "../shared/standalone-registry";
import { connectStdio } from "../shared/transport";
import type { ServerContext } from "../shared/types";
import { beUniqTools } from "./tools";

const ctx: ServerContext = {
  userId: process.env.USER_ID ?? "anonymous",
  env: process.env as Record<string, string | undefined>,
  calledTools: new Set<string>(),
};

const server = createAppServer("be-uniq", "0.1.0", beUniqTools, ctx);
await connectStdio(server);
