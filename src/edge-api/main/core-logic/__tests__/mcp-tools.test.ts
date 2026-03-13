import { describe, expect, it, vi } from "vitest";
import {
  scoreTool,
  searchToolCatalog,
  fetchToolCatalog,
  callMcpTool,
  type ToolCatalogItem,
} from "../mcp-tools";

const TOOLS: ToolCatalogItem[] = [
  { name: "pricing_lookup", description: "Look up pricing information" },
  { name: "user_create", description: "Create a new user account" },
  { name: "analytics_query", description: "Query analytics data" },
  { name: "blog_publish", description: "Publish a blog post" },
  { name: "mcp_list_tools", description: "List all available MCP tools" },
];

describe("scoreTool", () => {
  it("scores exact name match highest", () => {
    const score = scoreTool("pricing_lookup", TOOLS[0]);
    expect(score).toBeGreaterThanOrEqual(12);
  });

  it("scores description match", () => {
    const score = scoreTool("pricing information", TOOLS[0]);
    expect(score).toBeGreaterThan(0);
  });

  it("returns 0 for no match", () => {
    expect(scoreTool("zebra", TOOLS[0])).toBe(0);
  });

  it("uses category in scoring when present", () => {
    const tool: ToolCatalogItem = {
      name: "stripe_charge",
      description: "Create a charge",
      category: "billing",
    };
    const score = scoreTool("billing", tool);
    expect(score).toBeGreaterThan(0);
  });
});

describe("searchToolCatalog", () => {
  it("returns matching tools sorted by relevance", () => {
    const results = searchToolCatalog("pricing", TOOLS);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe("pricing_lookup");
  });

  it("respects maxResults", () => {
    const results = searchToolCatalog("a", TOOLS, 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it("returns empty for no matches", () => {
    expect(searchToolCatalog("xyznonexistent", TOOLS)).toEqual([]);
  });
});

describe("fetchToolCatalog", () => {
  it("returns tools from MCP service", async () => {
    const mcpFetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            tools: [{ name: "test_tool", description: "A test tool" }],
          }),
          { headers: { "Content-Type": "application/json" } },
        ),
    );

    const result = await fetchToolCatalog({ fetch: mcpFetch } as unknown as Fetcher, "req-1");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("test_tool");
    expect(mcpFetch).toHaveBeenCalledTimes(1);
  });

  it("returns empty array on error", async () => {
    const mcpFetch = vi.fn(async () => new Response("error", { status: 500 }));
    const result = await fetchToolCatalog({ fetch: mcpFetch } as unknown as Fetcher, "req-1");
    expect(result).toEqual([]);
  });

  it("returns empty array on fetch exception", async () => {
    const mcpFetch = vi.fn(async () => {
      throw new Error("network error");
    });
    const result = await fetchToolCatalog({ fetch: mcpFetch } as unknown as Fetcher, "req-1");
    expect(result).toEqual([]);
  });
});

describe("callMcpTool", () => {
  it("calls MCP service and returns text content", async () => {
    const mcpFetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            result: { content: [{ text: "result text" }] },
          }),
          { headers: { "Content-Type": "application/json" } },
        ),
    );

    const result = await callMcpTool(
      { fetch: mcpFetch } as unknown as Fetcher,
      "req-1",
      "test_tool",
      { key: "value" },
    );
    expect(result).toBe("result text");
  });

  it("throws on RPC error", async () => {
    const mcpFetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: { message: "tool not found" } }), {
          headers: { "Content-Type": "application/json" },
        }),
    );

    await expect(
      callMcpTool({ fetch: mcpFetch } as unknown as Fetcher, "req-1", "bad_tool", {}),
    ).rejects.toThrow("tool not found");
  });

  it("throws on HTTP error", async () => {
    const mcpFetch = vi.fn(async () => new Response("error", { status: 500 }));

    await expect(
      callMcpTool({ fetch: mcpFetch } as unknown as Fetcher, "req-1", "test_tool", {}),
    ).rejects.toThrow("MCP tool call failed with status 500");
  });
});
