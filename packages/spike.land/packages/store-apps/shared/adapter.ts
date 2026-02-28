/**
 * Platform Adapter
 *
 * Bridges standalone tool definitions back into the platform's ToolRegistry.
 * Used by tool-manifest.ts to import tools from packages/store-apps/*.
 */

import type { StandaloneToolDefinition } from "./types";

/**
 * Convert standalone tool definitions into a register function
 * compatible with the platform's ToolRegistry.
 *
 * @example
 * ```typescript
 * import { chessArenaTools } from "@spike-land-ai/store-apps/chess-arena/tools";
 * import { fromStandalone } from "@spike-land-ai/store-apps/shared/adapter";
 *
 * // In TOOL_MODULES:
 * { register: fromStandalone(chessArenaTools), categories: ["chess-game"] }
 * ```
 */
export function fromStandalone(
  tools: StandaloneToolDefinition[],
): (
  registry: import("../../../src/lib/mcp/server/tool-registry.js").ToolRegistry,
  userId: string,
) => void {
  return (registry, userId) => {
    for (const tool of tools) {
      registry.register({
        name: tool.name,
        description: tool.description,
        category: tool.category,
        tier: tool.tier,
        complexity: tool.complexity,
        inputSchema: tool.inputSchema,
        annotations: tool.annotations,
        alwaysEnabled: tool.alwaysEnabled,
        dependencies: tool.dependencies,
        handler: (input: never) =>
          tool.handler(input, {
            userId,
            env: process.env as Record<string, string | undefined>,
            calledTools: new Set<string>(),
          }),
      });
    }
  };
}
