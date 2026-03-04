import * as fs from 'node:fs/promises';
import { glob } from 'glob';
import { 
  mapTestToSource, 
  getFileHash, 
  loadCache, 
  saveCache, 
  runVitestWithCoverage 
} from '../src/incremental-test-mcp/logic.js';

const CACHE_PATH = "incremental-coverage.json";
const REPORT_PATH = "docs/INCREMENTAL_COVERAGE_STATUS.md";

async function main() {
  const allTestFiles = await glob('.tests/**/*.test.ts');
  const cache = await loadCache(CACHE_PATH);
  
  // Group tests by their target source file
  const sourceToTests: Record<string, string[]> = {};
  for (const testFile of allTestFiles) {
    const srcFile = mapTestToSource(testFile);
    if (!sourceToTests[srcFile]) sourceToTests[srcFile] = [];
    sourceToTests[srcFile].push(testFile);
  }

  const results = [];

  for (const [srcFilePath, testFiles] of Object.entries(sourceToTests)) {
    // Check if source exists
    try {
      await fs.access(srcFilePath);
    } catch {
      continue; // Skip if source file doesn't exist
    }

    const srcHash = await getFileHash(srcFilePath);
    const testHashes = await Promise.all(testFiles.map(f => getFileHash(f)));
    const combinedTestHash = testHashes.join(',');

    const existing = cache[srcFilePath];
    let coverage = 0;
    let success = false;

    if (existing && existing.sourceHash === srcHash && (existing as any).combinedTestHash === combinedTestHash && existing.success) {
      coverage = existing.coverage;
      success = existing.success;
      console.log(`[CACHED] ${srcFilePath}: ${coverage}%`);
    } else {
      console.log(`[RUNNING] ${srcFilePath} (via ${testFiles.length} tests: ${testFiles.join(', ')})...`);
      // Run all tests for this source combined
      const testPattern = testFiles.join(' ');
      const result = await runVitestWithCoverage(testPattern, srcFilePath);
      coverage = result.coverage;
      success = result.success;
      
      cache[srcFilePath] = {
        sourceHash: srcHash,
        testHash: '', // legacy
        combinedTestHash,
        coverage,
        success,
      } as any;
      await saveCache(CACHE_PATH, cache);
      console.log(`[RESULT] ${srcFilePath}: ${coverage}% ${success ? "PASSED" : "FAILED"}`);
    }

    results.push({ testFiles, srcFilePath, coverage, success });
  }

  // Generate report
  const fullyCovered = results.filter(r => r.coverage === 100 && r.success);
  const others = results.filter(r => r.coverage < 100 || !r.success);

  let report = `# Incremental Coverage Report\n\n`;
  report += `## 100% Coverage ✅ (${fullyCovered.length})\n\n`;
  fullyCovered.forEach(r => {
    report += `- [ ] ${r.srcFilePath} (via ${r.testFiles.join(', ')})\n`;
  });

  report += `\n## Progressing 🚧 (${others.length})\n\n`;
  others.sort((a, b) => b.coverage - a.coverage).forEach(r => {
    report += `- [ ] ${r.srcFilePath}: ${r.coverage}% (via ${r.testFiles.join(', ')})${!r.success ? " ❌" : ""}\n`;
  });

  await fs.writeFile(REPORT_PATH, report);
  console.log(`\nReport updated: ${REPORT_PATH}`);
}

main().catch(console.error);
