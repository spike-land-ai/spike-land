/**
 * Index Builder
 *
 * Builds a vector index from the monorepo's TypeScript source files.
 * Uses AST-aware chunking at function/class boundaries.
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, extname } from "node:path";
import type { Chunk, ChunkMetadata } from "../core-logic/types.ts";
import { EmbeddingClient } from "./embedding-client.ts";
import { VectorStore } from "./vector-store.ts";

const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".cache",
  "__pycache__",
  ".yarn",
]);
const IGNORE_FILES = new Set([".d.ts", ".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx"]);
const MAX_FILE_SIZE = 100_000; // 100KB
const CHUNK_MAX_LINES = 80;
const CHUNK_MIN_LINES = 5;
const EMBEDDING_BATCH_SIZE = 10;

// ── AST-aware chunking via regex ───────────────────────────────────────

const BOUNDARY_PATTERNS = [
  /^export\s+(?:async\s+)?function\s+(\w+)/,
  /^export\s+(?:default\s+)?class\s+(\w+)/,
  /^export\s+(?:default\s+)?interface\s+(\w+)/,
  /^export\s+type\s+(\w+)/,
  /^export\s+(?:const|let)\s+(\w+)/,
  /^export\s+enum\s+(\w+)/,
  /^(?:async\s+)?function\s+(\w+)/,
  /^class\s+(\w+)/,
  /^interface\s+(\w+)/,
  /^const\s+(\w+)\s*=\s*(?:async\s+)?\(/,
];

function inferSymbolType(line: string): ChunkMetadata["symbolType"] {
  if (/\bfunction\b/.test(line)) return "function";
  if (/\bclass\b/.test(line)) return "class";
  if (/\binterface\b/.test(line)) return "interface";
  if (/\btype\b/.test(line)) return "type";
  if (/\bconst\b/.test(line)) return "const";
  return "module";
}

function chunkFile(content: string, filePath: string, packageName: string | undefined): Chunk[] {
  const lines = content.split("\n");
  const chunks: Chunk[] = [];
  let currentStart = 0;
  let currentSymbol: string | undefined;
  let currentType: ChunkMetadata["symbolType"] = "module";

  function flush(endLine: number) {
    if (endLine - currentStart < CHUNK_MIN_LINES) return;

    const chunkLines = lines.slice(currentStart, endLine);
    const chunkContent = chunkLines.join("\n").trim();
    if (!chunkContent) return;

    chunks.push({
      id: `${filePath}:${currentStart + 1}-${endLine}`,
      content: chunkContent,
      metadata: {
        filePath,
        startLine: currentStart + 1,
        endLine,
        symbolName: currentSymbol,
        symbolType: currentType,
        packageName,
      },
      embedding: undefined,
    });
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    // Check if this line is a symbol boundary
    for (const pattern of BOUNDARY_PATTERNS) {
      const match = pattern.exec(line);
      if (match) {
        // Flush previous chunk
        if (i > currentStart) {
          flush(i);
        }
        currentStart = i;
        currentSymbol = match[1];
        currentType = inferSymbolType(line);
        break;
      }
    }

    // Force flush at max chunk size
    if (i - currentStart >= CHUNK_MAX_LINES) {
      flush(i);
      currentStart = i;
      currentSymbol = undefined;
      currentType = "module";
    }
  }

  // Flush remaining
  flush(lines.length);

  return chunks;
}

// ── File walking ───────────────────────────────────────────────────────

function inferPackageName(filePath: string, root: string): string | undefined {
  const rel = relative(root, filePath);
  const parts = rel.split("/");
  // src/mcp-tools/crystalline/... → crystalline
  // src/edge-api/main/... → main
  if (parts[0] === "src" && parts.length >= 3) {
    return parts[2];
  }
  return undefined;
}

async function walkDir(dir: string, root: string, files: string[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;

    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await walkDir(fullPath, root, files);
    } else if (entry.isFile()) {
      const ext = extname(entry.name);
      if (!EXTENSIONS.has(ext)) continue;
      if ([...IGNORE_FILES].some((suffix: string) => entry.name.endsWith(suffix))) continue;

      try {
        const s = await stat(fullPath);
        if (s.size <= MAX_FILE_SIZE) {
          files.push(fullPath);
        }
      } catch {
        // Skip unreadable files
      }
    }
  }
}

// ── Public API ─────────────────────────────────────────────────────────

export async function buildIndex(
  monorepoRoot: string,
  embeddingClient: EmbeddingClient,
  onProgress?: (processed: number, total: number) => void,
): Promise<VectorStore> {
  const store = new VectorStore();
  const srcDir = join(monorepoRoot, "src");

  // Collect all source files
  const files: string[] = [];
  await walkDir(srcDir, monorepoRoot, files);

  console.log(`[crystalline] Found ${files.length} source files to index`);

  // Chunk all files
  const allChunks: Chunk[] = [];

  for (const filePath of files) {
    try {
      const content = await readFile(filePath, "utf-8");
      const relPath = relative(monorepoRoot, filePath);
      const packageName = inferPackageName(filePath, monorepoRoot);
      const chunks = chunkFile(content, relPath, packageName);
      allChunks.push(...chunks);
    } catch {
      // Skip unreadable files
    }
  }

  console.log(`[crystalline] Created ${allChunks.length} chunks from ${files.length} files`);

  // Embed in batches
  for (let i = 0; i < allChunks.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = allChunks.slice(i, i + EMBEDDING_BATCH_SIZE);
    const texts = batch.map((c) => c.content);

    try {
      const embeddings = await embeddingClient.embed(texts);
      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j]!;
        chunk.embedding = embeddings[j];
      }
    } catch (err) {
      console.error(`[crystalline] Embedding batch ${i}-${i + batch.length} failed:`, err);
    }

    onProgress?.(Math.min(i + EMBEDDING_BATCH_SIZE, allChunks.length), allChunks.length);
  }

  store.addChunks(allChunks);
  return store;
}
