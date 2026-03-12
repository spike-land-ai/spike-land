import { describe, expect, it } from "vitest";
import type { FileNode } from "../../reorganize/types.js";
import {
  buildNodeLookup,
  propagateDeps,
  computePackageCategories,
  resolveAppName,
} from "../../reorganize/grouping.js";
import { getDependencyGroupName, deduplicateDepGroup } from "../../reorganize-config.js";

// ─── Helper to create FileNode objects ──────────────────────────────

function makeNode(
  overrides: Partial<FileNode> & { absPath: string; packageName: string },
): FileNode {
  return {
    relPath: overrides.relPath ?? overrides.absPath.replace("/src/", ""),
    externalDeps: new Set(),
    relativeImports: new Set(),
    ...overrides,
  };
}

// ─── buildNodeLookup ────────────────────────────────────────────────

describe("buildNodeLookup", () => {
  it("looks up by full path", () => {
    const node = makeNode({ absPath: "/src/foo/bar.ts", packageName: "foo" });
    const lookup = buildNodeLookup([node]);
    expect(lookup.get("/src/foo/bar.ts")).toBe(node);
  });

  it("looks up by path without extension", () => {
    const node = makeNode({ absPath: "/src/foo/bar.ts", packageName: "foo" });
    const lookup = buildNodeLookup([node]);
    expect(lookup.get("/src/foo/bar")).toBe(node);
  });

  it("looks up index.ts by directory path", () => {
    const node = makeNode({
      absPath: "/src/foo/utils/index.ts",
      packageName: "foo",
    });
    const lookup = buildNodeLookup([node]);
    expect(lookup.get("/src/foo/utils")).toBe(node);
  });

  it("handles .tsx files", () => {
    const node = makeNode({
      absPath: "/src/foo/Component.tsx",
      packageName: "foo",
    });
    const lookup = buildNodeLookup([node]);
    expect(lookup.get("/src/foo/Component")).toBe(node);
  });
});

// ─── propagateDeps ──────────────────────────────────────────────────

