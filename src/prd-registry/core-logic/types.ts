import { z } from "zod";

export const PrdLevel = z.enum(["platform", "domain", "route", "app", "tool-category"]);
export type PrdLevel = z.infer<typeof PrdLevel>;

export const PrdDefinitionSchema = z.object({
  /** Unique ID: "platform" | "domain:labs" | "route:/apps" | "app:chess-arena" */
  id: z.string().min(1),
  level: PrdLevel,
  name: z.string().min(1),
  /** Max 120 chars */
  summary: z.string().max(120),
  /** Max 300 chars */
  purpose: z.string().max(300).optional(),
  /** Max 8 constraints */
  constraints: z.array(z.string()).max(8).default([]),
  /** Max 5 acceptance criteria */
  acceptance: z.array(z.string()).max(5).default([]),
  /** Max 500 chars freeform context */
  context: z.string().max(500).optional(),
  /** Auto-enables these MCP tool categories */
  toolCategories: z.array(z.string()).default([]),
  /** Specific tool names */
  tools: z.array(z.string()).default([]),
  /** Parent PRD IDs this composes from */
  composesFrom: z.array(z.string()).default([]),
  /** Glob-style route patterns for matching */
  routePatterns: z.array(z.string()).default([]),
  /** Keywords for fuzzy matching (Rubik-style) */
  keywords: z.array(z.string()).default([]),
  /** Estimated token count for this PRD alone */
  tokenEstimate: z.number().int().positive(),
  version: z.string().default("1.0.0"),
});

export type PrdDefinition = z.infer<typeof PrdDefinitionSchema>;

export interface ResolvedPrd {
  /** Ordered chain: platform → domain → route → app */
  chain: PrdDefinition[];
  /** Merged constraints (platform first) */
  constraints: string[];
  /** Merged acceptance criteria */
  acceptance: string[];
  /** Union of all tool categories */
  toolCategories: string[];
  /** Union of all specific tools */
  tools: string[];
  /** Sum of chain token estimates */
  totalTokens: number;
  /** Ready-to-inject serialized string */
  serialized: string;
}

export interface PrdRegistryOptions {
  /** Soft token budget for composed PRDs (default 2000) */
  tokenBudget?: number;
  /** Priority order for levels when trimming (lowest priority dropped first) */
  levelPriority?: PrdLevel[];
}
