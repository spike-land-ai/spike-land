import { describe, it, expect } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMockServer } from "@spike-land-ai/mcp-server-base";
import { createMockToolClient } from "../../src/mcp-tools/iwd-spotlight/core-logic/tool-client.js";
import { registerContributorTools } from "../../src/mcp-tools/iwd-spotlight/core-logic/contributors.js";

function setup(responses: Record<string, { content: Array<{ type: "text"; text: string }>; isError?: boolean }> = {}) {
  const server = createMockServer();
  const client = createMockToolClient(responses);
  registerContributorTools(server as unknown as McpServer, client);
  return server;
}

describe("iwd_contributor_spotlight", () => {
  it("registers the tool", () => {
    const server = setup();
    expect(server.handlers.has("iwd_contributor_spotlight")).toBe(true);
  });

  it("fetches PR details and generates a recognition card", async () => {
    const server = setup({
      get_pr_details: {
        content: [{ type: "text", text: JSON.stringify({ title: "Add dark mode", author: "alice" }) }],
      },
      img_generate: { content: [{ type: "text", text: "card_image_url" }] },
    });

    const result = await server.call("iwd_contributor_spotlight", {
      owner: "spike-land-ai",
      repo: "spike.land",
      pr_number: 42,
      message: "Amazing contribution!",
    });
    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.pr.number).toBe(42);
    expect(data.recognition.message).toBe("Amazing contribution!");
    expect(data.recognition.card).toBe("card_image_url");
    expect(data.recognition.hashtags).toContain("#IWD2026");
  });

  it("uses default message when none provided", async () => {
    const server = setup({
      get_pr_details: { content: [{ type: "text", text: "{}" }] },
      img_generate: { content: [{ type: "text", text: "card_url" }] },
    });

    const result = await server.call("iwd_contributor_spotlight", {
      owner: "org",
      repo: "repo",
      pr_number: 1,
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.recognition.message).toBe("Thank you for your contribution!");
  });
});
