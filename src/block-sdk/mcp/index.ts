/**
 * MCP integration — register block procedures as MCP tools.
 */

import type { BuiltTool, CallToolResult } from "@spike-land-ai/shared/tool-builder";
import type { Block } from "../define-block.js";
import type { StorageAdapter } from "../storage/types.js";
import type { BlockComponents } from "../define-block.js";
import type { TableDef } from "../schema/types.js";

/** MCP server interface (minimal — compatible with @modelcontextprotocol/sdk) */
export interface McpToolRegistry {
  register(tool: {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    handler: (args: Record<string, unknown>) => Promise<CallToolResult>;
  }): void;
}

/** Options for registering block tools */
export interface BlockToolsOptions {
  /** Prefix for tool names (e.g., "tasks_" → "tasks_create_task") */
  prefix?: string;
  /** Override the user ID (useful for multi-tenant) */
  userId?: string;
}

/**
 * Convert a block's procedures into BuiltTool[] for MCP registration.
 *
 * @example
 * ```ts
 * const tools = blockToTools(taskQueue, storage, "user-123");
 * for (const tool of tools) {
 *   server.tool(tool.name, tool.inputSchema, tool.handler);
 * }
 * ```
 */
export function blockToTools(
  block: Block<Record<string, TableDef>, Record<string, BuiltTool>, BlockComponents>,
  storage: StorageAdapter,
  userId: string,
  options?: BlockToolsOptions,
): BuiltTool[] {
  const tools = block.getTools(storage, userId);
  const prefix = options?.prefix ?? "";

  if (!prefix) return tools;

  // Apply prefix to tool names
  return tools.map((tool) => ({
    ...tool,
    name: `${prefix}${tool.name}`,
  }));
}

/**
 * Register all block tools with an MCP server/registry.
 */
export function registerBlockTools(
  block: Block<Record<string, TableDef>, Record<string, BuiltTool>, BlockComponents>,
  registry: McpToolRegistry,
  storage: StorageAdapter,
  userId: string,
  options?: BlockToolsOptions,
): void {
  const tools = blockToTools(block, storage, userId, options);

  for (const tool of tools) {
    registry.register({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema as Record<string, unknown>,
      handler: (args) => tool.handler(args as Parameters<typeof tool.handler>[0]),
    });
  }
}
