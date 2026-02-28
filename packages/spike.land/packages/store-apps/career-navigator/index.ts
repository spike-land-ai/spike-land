#!/usr/bin/env node
/**
 * Career Navigator — Standalone MCP Server Entry Point
 *
 * Skills assessment, occupation search, salary data, job listings,
 * resume building, job matching, learning paths, and interview prep.
 */

import { createAppServer } from "../shared/standalone-registry";
import { connectStdio } from "../shared/transport";
import type { ServerContext } from "../shared/types";
import { careerNavigatorTools } from "./tools";

const ctx: ServerContext = {
  userId: process.env.USER_ID ?? "anonymous",
  env: process.env as Record<string, string | undefined>,
  calledTools: new Set<string>(),
};

const server = createAppServer("career-navigator", "0.1.0", careerNavigatorTools, ctx);
await connectStdio(server);
