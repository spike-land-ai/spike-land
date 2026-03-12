#!/usr/bin/env npx tsx
/**
 * QA Studio E2E Smoke Test
 *
 * Tests the live spike.land app across key routes using Playwright.
 * Captures: page load errors, console errors, broken links, accessibility issues,
 * HTTP failures, and visual regressions.
 */

import { chromium, type Page, type Browser, type BrowserContext } from "playwright";

const BASE_URL = "https://spike.land";

interface TestResult {
  route: string;
  status: "pass" | "fail" | "warn";
  loadTimeMs: number;
  httpStatus: number | null;
  consoleErrors: string[];
  consoleWarnings: string[];
  networkErrors: string[];
  title: string;
  issues: string[];
}

const ROUTES_TO_TEST = [
  "/",
  "/apps",
  "/blog",
  "/docs",
  "/mcp",
  "/pricing",
  "/store",
  "/tools",
  "/what-we-do",
  "/login",
  "/bugbook",
  "/learn",
  "/version",
  "/cockpit",
  "/build",
  "/analytics",
  "/settings",
];

async function testRoute(page: Page, route: string): Promise<TestResult> {
  const result: TestResult = {
    route,
    status: "pass",
    loadTimeMs: 0,
    httpStatus: null,
    consoleErrors: [],
    consoleWarnings: [],
    networkErrors: [],
    title: "",
    issues: [],
  };

  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  const networkErrors: string[] = [];

  // Listen for console messages
  const consoleHandler = (msg: { type: () => string; text: () => string }) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Filter out known noise
      if (!text.includes("favicon") && !text.includes("net::ERR_")) {
        consoleErrors.push(text.slice(0, 200));
      }
    }
    if (msg.type() === "warning") {
      consoleWarnings.push(msg.text().slice(0, 200));
    }
  };
  page.on("console", consoleHandler);

  // Listen for request failures
  const requestFailedHandler = (request: {
    url: () => string;
    failure: () => { errorText: string } | null;
  }) => {
    const failure = request.failure();
    if (failure && !request.url().includes("favicon")) {
      networkErrors.push(`${request.url().slice(0, 100)}: ${failure.errorText}`);
    }
  };
  page.on("requestfailed", requestFailedHandler);

  const url = `${BASE_URL}${route}`;
  const start = Date.now();

  try {
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    result.httpStatus = response?.status() ?? null;
    result.loadTimeMs = Date.now() - start;

    // Wait for network to settle
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {
      result.issues.push("Network did not reach idle within 15s");
    });

    result.title = await page.title();

    // Check HTTP status
    if (result.httpStatus && result.httpStatus >= 400) {
      result.issues.push(`HTTP ${result.httpStatus}`);
      result.status = "fail";
    }

    // Check if page has meaningful content
    const bodyText = await page.evaluate(() => document.body?.innerText?.length ?? 0);
    if (bodyText < 10) {
      result.issues.push("Page appears empty (< 10 chars of text)");
      result.status = "warn";
    }

    // Check for React error boundaries / error states
    const errorBoundary = await page.$(
      '[data-testid="error-boundary"], .error-boundary, [class*="error"]',
    );
    if (errorBoundary) {
      const errorText = await errorBoundary.innerText().catch(() => "");
      if (errorText && errorText.toLowerCase().includes("error")) {
        result.issues.push(`Error boundary visible: "${errorText.slice(0, 100)}"`);
        result.status = "fail";
      }
    }

    // Check for broken images
    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("img"));
      return imgs
        .filter(
          (img) =>
            img.complete && img.naturalWidth === 0 && img.src && !img.src.startsWith("data:"),
        )
        .map((img) => img.src.slice(0, 100));
    });
    if (brokenImages.length > 0) {
      result.issues.push(`Broken images: ${brokenImages.join(", ")}`);
      result.status = "warn";
    }

    // Check viewport / responsive: no horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 5;
    });
    if (hasHorizontalScroll) {
      result.issues.push("Horizontal scroll detected (possible layout overflow)");
      result.status = "warn";
    }

    // Wait for React hydration before checking landmarks
    await page.waitForSelector("h1, main, [role='main']", { timeout: 5000 }).catch(() => {});

    // Check basic accessibility: page should have h1 or main landmark
    const hasMainLandmark = await page.$("main, [role='main']");
    const hasH1 = await page.$("h1");
    if (!hasMainLandmark && !hasH1) {
      result.issues.push("No <main> landmark or <h1> heading found");
      result.status = "warn";
    }

    // Check for uncaught JS errors in the page
    const pageErrors = await page.evaluate(() => {
      return (window as unknown as { __pageErrors?: string[] }).__pageErrors ?? [];
    });
    if (pageErrors.length > 0) {
      result.issues.push(`Page JS errors: ${pageErrors.join("; ").slice(0, 200)}`);
      result.status = "fail";
    }
  } catch (err) {
    result.loadTimeMs = Date.now() - start;
    result.issues.push(`Navigation failed: ${(err as Error).message.slice(0, 200)}`);
    result.status = "fail";
  }

  // Collect console/network errors
  result.consoleErrors = consoleErrors;
  result.consoleWarnings = consoleWarnings;
  result.networkErrors = networkErrors;

  if (consoleErrors.length > 0) {
    result.status = result.status === "pass" ? "warn" : result.status;
  }
  if (networkErrors.length > 0) {
    result.status = result.status === "pass" ? "warn" : result.status;
  }

  page.removeListener("console", consoleHandler);
  page.removeListener("requestfailed", requestFailedHandler);

  return result;
}

