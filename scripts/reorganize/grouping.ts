import type { FileNode } from "./types.js";
import {
  categoryRules,
  fallbackCategory,
  nameOverrides,
  kindToCategory,
} from "../reorganize-config.js";

export function buildNodeLookup(nodes: FileNode[]): Map<string, FileNode> {
  const lookup = new Map<string, FileNode>();
  for (const n of nodes) {
    lookup.set(n.absPath, n);
    const noExt = n.absPath.replace(/\.(tsx|ts|js|jsx)$/, "");
    lookup.set(noExt, n);
    if (noExt.endsWith("/index")) {
      lookup.set(noExt.slice(0, -6), n);
    }
  }
  return lookup;
}

export function resolveImportTarget(
  importPath: string,
  lookup: Map<string, FileNode>,
): FileNode | undefined {
  const noExt = importPath.replace(/\.(tsx|ts|js|jsx)$/, "");
  return lookup.get(importPath) || lookup.get(noExt) || lookup.get(noExt + "/index");
}

export function propagateDeps(nodes: FileNode[]) {
  const lookup = buildNodeLookup(nodes);

  for (const n of nodes) {
    n.resolvedDeps = new Set(n.externalDeps);
  }

  let changed = true;
  let rounds = 0;
  while (changed && rounds < 10) {
    changed = false;
    rounds++;
    for (const n of nodes) {
      const sizeBefore = n.resolvedDeps!.size;
      for (const importPath of n.relativeImports) {
        const target = resolveImportTarget(importPath, lookup);
        if (target?.resolvedDeps) {
          for (const dep of target.resolvedDeps) {
            n.resolvedDeps!.add(dep);
          }
        }
      }
      if (n.resolvedDeps!.size > sizeBefore) changed = true;
    }
  }
}

export function computePackageCategories(
  nodes: FileNode[],
  packagesYaml: Record<string, { kind?: string }>,
): Map<string, string> {
  const result = new Map<string, string>();

  const byPackage = new Map<string, FileNode[]>();
  for (const n of nodes) {
    let arr = byPackage.get(n.packageName);
    if (!arr) {
      arr = [];
      byPackage.set(n.packageName, arr);
    }
    arr.push(n);
  }

  for (const [pkgName, pkgNodes] of byPackage) {
    const pkgKind = packagesYaml[pkgName]?.kind;

    if (pkgKind && kindToCategory[pkgKind]) {
      result.set(pkgName, kindToCategory[pkgKind]);
      continue;
    }

    const categoryCounts = new Map<string, number>();
    for (const n of pkgNodes) {
      let fileCategory = fallbackCategory;
      for (const rule of categoryRules) {
        if (rule.predicate(n.resolvedDeps!, n.externalDeps, pkgKind)) {
          fileCategory = rule.category;
          break;
        }
      }
      categoryCounts.set(fileCategory, (categoryCounts.get(fileCategory) || 0) + 1);
    }

    let bestCategory = fallbackCategory;
    let bestCount = 0;
    for (const [cat, count] of categoryCounts) {
      if (cat !== fallbackCategory && count > bestCount) {
        bestCategory = cat;
        bestCount = count;
      }
    }

    result.set(pkgName, bestCategory);
  }

  return result;
}

export function resolveAppName(packageName: string): string {
  if (nameOverrides[packageName]) return nameOverrides[packageName];
  let name = packageName;
  if (name.endsWith("-mcp")) name = name.replace("-mcp", "");
  if (name.startsWith("mcp-")) name = name.replace("mcp-", "");
  return name;
}
