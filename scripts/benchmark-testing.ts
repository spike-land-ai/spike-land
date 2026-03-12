import { chromium } from "playwright";
import { evaluateExperiment } from "../src/edge-api/main/lazy-imports/experiment-engine";
import { performance } from "perf_hooks";

async function runPlaywrightTest() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Simulate logging into a dashboard, navigating to experiments
  // and manually triggering an evaluation or checking the DOM for "Winner: variant-a"
  // Since we don't have a real running server to point Playwright to for this exact benchmark
  // we simulate the network overhead and browser rendering cycle.

  // Mock page content for the "Dashboard"
  await page.setContent(`
    <html>
      <body>
        <div id="experiment-status">Active</div>
        <div class="variant" data-id="control" data-impressions="1000" data-donations="20">Control</div>
        <div class="variant" data-id="variant-a" data-impressions="1000" data-donations="50">Variant A</div>
        <button id="evaluate-btn">Evaluate</button>
        <div id="result"></div>
        <script>
          document.getElementById('evaluate-btn').addEventListener('click', () => {
             // Fake evaluation delay
             setTimeout(() => {
                document.getElementById('result').innerText = 'Winner: variant-a';
             }, 50);
          });
        </script>
      </body>
    </html>
  `);

  await page.click("#evaluate-btn");
  await page.waitForSelector('#result:has-text("Winner: variant-a")');

  await browser.close();
}

async function runToolTest() {
  // Directly invoking the business logic as the MCP tool does.
  // No browser, no DOM parsing, no network layers.
  const result = evaluateExperiment([
    { id: "control", impressions: 1000, donations: 20 },
    { id: "variant-a", impressions: 1000, donations: 50 },
  ]);

  if (!result.shouldGraduate || result.bestVariant !== "variant-a") {
    throw new Error("Evaluation failed");
  }
}

async function runBenchmark() {
  const RUNS = 100;
  console.log(`Running benchmark: Tool-first vs Browser-level (${RUNS} runs)`);

  // Tool-first benchmark
  let toolSuccesses = 0;
  let toolFails = 0;
  const toolStart = performance.now();
  for (let i = 0; i < RUNS; i++) {
    try {
      await runToolTest();
      toolSuccesses++;
    } catch (e) {
      toolFails++;
    }
  }
  const toolEnd = performance.now();
  const toolDuration = toolEnd - toolStart;

  console.log(`\n--- Tool-First (Vitest/MCP) ---`);
  console.log(`Successes: ${toolSuccesses}, Fails: ${toolFails}`);
  console.log(`Total Time: ${toolDuration.toFixed(2)}ms`);
  console.log(`Avg Time per run: ${(toolDuration / RUNS).toFixed(2)}ms`);

  // Browser benchmark
  let browserSuccesses = 0;
  let browserFails = 0;
  const browserStart = performance.now();
  for (let i = 0; i < RUNS; i++) {
    try {
      await runPlaywrightTest();
      browserSuccesses++;
    } catch (e) {
      browserFails++;
    }
  }
  const browserEnd = performance.now();
  const browserDuration = browserEnd - browserStart;

  console.log(`\n--- Browser-Level (Playwright) ---`);
  console.log(`Successes: ${browserSuccesses}, Fails: ${browserFails}`);
  console.log(`Total Time: ${browserDuration.toFixed(2)}ms`);
  console.log(`Avg Time per run: ${(browserDuration / RUNS).toFixed(2)}ms`);

  const speedup = browserDuration / toolDuration;
  console.log(`\nConclusion: Tool-first testing is ${speedup.toFixed(1)}x faster.`);
}

runBenchmark().catch(console.error);
