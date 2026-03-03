/**
 * SpacetimeDB MCP Server — Types & Helpers
 */

export interface RegisteredTool {
  id: bigint;
  name: string;
  description: string;
  inputSchema: string;
  providerIdentity: string;
  category: string;
  createdAt: bigint;
}

export interface McpTask {
  id: bigint;
  toolName: string;
  argumentsJson: string;
  requesterIdentity: string;
  providerIdentity?: string;
  status: string; // "pending", "claimed", "completed", "failed"
  resultJson?: string;
  error?: string;
  createdAt: bigint;
  completedAt?: bigint;
}

// ─── Shared types from spacetimedb-platform (canonical source) ───

export type {
  Agent,
  AgentMessage,
  ConnectionState,
  Task,
} from "@spike-land-ai/spacetimedb-platform";

// ─── Error Codes ───

export type StdbErrorCode =
  | "NOT_CONNECTED"
  | "CONNECTION_FAILED"
  | "REDUCER_FAILED"
  | "QUERY_FAILED"
  | "NOT_FOUND"
  | "INVALID_INPUT"
  | "ALREADY_CONNECTED";

// ─── Result Helpers (re-exported from mcp-server-base) ───

export {
  type CallToolResult,
  errorResult,
  jsonResult,
  tryCatch,
} from "@spike-land-ai/mcp-server-base";
