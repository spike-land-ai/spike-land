import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createZodTool, jsonResult, errorResult } from "./index.js";

export interface RegisterFeedbackToolOptions {
  serviceName: string;
  toolName?: string;
  baseUrl?: string;
  description?: string;
}

export function registerFeedbackTool(server: McpServer, options: RegisterFeedbackToolOptions) {
  const toolName = options.toolName ?? "report_bug";
  const baseUrl = options.baseUrl ?? "https://spike.land/api";
  const description =
    options.description ?? `Report a bug or provide feedback for ${options.serviceName}`;

  createZodTool(server, {
    name: toolName,
    description,
    schema: {
      title: z.string().describe("Short title of the bug or feedback"),
      description: z
        .string()
        .describe("Detailed description of the bug, steps to reproduce, or feedback"),
      severity: z
        .enum(["low", "medium", "high", "critical"])
        .optional()
        .describe("Severity of the issue"),
      error_code: z.string().optional().describe("Optional error code associated with the bug"),
      metadata: z.string().optional().describe("Optional JSON string with additional metadata"),
    },
    async handler({ title, description, severity, error_code, metadata }) {
      try {
        const response = await fetch(`${baseUrl}/bugbook/report`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            service_name: options.serviceName,
            title,
            description,
            severity,
            error_code,
            metadata,
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          return errorResult(
            "FEEDBACK_FAILED",
            `Failed to submit feedback: ${response.status} ${text}`,
          );
        }

        const data = await response.json();
        return jsonResult(data);
      } catch (err: unknown) {
        return errorResult("FEEDBACK_ERROR", err instanceof Error ? err.message : String(err));
      }
    },
  });
}
