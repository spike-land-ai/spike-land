import fs from "node:fs/promises";
import path from "node:path";
import type { Project, StringLiteral, NoSubstitutionTemplateLiteral } from "ts-morph";
import { SyntaxKind } from "ts-morph";
import type { FileNode, AliasMap } from "./types.js";
import { extractRootPackage } from "./utils.js";
import { excludedDeps } from "../reorganize-config.js";

/**
 * Detect which first-level directories in srcDir are "categories"
 * (containing packages as subdirs) vs standalone packages.
 *
 * A directory is a category if:
 * - It has no package.json
 * - It has subdirectories that contain source files
 * - Any root-level .ts files are only barrel re-exports
 */
export async function detectCategoryDirs(srcDir: string): Promise<Set<string>> {
  const categories = new Set<string>();
  const entries = await fs.readdir(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dirPath = path.join(srcDir, entry.name);

    // Has package.json → standalone package, not a category
    try {
      await fs.access(path.join(dirPath, "package.json"));
      continue;
    } catch {
      // no package.json — candidate for category
    }

    // Check children: does it have subdirs with source files?
    const children = await fs.readdir(dirPath, { withFileTypes: true });
    const subDirs = children.filter(
      (c) =>
        c.isDirectory() && !["node_modules", "__tests__", "dist", ".deploy-cache"].includes(c.name),
    );

    if (subDirs.length === 0) continue;

    // Check if root-level .ts files are only barrels (export * from)
    // Exclude .d.ts files and test files from the check
    const tsFiles = children.filter(
      (c) =>
        c.isFile() &&
        (c.name.endsWith(".ts") || c.name.endsWith(".tsx")) &&
        !c.name.endsWith(".d.ts") &&
        !c.name.endsWith(".test.ts") &&
        !c.name.endsWith(".test.tsx") &&
        !c.name.endsWith(".spec.ts"),
    );

    let allBarrels = true;
    for (const tsFile of tsFiles) {
      const content = await fs.readFile(path.join(dirPath, tsFile.name), "utf-8");
      const lines = content
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("//"));
      const isBarrel = lines.every(
        (l) => l.startsWith("export *") || l.startsWith("export {") || l.startsWith("export type"),
      );
      if (!isBarrel) {
        allBarrels = false;
        break;
      }
    }

    // If it has subdirs and only barrel TS files (or no TS files), it's a category
    if (allBarrels) {
      categories.add(entry.name);
    }
  }

  return categories;
}

/**
 * For a file's relPath (relative to srcDir), extract the package name.
 * If the first segment is a category dir AND there are 3+ parts
 * (category/package/file), use the second segment.
 * Files at category root (category/file.ts) keep the category as package name.
 * Otherwise use the first segment (flat layout).
 */
function extractPackageName(relPath: string, categoryDirs: Set<string>): string {
  const parts = relPath.split(path.sep);
  const firstSeg = parts[0] ?? "";
  if (categoryDirs.has(firstSeg) && parts.length >= 3) {
    return parts[1] ?? firstSeg;
  }
  return firstSeg;
}

/**
 * Build a per-package alias map for `@/*` paths.
 * Handles both flat (src/<pkg>) and nested (src/<category>/<pkg>) layouts.
 */
async function buildAliasMap(srcDir: string, categoryDirs: Set<string>): Promise<AliasMap> {
  const aliasMap: AliasMap = new Map();

  // Collect all package directories (accounting for category nesting)
  const pkgDirs: Array<{ name: string; dir: string }> = [];
  const entries = await fs.readdir(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    if (categoryDirs.has(entry.name)) {
      // Nested: src/<category>/<pkg>/
      const catDir = path.join(srcDir, entry.name);
      const subEntries = await fs.readdir(catDir, { withFileTypes: true });
      for (const sub of subEntries) {
        if (!sub.isDirectory()) continue;
        if (["node_modules", "__tests__", "dist"].includes(sub.name)) continue;
        pkgDirs.push({ name: sub.name, dir: path.join(catDir, sub.name) });
      }
    } else {
      // Flat: src/<pkg>/
      pkgDirs.push({ name: entry.name, dir: path.join(srcDir, entry.name) });
    }
  }

  for (const { name: pkgName, dir: pkgDir } of pkgDirs) {
    // Try reading tsconfig.json for paths
    const tsconfigPath = path.join(pkgDir, "tsconfig.json");
    try {
      const content = await fs.readFile(tsconfigPath, "utf-8");
      const tsconfig = JSON.parse(content);
      const paths = tsconfig?.compilerOptions?.paths;
      if (paths && paths["@/*"]) {
        const aliasTarget = paths["@/*"][0]; // e.g. "./*" or "./@/*"
        const resolved = path.resolve(pkgDir, aliasTarget.replace("/*", ""));
        aliasMap.set(pkgName, { prefix: "@/", baseDir: resolved });
        continue;
      }
    } catch {
      // no tsconfig or can't parse — fall through to heuristics
    }

    // Heuristic: if the package has a `@/` directory, @/ maps to <pkg>/@/
    const atDir = path.join(pkgDir, "@");
    try {
      const stat = await fs.stat(atDir);
      if (stat.isDirectory()) {
        aliasMap.set(pkgName, { prefix: "@/", baseDir: atDir });
        continue;
      }
    } catch {
      // no @ directory
    }

    // Default: @/ maps to package root
    aliasMap.set(pkgName, { prefix: "@/", baseDir: pkgDir });
  }

  return aliasMap;
}

