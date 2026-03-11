/**
 * Temporary runner: execute business plan analyzer against spike.land
 *
 * spike.land is a client-rendered SPA, so fetchWebsiteContent gets minimal body.
 * We enrich the ExtractedContent with real project data from docs/meta before
 * sending to the AI analyzer.
 *
 * Usage: ANTHROPIC_API_KEY=sk-ant-api03-... npx tsx scripts/run-biz-analyzer.ts
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ExtractedContent } from "../src/edge-api/spike-land/core-logic/tools/business-plan-analyzer.ts";
import {
  fetchWebsiteContent,
  buildAnalysisPrompt,
  callAnthropicAnalysis,
} from "../src/edge-api/spike-land/core-logic/tools/business-plan-analyzer.ts";

const TARGET_URL = "https://spike.land";
const FOCUS = "general" as const;

// When run via `npx tsx scripts/run-biz-analyzer.ts` from repo root, cwd is root.
// import.meta.dirname points to scripts/, so go up one level.
const ROOT = import.meta.dirname ? resolve(import.meta.dirname, "..") : process.cwd();

/** Read a local file and return its contents, or empty string on failure. */
function readLocal(relPath: string): string {
  try {
    const full = resolve(ROOT, relPath);
    return readFileSync(full, "utf-8");
  } catch {
    return "";
  }
}

/**
 * Enrich the thin SPA-extracted content with real project documentation
 * so the AI analyzer has substantive material to work with.
 */
function enrichContent(base: ExtractedContent): ExtractedContent {
  const sections: string[] = [base.bodyText];

  // Pull key docs that describe the product/business
  const docFiles = [
    "docs/business/PRO_SCHEMA_ANALYSIS.md",
    "docs/features/APP_STORE_OVERVIEW.md",
    "docs/features/FEATURES.md",
    "docs/features/SUBSCRIPTION_TIERS.md",
    "docs/README.md",
    "CLAUDE.md",
  ];

  for (const f of docFiles) {
    const text = readLocal(f);
    if (text) {
      sections.push(`\n\n--- SOURCE: ${f} ---\n${text.slice(0, 15000)}`);
    }
  }

  // Add product links that a real rendered page would show
  const productLinks = [
    "https://spike.land/store",
    "https://spike.land/docs",
    "https://spike.land/playground",
    "https://spike.land/mcp",
    "https://github.com/nicetransition/spike-land-ai",
    "https://spike.land/api/health",
  ];

  return {
    ...base,
    bodyText: sections.join("\n"),
    links: [...base.links, ...productLinks],
  };
}

async function main() {
  // Step 1: Fetch & extract signals
  console.log(`\n=== Fetching ${TARGET_URL} ===\n`);
  const rawContent = await fetchWebsiteContent(TARGET_URL);
  console.log(`Title: ${rawContent.title}`);
  console.log(`Description: ${rawContent.description}`);
  console.log(`Raw body: ${rawContent.bodyText.length} chars (SPA shell)`);
  console.log(`Meta tags: ${Object.keys(rawContent.metaTags).length}`);

  // Enrich with local docs
  const content = enrichContent(rawContent);
  console.log(`Enriched body: ${content.bodyText.length} chars`);
  console.log(`Links: ${content.links.length}`);

  // Step 2: Full AI analysis
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log("\n=== Skipping AI analysis: ANTHROPIC_API_KEY not set ===");
    console.log("Usage: ANTHROPIC_API_KEY=sk-ant-api03-... npx tsx scripts/run-biz-analyzer.ts\n");
    const prompt = buildAnalysisPrompt(content, FOCUS);
    console.log(`Prompt system: ${prompt.system.length} chars`);
    console.log(`Prompt user: ${prompt.user.length} chars`);
    return;
  }

  console.log(`\n=== Running PRO_V1 Analysis (${FOCUS} focus) ===\n`);
  const prompt = buildAnalysisPrompt(content, FOCUS);
  console.log(`Prompt: ${prompt.system.length + prompt.user.length} total chars`);
  const env = { ANTHROPIC_API_KEY: apiKey };
  const result = await callAnthropicAnalysis(env, prompt.user, prompt.system);

  console.log(`\nTokens: ${result.usage.input_tokens} in / ${result.usage.output_tokens} out\n`);
  console.log("=".repeat(60));
  console.log(result.text);
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
