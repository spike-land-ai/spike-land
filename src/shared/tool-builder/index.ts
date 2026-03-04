/**
 * Tool Builder -- tRPC-grade type-safe MCP tool definitions
 *
 * Immutable builder with composable middleware.
 * Zero `as unknown as` or `any` casts.
 */

export { baseProcedure, createProcedure } from "./builder.js";
export type { Procedure, ToolBuilder } from "./builder.js";
export { middleware } from "./middleware.js";
export type {
  BuiltTool,
  CallToolResult,
  EmptyContext,
  HandlerParams,
  Middleware,
  MiddlewareFn,
  MiddlewareParams,
  ToolExample,
  ToolMeta,
} from "./types.js";
