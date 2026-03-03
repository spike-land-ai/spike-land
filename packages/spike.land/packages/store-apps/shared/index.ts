/**
 * Shared infrastructure for standalone store app MCP servers.
 *
 * @module @spike-land-ai/store-apps/shared
 */

export type {
  AppServerFactory,
  AppServerMeta,
  ServerContext,
  StandaloneToolDefinition,
  ToolDependencies,
} from "./types";

export {
  checkDependsOn,
  checkRequires,
  detectCycles,
  getEnables,
} from "./dependency-graph";

export { createAppServer } from "./standalone-registry";
export { connectStdio } from "./transport";
export {
  errorResult,
  jsonResult,
  safeToolCall,
  textResult,
} from "./tool-helpers";
export { createMockContext, createMockRegistry } from "./test-utils";
export { fromStandalone } from "./adapter";
