/**
 * Bugbook Feedback Tool
 *
 * Registers `mcp_feedback` tool that reports bugs to the central Bugbook
 * via the SPIKE_EDGE service binding.
 */

import { z } from "zod";
import type { ToolRegistry } from "../mcp/registry";
import type { DrizzleDB } from "../db/index";
import { freeTool } from "../procedures/index";

export function registerBugbookFeedbackTools(
  registry: ToolRegistry,
  userId: string,
  db: DrizzleDB,
  spikeEdge?: Fetcher,
): void {
  const t = freeTool(userId, db);

  registry.registerBuilt(
    t
      .tool("mcp_feedback", "Report a bug or provide feedback. Reports are tracked in the public Bugbook at spike.land/bugbook.", {
        title: z.string().min(5).max(200).describe("Short bug title"),
        description: z.string().min(10).max(2000).describe("Detailed bug description"),
        severity: z.enum(["low", "medium", "high", "critical"]).describe("Bug severity"),
        reproduction_steps: z.string().max(2000).optional().describe("Steps to reproduce"),
        error_code: z.string().max(100).optional().describe("Error code if applicable"),
      })
      .meta({ category: "bugbook", tier: "free", alwaysEnabled: true })
      .handler(async ({ input }) => {
        if (!spikeEdge) {
          return {
            content: [{ type: "text" as const, text: "Feedback service unavailable (no SPIKE_EDGE binding)" }],
            isError: true,
          };
        }

        const res = await spikeEdge.fetch(
          new Request("https://edge.spike.land/bugbook/report", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-User-Id": userId,
            },
            body: JSON.stringify({
              title: input.title,
              description: input.description,
              service_name: "spike-land-mcp",
              severity: input.severity,
              reproduction_steps: input.reproduction_steps,
              error_code: input.error_code,
            }),
          }),
        );

        if (!res.ok) {
          const text = await res.text();
          return {
            content: [{ type: "text" as const, text: `Failed to submit feedback (${res.status}): ${text}` }],
            isError: true,
          };
        }

        const result = await res.json<{ bugId: string; isNewBug: boolean }>();
        const msg = result.isNewBug
          ? `New bug reported: "${input.title}". Track it at spike.land/bugbook/${result.bugId}`
          : `Bug confirmed: "${input.title}". Track it at spike.land/bugbook/${result.bugId}`;

        return { content: [{ type: "text" as const, text: msg }] };
      }),
  );
}