/**
 * Resolve an `@/` import to an absolute file path.
 * Returns null if the alias can't be resolved.
 */
function resolveAliasImport(
  importPath: string,
  packageName: string,
  aliasMap: AliasMap,
): string | null {
  if (!importPath.startsWith("@/")) return null;

  const entry = aliasMap.get(packageName);
  if (!entry) return null;

  const subPath = importPath.slice(2); // strip "@/"
  return path.resolve(entry.baseDir, subPath);
}

export async function discoverFiles(
  project: Project,
  srcDir?: string,
): Promise<{ nodes: FileNode[]; aliasMap: AliasMap; categoryDirs: Set<string> }> {
  const root = srcDir || path.resolve(process.cwd(), "src");
  const categoryDirs = await detectCategoryDirs(root);
  const aliasMap = await buildAliasMap(root, categoryDirs);
  const nodes: FileNode[] = [];

  if (categoryDirs.size > 0) {
    console.log(`Detected category dirs: ${[...categoryDirs].sort().join(", ")}`);
  }

  const rootWithSep = root.endsWith("/") ? root : root + "/";

  for (const sourceFile of project.getSourceFiles()) {
    const absPath = sourceFile.getFilePath();
    if (!absPath.startsWith(rootWithSep)) continue;

    const relPath = path.relative(root, absPath);
    const packageName = extractPackageName(relPath, categoryDirs);

    const externalDeps = new Set<string>();
    const relativeImports = new Set<string>();

    const imports = sourceFile.getImportDeclarations();
    const exports = sourceFile.getExportDeclarations();
    const dynamicImports = sourceFile
      .getDescendantsOfKind(SyntaxKind.CallExpression)
      .filter((c) => c.getExpression().getText() === "import");

    const specs = [
      ...imports.map((i) => i.getModuleSpecifierValue()).filter(Boolean),
      ...exports.map((e) => e.getModuleSpecifierValue()).filter(Boolean),
      ...dynamicImports
        .map((d) => {
          const arg = d.getArguments()[0];
          if (
            arg &&
            (arg.getKind() === SyntaxKind.StringLiteral ||
              arg.getKind() === SyntaxKind.NoSubstitutionTemplateLiteral)
          ) {
            return (arg as StringLiteral | NoSubstitutionTemplateLiteral).getLiteralText();
          }
          return null;
        })
        .filter(Boolean),
    ] as string[];

    for (const importPath of specs) {
      if (
        importPath.startsWith("http") ||
        importPath.endsWith(".css") ||
        importPath.endsWith(".json") ||
        importPath.includes("${")
      )
        continue;

      if (importPath.startsWith(".") || importPath.startsWith("/")) {
        const dir = path.dirname(absPath);
        const resolved = path.resolve(dir, importPath);
        relativeImports.add(resolved);
      } else if (importPath.startsWith("@/")) {
        // Resolve @/ alias to absolute path and track as relative import
        const resolved = resolveAliasImport(importPath, packageName ?? "", aliasMap);
        if (resolved) {
          relativeImports.add(resolved);
        }
      } else {
        const rootPkg = extractRootPackage(importPath);
        if (rootPkg && !excludedDeps.has(rootPkg)) {
          externalDeps.add(rootPkg);
        }
      }
    }

    nodes.push({ absPath, relPath, packageName: packageName ?? "", externalDeps, relativeImports });
  }
  return { nodes, aliasMap, categoryDirs };
}
