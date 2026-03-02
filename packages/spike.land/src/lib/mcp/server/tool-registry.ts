/**
 * Server-Side Progressive Tool Registry
 *
 * Progressive disclosure pattern: 5 always-on gateway-meta tools,
 * all others discoverable via search_tools and enable_category.
 */

import type {
  McpServer,
  RegisteredTool,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import type {
  CallToolResult,
  ToolAnnotations,
} from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";
import type { BuiltTool } from "@spike-land-ai/shared/tool-builder";
import logger from "@/lib/logger";
import { recordSkillUsage } from "./tool-loader";
import { CATEGORY_DESCRIPTIONS } from "./tool-categories";
import { suggestParameters, ToolEmbeddingIndex } from "@/lib/mcp/embeddings";

/**
 * Validate that all fields in a Zod input schema have `.describe()` calls.
 * Returns an array of field names missing descriptions.
 */
export function validateSchemaDescriptions(
  inputSchema: z.ZodRawShape | undefined,
): string[] {
  if (!inputSchema) return [];
  const missing: string[] = [];
  for (const [fieldName, zodType] of Object.entries(inputSchema)) {
    // Zod stores .describe() result on the instance's `description` property
    const desc = (zodType as { description?: string }).description;
    if (!desc) {
      missing.push(fieldName);
    }
  }
  return missing;
}

export type ToolComplexity = "primitive" | "composed" | "workflow";

/**
 * Tool dependency declarations for progressive tool activation.
 * Used by standalone store apps and enforced in the registry.
 */
export interface ToolDependencies {
  dependsOn?: string[] | undefined;
  enables?: string[] | undefined;
  requires?: string[] | undefined;
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: string;
  tier: "free" | "workspace";
  complexity?: ToolComplexity | undefined;
  inputSchema?: z.ZodRawShape | undefined;
  annotations?: ToolAnnotations | undefined;
  dependencies?: ToolDependencies | undefined;
  // Handlers are cast in register() — accept typed Zod-inferred params
  handler: (input: never) => Promise<CallToolResult> | CallToolResult;
  alwaysEnabled?: boolean | undefined;
}

export interface SearchResult {
  name: string;
  category: string;
  description: string;
  tier: string;
  complexity?: ToolComplexity;
  enabled: boolean;
  score?: number; // 0-1 cosine similarity
  suggestedParams?: Record<string, string>; // extracted from query
}

export interface CategoryInfo {
  name: string;
  description: string;
  tier: string;
  toolCount: number;
  enabledCount: number;
  tools: string[];
}

interface TrackedTool {
  definition: ToolDefinition;
  registered: RegisteredTool;
  wrappedHandler: (input: never) => Promise<CallToolResult>;
}

// Re-export for backward compatibility (moved to tool-categories.ts)
export { CATEGORY_DESCRIPTIONS } from "./tool-categories";

export class ToolRegistry {
  private tools = new Map<string, TrackedTool>();
  private mcpServer: McpServer;
  protected userId: string;
  private toolEmbeddings = new Map<string, number[]>();
  private embeddingIndex = new ToolEmbeddingIndex();

  constructor(mcpServer: McpServer, userId: string) {
    this.mcpServer = mcpServer;
    this.userId = userId;
  }

  register(def: ToolDefinition): void {
    // Validate that all schema fields have .describe() for LLM tool selection
    const missingDescriptions = validateSchemaDescriptions(def.inputSchema);
    if (missingDescriptions.length > 0) {
      const msg =
        `Tool "${def.name}" has schema fields without .describe(): ${missingDescriptions.join(", ")}. ` +
        `Add .describe() to every Zod field for accurate LLM tool selection.`;
      if (process.env.NODE_ENV !== "production") {
        throw new Error(msg);
      }
      logger.warn(msg);
    }

    const originalHandler = def.handler;
    const { userId } = this;

    const wrappedHandler = async (input: never): Promise<CallToolResult> => {
      const startTime = Date.now();
      let outcome = "success";
      let errorMsg: string | undefined;
      let result: CallToolResult | undefined;
      let tokensUsed: number | undefined;

      try {
        result = await originalHandler(input);

        // Some tools might return isError true in their result
        if (result.isError) {
          outcome = "error";
          errorMsg = result.content?.map(c => c.type === "text" ? c.text : "")
            .join(" ");
        }

        // Try extracting A/B test metadata / token counts from tool output if we want to add convention later
        // e.g if result._meta exists
        const meta = (result as Record<string, unknown>)._meta as
          | Record<string, unknown>
          | undefined;
        if (meta?._tokens && typeof meta._tokens === "number") {
          tokensUsed = meta._tokens;
        }

        return result;
      } catch (err) {
        outcome = "error";
        errorMsg = err instanceof Error ? err.message : String(err);
        throw err;
      } finally {
        const durationMs = Date.now() - startTime;

        // Fire & forget logging
        if (userId) {
          void recordSkillUsage({
            userId,
            skillName: def.name,
            category: def.category,
            outcome,
            durationMs,
            input: input as Record<string, unknown>,
            ...(errorMsg !== undefined ? { errorMessage: errorMsg } : {}),
            ...(tokensUsed !== undefined ? { tokensUsed } : {}),
          });
        }
      }
    };

    const registered = this.mcpServer.registerTool(
      def.name,
      {
        description: def.description,
        ...(def.inputSchema !== undefined ? { inputSchema: def.inputSchema } : {}),
        ...(def.annotations !== undefined ? { annotations: def.annotations } : {}),
        _meta: { category: def.category, tier: def.tier },
      },
      // Handler type is erased in ToolDefinition for heterogeneous storage
      wrappedHandler as unknown as Parameters<McpServer["registerTool"]>[2],
    );

    if (!def.alwaysEnabled) {
      registered.disable();
    }

    this.tools.set(def.name, { definition: def, registered, wrappedHandler });
    this.embeddingIndex.embed(def.name, def.category, def.description);
  }

  /**
   * Register a tool built with the shared tool-builder.
   * Adapts BuiltTool to ToolDefinition internally -- zero breaking changes.
   */
  registerBuilt<TInput, TOutput>(built: BuiltTool<TInput, TOutput>): void {
    this.register({
      name: built.name,
      description: built.description,
      category: built.meta.category ?? "uncategorized",
      tier: built.meta.tier ?? "free",
      ...(built.meta.complexity ? { complexity: built.meta.complexity } : {}),
      ...(built.meta.annotations ? { annotations: built.meta.annotations as ToolAnnotations } : {}),
      ...(built.meta.alwaysEnabled !== undefined ? { alwaysEnabled: built.meta.alwaysEnabled } : {}),
      inputSchema: built.inputSchema,
      handler: built.handler as unknown as ToolDefinition["handler"],
    });
  }

  async searchTools(query: string, limit = 10): Promise<SearchResult[]> {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];

    const scored: Array<{ result: SearchResult; score: number; }> = [];

    // Provide base keyword score scaling
    for (const [, { definition, registered }] of this.tools) {
      if (definition.category === "gateway-meta") continue;

      const nameLC = definition.name.toLowerCase();
      const descLC = definition.description.toLowerCase();
      const catLC = definition.category.toLowerCase();

      let score = 0;
      for (const term of terms) {
        if (nameLC.includes(term)) score += 3;
        if (catLC.includes(term)) score += 2;
        if (descLC.includes(term)) score += 1;
      }

      scored.push({
        result: {
          name: definition.name,
          category: definition.category,
          description: (definition.description.split("\n")[0] ?? "").slice(
            0,
            200,
          ),
          tier: definition.tier,
          ...(definition.complexity
            ? { complexity: definition.complexity }
            : {}),
          enabled: registered.enabled ?? false,
        },
        score,
      });
    }

    try {
      const { isGeminiConfigured, embedText, cosineSimilarity } = await import(
        "@/lib/ai/gemini-client"
      );
      const configured = await isGeminiConfigured();

      if (configured) {
        // Embed the query
        const queryEmbedding = await embedText(query);

        if (queryEmbedding.length > 0) {
          // Batch embed any missing tools
          const missingEmbeddings = [];
          for (const [name, tracked] of this.tools) {
            if (tracked.definition.category === "gateway-meta") continue;
            if (!this.toolEmbeddings.has(name)) {
              missingEmbeddings.push({ name, definition: tracked.definition });
            }
          }

          if (missingEmbeddings.length > 0) {
            // In-memory cache warming.
            // Run sequentially or small batches if too large, but <150 tools is fast.
            const promises = missingEmbeddings.map(
              async ({ name, definition }) => {
                const textToEmbed =
                  `${definition.name} - ${definition.description} (Category: ${definition.category})`;
                try {
                  const vec = await embedText(textToEmbed);
                  this.toolEmbeddings.set(name, vec);
                } catch (err) {
                  logger.warn(`Failed to embed tool ${name}`, { error: err });
                }
              },
            );
            await Promise.all(promises);
          }

          // Apply semantic score
          for (const item of scored) {
            const vec = this.toolEmbeddings.get(item.result.name);
            if (vec && vec.length > 0) {
              const sim = cosineSimilarity(queryEmbedding, vec);
              // Keyword scores typically range 0-10. Similarity ranges -1 to 1.
              // We significantly weight semantic similarity.
              // For example, >0.6 similarity is solid.
              item.score += sim * 10;
            }
          }
        }
      }
    } catch (err) {
      logger.warn("Semantic search failed, falling back to keyword search", {
        error: err,
      });
    }

    // Filter out items with very low score (<= 0)
    const validScores = scored.filter(s => s.score > 0);
    validScores.sort((a, b) => b.score - a.score);
    return validScores.slice(0, limit).map(s => s.result);
  }

  searchToolsSemantic(query: string, limit = 10): SearchResult[] {
    const results = this.embeddingIndex.search(query, limit);
    if (results.length === 0) return [];

    const suggested = suggestParameters(query);

    return results
      .filter(r => {
        const tracked = this.tools.get(r.name);
        return tracked && tracked.definition.category !== "gateway-meta";
      })
      .map(r => {
        const tracked = this.tools.get(r.name)!;
        return {
          name: tracked.definition.name,
          category: tracked.definition.category,
          description: (tracked.definition.description.split("\n")[0] ?? "")
            .slice(0, 200),
          tier: tracked.definition.tier,
          ...(tracked.definition.complexity
            ? { complexity: tracked.definition.complexity }
            : {}),
          enabled: tracked.registered.enabled ?? false,
          score: Math.round(r.score * 100) / 100,
          ...(Object.keys(suggested).length > 0 ? { suggestedParams: suggested } : {}),
        };
      });
  }

  enableTools(names: string[]): string[] {
    const enabled: string[] = [];
    for (const name of names) {
      const tracked = this.tools.get(name);
      if (tracked && !tracked.registered.enabled) {
        tracked.registered.enable();
        enabled.push(name);
      }
    }
    return enabled;
  }

  enableCategory(category: string): string[] {
    const enabled: string[] = [];
    for (const [, { definition, registered }] of this.tools) {
      if (definition.category === category && !registered.enabled) {
        registered.enable();
        enabled.push(definition.name);
      }
    }
    return enabled;
  }

  disableCategory(category: string): string[] {
    const disabled: string[] = [];
    for (const [, { definition, registered }] of this.tools) {
      if (
        definition.category === category
        && registered.enabled
        && !definition.alwaysEnabled
      ) {
        registered.disable();
        disabled.push(definition.name);
      }
    }
    return disabled;
  }

  listCategories(): CategoryInfo[] {
    const categories = new Map<
      string,
      { tools: string[]; enabledCount: number; tier: string; }
    >();

    for (const [, { definition, registered }] of this.tools) {
      let cat = categories.get(definition.category);
      if (!cat) {
        cat = { tools: [], enabledCount: 0, tier: definition.tier };
        categories.set(definition.category, cat);
      }
      cat.tools.push(definition.name);
      if (registered.enabled) cat.enabledCount++;
    }

    return Array.from(categories.entries()).map(([name, data]) => ({
      name,
      description: CATEGORY_DESCRIPTIONS[name] || `${name} tools`,
      tier: data.tier,
      toolCount: data.tools.length,
      enabledCount: data.enabledCount,
      tools: data.tools,
    }));
  }

  /**
   * Get the set of non-gateway categories that currently have at least one enabled tool.
   * Used by category persistence to snapshot state for Redis storage.
   */
  getEnabledCategories(): string[] {
    const categories = new Set<string>();
    for (const [, { definition, registered }] of this.tools) {
      if (
        registered.enabled
        && !definition.alwaysEnabled
        && definition.category !== "gateway-meta"
      ) {
        categories.add(definition.category);
      }
    }
    return Array.from(categories);
  }

  /**
   * Restore previously enabled categories (e.g. from Redis).
   * Enables all tools in each listed category.
   */
  restoreCategories(categories: string[]): void {
    for (const category of categories) {
      this.enableCategory(category);
    }
  }

  hasCategory(category: string): boolean {
    for (const [, { definition }] of this.tools) {
      if (definition.category === category) return true;
    }
    return false;
  }

  getToolCount(): number {
    return this.tools.size;
  }

  getEnabledCount(): number {
    let count = 0;
    for (const [, { registered }] of this.tools) {
      if (registered.enabled) count++;
    }
    return count;
  }

  /**
   * Return tool definitions for direct (in-process) invocation.
   * Used by InProcessToolProvider to build NamespacedTool[] without MCP transport.
   */
  getToolDefinitions(): Array<{
    name: string;
    description: string;
    category: string;
    handler: ToolDefinition["handler"];
    inputSchema?: z.ZodRawShape;
    enabled: boolean;
    alwaysEnabled?: boolean;
  }> {
    return Array.from(this.tools.values()).map(({ definition, registered }) => ({
      name: definition.name,
      description: definition.description,
      category: definition.category,
      handler: definition.handler,
      ...(definition.inputSchema !== undefined ? { inputSchema: definition.inputSchema } : {}),
      enabled: registered.enabled ?? false,
      ...(definition.alwaysEnabled !== undefined ? { alwaysEnabled: definition.alwaysEnabled } : {}),
    }));
  }

  /**
   * Call a tool handler directly, bypassing MCP transport.
   * Used by InProcessToolProvider for Docker/production environments.
   */
  async callToolDirect(
    name: string,
    input: Record<string, unknown>,
  ): Promise<CallToolResult> {
    const tracked = this.tools.get(name);
    if (!tracked) {
      return {
        content: [{ type: "text", text: `Tool not found: ${name}` }],
        isError: true,
      };
    }
    if (!tracked.registered.enabled) {
      return {
        content: [{ type: "text", text: `Tool disabled: ${name}` }],
        isError: true,
      };
    }
    return tracked.wrappedHandler(input as never);
  }

  /**
   * Enable ALL registered tool categories at once.
   * Used by InProcessToolProvider to skip progressive disclosure for agent loops.
   */
  enableAll(): number {
    let count = 0;
    for (const [, { registered }] of this.tools) {
      if (!registered.enabled) {
        registered.enable();
        count++;
      }
    }
    return count;
  }
}

