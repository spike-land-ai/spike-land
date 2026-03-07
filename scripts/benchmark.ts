import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";

const ITERATIONS = 10000;
const TEST_FILE = path.join(__dirname, "test_cache.txt");

async function runBenchmark() {
  // Setup
  fs.writeFileSync(TEST_FILE, "a1b2c3d4e5f6g7h8");

  // Benchmark Sync
  const startSync = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    if (fs.existsSync(TEST_FILE)) {
      const content = fs.readFileSync(TEST_FILE, "utf-8").trim();
    }
  }
  const endSync = performance.now();
  const syncTime = endSync - startSync;

  // Benchmark Async
  const startAsync = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    try {
      const content = await fs.promises.readFile(TEST_FILE, "utf-8");
      content.trim();
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
        throw e;
      }
    }
  }
  const endAsync = performance.now();
  const asyncTime = endAsync - startAsync;

  console.log(`Sync time: ${syncTime.toFixed(2)}ms`);
  console.log(`Async time: ${asyncTime.toFixed(2)}ms`);

  // Cleanup
  fs.unlinkSync(TEST_FILE);
}

runBenchmark().catch(console.error);
