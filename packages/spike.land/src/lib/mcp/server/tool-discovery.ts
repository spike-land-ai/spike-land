/**
 * Auto-Discovery for MCP Tool Modules
 *
 * Scans tool files at startup for exported `toolModules` arrays,
 * reducing the need to manually maintain tool-manifest.ts for in-tree tools.
 *
 * Tool files opt in by exporting:
 *   export const toolModules: ToolModuleExport[] = [
 *     { register: registerMyTools, categories: ["my-category"] },
 *   ];
 *
 * Files without a `toolModules` export are ignored — they must be
 * registered explicitly in the EXPLICIT_MODULES array in tool-manifest.ts.
 *
 * Usage in tool-manifest.ts:
 *   const discovered = await discoverToolModules();
 *   const allModules = [...discovered, ...EXPLICIT_MODULES];
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { ToolRegistry } from "./tool-registry";

export interface ToolModuleExport {
  register: (registry: ToolRegistry, userId: string) => void;
  categories?: string[];
  condition?: () => boolean;
}

const TOOLS_DIR = path.resolve(__dirname, "tools");

/**
 * Discover tool modules by scanning the tools/ directory for files
 * that export a `toolModules` array.
 *
 * Returns discovered modules sorted by file path for deterministic ordering.
 */
export async function discoverToolModules(): Promise<ToolModuleExport[]> {
  const discovered: ToolModuleExport[] = [];

  const entries = scanToolFiles(TOOLS_DIR);

  for (const filePath of entries) {
    try {
      const mod = await import(filePath);
      if (mod.toolModules && Array.isArray(mod.toolModules)) {
        for (const entry of mod.toolModules as ToolModuleExport[]) {
          discovered.push(entry);
        }
      }
    } catch {
      // Skip files that fail to import (e.g., syntax errors in dev)
    }
  }

  return discovered;
}

/**
 * Recursively scan for .ts tool files, excluding tests and helpers.
 */
function scanToolFiles(dir: string): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) return results;

  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      // Skip test utilities directory
      if (item.name === "__test-utils__" || item.name === "templates") continue;
      results.push(...scanToolFiles(fullPath));
    } else if (
      item.isFile() &&
      item.name.endsWith(".ts") &&
      !item.name.endsWith(".test.ts") &&
      !item.name.endsWith(".test.tsx") &&
      item.name !== "tool-helpers.ts"
    ) {
      results.push(fullPath);
    }
  }

  return results.sort();
}
