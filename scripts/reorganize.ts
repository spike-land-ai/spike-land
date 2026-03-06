#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";
import { parseArgs } from "node:util";
import { execSync } from "node:child_process";
import * as yaml from "yaml";
import {
  excludedDeps,
  categoryRules,
  fallbackCategory,
  nameOverrides,
  excludeGlobs,
} from "./reorganize-config.js";

// Multi-pattern regexes for parsing imports
const staticImportRe = /\bimport\s+(?:type\s+)?(?:[a-zA-Z0-9_{},\s\*]+)\s+from\s+["']([^"'\n]+)["']/g;
const sideEffectRe = /\bimport\s+["']([^"'\n]+)["']/g;
const dynamicRe = /\bimport\(\s*["']([^"'\n]+)["']\s*\)/g;

interface FileNode {
  absPath: string;
  relPath: string; // relative to src/
  packageName: string;
  externalDeps: Set<string>;
  relativeImports: Set<string>; // abs paths
  resolvedDeps?: Set<string>; // inherited
}

interface MovePlan {
  fileNode: FileNode;
  targetDir: string;
  targetFileName: string;
  targetRelPath: string; // new path relative to src/
}

interface ManifestPkg {
  kind?: string;
}

// ─── UTILS ─────────────────────────────────────────────────────────────

function extractRootPackage(importPath: string): string | null {
  if (importPath.startsWith(".") || importPath.startsWith("/") || importPath.startsWith("http")) {
    return null;
  }
  if (importPath.startsWith("@/")) {
    return null; // path alias
  }
  const parts = importPath.split("/");
  if (importPath.startsWith("@") && parts.length >= 2) {
    return `${parts[0]}/${parts[1]}`;
  }
  return parts[0];
}

async function readPackagesYaml(): Promise<Record<string, ManifestPkg>> {
  try {
    const content = await fs.readFile("packages.yaml", "utf-8");
    const parsed = yaml.parse(content);
    return parsed.packages || {};
  } catch (e) {
    return {};
  }
}

// ─── PHASE 2: DISCOVERY ───────────────────────────────────────────────

async function discoverFiles(): Promise<FileNode[]> {
  const root = path.resolve(process.cwd(), "src");
  const files = await glob("**/*.{ts,tsx}", {
    cwd: root,
    ignore: excludeGlobs,
    absolute: true,
  });

  const nodes: FileNode[] = [];
  for (const absPath of files) {
    const relPath = path.relative(root, absPath);
    const packageName = relPath.split(path.sep)[0]; // assumed standard

    const content = await fs.readFile(absPath, "utf-8");
    const externalDeps = new Set<string>();
    const relativeImports = new Set<string>();

    const matches = [
      ...content.matchAll(staticImportRe),
      ...content.matchAll(sideEffectRe),
      ...content.matchAll(dynamicRe),
    ];

    for (const match of matches) {
      const importPath = match[1];
      if (importPath.startsWith("http") || importPath.endsWith(".css") || importPath.endsWith(".json")) continue;

      if (importPath.startsWith(".") || importPath.startsWith("/")) {
        // Resolve relative to absolute
        const dir = path.dirname(absPath);
        const resolved = path.resolve(dir, importPath);
        relativeImports.add(resolved); // Note: we don't resolve exact extension here yet
      } else if (importPath.startsWith("@/")) {
        // Path alias logic could go here, treating as internal
      } else {
        const rootPkg = extractRootPackage(importPath);
        if (rootPkg && !excludedDeps.has(rootPkg)) {
          externalDeps.add(rootPkg);
        }
      }
    }

    nodes.push({ absPath, relPath, packageName, externalDeps, relativeImports });
  }
  return nodes;
}

// ─── PHASE 3: GROUPING ────────────────────────────────────────────────

function resolveZeroImportFiles(nodes: FileNode[]) {
  // Build reverse map
  const reverseMap = new Map<string, FileNode[]>();
  // Approximate resolution matching
  const nodesByAbsNoExt = new Map<string, FileNode>();
  for (const n of nodes) {
    const noExt = n.absPath.replace(/\.(tsx|ts|js|jsx)$/, "");
    nodesByAbsNoExt.set(noExt, n);
    // Also store index variants
    if (noExt.endsWith("/index")) {
      nodesByAbsNoExt.set(noExt.slice(0, -6), n);
    }
  }

  for (const n of nodes) {
    for (const rel of n.relativeImports) {
      const relNoExt = rel.replace(/\.(tsx|ts|js|jsx)$/, "");
      let target = nodesByAbsNoExt.get(relNoExt);
      if (!target) target = nodesByAbsNoExt.get(relNoExt + "/index");
      if (target) {
        let arr = reverseMap.get(target.absPath);
        if (!arr) {
          arr = [];
          reverseMap.set(target.absPath, arr);
        }
        arr.push(n);
      }
    }
  }

  // Iterate to propagate deps
  for (const n of nodes) {
    n.resolvedDeps = new Set(n.externalDeps);
  }

  let changed = true;
  let rounds = 0;
  while (changed && rounds < 10) {
    changed = false;
    rounds++;
    for (const n of nodes) {
      const importers = reverseMap.get(n.absPath) || [];
      const sizeBefore = n.resolvedDeps!.size;
      for (const imp of importers) {
        for (const dep of imp.resolvedDeps!) {
          n.resolvedDeps!.add(dep);
        }
      }
      if (n.resolvedDeps!.size > sizeBefore) changed = true;
    }
  }
}

