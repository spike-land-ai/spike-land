import { describe, it, expect } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMockServer } from "@spike-land-ai/mcp-server-base";
import { createMockToolClient } from "../../src/mcp-tools/iwd-spotlight/core-logic/tool-client.js";
import { registerDashboardTools } from "../../src/mcp-tools/iwd-spotlight/core-logic/dashboard.js";

function setup(responses: Record<string, { content: Array<{ type: "text"; text: string }>; isError?: boolean }> = {}) {
  const server = createMockServer();
  const client = createMockToolClient(responses);
  registerDashboardTools(server as unknown as McpServer, client);
  return server;
}

describe("iwd_impact_dashboard", () => {
  it("registers the tool", () => {
    const server = setup();
    expect(server.handlers.has("iwd_impact_dashboard")).toBe(true);
  });

  it("combines Stripe, GA4 data and generates dashboard image", async () => {
    const server = setup({
      stripe_revenue_summary: {
        content: [{ type: "text", text: JSON.stringify({ total_revenue: 5000, net_revenue: 4500 }) }],
      },
      ga4_run_report: {
        content: [{ type: "text", text: JSON.stringify({ rows: [{ sessions: 1200 }] }) }],
      },
      img_generate: { content: [{ type: "text", text: "dashboard_image_url" }] },
    });

    const result = await server.call("iwd_impact_dashboard", {
      start_date: "2026-03-01",
      end_date: "2026-03-08",
      property_id: "123456789",
    });
    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.campaign.period.start_date).toBe("2026-03-01");
    expect(data.stripe).toContain("total_revenue");
    expect(data.dashboard_image).toBe("dashboard_image_url");
  });
});
