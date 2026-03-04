/**
 * Shared feedback tool factory for MCP servers.
 * Registers a {prefix}_feedback tool that reports bugs to the central Bugbook.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createZodTool, jsonResult, errorResult } from "./index.js";

export interface FeedbackReport {
  title: string;
  description: string;
  service_name: string;
  severity: "low" | "medium" | "high" | "critical";
  reproduction_steps?: string;
  error_code?: string;
  metadata?: Record<string, unknown>;
}

export interface FeedbackToolOptions {
  /** Tool name prefix (e.g., "image_studio" -> "image_studio_feedback") */
  prefix: string;
  /** Service name for tagging reports (e.g., "mcp-image-studio") */
  serviceName: string;
  /** Function to send the report to spike-edge's bugbook. */
  reportFn: (report: FeedbackReport) => Promise<{ bugId: string; isNewBug: boolean }>;
}

const feedbackSchema = {
  title: z.string().min(5).max(200).describe("Short bug title describing the issue"),
  description: z.string().min(10).max(2000).describe("Detailed bug description"),
  severity: z
    .enum(["low", "medium", "high", "critical"])
    .describe("Bug severity level"),
  reproduction_steps: z
    .string()
    .max(2000)
    .optional()
    .describe("Steps to reproduce the bug"),
  error_code: z
    .string()
    .max(100)
    .optional()
    .describe("Error code if applicable"),
  metadata: z
    .record(z.unknown())
    .optional()
    .describe("Additional context or metadata"),
} as const;

/**
 * Register a feedback tool on an MCP server.
 *
 * Usage:
 * ```ts
 * registerFeedbackTool(server, {
 *   prefix: "image_studio",
 *   serviceName: "mcp-image-studio",
 *   reportFn: async (report) => {
 *     const res = await fetch("https://edge.spike.land/bugbook/report", { ... });
 *     return res.json();
 *   },
 * });
 * ```
 */
export function registerFeedbackTool(server: McpServer, options: FeedbackToolOptions): void {
  createZodTool(server, {
    name: `${options.prefix}_feedback`,
    description: `Report a bug or provide feedback for the ${options.serviceName} service. Reports are tracked in the public Bugbook at spike.land/bugbook.`,
    schema: feedbackSchema,
    async handler(args) {
      try {
        const report: FeedbackReport = {
          title: args.title,
          description: args.description,
          service_name: options.serviceName,
          severity: args.severity,
          reproduction_steps: args.reproduction_steps,
          error_code: args.error_code,
          metadata: args.metadata as Record<string, unknown> | undefined,
        };

        const result = await options.reportFn(report);
        return jsonResult({
          status: "reported",
          bugId: result.bugId,
          isNewBug: result.isNewBug,
          message: result.isNewBug
            ? `New bug reported: "${report.title}". Track it at spike.land/bugbook/${result.bugId}`
            : `Bug confirmed: "${report.title}". Track it at spike.land/bugbook/${result.bugId}`,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return errorResult("FEEDBACK_ERROR", `Failed to submit feedback: ${message}`, true);
      }
    },
  });
}

/**
 * Create a reportFn that sends reports via HTTP to spike-edge.
 * Use this for Node.js MCP servers that can't use CF service bindings.
 */
export function createHttpReportFn(
  baseUrl = "https://edge.spike.land",
  headers?: Record<string, string>,
): FeedbackToolOptions["reportFn"] {
  return async (report) => {
    const res = await fetch(`${baseUrl}/bugbook/report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(report),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Bugbook API error (${res.status}): ${text}`);
    }
    return res.json() as Promise<{ bugId: string; isNewBug: boolean }>;
  };
}
