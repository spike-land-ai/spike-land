#!/usr/bin/env node

/**
 * SpacetimeDB MCP Server — Agent Coordination
 *
 * Provides real-time agent state, point-to-point messaging,
 * and task coordination via SpacetimeDB.
 */

import { createMcpServer, startMcpServer } from "@spike-land-ai/mcp-server-base";
import { createLiveSpacetimeMcpClient } from "./client.js";
import { registerSwarmTools } from "./tools/swarm-tools.js";

const server = createMcpServer({
  name: "spacetimedb-mcp",
  version: "0.1.0",
});

const client = createLiveSpacetimeMcpClient();

registerSwarmTools(server, client);

await startMcpServer(server);
