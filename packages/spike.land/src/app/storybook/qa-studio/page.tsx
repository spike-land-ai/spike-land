"use client";

import {
  AccessibilityPanel,
  Breadcrumbs,
  CodePreview,
  ComponentSample,
  PageHeader,
  RelatedComponents,
  UsageGuide,
} from "@/components/storybook";
import { TestRunCard } from "@/components/qa-studio/TestRunCard";
import { AccessibilityReport } from "@/components/qa-studio/AccessibilityReport";
import { ScreenshotViewer } from "@/components/qa-studio/ScreenshotViewer";
import { NetworkRequestTable } from "@/components/qa-studio/NetworkRequestTable";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockTestRuns = [
  {
    runId: "run-abc123",
    suiteName: "Auth Tests",
    passed: 42,
    failed: 0,
    skipped: 2,
    durationMs: 3820,
    timestamp: "2026-02-26T10:00:00Z",
    status: "passed" as const,
  },
  {
    runId: "run-def456",
    suiteName: "Payment Flow",
    passed: 18,
    failed: 3,
    skipped: 1,
    durationMs: 7450,
    timestamp: "2026-02-26T10:05:00Z",
    status: "failed" as const,
  },
  {
    runId: "run-ghi789",
    suiteName: "Dashboard E2E",
    passed: 0,
    failed: 0,
    skipped: 0,
    durationMs: 1200,
    timestamp: "2026-02-26T10:10:00Z",
    status: "running" as const,
  },
];

const mockViolations = [
  {
    id: "color-contrast",
    impact: "critical" as const,
    description: "Elements must have sufficient color contrast",
    nodes: 8,
    wcagCriteria: "WCAG 1.4.3",
  },
  {
    id: "image-alt",
    impact: "serious" as const,
    description: "Images must have alternate text",
    nodes: 3,
    wcagCriteria: "WCAG 1.1.1",
  },
  {
    id: "label",
    impact: "moderate" as const,
    description: "Form elements must have labels",
    nodes: 5,
    wcagCriteria: "WCAG 1.3.1",
  },
  {
    id: "link-name",
    impact: "minor" as const,
    description: "Links must have discernible text",
    nodes: 2,
    wcagCriteria: "WCAG 2.4.4",
  },
];

const mockScreenshots = [
  {
    id: "ss-mobile",
    label: "Home Page",
    device: "mobile" as const,
    width: 390,
    height: 844,
  },
  {
    id: "ss-tablet",
    label: "Dashboard",
    device: "tablet" as const,
    width: 768,
    height: 1024,
  },
  {
    id: "ss-desktop",
    label: "Settings",
    device: "desktop" as const,
    width: 1440,
    height: 900,
  },
];

const mockRequests = [
  {
    id: "req-1",
    method: "GET" as const,
    url: "/api/user/profile",
    status: 200,
    duration: 42,
    size: "1.2 KB",
  },
  {
    id: "req-2",
    method: "POST" as const,
    url: "/api/auth/login",
    status: 200,
    duration: 187,
    size: "0.8 KB",
  },
  {
    id: "req-3",
    method: "GET" as const,
    url: "/api/payments/history",
    status: 404,
    duration: 31,
    size: "0.3 KB",
  },
  {
    id: "req-4",
    method: "DELETE" as const,
    url: "/api/sessions/abc123",
    status: 204,
    duration: 55,
    size: "0 B",
  },
  {
    id: "req-5",
    method: "PATCH" as const,
    url: "/api/user/settings",
    status: 500,
    duration: 1204,
    size: "0.5 KB",
  },
  {
    id: "req-6",
    method: "PUT" as const,
    url: "/api/content/draft/42",
    status: 422,
    duration: 76,
    size: "2.1 KB",
  },
];

// ---------------------------------------------------------------------------
// Code snippets
// ---------------------------------------------------------------------------

