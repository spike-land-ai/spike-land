/**
 * Programmatic API for spike MCP CLI.
 */

export { discoverConfig, type DiscoveryOptions } from "./config/discovery";
export { validateConfig } from "./config/schema";
export type {
  HttpServerConfig,
  McpConfigFile,
  ResolvedConfig,
  ServerConfig,
  StdioServerConfig,
} from "./config/types";
export { setVerbose } from "./util/logger";
export { ChatClient, type ChatClientOptions } from "./chat/client";
export { runAgentLoop, type AgentLoopContext } from "./chat/loop";
export { ServerManager, type ServerManagerOptions } from "./multiplexer/server-manager";
