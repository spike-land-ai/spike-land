import { describe, it, expect } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMockServer } from "@spike-land-ai/mcp-server-base";
import { createMockToolClient } from "../../src/mcp-tools/iwd-spotlight/core-logic/tool-client.js";
import { registerStorytellingTools } from "../../src/mcp-tools/iwd-spotlight/core-logic/storytelling.js";

function setup(responses: Record<string, { content: Array<{ type: "text"; text: string }>; isError?: boolean }> = {}) {
  const server = createMockServer();
  const client = createMockToolClient(responses);
  registerStorytellingTools(server as unknown as McpServer, client);
  return server;
}

describe("iwd_story_album", () => {
  it("registers the tool", () => {
    const server = setup();
    expect(server.handlers.has("iwd_story_album")).toBe(true);
  });

  it("creates album and generates images", async () => {
    const server = setup({
      img_album_create: { content: [{ type: "text", text: "album_id_123" }] },
      img_generate: { content: [{ type: "text", text: "image_url" }] },
    });

    const result = await server.call("iwd_story_album", {
      theme: "pioneers",
      image_count: 2,
    });
    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.theme).toBe("pioneers");
    expect(data.images).toHaveLength(2);
    expect(data.album).toBe("album_id_123");
  });
});

describe("iwd_timeline", () => {
  it("registers the tool", () => {
    const server = setup();
    expect(server.handlers.has("iwd_timeline")).toBe(true);
  });

  it("generates a timeline diagram with all milestones", async () => {
    const server = setup({
      img_diagram: { content: [{ type: "text", text: "diagram_url" }] },
    });

    const result = await server.call("iwd_timeline", {});
    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.milestones.length).toBeGreaterThan(5);
    expect(data.diagram).toBe("diagram_url");
  });

  it("filters milestones by year range", async () => {
    const server = setup({
      img_diagram: { content: [{ type: "text", text: "diagram_url" }] },
    });

    const result = await server.call("iwd_timeline", {
      start_year: 2000,
      end_year: 2026,
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.milestones.every((m: { year: number }) => m.year >= 2000 && m.year <= 2026)).toBe(true);
  });
});
