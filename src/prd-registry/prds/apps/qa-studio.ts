import type { PrdDefinition } from "../../core-logic/types.js";

export const qaStudioPrd: PrdDefinition = {
  id: "app:qa-studio",
  level: "app",
  name: "QA Studio",
  summary:
    "Browser automation, test execution, screenshots, accessibility audits, and network analysis",
  purpose:
    "Playwright-powered browser automation and testing app. Run visual regression tests, accessibility audits, performance checks, and capture network traffic for debugging.",
  constraints: [
    "Browser sessions must be sandboxed per user",
    "Screenshots stored in R2 with 30-day retention",
    "Test execution has a 5-minute timeout",
    "Network capture excludes sensitive headers",
  ],
  acceptance: [
    "Run a test suite and see pass/fail results with screenshots",
    "Accessibility audit returns WCAG 2.1 AA violations",
    "Performance audit returns Core Web Vitals metrics",
  ],
  toolCategories: ["qa-studio", "qa-performance"],
  tools: [],
  composesFrom: ["platform", "domain:app-building", "route:/apps"],
  routePatterns: ["/apps/qa-studio"],
  keywords: ["test", "qa", "automation", "playwright", "screenshot", "accessibility"],
  tokenEstimate: 380,
  version: "1.0.0",
};
