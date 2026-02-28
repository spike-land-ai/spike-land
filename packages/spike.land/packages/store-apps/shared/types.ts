/**
 * Standalone Store App Types
 *
 * Framework-agnostic type definitions for standalone MCP server apps.
 * These types extend the platform's ToolDefinition with dependency
 * declarations and portable server context.
 */

import type { CallToolResult, ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";

/**
 * Tool dependency declarations for progressive tool activation.
 *
 * - `dependsOn`: Must be registered before this tool appears
 * - `enables`: Auto-enabled after this tool succeeds
 * - `requires`: Must have been called successfully in this session before executing
 */
export interface ToolDependencies {
  dependsOn?: string[];
  enables?: string[];
  requires?: string[];
}

/**
 * Server context injected into every tool handler.
 * Provides user identity, environment access, and session state.
 */
export interface ServerContext {
  userId: string;
  env: Record<string, string | undefined>;
  calledTools: Set<string>;
}

/**
 * A standalone tool definition that can run in or outside the platform.
 *
 * Compared to the platform's `ToolDefinition`:
 * - Adds `dependencies` for tool-to-tool activation chains
 * - Handler receives `ServerContext` as second parameter
 * - No coupling to `@/lib/logger`, `@/lib/tracking`, etc.
 */
export interface StandaloneToolDefinition {
  name: string;
  description: string;
  category: string;
  tier: "free" | "workspace";
  complexity?: "primitive" | "composed" | "workflow";
  inputSchema?: z.ZodRawShape;
  annotations?: ToolAnnotations;
  dependencies?: ToolDependencies;
  alwaysEnabled?: boolean;
  handler: (input: never, ctx: ServerContext) => Promise<CallToolResult> | CallToolResult;
}

/**
 * Metadata about a store app MCP server.
 */
export interface AppServerMeta {
  name: string;
  slug: string;
  version: string;
  toolCount: number;
}

/**
 * Factory function that creates an McpServer for a store app.
 * Used by the standalone entry point and the aggregator.
 */
export interface AppServerFactory {
  (ctx: ServerContext): Promise<import("@modelcontextprotocol/sdk/server/mcp.js").McpServer>;
  tools: StandaloneToolDefinition[];
  meta: AppServerMeta;
}
