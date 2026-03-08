import { describe, it, expect } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMockServer } from "@spike-land-ai/mcp-server-base";
import { createMockToolClient } from "../../src/mcp-tools/iwd-spotlight/core-logic/tool-client.js";
import { registerSpotlightTools } from "../../src/mcp-tools/iwd-spotlight/core-logic/spotlight.js";

function setup(responses: Record<string, { content: Array<{ type: "text"; text: string }>; isError?: boolean }> = {}) {
  const server = createMockServer();
  const client = createMockToolClient(responses);
  registerSpotlightTools(server as unknown as McpServer, client);
  return server;
}

describe("iwd_spotlight_search", () => {
  it("registers the tool", () => {
    const server = setup();
    expect(server.handlers.has("iwd_spotlight_search")).toBe(true);
  });

  it("delegates to hn_search with IWD terms", async () => {
    const server = setup({
      hn_search: {
        content: [{ type: "text", text: JSON.stringify({ hits: [{ title: "Women in AI" }] }) }],
      },
    });

    const result = await server.call("iwd_spotlight_search", { limit: 5 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("Women in AI");
  });

  it("combines custom query with IWD terms", async () => {
    const server = setup({
      hn_search: {
        content: [{ type: "text", text: JSON.stringify({ hits: [] }) }],
      },
    });

    const result = await server.call("iwd_spotlight_search", { query: "machine learning", limit: 5 });
    expect(result.isError).toBeUndefined();
  });
});

describe("iwd_spotlight_card", () => {
  it("registers the tool", () => {
    const server = setup();
    expect(server.handlers.has("iwd_spotlight_card")).toBe(true);
  });

  it("generates a spotlight card via img_generate", async () => {
    const server = setup({
      img_generate: {
        content: [{ type: "text", text: "image_url: https://example.com/card.png" }],
      },
    });

    const result = await server.call("iwd_spotlight_card", {
      name: "Ada Lovelace",
      role: "Mathematician",
      achievement: "First computer programmer",
    });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("card.png");
  });
});
