import type { PrdDefinition, PrdLevel } from "./types.js";

const DEFAULT_LEVEL_PRIORITY: PrdLevel[] = ["platform", "domain", "route", "app", "tool-category"];

/**
 * Build a composition chain from a leaf PRD up to platform root.
 * Resolves composesFrom references, deduplicates diamond paths,
 * and returns PRDs ordered platform → domain → route → app.
 */
export function buildChain(leafId: string, lookup: Map<string, PrdDefinition>): PrdDefinition[] {
  const visited = new Set<string>();
  const result: PrdDefinition[] = [];

  function walk(id: string): void {
    if (visited.has(id)) return;
    visited.add(id);

    const prd = lookup.get(id);
    if (!prd) return;

    // Walk parents first (depth-first, parents before children)
    for (const parentId of prd.composesFrom) {
      walk(parentId);
    }
    result.push(prd);
  }

  walk(leafId);

  // Sort by level hierarchy: platform first, app last
  const levelIndex = new Map(DEFAULT_LEVEL_PRIORITY.map((l, i) => [l, i]));
  result.sort((a, b) => (levelIndex.get(a.level) ?? 99) - (levelIndex.get(b.level) ?? 99));

  return result;
}

/**
 * Trim a chain to fit within a token budget.
 * Drops lowest-priority (deepest level) PRDs first, but never drops platform.
 */
export function trimToBudget(
  chain: PrdDefinition[],
  budget: number,
  levelPriority: PrdLevel[] = DEFAULT_LEVEL_PRIORITY,
): PrdDefinition[] {
  let total = chain.reduce((sum, p) => sum + p.tokenEstimate, 0);
  if (total <= budget) return chain;

  // Work backwards through priority (drop app first, then route, etc.)
  const trimmed = [...chain];
  for (let i = levelPriority.length - 1; i > 0 && total > budget; i--) {
    const dropLevel = levelPriority[i];
    if (!dropLevel) continue;
    for (let j = trimmed.length - 1; j >= 0 && total > budget; j--) {
      const candidate = trimmed[j];
      if (!candidate) continue;
      if (candidate.level === dropLevel) {
        total -= candidate.tokenEstimate;
        trimmed.splice(j, 1);
      }
    }
  }

  return trimmed;
}
