import { buildChain, trimToBudget } from "./composer.js";
import { buildCatalogText, resolveFromChain } from "./serializer.js";
import type { PrdDefinition, PrdLevel, PrdRegistryOptions, ResolvedPrd } from "./types.js";
import { PrdDefinitionSchema } from "./types.js";

/**
 * PRD Registry — maps routes, keywords, and apps to composable PRD context.
 * Mirrors the ToolRegistry progressive-disclosure pattern.
 */
export class PrdRegistry {
  private prds = new Map<string, PrdDefinition>();
  private routeIndex = new Map<string, string[]>(); // pattern → prd IDs
  private keywordIndex = new Map<string, string[]>(); // keyword → prd IDs
  private categoryIndex = new Map<string, string[]>(); // tool category → prd IDs
  private tokenBudget: number;
  private levelPriority: PrdLevel[];

  constructor(options: PrdRegistryOptions = {}) {
    this.tokenBudget = options.tokenBudget ?? 2000;
    this.levelPriority = options.levelPriority ?? [
      "platform",
      "domain",
      "route",
      "app",
      "tool-category",
    ];
  }

  /** Register a PRD definition with validation */
  register(input: PrdDefinition): void {
    const prd = PrdDefinitionSchema.parse(input);
    this.prds.set(prd.id, prd);

    for (const pattern of prd.routePatterns) {
      const list = this.routeIndex.get(pattern) ?? [];
      list.push(prd.id);
      this.routeIndex.set(pattern, list);
    }

    for (const kw of prd.keywords) {
      const lower = kw.toLowerCase();
      const list = this.keywordIndex.get(lower) ?? [];
      list.push(prd.id);
      this.keywordIndex.set(lower, list);
    }

    for (const cat of prd.toolCategories) {
      const list = this.categoryIndex.get(cat) ?? [];
      list.push(prd.id);
      this.categoryIndex.set(cat, list);
    }
  }

  /** Get a PRD by ID */
  get(id: string): PrdDefinition | undefined {
    return this.prds.get(id);
  }

  /** Get all registered PRDs */
  getAll(): PrdDefinition[] {
    return [...this.prds.values()];
  }

  /** Build a compact catalog of all PRDs for AI context (~500 tokens) */
  buildCatalog(): string {
    return buildCatalogText([...this.prds.values()]);
  }

  /** Resolve PRDs for a given route path */
  resolveForRoute(path: string): ResolvedPrd {
    const matchedIds = new Set<string>();

    for (const [pattern, ids] of this.routeIndex) {
      if (matchRoute(pattern, path)) {
        for (const id of ids) matchedIds.add(id);
      }
    }

    // If no route matches, return just platform
    if (matchedIds.size === 0) {
      const platform = this.prds.get("platform");
      if (platform) {
        return resolveFromChain([platform]);
      }
      return resolveFromChain([]);
    }

    return this.compose([...matchedIds]);
  }

  /** Fuzzy-match PRDs by keywords in text (Rubik-style) */
  resolveByKeywords(text: string, max = 3): ResolvedPrd {
    const words = text
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const scores = new Map<string, number>();
    for (const word of words) {
      for (const [keyword, ids] of this.keywordIndex) {
        if (keyword.includes(word) || word.includes(keyword)) {
          for (const id of ids) {
            scores.set(id, (scores.get(id) ?? 0) + 1);
          }
        }
      }
    }

    const ranked = [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, max)
      .map(([id]) => id);

    if (ranked.length === 0) {
      const platform = this.prds.get("platform");
      return platform ? resolveFromChain([platform]) : resolveFromChain([]);
    }

    return this.compose(ranked);
  }

  /** Shorthand: resolve for an app by slug */
  resolveForApp(slug: string): ResolvedPrd {
    const appId = `app:${slug}`;
    if (!this.prds.has(appId)) {
      return this.resolveForRoute(`/apps/${slug}`);
    }
    return this.compose([appId]);
  }

  /** Resolve PRDs for a tool category */
  resolveForToolCategory(category: string): ResolvedPrd {
    const ids = this.categoryIndex.get(category) ?? [];
    if (ids.length === 0) {
      const platform = this.prds.get("platform");
      return platform ? resolveFromChain([platform]) : resolveFromChain([]);
    }
    return this.compose(ids);
  }

  /** Compose a chain from PRD IDs, resolving parents and trimming to budget */
  compose(prdIds: string[]): ResolvedPrd {
    // Build full chain including all parent references
    const allInChain = new Map<string, PrdDefinition>();
    for (const id of prdIds) {
      const chain = buildChain(id, this.prds);
      for (const prd of chain) {
        allInChain.set(prd.id, prd);
      }
    }

    // Sort by level hierarchy
    const levelOrder: PrdLevel[] = ["platform", "domain", "route", "app", "tool-category"];
    const levelIndex = new Map(levelOrder.map((l, i) => [l, i]));
    const sorted = [...allInChain.values()].sort(
      (a, b) => (levelIndex.get(a.level) ?? 99) - (levelIndex.get(b.level) ?? 99),
    );

    const trimmed = trimToBudget(sorted, this.tokenBudget, this.levelPriority);
    return resolveFromChain(trimmed);
  }
}

/** Match a glob-style route pattern against a path */
function matchRoute(pattern: string, path: string): boolean {
  // Exact match
  if (pattern === path) return true;

  // Wildcard: /apps/* matches /apps/chess-arena
  if (pattern.endsWith("/*")) {
    const prefix = pattern.slice(0, -2);
    return path === prefix || path.startsWith(prefix + "/");
  }

  // Param pattern: /apps/$slug matches /apps/anything
  if (pattern.includes("$")) {
    const patternParts = pattern.split("/");
    const pathParts = path.split("/");
    if (patternParts.length !== pathParts.length) return false;
    return patternParts.every((part, i) => part.startsWith("$") || part === pathParts[i]);
  }

  return false;
}
