/**
 * Bootstrap script: parse content/apps/*.md YAML frontmatter → generate PRD stubs.
 *
 * Usage: npx tsx src/prd-registry/scripts/bootstrap-from-apps.ts
 *
 * This reads YAML frontmatter from content/apps/ markdown files and generates
 * TypeScript PRD definition files in src/prd-registry/prds/apps/.
 */

import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const APPS_DIR = join(import.meta.dirname ?? ".", "../../../content/apps");
const OUTPUT_DIR = join(import.meta.dirname ?? ".", "../prds/apps");

interface AppFrontmatter {
  name: string;
  slug: string;
  description: string;
  category?: string;
  tools?: string[];
}

function parseFrontmatter(content: string): AppFrontmatter | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const yaml = match[1];
  if (!yaml) return null;
  const result: Record<string, unknown> = {};
  let currentArrayKey: string | null = null;

  for (const line of yaml.split("\n")) {
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.+)/);
    if (kvMatch) {
      const key = kvMatch[1];
      const rawValue = kvMatch[2];
      if (!key || rawValue === undefined) continue;
      let value: unknown = rawValue.trim();
      // Strip quotes
      if (typeof value === "string" && value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      result[key] = value;
      currentArrayKey = key;
    }
    // Handle tool arrays
    if (line.match(/^\s+-\s+/)) {
      const toolMatch = line.match(/^\s+-\s+"?([^"]+)"?/);
      const toolName = toolMatch?.[1];
      if (currentArrayKey && toolName) {
        const currentValue = result[currentArrayKey];
        if (!Array.isArray(currentValue)) {
          result[currentArrayKey] = [];
        }
        const target = result[currentArrayKey];
        if (Array.isArray(target)) {
          target.push(toolName);
        }
      }
    }
  }

  if (!result.name || !result.slug) return null;
  return result as unknown as AppFrontmatter;
}

function toExportName(slug: string): string {
  return (
    slug
      .split("-")
      .map((part, i) => {
        const firstChar = part[0] ?? "";
        return i === 0 ? part : firstChar.toUpperCase() + part.slice(1);
      })
      .join("") + "Prd"
  );
}

function generatePrdFile(app: AppFrontmatter): string {
  const exportName = toExportName(app.slug);
  const tools = app.tools ?? [];
  const toolsStr =
    tools.length > 0 ? `\n  tools: [${tools.map((t) => `"${t}"`).join(", ")}],` : "\n  tools: [],";

  return `import type { PrdDefinition } from "../../core-logic/types.js";

export const ${exportName}: PrdDefinition = {
  id: "app:${app.slug}",
  level: "app",
  name: "${app.name}",
  summary: "${(app.description ?? "").slice(0, 120).replace(/"/g, '\\"')}",
  purpose: "${(app.description ?? "").replace(/"/g, '\\"')}",
  constraints: [],
  acceptance: [],
  toolCategories: [],${toolsStr}
  composesFrom: ["platform", "route:/apps"],
  routePatterns: ["/apps/${app.slug}"],
  keywords: ["${app.slug.replace(/-/g, '", "')}"],
  tokenEstimate: 350,
  version: "1.0.0",
};
`;
}

function main(): void {
  if (!existsSync(APPS_DIR)) {
    console.error(`Apps directory not found: ${APPS_DIR}`);
    process.exit(1);
  }

  const files = readdirSync(APPS_DIR).filter((f) => f.endsWith(".md"));
  let generated = 0;
  let skipped = 0;

  for (const file of files) {
    const slug = basename(file, ".md");
    const outputPath = join(OUTPUT_DIR, `${slug}.ts`);

    // Skip if already exists (don't overwrite manual PRDs)
    if (existsSync(outputPath)) {
      skipped++;
      continue;
    }

    const content = readFileSync(join(APPS_DIR, file), "utf-8");
    const frontmatter = parseFrontmatter(content);
    if (!frontmatter) {
      console.warn(`Skipping ${file}: no valid frontmatter`);
      continue;
    }

    writeFileSync(outputPath, generatePrdFile(frontmatter));
    generated++;
    console.log(`Generated: ${outputPath}`);
  }

  console.log(`\nDone: ${generated} generated, ${skipped} skipped (already exist)`);
}

main();
