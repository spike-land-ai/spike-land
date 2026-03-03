#!/usr/bin/env node

/**
 * SpacetimeDB Platform MCP Server
 *
 * Provides real-time platform operations: users, apps, tools, content,
 * messaging, and analytics via SpacetimeDB.
 */

import { createMcpServer, startMcpServer } from "@spike-land-ai/mcp-server-base";
import { createLivePlatformClient } from "./client-live.js";
import { registerAnalyticsTools } from "./tools/analytics-tools.js";
import { registerAppTools } from "./tools/app-tools.js";
import { registerContentTools } from "./tools/content-tools.js";
import { registerMessageTools } from "./tools/message-tools.js";
import { registerToolRegistryTools } from "./tools/tool-registry-tools.js";
import { registerUserTools } from "./tools/user-tools.js";
export * from "./types.js";
export { createLivePlatformClient } from "./client-live.js";
export type { SpacetimePlatformClient } from "./client.js";
export type {
  Image,
  Album,
  AlbumImage,
  Pipeline,
  EnhancementJob,
  GenerationJob,
  Subject,
  Credits,
} from "./image-types.js";
export {
  typedTables,
  typedReducers,
  type TypedTables,
  type TypedReducers,
} from "./typed-tables.js";
export { createStdbHttpClient, type StdbHttpClient, type StdbHttpClientConfig } from "./stdb-http-client.js";

const server = createMcpServer({
  name: "spacetimedb-platform",
  version: "0.1.0",
});

const client = createLivePlatformClient();

registerUserTools(server, client);
registerAppTools(server, client);
registerToolRegistryTools(server, client);
registerContentTools(server, client);
registerMessageTools(server, client);
registerAnalyticsTools(server, client);

await startMcpServer(server);
