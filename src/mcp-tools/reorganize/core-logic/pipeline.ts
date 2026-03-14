import path from "node:path";
import { glob } from "glob";
import { Project } from "ts-morph";

import { excludeGlobs } from "../../../../scripts/reorganize-config.js";
import { readPackagesYaml } from "../../../../scripts/reorganize/utils.js";
import { discoverFiles } from "../../../../scripts/reorganize/discovery.js";
import {
  propagateDeps,
  computePackageCategories,
} from "../../../../scripts/reorganize/grouping.js";
import { computeMovePlans } from "../../../../scripts/reorganize/planning.js";
import type {
  FileNode,
  MovePlan,
  AliasMap,
  ManifestPkg,
} from "../../../../scripts/reorganize/types.js";

export interface PipelineResult {
  project: Project;
  nodes: FileNode[];
  aliasMap: AliasMap;
  packageCategories: Map<string, string>;
  plans: MovePlan[];
  packagesYaml: Record<string, ManifestPkg>;
  srcDir: string;
}

export async function runPipeline(srcDir?: string, _incremental = false): Promise<PipelineResult> {
  const resolvedSrcDir = srcDir
    ? path.resolve(process.cwd(), srcDir)
    : path.resolve(process.cwd(), "src");

  const packagesYaml = await readPackagesYaml();

  const project = new Project({
    tsConfigFilePath: path.resolve(process.cwd(), "tsconfig.json"),
    skipAddingFilesFromTsConfig: true,
  });

  // Incremental mode: only changed files
  let filesToProcess: string[] = [];
  if (_incremental) {
    try {
      const { execSync } = await import("node:child_process");
      const stdout = execSync("git diff --name-only HEAD", { encoding: "utf-8" });
      filesToProcess = stdout
        .split("\n")
        .filter((f) => f.startsWith("src/") && (f.endsWith(".ts") || f.endsWith(".tsx")))
        .map((f) => path.resolve(process.cwd(), f));
    } catch (_e) {}
  }

  const allFiles = await glob("**/*.{ts,tsx}", {
    cwd: resolvedSrcDir,
    ignore: excludeGlobs,
    absolute: true,
  });

  project.addSourceFilesAtPaths(allFiles);

  const { nodes: allNodes, aliasMap } = await discoverFiles(project, resolvedSrcDir);

  // Incremental mode: only keep nodes for files we wanted to process
  const nodes =
    filesToProcess.length > 0
      ? allNodes.filter((node) => filesToProcess.includes(node.absPath))
      : allNodes;

  propagateDeps(nodes);

  const packageCategories = computePackageCategories(nodes, packagesYaml);
  const plans = computeMovePlans(nodes, packageCategories);

  return {
    project,
    nodes,
    aliasMap,
    packageCategories,
    plans,
    packagesYaml,
    srcDir: resolvedSrcDir,
  };
}