function buildDepSetKey(deps: Set<string>): string {
  if (deps.size === 0) return "core-utils";
  return Array.from(deps).sort().join(",");
}

function resolveAppName(packageName: string): string {
  if (nameOverrides[packageName]) return nameOverrides[packageName];
  let name = packageName;
  if (name.endsWith("-mcp")) name = name.replace("-mcp", "");
  if (name.startsWith("mcp-")) name = name.replace("mcp-", "");
  return name;
}

// ─── PHASE 4: FLATTEN ─────────────────────────────────────────────────

function flattenFilename(relPath: string, packageName: string): string {
  const parts = relPath.split(path.sep);
  const fileName = parts.pop()!;
  
  if (fileName === "index.ts" || fileName === "index.tsx") {
    // Prefix with parent dir unless parent is the package root
    if (parts.length > 1) {
      const parent = parts[parts.length - 1];
      return `${parent}-${fileName}`;
    }
  }
  return fileName;
}

// ─── EXECUTION ────────────────────────────────────────────────────────

function rewriteImports(content: string, oldPath: string, newPath: string, pathMapping: Map<string, string>): string {
  const newDir = path.dirname(newPath);
  
  return content.replace(staticImportRe, (match, p1) => {
    return rewriteSingleImport(match, p1, oldPath, newDir, pathMapping);
  })
  .replace(sideEffectRe, (match, p1) => {
    return rewriteSingleImport(match, p1, oldPath, newDir, pathMapping);
  })
  .replace(dynamicRe, (match, p1) => {
    return rewriteSingleImport(match, p1, oldPath, newDir, pathMapping);
  });
}

function rewriteSingleImport(match: string, p1: string, oldPath: string, newDir: string, pathMapping: Map<string, string>): string {
  if (p1.startsWith("http") || (!p1.startsWith(".") && !p1.startsWith("/") && !p1.startsWith("@/"))) {
    return match;
  }
  
  // Note: path aliases (@/) would need special handling if their resolution changes
  if (p1.startsWith("@/")) {
    return match; // assuming aliases still resolve to src root
  }

  const oldDir = path.dirname(oldPath);
  let resolvedAbs = path.resolve(oldDir, p1);
  
  // Try to find the mapped file
  let mapped = pathMapping.get(resolvedAbs);
  if (!mapped) {
    // Try adding extension
    if (pathMapping.has(resolvedAbs + ".ts")) mapped = pathMapping.get(resolvedAbs + ".ts");
    else if (pathMapping.has(resolvedAbs + ".tsx")) mapped = pathMapping.get(resolvedAbs + ".tsx");
    else if (pathMapping.has(resolvedAbs.replace(/\.js$/, ".ts"))) mapped = pathMapping.get(resolvedAbs.replace(/\.js$/, ".ts"));
    else if (pathMapping.has(resolvedAbs.replace(/\.js$/, ".tsx"))) mapped = pathMapping.get(resolvedAbs.replace(/\.js$/, ".tsx"));
    
    // Try index
    else if (pathMapping.has(resolvedAbs + "/index.ts")) mapped = pathMapping.get(resolvedAbs + "/index.ts");
  }

  if (mapped) {
    let newRel = path.relative(newDir, mapped);
    if (!newRel.startsWith(".")) newRel = "./" + newRel;
    // Restore .js convention if used
    if (p1.endsWith(".js")) {
      newRel = newRel.replace(/\.tsx?$/, ".js");
    } else {
       // if we mapped to an index, and original didn't specify index
       if (mapped.endsWith("index.ts") && !p1.endsWith("index.ts") && !p1.endsWith("index.js")) {
          newRel = newRel.replace(/\/index\.tsx?$/, "");
          if (newRel === "") newRel = ".";
       } else {
          newRel = newRel.replace(/\.tsx?$/, "");
       }
    }
    return match.replace(p1, newRel);
  }
  
  return match;
}

