/**
 * Benchmark Harness
 *
 * Compares crystalline (context-enriched) vs raw Ollama vs Opus
 * across a bank of test prompts.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";

interface BenchmarkPrompt {
  id: string;
  category: "implementation" | "debugging" | "query" | "refactoring" | "explanation";
  question: string;
  expectedKeywords: string[];
  expectedFiles?: string[];
}

interface BenchmarkResult {
  promptId: string;
  provider: string;
  response: string;
  latencyMs: number;
  keywordHits: number;
  keywordTotal: number;
  fileHits: number;
  fileTotal: number;
  score?: number;
}

const PROMPTS: BenchmarkPrompt[] = [
  {
    id: "query-rate-limiter",
    category: "query",
    question: "Where is rate limiting implemented in the spike-land-ai codebase?",
    expectedKeywords: ["RateLimiter", "Durable Object", "grace limit"],
    expectedFiles: ["src/edge-api/main/core-logic/rate-limiter.ts"],
  },
  {
    id: "query-transpile-fix",
    category: "query",
    question: "What was the transpile worker custom domain fix about?",
    expectedKeywords: ["js.spike.land", "wrangler.toml", "routes"],
  },
  {
    id: "debug-import-path",
    category: "debugging",
    question: "If I get 'Module not found' for @spike-land-ai/shared, where should I look?",
    expectedKeywords: ["src/core/shared-utils", "tsconfig", "paths"],
  },
  {
    id: "impl-new-route",
    category: "implementation",
    question: "How would I add a new API route to spike-edge?",
    expectedKeywords: ["Hono", "routes", "middleware", "wrangler"],
    expectedFiles: ["src/edge-api/main/api/routes"],
  },
  {
    id: "explain-mcp",
    category: "explanation",
    question:
      "Explain the MCP ecosystem in spike-land-ai. How do the different MCP servers relate?",
    expectedKeywords: ["spike-land-mcp", "mcp-server-base", "bazdmeg", "tools"],
  },
];

async function callEndpoint(
  endpoint: string,
  model: string,
  question: string,
): Promise<{ content: string; latencyMs: number }> {
  const start = performance.now();

  const res = await fetch(`${endpoint}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: question }],
      temperature: 0.2,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    throw new Error(`${endpoint} returned ${res.status}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content ?? "";
  const latencyMs = performance.now() - start;

  return { content, latencyMs };
}

function scoreResult(
  prompt: BenchmarkPrompt,
  response: string,
): Pick<BenchmarkResult, "keywordHits" | "keywordTotal" | "fileHits" | "fileTotal"> {
  const lower = response.toLowerCase();
  const keywordHits = prompt.expectedKeywords.filter((kw) =>
    lower.includes(kw.toLowerCase()),
  ).length;
  const fileHits = (prompt.expectedFiles ?? []).filter((f) => response.includes(f)).length;

  return {
    keywordHits,
    keywordTotal: prompt.expectedKeywords.length,
    fileHits,
    fileTotal: (prompt.expectedFiles ?? []).length,
  };
}

export async function runBenchmark(config: {
  crystallineEndpoint: string;
  crystallineModel: string;
  rawOllamaEndpoint: string;
  rawOllamaModel: string;
  outputPath: string;
}): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];

  for (const prompt of PROMPTS) {
    console.log(`\n[benchmark] Running: ${prompt.id}`);

    // Crystalline (enriched)
    try {
      const { content, latencyMs } = await callEndpoint(
        config.crystallineEndpoint,
        config.crystallineModel,
        prompt.question,
      );
      const scoring = scoreResult(prompt, content);
      results.push({
        promptId: prompt.id,
        provider: "crystalline",
        response: content,
        latencyMs,
        ...scoring,
      });
      console.log(
        `  crystalline: ${latencyMs.toFixed(0)}ms, keywords=${scoring.keywordHits}/${scoring.keywordTotal}`,
      );
    } catch (err) {
      console.error(`  crystalline FAILED:`, err);
    }

    // Raw Ollama (no context)
    try {
      const { content, latencyMs } = await callEndpoint(
        config.rawOllamaEndpoint,
        config.rawOllamaModel,
        prompt.question,
      );
      const scoring = scoreResult(prompt, content);
      results.push({
        promptId: prompt.id,
        provider: "raw-ollama",
        response: content,
        latencyMs,
        ...scoring,
      });
      console.log(
        `  raw-ollama: ${latencyMs.toFixed(0)}ms, keywords=${scoring.keywordHits}/${scoring.keywordTotal}`,
      );
    } catch (err) {
      console.error(`  raw-ollama FAILED:`, err);
    }
  }

  // Save results
  await mkdir(dirname(config.outputPath), { recursive: true });
  await writeFile(config.outputPath, JSON.stringify(results, null, 2));
  console.log(`\n[benchmark] Results saved to ${config.outputPath}`);

  // Summary
  const crystalline = results.filter((r) => r.provider === "crystalline");
  const raw = results.filter((r) => r.provider === "raw-ollama");

  const avgKeywordsCrystalline =
    crystalline.reduce((s, r) => s + r.keywordHits / r.keywordTotal, 0) / (crystalline.length || 1);
  const avgKeywordsRaw =
    raw.reduce((s, r) => s + r.keywordHits / r.keywordTotal, 0) / (raw.length || 1);
  const avgLatencyCrystalline =
    crystalline.reduce((s, r) => s + r.latencyMs, 0) / (crystalline.length || 1);
  const avgLatencyRaw = raw.reduce((s, r) => s + r.latencyMs, 0) / (raw.length || 1);

  console.log(`\n=== Summary ===`);
  console.log(
    `Crystalline: avg keywords=${(avgKeywordsCrystalline * 100).toFixed(1)}%, avg latency=${avgLatencyCrystalline.toFixed(0)}ms`,
  );
  console.log(
    `Raw Ollama:  avg keywords=${(avgKeywordsRaw * 100).toFixed(1)}%, avg latency=${avgLatencyRaw.toFixed(0)}ms`,
  );

  return results;
}

// CLI entry
if (process.argv[1]?.includes("harness")) {
  runBenchmark({
    crystallineEndpoint: "http://localhost:11435",
    crystallineModel: "qwen3:8b",
    rawOllamaEndpoint: "http://localhost:11434",
    rawOllamaModel: "qwen3:8b",
    outputPath: join(process.cwd(), ".crystalline", "benchmark-results.json"),
  }).catch(console.error);
}
