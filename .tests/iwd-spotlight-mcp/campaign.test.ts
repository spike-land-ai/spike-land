import { describe, it, expect } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMockServer } from "@spike-land-ai/mcp-server-base";
import { createMockToolClient } from "../../src/mcp-tools/iwd-spotlight/core-logic/tool-client.js";
import { registerCampaignTools } from "../../src/mcp-tools/iwd-spotlight/core-logic/campaign.js";

function setup(responses: Record<string, { content: Array<{ type: "text"; text: string }>; isError?: boolean }> = {}) {
  const server = createMockServer();
  const client = createMockToolClient(responses);
  registerCampaignTools(server as unknown as McpServer, client);
  return server;
}

describe("iwd_campaign_kit", () => {
  it("registers the tool", () => {
    const server = setup();
    expect(server.handlers.has("iwd_campaign_kit")).toBe(true);
  });

  it("generates banner, card, and avatar in parallel", async () => {
    const server = setup({
      img_banner: { content: [{ type: "text", text: "banner_url" }] },
      img_generate: { content: [{ type: "text", text: "card_url" }] },
      img_avatar: { content: [{ type: "text", text: "avatar_url" }] },
    });

    const result = await server.call("iwd_campaign_kit", {
      name: "Grace Hopper",
      role: "Computer Scientist",
      achievement: "Invented the first compiler",
      campaign_title: "IWD 2026",
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.banner).toBe("banner_url");
    expect(data.card).toBe("card_url");
    expect(data.avatar).toBe("avatar_url");
    expect(data.hashtags).toContain("#IWD2026");
  });
});

describe("iwd_campaign_avatar", () => {
  it("registers the tool", () => {
    const server = setup();
    expect(server.handlers.has("iwd_campaign_avatar")).toBe(true);
  });

  it("generates an IWD-themed avatar", async () => {
    const server = setup({
      img_avatar: { content: [{ type: "text", text: "avatar_result" }] },
    });

    const result = await server.call("iwd_campaign_avatar", {
      description: "software engineer with laptop",
    });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("avatar_result");
  });
});