describe("propagateDeps", () => {
  it("initializes resolvedDeps from externalDeps", () => {
    const a = makeNode({
      absPath: "/src/pkg/a.ts",
      packageName: "pkg",
      externalDeps: new Set(["react"]),
    });
    propagateDeps([a]);
    expect(a.resolvedDeps).toEqual(new Set(["react"]));
  });

  it("propagates deps from importee to importer (correct direction)", () => {
    // A imports B. B depends on "react". A should get "react".
    const b = makeNode({
      absPath: "/src/pkg/b.ts",
      packageName: "pkg",
      externalDeps: new Set(["react"]),
    });
    const a = makeNode({
      absPath: "/src/pkg/a.ts",
      packageName: "pkg",
      relativeImports: new Set(["/src/pkg/b.ts"]),
    });

    propagateDeps([a, b]);

    expect(a.resolvedDeps).toEqual(new Set(["react"]));
    // B should NOT get A's deps (this was the old bug)
    expect(b.resolvedDeps).toEqual(new Set(["react"]));
  });

  it("does NOT propagate deps from importer to importee (old bug)", () => {
    // A imports B. A depends on "hono". B should NOT get "hono".
    const b = makeNode({
      absPath: "/src/pkg/b.ts",
      packageName: "pkg",
    });
    const a = makeNode({
      absPath: "/src/pkg/a.ts",
      packageName: "pkg",
      externalDeps: new Set(["hono"]),
      relativeImports: new Set(["/src/pkg/b.ts"]),
    });

    propagateDeps([a, b]);

    expect(a.resolvedDeps).toEqual(new Set(["hono"]));
    expect(b.resolvedDeps).toEqual(new Set()); // B must NOT inherit "hono" from A
  });

  it("handles transitive deps: A → B → C", () => {
    const c = makeNode({
      absPath: "/src/pkg/c.ts",
      packageName: "pkg",
      externalDeps: new Set(["drizzle-orm"]),
    });
    const b = makeNode({
      absPath: "/src/pkg/b.ts",
      packageName: "pkg",
      relativeImports: new Set(["/src/pkg/c.ts"]),
      externalDeps: new Set(["hono"]),
    });
    const a = makeNode({
      absPath: "/src/pkg/a.ts",
      packageName: "pkg",
      relativeImports: new Set(["/src/pkg/b.ts"]),
    });

    propagateDeps([a, b, c]);

    // A should have both hono (from B) and drizzle (transitively from C via B)
    expect(a.resolvedDeps).toEqual(new Set(["hono", "drizzle-orm"]));
    // B should have its own + C's
    expect(b.resolvedDeps).toEqual(new Set(["hono", "drizzle-orm"]));
    // C should only have its own
    expect(c.resolvedDeps).toEqual(new Set(["drizzle-orm"]));
  });

  it("handles diamond dependencies: A → B, A → C, B → D, C → D", () => {
    const d = makeNode({
      absPath: "/src/pkg/d.ts",
      packageName: "pkg",
      externalDeps: new Set(["zlib"]),
    });
    const b = makeNode({
      absPath: "/src/pkg/b.ts",
      packageName: "pkg",
      relativeImports: new Set(["/src/pkg/d.ts"]),
      externalDeps: new Set(["react"]),
    });
    const c = makeNode({
      absPath: "/src/pkg/c.ts",
      packageName: "pkg",
      relativeImports: new Set(["/src/pkg/d.ts"]),
      externalDeps: new Set(["hono"]),
    });
    const a = makeNode({
      absPath: "/src/pkg/a.ts",
      packageName: "pkg",
      relativeImports: new Set(["/src/pkg/b.ts", "/src/pkg/c.ts"]),
    });

    propagateDeps([a, b, c, d]);

    expect(a.resolvedDeps).toEqual(new Set(["react", "hono", "zlib"]));
    expect(d.resolvedDeps).toEqual(new Set(["zlib"]));
  });

  it("resolves imports without extension", () => {
    const b = makeNode({
      absPath: "/src/pkg/b.ts",
      packageName: "pkg",
      externalDeps: new Set(["lodash"]),
    });
    const a = makeNode({
      absPath: "/src/pkg/a.ts",
      packageName: "pkg",
      relativeImports: new Set(["/src/pkg/b"]), // no .ts extension
    });

    propagateDeps([a, b]);

    expect(a.resolvedDeps).toEqual(new Set(["lodash"]));
  });

  it("resolves imports to index files via directory path", () => {
    const idx = makeNode({
      absPath: "/src/pkg/utils/index.ts",
      packageName: "pkg",
      externalDeps: new Set(["lodash"]),
    });
    const a = makeNode({
      absPath: "/src/pkg/a.ts",
      packageName: "pkg",
      relativeImports: new Set(["/src/pkg/utils"]), // points to directory
    });

    propagateDeps([a, idx]);

    expect(a.resolvedDeps).toEqual(new Set(["lodash"]));
  });

  it("handles files with no imports (leaf nodes)", () => {
    const leaf = makeNode({
      absPath: "/src/pkg/leaf.ts",
      packageName: "pkg",
    });

    propagateDeps([leaf]);

    expect(leaf.resolvedDeps).toEqual(new Set());
  });
});

// ─── computePackageCategories ───────────────────────────────────────

