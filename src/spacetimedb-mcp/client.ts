/**
 * SpacetimeDB Connection Manager for MCP Swarm
 *
 * Wraps the SpacetimeDB HTTP API for agent coordination.
 * Exposes methods for Leaf Servers (Providers) and Agents (Consumers).
 */

import type { Agent, AgentMessage, ConnectionState, McpTask, RegisteredTool, Task } from "./types.js";
import { createStdbHttpClient, type StdbHttpClient } from "../spacetimedb-platform/stdb-http-client.js";

// ─── Agent-Coordination Client Interface ───
// Used by agent-tools.ts and task-tools.ts (and their tests).

export interface SpacetimeClient {
  getState(): ConnectionState;
  connect(uri: string, moduleName: string, token?: string): Promise<ConnectionState>;
  disconnect(): void;

  registerAgent(displayName: string, capabilities: string[]): Promise<void>;
  unregisterAgent(): Promise<void>;
  listAgents(): Agent[];

  sendMessage(toAgent: string, content: string): Promise<void>;
  getMessages(onlyUndelivered?: boolean): AgentMessage[];
  markDelivered(messageId: bigint): Promise<void>;

  createTask(description: string, priority: number, context: string): Promise<void>;
  listTasks(statusFilter?: string): Task[];
  claimTask(taskId: bigint): Promise<void>;
  completeTask(taskId: bigint): Promise<void>;
}

// ─── Swarm Client Interface ───
// Used by swarm-tools.ts (newer MCP swarm API).

export interface SpacetimeMcpClient {
  /** Current connection state */
  getState(): ConnectionState;

  /** Connect to a SpacetimeDB instance */
  connect(uri: string, moduleName: string, token?: string): Promise<ConnectionState>;

  /** Disconnect from the current instance */
  disconnect(): void;

  // ─── Provider Operations (Leaf Servers) ───

  /** Register an MCP tool provided by this connection */
  registerTool(
    name: string,
    description: string,
    inputSchema: string,
    category: string,
  ): Promise<void>;

  /** Unregister an MCP tool */
  unregisterTool(name: string): Promise<void>;

  /** Claim a pending task assigned to this tool */
  claimMcpTask(taskId: bigint): Promise<void>;

  /** Complete an execution task with result or error */
  completeMcpTask(taskId: bigint, resultJson?: string, error?: string): Promise<void>;

  // ─── Consumer Operations (Agents) ───

  /** Request the execution of an MCP tool */
  invokeToolRequest(toolName: string, argumentsJson: string): Promise<void>;

  /** List all registered tools from all connected leaf servers */
  listRegisteredTools(categoryFilter?: string): RegisteredTool[];

  /** List tasks, optionally filtering by status */
  listMcpTasks(statusFilter?: string): McpTask[];

  // ─── Agent Registry (Legacy/General) ───

  registerAgent(displayName: string, capabilities: string[]): Promise<void>;
  unregisterAgent(): Promise<void>;
  listAgents(): Agent[];

  // ─── Events ───
  onEvent(cb: () => void): void;
}

// ─── Live Client ───

export function createLiveSpacetimeMcpClient(): SpacetimeMcpClient {
  let state: ConnectionState = {
    connected: false,
    uri: null,
    moduleName: null,
    identity: null,
    token: null,
  };

  let httpClient: StdbHttpClient | null = null;
  const eventListeners: Array<() => void> = [];

  function requireClient(): StdbHttpClient {
    if (!httpClient) throw new Error("Not connected");
    return httpClient;
  }

  function notifyListeners() {
    for (const cb of eventListeners) {
      cb();
    }
  }

  return {
    getState() {
      return { ...state };
    },

    async connect(uri: string, moduleName: string, token?: string): Promise<ConnectionState> {
      if (state.connected) {
        throw new Error("Already connected. Disconnect first.");
      }

      // Convert ws:// to http:// for HTTP API
      const httpHost = uri.replace(/^ws(s?):\/\//, "http$1://");

      httpClient = createStdbHttpClient({
        host: httpHost,
        database: moduleName,
        token,
      });

      // Verify connectivity
      await httpClient.sql("SELECT 1");

      state = {
        connected: true,
        uri,
        moduleName,
        identity: null,
        token: token ?? null,
      };

      notifyListeners();
      return { ...state };
    },

    disconnect() {
      httpClient = null;
      state = { connected: false, uri: null, moduleName: null, identity: null, token: null };
    },

    // ─── Provider Operations ───

    async registerTool(name: string, description: string, inputSchema: string, category: string) {
      await requireClient().callReducer("register_tool", [name, description, inputSchema, category]);
    },

    async unregisterTool(name: string) {
      await requireClient().callReducer("unregister_tool", [name]);
    },

    async claimMcpTask(taskId: bigint) {
      await requireClient().callReducer("claim_mcp_task", [taskId]);
    },

    async completeMcpTask(taskId: bigint, resultJson?: string, error?: string) {
      await requireClient().callReducer("complete_mcp_task", [taskId, resultJson, error]);
    },

    // ─── Consumer Operations ───

    async invokeToolRequest(toolName: string, argumentsJson: string) {
      await requireClient().callReducer("invoke_tool_request", [toolName, argumentsJson]);
    },

    listRegisteredTools(_categoryFilter?: string): RegisteredTool[] {
      throw new Error("Sync listRegisteredTools not supported with HTTP client.");
    },

    listMcpTasks(_statusFilter?: string): McpTask[] {
      throw new Error("Sync listMcpTasks not supported with HTTP client.");
    },

    // ─── Agent Operations ───

    async registerAgent(displayName: string, capabilities: string[]) {
      await requireClient().callReducer("register_agent", [displayName, capabilities]);
    },

    async unregisterAgent() {
      await requireClient().callReducer("unregister_agent", []);
    },

    listAgents(): Agent[] {
      throw new Error("Sync listAgents not supported with HTTP client.");
    },

    onEvent(cb: () => void) {
      eventListeners.push(cb);
    },
  };
}
