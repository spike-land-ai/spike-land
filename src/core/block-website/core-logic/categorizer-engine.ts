/**
 * Browser-safe code categorization engine.
 *
 * Ports the logic from scripts/reorganize-config.ts without ts-morph.
 * Runs entirely client-side — no server calls needed.
 */

// ── Import Parser ────────────────────────────────────────────────────────

const IMPORT_PATTERNS = [
  // static: import X from "pkg"
  /import\s+(?:[\w*{}\s,]+)\s+from\s+["']([^"']+)["']/g,
  // dynamic: import("pkg")
  /import\(\s*["']([^"']+)["']\s*\)/g,
  // re-export: export { X } from "pkg"
  /export\s+(?:[\w*{}\s,]+)\s+from\s+["']([^"']+)["']/g,
  // type import: import type { X } from "pkg"
  /import\s+type\s+(?:[\w*{}\s,]+)\s+from\s+["']([^"']+)["']/g,
  // require: require("pkg")
  /require\(\s*["']([^"']+)["']\s*\)/g,
];

export function parseImports(code: string): string[] {
  const externals = new Set<string>();

  for (const pattern of IMPORT_PATTERNS) {
    // Reset lastIndex for each pass since we reuse patterns
    const regex = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(code)) !== null) {
      const specifier = match[1];
      // Skip relative imports
      if (specifier.startsWith(".") || specifier.startsWith("/")) continue;
      // Normalize scoped packages: @scope/pkg/subpath -> @scope/pkg
      if (specifier.startsWith("@")) {
        const parts = specifier.split("/");
        externals.add(parts.slice(0, 2).join("/"));
      } else {
        // bare: pkg/subpath -> pkg
        externals.add(specifier.split("/")[0]);
      }
    }
  }

  return [...externals];
}

// ── Category Rules ───────────────────────────────────────────────────────

export type Category =
  | "mcp-tools"
  | "frontend"
  | "edge-api"
  | "media"
  | "cli"
  | "core"
  | "utilities";

interface CategoryResult {
  category: Category;
  reason: string;
  matchedRule: string;
}

interface CategoryRule {
  test: (deps: Set<string>) => boolean;
  category: Category;
  rule: string;
  reason: string;
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    test: (deps) => deps.has("@modelcontextprotocol/sdk"),
    category: "mcp-tools",
    rule: "@modelcontextprotocol/sdk",
    reason: "Imports MCP SDK — this is a Model Context Protocol server or tool.",
  },
  {
    test: (deps) => deps.has("react") || deps.has("react-dom"),
    category: "frontend",
    rule: "react / react-dom",
    reason: "Imports React — this is a frontend UI component or application.",
  },
  {
    test: (deps) => deps.has("hono"),
    category: "edge-api",
    rule: "hono",
    reason: "Imports Hono — this is a Cloudflare Workers edge API handler.",
  },
  {
    test: (deps) => deps.has("remotion"),
    category: "media",
    rule: "remotion",
    reason: "Imports Remotion — this is a video composition or media component.",
  },
  {
    test: (deps) => deps.has("commander"),
    category: "cli",
    rule: "commander",
    reason: "Imports Commander — this is a CLI tool entry point.",
  },
  {
    test: (deps) =>
      deps.has("@ai-sdk/anthropic") ||
      deps.has("@ai-sdk/google") ||
      deps.has("@anthropic-ai/sdk") ||
      deps.has("replicate"),
    category: "edge-api",
    rule: "AI SDK packages",
    reason: "Imports AI SDK (Anthropic/Google/Replicate) — this is an AI gateway or edge handler.",
  },
];

export function categorizeFile(externals: string[]): CategoryResult {
  const deps = new Set(externals);

  for (const rule of CATEGORY_RULES) {
    if (rule.test(deps)) {
      return { category: rule.category, reason: rule.reason, matchedRule: rule.rule };
    }
  }

  if (deps.size === 0) {
    return {
      category: "core",
      reason: "No external dependencies — pure logic belongs in core.",
      matchedRule: "no-deps",
    };
  }

  return {
    category: "utilities",
    reason: "No framework-specific imports detected — falls through to utilities.",
    matchedRule: "fallback",
  };
}

// ── Dependency Group (subdirectory suggestion) ───────────────────────────

export function suggestSubdir(externals: string[]): string {
  const deps = new Set(externals);
  if (deps.size === 0) return "core-logic";

  const has = (name: string) => [...deps].some((d) => d.includes(name));

  const tags: string[] = [];

  if (has("playwright") || has("testing-library") || has("vitest")) tags.push("testing");
  if (has("ai-sdk") || has("anthropic") || has("google/genai") || has("replicate")) tags.push("ai");
  if (has("drizzle") || has("sql.js") || has("sqlite") || has("better-sqlite3")) tags.push("db");
  if (has("hono")) tags.push("api");
  if (has("remotion")) tags.push("video");
  if (has("commander") || has("dotenv") || has("xterm") || has("readline")) tags.push("cli");
  if (has("react-three")) tags.push("3d");
  if (has("framer-motion") || has("tw-animate")) tags.push("animation");
  if (has("monaco")) tags.push("editor");
  if (has("mcp-server-base") || has("modelcontextprotocol") || has("mcp-image-studio"))
    tags.push("mcp");
  if (has("cloudflare") || has("workbox")) tags.push("edge");
  if (has("better-auth")) tags.push("auth");
  if (has("stripe")) tags.push("payments");

  // React / UI
  if (has("react") || has("radix-ui") || has("lucide") || has("emotion") || has("tailwindcss")) {
    if (!tags.includes("editor") && !tags.includes("video") && !tags.includes("3d")) {
      tags.push("ui");
    }
  }

  // Node built-ins
  if (has("node:") || has("child_process")) {
    if (tags.length === 0) tags.push("node-sys");
  }

  if (tags.length > 0) return tags.slice(0, 3).join("-");

  return "lazy-imports";
}

// ── Combined analysis (convenience) ──────────────────────────────────────

export interface CategorizationResult {
  category: Category;
  reason: string;
  matchedRule: string;
  suggestedSubdir: string;
  imports: string[];
}

export function analyzeCode(code: string): CategorizationResult {
  const imports = parseImports(code);
  const { category, reason, matchedRule } = categorizeFile(imports);
  const suggestedSubdir = suggestSubdir(imports);
  return { category, reason, matchedRule, suggestedSubdir, imports };
}
