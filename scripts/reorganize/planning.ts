import path from "node:path";
import {
  fallbackCategory,
  getDependencyGroupName,
  deduplicateDepGroup,
} from "../reorganize-config.js";
import type { MovePlan, FileNode } from "./types.js";
import { resolveAppName } from "./grouping.js";
import { flattenFilename } from "./flatten.js";

export function computeMovePlans(
  nodes: FileNode[],
  packageCategories: Map<string, string>,
  MAX_BUCKET_SIZE: number = 20,
  categoryDirs?: Set<string>,
): MovePlan[] {
  // Pass 1: Initial grouping to count bucket sizes
  const bucketCounts = new Map<string, number>();
  for (const n of nodes) {
    const depGroupRaw = getDependencyGroupName(n.externalDeps); // Use direct deps
    const category = packageCategories.get(n.packageName) || fallbackCategory;
    const depGroupName = deduplicateDepGroup(depGroupRaw, category);
    const appName = resolveAppName(n.packageName);
    const bucket = path.join(category, appName, depGroupName);
    bucketCounts.set(bucket, (bucketCounts.get(bucket) || 0) + 1);
  }

  const plans: MovePlan[] = [];
  const targetCounts = new Map<string, number>();

  for (const n of nodes) {
    const depGroupRaw = getDependencyGroupName(n.externalDeps); // Use direct deps
    const category = packageCategories.get(n.packageName) || fallbackCategory;

    // Deduplicate: avoid cli/cli/cli stutter
    const depGroupName = deduplicateDepGroup(depGroupRaw, category);

    const appName = resolveAppName(n.packageName);
    let targetDir = path.join(category, appName, depGroupName);

    // Issue 3: Split oversized buckets
    // For 2-level structure (category/package/subdir/...), skip 2 segments
    // For flat structure (package/subdir/...), skip 1 segment
    // Also skip leading segment if it matches the dep group (avoid stutter
    // when source already has dep-group-based dirs)
    if ((bucketCounts.get(targetDir) || 0) > MAX_BUCKET_SIZE) {
      const parts = path.dirname(n.relPath).split(path.sep);
      const firstSeg = parts[0] ?? "";
      const skipCount = categoryDirs?.has(firstSeg) ? 2 : 1;
      let subParts = parts.slice(skipCount);
      // Strip leading segment if it duplicates the dep group name
      if (subParts.length > 0 && subParts[0] === depGroupName) {
        subParts = subParts.slice(1);
      }
      const subDir = subParts.join(path.sep);
      if (subDir) {
        targetDir = path.join(targetDir, subDir);
      }
    }

    const fileName = flattenFilename(n.relPath, n.packageName);

    // Issue 3 (Co-locate tests): Put tests in __tests__ subfolder
    if (fileName.endsWith(".test.ts") || fileName.endsWith(".test.tsx")) {
      targetDir = path.join(targetDir, "__tests__");
    }

    const targetPathKey = path.join(targetDir, fileName);
    let disambigName = fileName;
    const count = targetCounts.get(targetPathKey) || 0;
    if (count > 0) {
      const ext = path.extname(fileName);
      const base = path.basename(fileName, ext);
      disambigName = `${base}-${n.packageName}${ext}`;
    }
    targetCounts.set(targetPathKey, count + 1);

    plans.push({
      fileNode: n,
      targetDir: targetDir,
      targetFileName: disambigName,
      targetRelPath: path.join(targetDir, disambigName),
    });
  }
  return plans;
}