async function testNavigation(page: Page): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Navigate to home first
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

  // Find all nav links
  const navLinks = await page.$$eval("nav a[href]", (links) =>
    links
      .map((a) => ({
        href: (a as HTMLAnchorElement).href,
        text: a.textContent?.trim() ?? "",
      }))
      .filter((l) => l.href.includes("spike.land") && !l.href.includes("#"))
      .slice(0, 20),
  );

  for (const link of navLinks) {
    try {
      const path = new URL(link.href).pathname;
      const response = await page.goto(link.href, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      const status = response?.status() ?? 0;
      if (status >= 400) {
        results.push({
          route: path,
          status: "fail",
          loadTimeMs: 0,
          httpStatus: status,
          consoleErrors: [],
          consoleWarnings: [],
          networkErrors: [],
          title: "",
          issues: [`Nav link "${link.text}" -> HTTP ${status}`],
        });
      }
    } catch {
      // skip
    }
  }

  return results;
}

async function testLinks(page: Page): Promise<string[]> {
  // Check for links that might have XSS issues (javascript: protocol, data: URLs)
  const suspiciousLinks = await page.$$eval("a[href]", (links) =>
    links
      .map((a) => ({ href: (a as HTMLAnchorElement).href, text: a.textContent?.trim() ?? "" }))
      .filter(
        (l) =>
          l.href.startsWith("javascript:") ||
          (l.href.startsWith("data:") && !l.href.startsWith("data:image")),
      )
      .map((l) => `"${l.text}" -> ${l.href.slice(0, 80)}`),
  );
  return suspiciousLinks;
}

function printResult(r: TestResult): void {
  const icon = r.status === "pass" ? "\u2705" : r.status === "warn" ? "\u26A0\uFE0F" : "\u274C";
  console.log(`${icon} ${r.route} [${r.loadTimeMs}ms] ${r.title}`);
  if (r.httpStatus && r.httpStatus >= 400) console.log(`   HTTP: ${r.httpStatus}`);
  for (const issue of r.issues) console.log(`   - ${issue}`);
  for (const err of r.consoleErrors) console.log(`   console.error: ${err}`);
  for (const err of r.networkErrors) console.log(`   network: ${err}`);
}

async function main(): Promise<void> {
  console.log(`\n=== QA Studio E2E Smoke Test ===`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Routes: ${ROUTES_TO_TEST.length}\n`);

  let browser: Browser | null = null;
  let context: BrowserContext | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: "QA-Studio-Bot/1.0 Playwright",
    });

    // Inject error catcher on every page
    await context.addInitScript(() => {
      (window as unknown as { __pageErrors: string[] }).__pageErrors = [];
      window.addEventListener("error", (e) => {
        (window as unknown as { __pageErrors: string[] }).__pageErrors.push(e.message);
      });
      window.addEventListener("unhandledrejection", (e) => {
        (window as unknown as { __pageErrors: string[] }).__pageErrors.push(
          `Unhandled rejection: ${String(e.reason).slice(0, 150)}`,
        );
      });
    });

    const page = await context.newPage();
    const results: TestResult[] = [];

    // Test each route
    for (const route of ROUTES_TO_TEST) {
      const result = await testRoute(page, route);
      results.push(result);
      printResult(result);
    }

    // Test navigation links from home
    console.log("\n--- Navigation Link Check ---");
    const navResults = await testNavigation(page);
    for (const r of navResults) {
      results.push(r);
      printResult(r);
    }
    if (navResults.length === 0) console.log("All nav links OK");

    // Test for suspicious links on home page
    console.log("\n--- Security: Suspicious Links ---");
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 15000 });
    const suspicious = await testLinks(page);
    if (suspicious.length > 0) {
      for (const s of suspicious) console.log(`   \u26A0\uFE0F ${s}`);
    } else {
      console.log("No suspicious links found");
    }

    // Summary
    console.log("\n=== SUMMARY ===");
    const passed = results.filter((r) => r.status === "pass").length;
    const warned = results.filter((r) => r.status === "warn").length;
    const failed = results.filter((r) => r.status === "fail").length;
    console.log(`Pass: ${passed}  Warn: ${warned}  Fail: ${failed}  Total: ${results.length}`);

    if (failed > 0) {
      console.log("\nFailed routes:");
      for (const r of results.filter((r) => r.status === "fail")) {
        console.log(`  ${r.route}: ${r.issues.join("; ")}`);
      }
    }
    if (warned > 0) {
      console.log("\nWarnings:");
      for (const r of results.filter((r) => r.status === "warn")) {
        console.log(`  ${r.route}: ${r.issues.join("; ")}`);
      }
    }

    // Output full JSON for programmatic use
    const reportPath = "/tmp/qa-studio-report.json";
    const { writeFileSync } = await import("fs");
    writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\nFull report: ${reportPath}`);
  } finally {
    if (context) await context.close();
    if (browser) await browser.close();
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
