#!/usr/bin/env node
/**
 * Content Hub — Standalone MCP Server Entry Point
 */

import { createAppServer } from "../shared/standalone-registry";
import { connectStdio } from "../shared/transport";
import type { ServerContext } from "../shared/types";
import { contentHubTools } from "./tools";

const ctx: ServerContext = {
  userId: process.env.USER_ID ?? "anonymous",
  env: process.env as Record<string, string | undefined>,
  calledTools: new Set(),
};

const server = createAppServer("content-hub", "0.1.0", contentHubTools, ctx);
await connectStdio(server);