describe("computePackageCategories", () => {
  it("uses kindToCategory when packages.yaml specifies a kind", () => {
    const node = makeNode({
      absPath: "/src/my-mcp/index.ts",
      packageName: "my-mcp",
      externalDeps: new Set(["react"]), // Would normally be "frontend"
      resolvedDeps: new Set(["react"]),
    });

    const categories = computePackageCategories([node], {
      "my-mcp": { kind: "mcp-server" },
    });

    // packages.yaml kind overrides file-level classification
    expect(categories.get("my-mcp")).toBe("mcp-tools");
  });

  it("uses dominant file category when no kind in packages.yaml", () => {
    const nodes = [
      makeNode({
        absPath: "/src/app/page.tsx",
        packageName: "app",
        externalDeps: new Set(["react"]),
        resolvedDeps: new Set(["react"]),
      }),
      makeNode({
        absPath: "/src/app/utils.ts",
        packageName: "app",
        externalDeps: new Set(),
        resolvedDeps: new Set(),
      }),
      makeNode({
        absPath: "/src/app/component.tsx",
        packageName: "app",
        externalDeps: new Set(["react"]),
        resolvedDeps: new Set(["react"]),
      }),
    ];

    const categories = computePackageCategories(nodes, {});

    // 2 files are "frontend" (react), 1 is fallback → dominant is "frontend"
    expect(categories.get("app")).toBe("frontend");
  });

  it("falls back to 'utilities' when no kind and no dominant category", () => {
    const node = makeNode({
      absPath: "/src/misc/helpers.ts",
      packageName: "misc",
      externalDeps: new Set(),
      resolvedDeps: new Set(),
    });

    const categories = computePackageCategories([node], {});

    expect(categories.get("misc")).toBe("utilities");
  });

  it("all files in a package get the same category", () => {
    const nodes = [
      makeNode({
        absPath: "/src/spike-cli/index.ts",
        packageName: "spike-cli",
        externalDeps: new Set(["commander"]),
        resolvedDeps: new Set(["commander"]),
      }),
      makeNode({
        absPath: "/src/spike-cli/utils.ts",
        packageName: "spike-cli",
        externalDeps: new Set(), // Would normally be "utilities"
        resolvedDeps: new Set(),
      }),
    ];

    const categories = computePackageCategories(nodes, {
      "spike-cli": { kind: "cli" },
    });

    // Both files share the package's category
    expect(categories.get("spike-cli")).toBe("cli");
  });

  it("worker kind maps to edge-api", () => {
    const node = makeNode({
      absPath: "/src/spike-edge/index.ts",
      packageName: "spike-edge",
      resolvedDeps: new Set(),
    });

    const categories = computePackageCategories([node], {
      "spike-edge": { kind: "worker" },
    });

    expect(categories.get("spike-edge")).toBe("edge-api");
  });

  it("browser kind maps to frontend", () => {
    const node = makeNode({
      absPath: "/src/spike-app/main.tsx",
      packageName: "spike-app",
      resolvedDeps: new Set(),
    });

    const categories = computePackageCategories([node], {
      "spike-app": { kind: "browser" },
    });

    expect(categories.get("spike-app")).toBe("frontend");
  });
});

// ─── resolveAppName ─────────────────────────────────────────────────

describe("resolveAppName", () => {
  it("uses name override when available", () => {
    expect(resolveAppName("spike-app")).toBe("platform-frontend");
    expect(resolveAppName("code")).toBe("monaco-editor");
  });

  it("strips -mcp suffix for non-overridden packages", () => {
    expect(resolveAppName("hackernews-mcp")).toBe("hackernews");
    expect(resolveAppName("esbuild-wasm-mcp")).toBe("esbuild-wasm");
  });

  it("strips mcp- prefix for non-overridden packages", () => {
    expect(resolveAppName("mcp-auth")).toBe("auth");
  });

  it("returns the name unchanged when no override or mcp pattern", () => {
    expect(resolveAppName("shared")).toBe("shared-utils");
    expect(resolveAppName("transpile")).toBe("transpile");
  });

  it("spike-cli maps to spike-cli (not 'cli' which would cause stutter)", () => {
    expect(resolveAppName("spike-cli")).toBe("spike-cli");
  });
});

// ─── Integration: cli stutter prevention ────────────────────────────

describe("cli stutter prevention (cli/cli/cli → cli/spike-cli/core-logic)", () => {
  it("spike-cli package produces non-stuttering path", () => {
    const nodes = [
      makeNode({
        absPath: "/src/spike-cli/index.ts",
        packageName: "spike-cli",
        externalDeps: new Set(["commander"]),
        resolvedDeps: new Set(["commander"]),
      }),
    ];

    const categories = computePackageCategories(nodes, {
      "spike-cli": { kind: "cli" },
    });

    const category = categories.get("spike-cli");
    const appName = resolveAppName("spike-cli");

    const depGroup = getDependencyGroupName(nodes[0].resolvedDeps);
    const finalDepGroup = deduplicateDepGroup(depGroup, category);

    const path = `${category}/${appName}/${finalDepGroup}`;

    // Must NOT be cli/cli/cli
    expect(path).not.toBe("cli/cli/cli");
    // Should be cli/spike-cli/core-logic
    expect(category).toBe("cli");
    expect(appName).toBe("spike-cli");
    expect(finalDepGroup).toBe("core-logic"); // "cli" dep-group deduped to "core-logic"
    expect(path).toBe("cli/spike-cli/core-logic");
  });
});
