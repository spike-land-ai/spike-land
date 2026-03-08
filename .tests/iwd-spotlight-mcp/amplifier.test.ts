import { describe, it, expect } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMockServer } from "@spike-land-ai/mcp-server-base";
import { createMockToolClient } from "../../src/mcp-tools/iwd-spotlight/core-logic/tool-client.js";
import { registerAmplifierTools } from "../../src/mcp-tools/iwd-spotlight/core-logic/amplifier.js";

function setup(responses: Record<string, { content: Array<{ type: "text"; text: string }>; isError?: boolean }> = {}) {
  const server = createMockServer();
  const client = createMockToolClient(responses);
  registerAmplifierTools(server as unknown as McpServer, client);
  return server;
}

describe("iwd_amplify_stories", () => {
  it("registers the tool", () => {
    const server = setup();
    expect(server.handlers.has("iwd_amplify_stories")).toBe(true);
  });

  it("searches HN and generates a summary image", async () => {
    const server = setup({
      hn_search: { content: [{ type: "text", text: JSON.stringify({ hits: [{ title: "test" }] }) }] },
      img_generate: { content: [{ type: "text", text: "summary_image_url" }] },
    });

    const result = await server.call("iwd_amplify_stories", { limit: 3 });
    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.summary_image).toBe("summary_image_url");
  });
});

describe("iwd_amplify_comment", () => {
  it("registers the tool", () => {
    const server = setup();
    expect(server.handlers.has("iwd_amplify_comment")).toBe(true);
  });

  it("drafts a comment without auto-posting", async () => {
    const server = setup({
      hn_get_item_with_comments: {
        content: [{ type: "text", text: JSON.stringify({ title: "Women in AI", by: "alice" }) }],
      },
    });

    const result = await server.call("iwd_amplify_comment", {
      story_id: 12345,
      tone: "supportive",
    });
    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.draft_comment.note).toContain("DRAFT only");
    expect(data.draft_comment.note).toContain("Never auto-post");
  });
});
