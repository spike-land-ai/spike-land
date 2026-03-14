#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";
import { parseArgs } from "node:util";
import { execSync } from "node:child_process";
import { Project } from "ts-morph";
import chokidar from "chokidar";

import { excludeGlobs } from "./reorganize-config.js";
import { readPackagesYaml } from "./reorganize/utils.js";
import { discoverFiles } from "./reorganize/discovery.js";
import { propagateDeps, computePackageCategories } from "./reorganize/grouping.js";
import { computeMovePlans } from "./reorganize/planning.js";
import { checkLint } from "./reorganize/linting.js";
import { reportDryRun, reportDiff } from "./reorganize/reporting.js";
import {
  rewriteImports,
  updateTsConfigPaths,
  updatePackagesConfigs,
  updatePackageJsonWorkspaces,
  generateManifests,
  generateBarrels,
  copyAssets,
} from "./reorganize/execution.js";

async function runReorganization(values: unknown) {
  const MAX_BUCKET_SIZE = 20;
  const outputDir = path.resolve(process.cwd(), values.output as string);
  const srcDir = path.resolve(process.cwd(), values.src as string);

  const packagesYaml = await readPackagesYaml();

  const project = new Project({
    tsConfigFilePath: path.resolve(process.cwd(), "tsconfig.json"),
    skipAddingFilesFromTsConfig: true,
  });

  // Incremental mode: only changed files
  let filesToProcess: string[] = [];
  if (values.incremental) {
    try {
      const stdout = execSync("git diff --name-only HEAD", { encoding: "utf-8" });
      const srcRel = values.src as string;
      filesToProcess = stdout
        .split("\n")
        .filter((f) => f.startsWith(srcRel + "/") && (f.endsWith(".ts") || f.endsWith(".tsx")))
        .map((f) => path.resolve(process.cwd(), f));
    } catch (_e) {}
  }

  const allFiles = await glob("**/*.{ts,tsx}", {
    cwd: srcDir,
    ignore: excludeGlobs,
    absolute: true,
  });

  const _files = filesToProcess.length > 0 ? filesToProcess : allFiles;
  project.addSourceFilesAtPaths(allFiles);

  const { nodes, aliasMap, categoryDirs } = await discoverFiles(project, srcDir);
  propagateDeps(nodes);

  // Package-level category assignment
  const packageCategories = computePackageCategories(nodes, packagesYaml);

  const plans = computeMovePlans(nodes, packageCategories, MAX_BUCKET_SIZE, categoryDirs);

  // Lint mode: check for category violations
  if (values.lint) {
    const violations = checkLint(nodes, packageCategories);
    if (violations > 0) {
      console.error(`Found ${violations} lint violations.`);
      process.exit(1);
    }
    console.log("Lint passed.");
    return;
  }

  console.log(`Discovered ${nodes.length} files. Grouping...`);

  // --diff mode: show old path → new path
  if (values.diff) {
    reportDiff(plans);
    return;
  }

  if (!values.apply) {
    reportDryRun(plans);
    return;
  }

  console.log(`\nApplying changes to ${values.output}...`);
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });

  const pathMapping = new Map<string, string>();
  for (const p of plans) {
    const absNewPath = path.resolve(outputDir, p.targetRelPath);
    pathMapping.set(p.fileNode.absPath, absNewPath);
  }

  // Issue 10: Reversible mapping file
  const reversibleMapping: Record<string, string> = {};
  for (const [oldAbs, newAbs] of pathMapping.entries()) {
    reversibleMapping[path.relative(process.cwd(), oldAbs)] = path.relative(outputDir, newAbs);
  }
  await fs.writeFile(
    path.join(outputDir, ".mapping.json"),
    JSON.stringify(reversibleMapping, null, 2),
  );

  for (const p of plans) {
    const absNewPath = path.resolve(outputDir, p.targetRelPath);
    await fs.mkdir(path.dirname(absNewPath), { recursive: true });

    const newContent = rewriteImports(
      project,
      p.fileNode.absPath,
      absNewPath,
      pathMapping,
      aliasMap,
      p.fileNode.packageName,
    );
    await fs.writeFile(absNewPath, newContent, "utf-8");
  }

  await copyAssets(srcDir, outputDir, pathMapping);
  await generateBarrels(outputDir, plans);
  await updateTsConfigPaths(pathMapping, srcDir);
  await updatePackagesConfigs(pathMapping, srcDir);
  await updatePackageJsonWorkspaces(outputDir);
  await generateManifests(plans, outputDir);

  if (values.verify) {
    console.log("\nVerifying...");
    try {
      execSync("npx tsc --noEmit", { stdio: "inherit" });
      execSync("npx eslint " + values.output, { stdio: "inherit" });
      execSync("npx vitest run " + values.output, { stdio: "inherit" });
      console.log("Verification passed!");
    } catch (e) {
      console.error("Verification failed:", e);
    }
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      apply: { type: "boolean" },
      verify: { type: "boolean" },
      diff: { type: "boolean" },
      watch: { type: "boolean" },
      lint: { type: "boolean" },
      incremental: { type: "boolean" },
      src: { type: "string", default: "src-old" },
      output: { type: "string", default: "src-reorganized" },
    },
  });

  await runReorganization(values);

  if (values.watch) {
    const watchDir = path.resolve(process.cwd(), values.src as string);
    console.log(`Watching ${watchDir} for changes...`);
    chokidar
      .watch(watchDir, { persistent: true, ignoreInitial: true })
      .on("all", async (event, path) => {
        console.log(`Change detected: ${event} ${path}. Re-running...`);
        await runReorganization(values).catch(console.error);
      });
  }
}

main().catch(console.error);
