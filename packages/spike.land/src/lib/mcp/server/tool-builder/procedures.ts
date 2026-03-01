/**
 * spike.land Base Procedures
 *
 * Pre-composed middleware chains for spike.land MCP tools.
 * Each procedure bundles common concerns (error handling, Prisma, userId).
 */

import {
  createProcedure,
  middleware,
} from "@spike-land-ai/shared/tool-builder";
import type { CallToolResult as McpCallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { safeToolCall } from "../tools/tool-helpers";

// ─── Prisma client type (inferred from dynamic import) ───

type PrismaClient = Awaited<typeof import("@/lib/prisma")>["default"];

// ─── Middleware: safeToolCall wrapper ───

/**
 * Wraps the downstream handler in safeToolCall for error classification.
 * Requires ctx.toolName to be set (added by the tool builder automatically).
 */
const withSafeCall = middleware<
  { toolName: string },
  { toolName: string }
>(async ({ ctx, next }) => {
  return safeToolCall(ctx.toolName, async () => {
    return next(ctx) as Promise<McpCallToolResult>;
  });
});

// ─── Middleware: lazy Prisma import ───

/**
 * Lazily imports and injects Prisma client into context.
 * Avoids top-level import of @/lib/prisma.
 */
const withPrisma = middleware<
  Record<string, unknown>,
  { prisma: PrismaClient }
>(async ({ ctx, next }) => {
  const prisma = (await import("@/lib/prisma")).default;
  return next({ ...ctx, prisma });
});

// ─── Middleware: userId injection ───

/**
 * Injects userId into context. Created per-request via factory.
 */
function withUserId(userId: string) {
  return middleware<
    Record<string, unknown>,
    { userId: string }
  >(async ({ ctx, next }) => {
    return next({ ...ctx, userId });
  });
}

// ─── Middleware: toolName injection ───

/**
 * Injects toolName into context for use by safeToolCall.
 * Automatically set when using the composed procedures below.
 */
function withToolName(toolName: string) {
  return middleware<
    Record<string, unknown>,
    { toolName: string }
  >(async ({ ctx, next }) => {
    return next({ ...ctx, toolName });
  });
}

// ─── Composed Procedures ───

/**
 * Create a procedure for free-tier tools.
 * Includes: userId + Prisma + safeCall error handling.
 *
 * Usage:
 * ```ts
 * const t = freeTool(userId);
 * registry.registerBuilt(
 *   t.tool("my_tool", "Description", { name: z.string() })
 *     .meta({ category: "my-cat", tier: "free" })
 *     .handler(async ({ input, ctx }) => {
 *       // ctx.prisma, ctx.userId are typed
 *     })
 * );
 * ```
 */
export function freeTool(userId: string) {
  return createProcedure()
    .use(withUserId(userId))
    .use(withPrisma);
}

/**
 * Create a procedure for workspace-tier tools.
 * Same as freeTool — tier is set via .meta({ tier: "workspace" }).
 */
export function workspaceTool(userId: string) {
  return freeTool(userId);
}

// Re-export for convenience
export { withSafeCall, withPrisma, withUserId, withToolName };

// ─── Result helpers (re-export from tool-helpers) ───

export { textResult, jsonResult } from "../tools/tool-helpers";
