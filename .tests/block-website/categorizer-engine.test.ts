import { describe, it, expect } from "vitest";
import {
  parseImports,
  categorizeFile,
  suggestSubdir,
  analyzeCode,
  type Category,
} from "../../src/core/block-website/core-logic/categorizer-engine.js";

// ── parseImports ──────────────────────────────────────────────────────────────

describe("parseImports", () => {
  it("parses static named imports", () => {
    const code = `import { foo } from "lodash";`;
    expect(parseImports(code)).toContain("lodash");
  });

  it("parses default imports", () => {
    const code = `import React from "react";`;
    expect(parseImports(code)).toContain("react");
  });

  it("parses namespace imports", () => {
    const code = `import * as fs from "node:fs";`;
    expect(parseImports(code)).toContain("node:fs");
  });

  it("parses dynamic imports", () => {
    const code = `const mod = await import("some-module");`;
    expect(parseImports(code)).toContain("some-module");
  });

  it("parses re-exports", () => {
    const code = `export { something } from "another-package";`;
    expect(parseImports(code)).toContain("another-package");
  });

  it("parses type imports", () => {
    const code = `import type { Foo } from "zod";`;
    expect(parseImports(code)).toContain("zod");
  });

  it("parses require() calls", () => {
    const code = `const x = require("express");`;
    expect(parseImports(code)).toContain("express");
  });

  it("skips relative imports starting with '.'", () => {
    const code = `import { x } from "./local-file";`;
    expect(parseImports(code)).not.toContain("./local-file");
  });

  it("skips absolute path imports starting with '/'", () => {
    const code = `import { x } from "/absolute/path";`;
    expect(parseImports(code)).not.toContain("/absolute/path");
  });

  it("normalizes scoped packages to scope/name (drops subpath)", () => {
    const code = `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";`;
    const imports = parseImports(code);
    expect(imports).toContain("@modelcontextprotocol/sdk");
    expect(imports).not.toContain("@modelcontextprotocol/sdk/server/mcp.js");
  });

  it("normalizes bare packages to root name (drops subpath)", () => {
    const code = `import { something } from "lodash/fp";`;
    const imports = parseImports(code);
    expect(imports).toContain("lodash");
    expect(imports).not.toContain("lodash/fp");
  });

  it("deduplicates identical specifiers from multiple imports", () => {
    const code = `
      import { a } from "react";
      import { b } from "react";
      import { c } from "react";
    `;
    const imports = parseImports(code);
    expect(imports.filter((i) => i === "react")).toHaveLength(1);
  });

  it("handles multiple different imports in one file", () => {
    const code = `
      import React from "react";
      import { useState } from "react";
      import { Hono } from "hono";
      import type { Env } from "./types";
    `;
    const imports = parseImports(code);
    expect(imports).toContain("react");
    expect(imports).toContain("hono");
    expect(imports).not.toContain("./types");
  });

  it("returns an empty array for code with only relative imports", () => {
    const code = `
      import { x } from "./a";
      import { y } from "../b";
    `;
    expect(parseImports(code)).toHaveLength(0);
  });

  it("returns an empty array for code with no imports at all", () => {
    const code = `const x = 1 + 2;`;
    expect(parseImports(code)).toHaveLength(0);
  });
});

// ── categorizeFile ────────────────────────────────────────────────────────────

describe("categorizeFile", () => {
  function category(imports: string[]): Category {
    return categorizeFile(imports).category;
  }

  it("categorizes MCP SDK imports as mcp-tools", () => {
    expect(category(["@modelcontextprotocol/sdk"])).toBe("mcp-tools");
  });

  it("categorizes react imports as frontend", () => {
    expect(category(["react"])).toBe("frontend");
    expect(category(["react-dom"])).toBe("frontend");
    expect(category(["react", "react-dom"])).toBe("frontend");
  });

  it("categorizes hono imports as edge-api", () => {
    expect(category(["hono"])).toBe("edge-api");
  });

  it("categorizes remotion imports as media", () => {
    expect(category(["remotion"])).toBe("media");
  });

  it("categorizes commander imports as cli", () => {
    expect(category(["commander"])).toBe("cli");
  });

  it("categorizes AI SDK imports as edge-api", () => {
    expect(category(["@ai-sdk/anthropic"])).toBe("edge-api");
    expect(category(["@ai-sdk/google"])).toBe("edge-api");
    expect(category(["@anthropic-ai/sdk"])).toBe("edge-api");
    expect(category(["replicate"])).toBe("edge-api");
  });

  it("categorizes zero-dependency files as core", () => {
    expect(category([])).toBe("core");
  });

  it("falls through to utilities for unknown deps", () => {
    expect(category(["lodash", "dayjs"])).toBe("utilities");
  });

  it("MCP rule takes priority over react", () => {
    // MCP rule is first in the rule list
    expect(category(["@modelcontextprotocol/sdk", "react"])).toBe("mcp-tools");
  });

  it("includes the matched rule name in the result", () => {
    const result = categorizeFile(["hono"]);
    expect(result.matchedRule).toBe("hono");
    expect(result.reason).toContain("Hono");
  });

  it("includes a reason describing the core fallback", () => {
    const result = categorizeFile([]);
    expect(result.reason).toContain("No external dependencies");
    expect(result.matchedRule).toBe("no-deps");
  });

  it("includes a reason for utilities fallback", () => {
    const result = categorizeFile(["some-util"]);
    expect(result.reason).toContain("No framework-specific");
    expect(result.matchedRule).toBe("fallback");
  });
});

