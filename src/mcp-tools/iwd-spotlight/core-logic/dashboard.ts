/**
 * iwd_impact_dashboard
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createZodTool, jsonResult } from "@spike-land-ai/mcp-server-base";
import type { ToolClient } from "../mcp/types.js";
import { IWD_BRAND } from "../mcp/types.js";

export function registerDashboardTools(server: McpServer, client: ToolClient): void {
  createZodTool(server, {
    name: "iwd_impact_dashboard",
    description:
      "Combine Stripe revenue + GA4 analytics data into an IWD campaign impact summary with a generated dashboard image.",
    schema: {
      start_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
        .describe("Campaign start date"),
      end_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
        .describe("Campaign end date"),
      property_id: z.string().describe("GA4 property ID"),
    },
    async handler({ start_date, end_date, property_id }) {
      const [stripeResult, ga4Result] = await Promise.all([
        client.callTool("stripe_revenue_summary", {
          start_date,
          end_date,
          currency: "usd",
        }),
        client.callTool("ga4_run_report", {
          property_id,
          start_date,
          end_date,
          metrics: ["sessions", "totalUsers", "screenPageViews"],
          dimensions: ["date"],
        }),
      ]);

      const dashboardPrompt = [
        "Create a campaign impact dashboard visualization.",
        `Title: "${IWD_BRAND.tagline} Campaign Impact"`,
        `Period: ${start_date} to ${end_date}.`,
        "Show: revenue chart, traffic graph, user engagement metrics.",
        `Colors: purple (#A020F0) for revenue, green (#44B78B) for traffic, white background.`,
        "Style: clean data dashboard, modern infographic.",
      ].join(" ");

      const imageResult = await client.callTool("img_generate", {
        prompt: dashboardPrompt,
        aspect_ratio: "16:9",
      });

      return jsonResult({
        campaign: {
          title: `${IWD_BRAND.tagline} Campaign`,
          period: { start_date, end_date },
        },
        stripe: extractContent(stripeResult),
        analytics: extractContent(ga4Result),
        dashboard_image: extractContent(imageResult),
      });
    },
  });
}

function extractContent(result: { content: Array<{ text: string }> }): string {
  return result.content[0]?.text ?? "";
}
