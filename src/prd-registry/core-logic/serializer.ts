import type { PrdDefinition, ResolvedPrd } from "./types.js";

/**
 * Estimate token count from text using word-count heuristic.
 * Roughly 1 token ≈ 0.75 words, so tokens ≈ words × 1.3
 */
export function estimateTokens(text: string): number {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.ceil(wordCount * 1.3);
}

/** Serialize a single PRD definition to compact format */
export function serializePrd(prd: PrdDefinition): string {
  const lines: string[] = [];
  lines.push(`[PRD:${prd.level}:${prd.id}] ${prd.summary}`);

  if (prd.purpose) {
    lines.push(`Purpose: ${prd.purpose}`);
  }
  if (prd.constraints.length > 0) {
    lines.push(`Constraints: ${prd.constraints.join("; ")}`);
  }
  if (prd.acceptance.length > 0) {
    lines.push(`Acceptance: ${prd.acceptance.join("; ")}`);
  }
  if (prd.context) {
    lines.push(`Context: ${prd.context}`);
  }
  if (prd.toolCategories.length > 0) {
    lines.push(`Tool categories: ${prd.toolCategories.join(", ")}`);
  }
  if (prd.tools.length > 0) {
    lines.push(`Tools: ${prd.tools.join(", ")}`);
  }

  return lines.join("\n");
}

/** Serialize a resolved PRD chain to a ready-to-inject string */
export function serializeChain(chain: PrdDefinition[]): string {
  return chain.map(serializePrd).join("\n---\n");
}

/** Build a compact catalog of all PRDs (~500 tokens) */
export function buildCatalogText(prds: PrdDefinition[]): string {
  const byLevel = new Map<string, PrdDefinition[]>();
  for (const prd of prds) {
    const list = byLevel.get(prd.level) ?? [];
    list.push(prd);
    byLevel.set(prd.level, list);
  }

  const lines: string[] = ["# PRD Catalog"];
  const levelOrder = ["platform", "domain", "route", "app", "tool-category"];

  for (const level of levelOrder) {
    const group = byLevel.get(level);
    if (!group?.length) continue;
    lines.push(`\n## ${level}`);
    for (const prd of group) {
      lines.push(`- ${prd.id}: ${prd.summary}`);
    }
  }

  return lines.join("\n");
}

/** Create a ResolvedPrd from a chain of definitions */
export function resolveFromChain(chain: PrdDefinition[]): ResolvedPrd {
  const constraints: string[] = [];
  const acceptance: string[] = [];
  const toolCategorySet = new Set<string>();
  const toolSet = new Set<string>();
  let totalTokens = 0;

  for (const prd of chain) {
    constraints.push(...prd.constraints);
    acceptance.push(...prd.acceptance);
    for (const cat of prd.toolCategories) toolCategorySet.add(cat);
    for (const tool of prd.tools) toolSet.add(tool);
    totalTokens += prd.tokenEstimate;
  }

  return {
    chain,
    constraints,
    acceptance,
    toolCategories: [...toolCategorySet],
    tools: [...toolSet],
    totalTokens,
    serialized: serializeChain(chain),
  };
}