async function updatePackageJsonWorkspaces(outputDir: string) {
  try {
    const pkgJsonPath = path.resolve(process.cwd(), "package.json");
    const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, "utf-8"));
    if (pkgJson.workspaces) {
      const outRel = path.basename(outputDir);
      const newGlob = `${outRel}/*/*/*`;
      if (!pkgJson.workspaces.includes(newGlob)) {
        pkgJson.workspaces.push(newGlob);
        await fs.writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + "\n");
        console.log(`Updated package.json workspaces with ${newGlob}`);
      }
    }
  } catch (e) {
    console.error("Failed to update package.json workspaces", e);
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────

async function main() {
  const { values } = parseArgs({
    options: {
      apply: { type: "boolean" },
      verify: { type: "boolean" },
      output: { type: "string", default: "src-reorganized" },
    },
  });

  const outputDir = path.resolve(process.cwd(), values.output as string);
  const srcDir = path.resolve(process.cwd(), "src");

  if (values.apply) {
    try {
      execSync("git diff --quiet", { stdio: "ignore" });
    } catch {
      console.error("Git working directory not clean. Commit or stash before --apply");
      process.exit(1);
    }
  }

  const packagesYaml = await readPackagesYaml();
  const nodes = await discoverFiles();
  resolveZeroImportFiles(nodes);

  const plans: MovePlan[] = [];
  const targetCounts = new Map<string, number>();

  for (const n of nodes) {
    const key = buildDepSetKey(n.resolvedDeps!);
    let category = fallbackCategory;
    
    for (const rule of categoryRules) {
      if (rule.predicate(n.resolvedDeps!, n.externalDeps, packagesYaml[n.packageName]?.kind)) {
        category = rule.category;
        break;
      }
    }

    const appName = resolveAppName(n.packageName);
    const targetDir = path.join(key, category, appName);
    
    // Handle tests directory
    let isTest = n.relPath.includes("__tests__") || n.absPath.endsWith(".test.ts") || n.absPath.endsWith(".test.tsx");
    const finalDir = isTest ? path.join(targetDir, "__tests__") : targetDir;
    
    let fileName = flattenFilename(n.relPath, n.packageName);
    
    // Collision detection
    const fullTargetDir = path.join(outputDir, finalDir);
    const targetPath = path.join(fullTargetDir, fileName);
    let disambigName = fileName;
    let count = targetCounts.get(targetPath) || 0;
    if (count > 0) {
      const ext = path.extname(fileName);
      const base = path.basename(fileName, ext);
      disambigName = `${base}-${n.packageName}${ext}`;
    }
    targetCounts.set(targetPath, count + 1);

    plans.push({
      fileNode: n,
      targetDir: finalDir,
      targetFileName: disambigName,
      targetRelPath: path.join(finalDir, disambigName),
    });
  }

  console.log(`Discovered ${nodes.length} files. Grouping...`);

  if (!values.apply) {
    const stats = new Map<string, number>();
    for (const p of plans) {
      stats.set(p.targetDir, (stats.get(p.targetDir) || 0) + 1);
    }
    console.log(`\nDry run summary (Top 15 dirs):`);
    const sorted = [...stats.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
    for (const [dir, count] of sorted) {
      console.log(`  ${dir}: ${count} files`);
    }
    console.log(`\nRun with --apply to execute.`);
    return;
  }

  // Execution
  console.log(`\nApplying changes to ${values.output}...`);
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });

  const pathMapping = new Map<string, string>();
  for (const p of plans) {
    const absNewPath = path.resolve(outputDir, p.targetRelPath);
    pathMapping.set(p.fileNode.absPath, absNewPath);
  }

  for (const p of plans) {
    const absNewPath = path.resolve(outputDir, p.targetRelPath);
    await fs.mkdir(path.dirname(absNewPath), { recursive: true });
    
    const content = await fs.readFile(p.fileNode.absPath, "utf-8");
    const newContent = rewriteImports(content, p.fileNode.absPath, absNewPath, pathMapping);
    await fs.writeFile(absNewPath, newContent, "utf-8");
  }

  // Generate barrels (naive implementation for intermediate dirs)
  const dirSet = new Set<string>();
  for (const p of plans) {
    let d = path.dirname(p.targetRelPath);
    while (d !== "." && d !== "/") {
      dirSet.add(d);
      d = path.dirname(d);
    }
  }
  
  // Sort descending by length to do bottom-up
  const sortedDirs = Array.from(dirSet).sort((a, b) => b.length - a.length);
  for (const d of sortedDirs) {
    // Skip test dirs
    if (d.includes("__tests__")) continue;
    
    const absD = path.resolve(outputDir, d);
    const entries = await fs.readdir(absD, { withFileTypes: true });
    let barrelContent = "";
    for (const entry of entries) {
      if (entry.name === "index.ts" || entry.name === "index.tsx") continue;
      const baseName = entry.isDirectory() ? entry.name : path.basename(entry.name, path.extname(entry.name));
      // In a real implementation we'd check if it's exportable, etc. 
      // This is a naive barrel.
      barrelContent += `export * from "./${baseName}";\n`;
    }
    if (barrelContent) {
       await fs.writeFile(path.join(absD, "index.ts"), barrelContent, "utf-8");
    }
  }

  await updatePackageJsonWorkspaces(outputDir);

  if (values.verify) {
    console.log("\nVerifying...");
    try {
      console.log("Running TSC...");
      // This will fail if tsconfig doesn't include the new dir yet, 
      // but for completeness we include the requested command.
      execSync("npx tsc --noEmit", { stdio: "inherit" });
      console.log("Running ESLint...");
      execSync("npx eslint " + values.output, { stdio: "inherit" });
      console.log("Running Vitest...");
      execSync("npx vitest run " + values.output, { stdio: "inherit" });
      console.log("Verification passed!");
    } catch (e) {
      console.error("Verification failed:", e);
    }
  }
}

main().catch(console.error);