const codeSnippets = {
  testRunCard: `import { TestRunCard } from "@/components/qa-studio/TestRunCard";

<TestRunCard
  runId="run-abc123"
  suiteName="Auth Tests"
  passed={42}
  failed={0}
  skipped={2}
  durationMs={3820}
  timestamp="2026-02-26T10:00:00Z"
  status="passed"
/>`,
  accessibilityReport:
    `import { AccessibilityReport } from "@/components/qa-studio/AccessibilityReport";

<AccessibilityReport
  violations={[
    {
      id: "color-contrast",
      impact: "critical",
      description: "Elements must have sufficient color contrast",
      nodes: 8,
      wcagCriteria: "WCAG 1.4.3",
    },
  ]}
/>`,
  screenshotViewer: `import { ScreenshotViewer } from "@/components/qa-studio/ScreenshotViewer";

<ScreenshotViewer
  screenshots={[
    { id: "ss-1", label: "Home Page", device: "mobile", width: 390, height: 844 },
    { id: "ss-2", label: "Dashboard", device: "desktop", width: 1440, height: 900 },
  ]}
/>`,
  networkRequestTable:
    `import { NetworkRequestTable } from "@/components/qa-studio/NetworkRequestTable";

<NetworkRequestTable
  requests={[
    { id: "r1", method: "GET", url: "/api/profile", status: 200, duration: 42, size: "1.2 KB" },
    { id: "r2", method: "POST", url: "/api/login", status: 200, duration: 187, size: "0.8 KB" },
  ]}
/>`,
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function QAStudioPage() {
  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="QA Studio"
        description="QA Studio components provide a visual interface for test run results, accessibility audits, screenshot comparisons, and network request analysis. They help developers and QA engineers identify regressions and performance issues at a glance."
        usage="Use QA Studio components on test dashboards, CI result pages, and automated audit reports. Pair TestRunCard grids with AccessibilityReport and NetworkRequestTable for comprehensive quality overviews."
      />

      <UsageGuide
        dos={[
          "Use TestRunCard in a grid layout to compare runs across suites.",
          "Show AccessibilityReport after every automated browser test run.",
          "Group ScreenshotViewer by device type for responsive regression testing.",
          "Color-code NetworkRequestTable status codes consistently: green 2xx, orange 4xx, red 5xx.",
          "Display run duration alongside pass/fail counts for performance trending.",
        ]}
        donts={[
          "Don't hide the status badge on TestRunCard -- it's the primary signal.",
          "Avoid truncating WCAG criteria codes in AccessibilityReport rows.",
          "Don't render ScreenshotViewer without device labels -- context matters.",
          "Avoid showing NetworkRequestTable without method badges -- method is critical for debugging.",
          "Don't omit the violation count summary in AccessibilityReport.",
        ]}
      />

      {/* Test Run Cards */}
      <ComponentSample
        title="Test Run Cards"
        description="Cards showing test suite results with pass/fail/skip counts, duration, and status. Use in grids to compare runs across multiple suites."
        code={codeSnippets.testRunCard}
        importPath='import { TestRunCard } from "@/components/qa-studio/TestRunCard"'
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {mockTestRuns.map(run => <TestRunCard key={run.runId} {...run} />)}
        </div>
      </ComponentSample>

      {/* Accessibility Report */}
      <ComponentSample
        title="Accessibility Report"
        description="Lists WCAG violations grouped by severity. Shows impact level, description, affected node count, and WCAG criterion reference for each violation."
        code={codeSnippets.accessibilityReport}
        importPath='import { AccessibilityReport } from "@/components/qa-studio/AccessibilityReport"'
      >
        <div className="w-full max-w-2xl">
          <AccessibilityReport violations={mockViolations} />
        </div>
      </ComponentSample>

      {/* Screenshot Viewer */}
      <ComponentSample
        title="Screenshot Viewer"
        description="Displays screenshots captured at different device viewports. Each card shows device type badge, label, placeholder preview, and pixel dimensions."
        code={codeSnippets.screenshotViewer}
        importPath='import { ScreenshotViewer } from "@/components/qa-studio/ScreenshotViewer"'
      >
        <div className="w-full">
          <ScreenshotViewer screenshots={mockScreenshots} />
        </div>
      </ComponentSample>

      {/* Network Request Table */}
      <ComponentSample
        title="Network Request Table"
        description="Tabular view of HTTP requests captured during a test run. Color-coded status codes (2xx green, 4xx orange, 5xx red) and method badges for quick scanning."
        code={codeSnippets.networkRequestTable}
        importPath='import { NetworkRequestTable } from "@/components/qa-studio/NetworkRequestTable"'
      >
        <div className="w-full">
          <NetworkRequestTable requests={mockRequests} />
        </div>
      </ComponentSample>

      {/* Code Snippets */}
      <CodePreview
        code={codeSnippets.testRunCard}
        title="QA Studio Components"
        tabs={[
          { label: "TestRunCard", code: codeSnippets.testRunCard },
          { label: "AccessibilityReport", code: codeSnippets.accessibilityReport },
          { label: "ScreenshotViewer", code: codeSnippets.screenshotViewer },
          { label: "NetworkRequestTable", code: codeSnippets.networkRequestTable },
        ]}
      />

      <AccessibilityPanel
        notes={[
          "TestRunCard status badges use both color and text labels for colorblind accessibility.",
          "AccessibilityReport impact badges combine color and text (critical/serious/moderate/minor).",
          "NetworkRequestTable uses semantic table structure with proper thead/tbody for screen readers.",
          "ScreenshotViewer image placeholders include alt text via label prop.",
          "Status code colors in NetworkRequestTable are supplemented with numeric values for non-visual users.",
          "HTTP method badges use both color and text so they remain distinguishable without color.",
          "Duration and size values in NetworkRequestTable use font-mono for alignment and readability.",
          "Violation node counts in AccessibilityReport help prioritize fixes beyond severity alone.",
        ]}
      />

      <RelatedComponents currentId="qa-studio" />
    </div>
  );
}
