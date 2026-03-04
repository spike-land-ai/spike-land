#!/usr/bin/env node

/**
 * QA Studio Web Reader MCP Server
 *
 * Exposes websites as screen-reader-style narrated text via 10 MCP tools.
 * Usage: node mcp-server.js [--visible]
 */

import {
  createMcpServer,
  startMcpServer,
} from "@spike-land-ai/mcp-server-base";

import { setBrowserConfig, cleanup } from "./browser-session.js";
import { registerWebTools } from "./tools.js";

const args = process.argv.slice(2);
const visible = args.includes("--visible");

if (visible) {
  setBrowserConfig({ headless: false });
}

const server = createMcpServer({
  name: "qa-studio-web-reader",
  version: "0.1.0",
});

registerWebTools(server);

process.on("SIGINT", () => {
  void cleanup().then(() => process.exit(0));
});

process.on("SIGTERM", () => {
  void cleanup().then(() => process.exit(0));
});

await startMcpServer(server);
