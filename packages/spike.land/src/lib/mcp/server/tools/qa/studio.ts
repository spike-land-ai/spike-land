/**
 * QA Studio MCP Tools
 *
 * Browser automation and test execution tools for the QA Studio dashboard.
 * Only registered when NODE_ENV=development.
 *
 * Tools:
 * 1. qa_navigate - Navigate to URL, return page info
 * 2. qa_screenshot - Capture page screenshot (base64)
 * 3. qa_accessibility - WCAG accessibility audit
 * 4. qa_console - Capture console messages
 * 5. qa_network - Analyze network requests
 * 6. qa_viewport - Responsive viewport testing
 * 7. qa_evaluate - Execute JavaScript on page
 * 8. qa_tabs - Manage multiple browser tabs/sessions
 * 9. qa_mobile_audit - iPhone/mobile compatibility audit
 * 10. qa_test_run - Run vitest on specific files
 * 11. qa_coverage - Analyze test coverage
 */

import { z } from "zod";
import type { ToolRegistry } from "../../tool-registry";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { execFileSync } from "node:child_process";
import { registerQaStudioRunnerTools } from "./runner";

const CATEGORY = "qa-studio";
const TIER = "free" as const;

function textResult(text: string): CallToolResult {
  return { content: [{ type: "text", text }] };
}

function errorResult(msg: string): CallToolResult {
  return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
}

/** Validate test target path to prevent command injection. */
function isValidPath(p: string): boolean {
  return /^[a-zA-Z0-9._/\-]+$/.test(p) && p.length <= 200 && !p.includes("..");
}

export function registerQaStudioTools(
  registry: ToolRegistry,
  _userId: string,
): void {
  // Register browser automation tools from the runner module
  registerQaStudioRunnerTools(registry, _userId);

  // ── qa_test_run ──────────────────────────────────────────────
  registry.register({
    name: "qa_test_run",
    description:
      "Run Vitest tests on a specific file or directory. Returns test results with pass/fail status.",
    category: CATEGORY,
    tier: TIER,
    alwaysEnabled: true,
    inputSchema: {
      target: z.string().describe(
        "Test file or directory path (e.g., 'src/lib/mcp')",
      ),
      reporter: z.enum(["verbose", "default"]).optional().describe(
        "Test reporter format",
      ),
    },
    handler: async (input: { target: string; reporter?: string }) => {
      if (!isValidPath(input.target)) {
        return errorResult(
          "Invalid path. Use alphanumeric characters, dots, slashes, and dashes only.",
        );
      }

      const reporter = input.reporter ?? "verbose";
      const args = ["vitest", "run", input.target, `--reporter=${reporter}`];

      try {
        const output = execFileSync("yarn", args, {
          encoding: "utf-8",
          timeout: 120_000,
          stdio: ["pipe", "pipe", "pipe"],
        });
        return textResult(
          [
            `## Test Results: PASS`,
            `- **Target:** ${input.target}`,
            ``,
            "```",
            output.slice(-3000),
            "```",
          ].join("\n"),
        );
      } catch (err: unknown) {
        const output = (err as { stdout?: string }).stdout ?? String(err);
        return errorResult(
          [
            `## Test Results: FAIL`,
            `- **Target:** ${input.target}`,
            ``,
            "```",
            output.slice(-3000),
            "```",
          ].join("\n"),
        );
      }
    },
  });

  // ── qa_coverage ──────────────────────────────────────────────
  registry.register({
    name: "qa_coverage",
    description:
      "Analyze test coverage for a specific file or directory. Returns line, function, branch, and statement coverage.",
    category: CATEGORY,
    tier: TIER,
    alwaysEnabled: true,
    inputSchema: {
      target: z.string().describe(
        "Source file or directory to analyze coverage for",
      ),
      format: z
        .enum(["summary", "detailed"])
        .optional()
        .describe("Output format (default: summary)"),
    },
    handler: async (input: { target: string; format?: string }) => {
      if (!isValidPath(input.target)) {
        return errorResult(
          "Invalid path. Use alphanumeric characters, dots, slashes, and dashes only.",
        );
      }

      const format = input.format ?? "summary";
      const args = [
        "vitest",
        "run",
        input.target,
        "--coverage",
        "--coverage.reporter=json-summary",
      ];

      try {
        const output = execFileSync("yarn", args, {
          encoding: "utf-8",
          timeout: 120_000,
          stdio: ["pipe", "pipe", "pipe"],
        });

        // Try to extract coverage summary from output
        const coverageMatch = output.match(
          /Statements\s*:\s*([\d.]+)%.*?Branches\s*:\s*([\d.]+)%.*?Functions\s*:\s*([\d.]+)%.*?Lines\s*:\s*([\d.]+)%/s,
        );

        if (coverageMatch) {
          const [, statements, branches, functions, lines] = coverageMatch;
          const colorize = (pct: string): string => {
            const n = parseFloat(pct!);
            if (n >= 80) return `${pct}% (good)`;
            if (n >= 60) return `${pct}% (needs improvement)`;
            return `${pct}% (low)`;
          };

          return textResult(
            [
              `## Coverage Report`,
              `- **Target:** ${input.target}`,
              `- **Format:** ${format}`,
              ``,
              `| Metric | Coverage |`,
              `|--------|----------|`,
              `| Statements | ${colorize(statements!)} |`,
              `| Branches | ${colorize(branches!)} |`,
              `| Functions | ${colorize(functions!)} |`,
              `| Lines | ${colorize(lines!)} |`,
            ].join("\n"),
          );
        }

        return textResult(
          [
            `## Coverage Report`,
            `- **Target:** ${input.target}`,
            ``,
            "```",
            output.slice(-3000),
            "```",
          ].join("\n"),
        );
      } catch (err: unknown) {
        const output = (err as { stdout?: string }).stdout ?? String(err);
        return errorResult(
          [
            `## Coverage Analysis Failed`,
            `- **Target:** ${input.target}`,
            ``,
            "```",
            output.slice(-3000),
            "```",
          ].join("\n"),
        );
      }
    },
  });
}