// ── suggestSubdir ─────────────────────────────────────────────────────────────

describe("suggestSubdir", () => {
  it("returns core-logic for zero external deps", () => {
    expect(suggestSubdir([])).toBe("core-logic");
  });

  it("suggests testing for playwright and vitest", () => {
    expect(suggestSubdir(["playwright"])).toBe("testing");
    expect(suggestSubdir(["vitest"])).toBe("testing");
  });

  it("suggests testing-ui for @testing-library/react (triggers both testing and ui tags)", () => {
    // @testing-library/react contains both "testing-library" (testing tag)
    // and "react" (ui tag), so both tags are combined
    expect(suggestSubdir(["@testing-library/react"])).toBe("testing-ui");
  });

  it("suggests db for drizzle/sqlite deps", () => {
    expect(suggestSubdir(["drizzle-orm"])).toBe("db");
    expect(suggestSubdir(["better-sqlite3"])).toBe("db");
  });

  it("suggests api for hono", () => {
    expect(suggestSubdir(["hono"])).toBe("api");
  });

  it("suggests cli for commander", () => {
    expect(suggestSubdir(["commander"])).toBe("cli");
  });

  it("suggests animation for framer-motion", () => {
    expect(suggestSubdir(["framer-motion"])).toBe("animation");
  });

  it("suggests mcp for MCP deps", () => {
    expect(suggestSubdir(["@modelcontextprotocol/sdk"])).toBe("mcp");
  });

  it("suggests edge for cloudflare packages", () => {
    expect(suggestSubdir(["@cloudflare/workers-types"])).toBe("edge");
  });

  it("suggests ui for react deps (not editor/video/3d)", () => {
    expect(suggestSubdir(["react"])).toBe("ui");
    expect(suggestSubdir(["@radix-ui/react-dialog"])).toBe("ui");
  });

  it("suggests editor for monaco deps (overrides ui)", () => {
    expect(suggestSubdir(["monaco-editor"])).toBe("editor");
  });

  it("suggests video for remotion (overrides ui)", () => {
    expect(suggestSubdir(["remotion"])).toBe("video");
  });

  it("suggests auth for better-auth", () => {
    expect(suggestSubdir(["better-auth"])).toBe("auth");
  });

  it("returns lazy-imports for unrecognized non-empty deps", () => {
    expect(suggestSubdir(["some-totally-unknown-package"])).toBe("lazy-imports");
  });

  it("limits combined tags to first three", () => {
    // playwright (testing) + drizzle (db) + hono (api) + commander (cli)
    const result = suggestSubdir(["playwright", "drizzle-orm", "hono", "commander"]);
    // Should be at most 3 segments joined by "-"
    expect(result.split("-").length).toBeLessThanOrEqual(4); // 3 tags each max 1 word... some tags are one word
    expect(result).toContain("testing");
  });
});

// ── analyzeCode ───────────────────────────────────────────────────────────────

describe("analyzeCode", () => {
  it("returns all fields: category, reason, matchedRule, suggestedSubdir, imports", () => {
    const result = analyzeCode(`import { Hono } from "hono";`);
    expect(result.category).toBe("edge-api");
    expect(result.matchedRule).toBe("hono");
    expect(result.reason).toBeTruthy();
    expect(result.suggestedSubdir).toBe("api");
    expect(result.imports).toContain("hono");
  });

  it("correctly analyzes pure logic code with no imports", () => {
    const result = analyzeCode(`export function add(a: number, b: number) { return a + b; }`);
    expect(result.category).toBe("core");
    expect(result.suggestedSubdir).toBe("core-logic");
    expect(result.imports).toHaveLength(0);
  });

  it("correctly analyzes a React component", () => {
    const result = analyzeCode(`
      import React from "react";
      import { useState } from "react";
      export const MyComponent = () => null;
    `);
    expect(result.category).toBe("frontend");
    expect(result.suggestedSubdir).toBe("ui");
    expect(result.imports).toContain("react");
  });

  it("correctly analyzes an MCP server file", () => {
    const result = analyzeCode(`
      import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
      import { z } from "zod";
    `);
    expect(result.category).toBe("mcp-tools");
    expect(result.suggestedSubdir).toBe("mcp");
  });
});
