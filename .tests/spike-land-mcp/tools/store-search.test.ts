/**
 * Tests for core-logic/tools/store/search.ts
 *
 * Covers: store_list_apps_with_tools, store_search, store_browse_category,
 * store_featured_apps, store_new_apps, store_app_detail — including
 * empty-result branches, error wrapping via safeToolCall, and URL construction.
 */

import type { McpServer, RegisteredTool } from "@modelcontextprotocol/sdk/server/mcp.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerStoreSearchTools } from "../../../src/edge-api/spike-land/core-logic/tools/store/search";
import { createDb } from "../../../src/edge-api/spike-land/db/db/db-index";
import { ToolRegistry } from "../../../src/edge-api/spike-land/lazy-imports/registry";
import { createMockD1 } from "../__test-utils__/mock-env";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createMockMcpServer(): McpServer {
  return {
    registerTool: vi.fn((_name: string, _config: unknown, handler: unknown): RegisteredTool => {
      let isEnabled = false;
      return {
        enable: () => {
          isEnabled = true;
        },
        disable: () => {
          isEnabled = false;
        },
        get enabled() {
          return isEnabled;
        },
        update: vi.fn(),
        remove: vi.fn(),
        handler: handler as RegisteredTool["handler"],
      };
    }),
  } as unknown as McpServer;
}

function createRegistry(userId = "user-store") {
  const db = createDb(createMockD1());
  const server = createMockMcpServer();
  const registry = new ToolRegistry(server, userId);
  registerStoreSearchTools(registry, userId, db);
  registry.enableAll();
  return { registry };
}

function getText(result: { content: Array<{ type: string; text?: string }> }): string {
  return result.content
    .filter((c) => c.type === "text" && typeof c.text === "string")
    .map((c) => c.text!)
    .join("\n");
}

function mockFetchOk(data: unknown): void {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response);
}

function mockFetchError(status: number, body = "Error"): void {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: false,
    status,
    text: async () => body,
  } as Response);
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ─── store_list_apps_with_tools ───────────────────────────────────────────────

describe("store_list_apps_with_tools", () => {
  it("returns raw JSON of apps with tools", async () => {
    const { registry } = createRegistry();
    const apps = [
      {
        slug: "image-gen",
        name: "Image Gen",
        icon: "🖼",
        category: "creative",
        tagline: "Generate images",
        toolNames: ["image_generate", "image_enhance"],
      },
      {
        slug: "code-assist",
        name: "Code Assist",
        icon: "💻",
        category: "developer",
        tagline: "Code helper",
        toolNames: ["code_review"],
      },
    ];
    mockFetchOk(apps);

    const result = await registry.callToolDirect("store_list_apps_with_tools", {});
    const text = getText(result);
    expect(result.isError).toBeUndefined();
    expect(text).toContain("image-gen");
    expect(text).toContain("image_generate");
    expect(text).toContain("code-assist");
  });

  it("passes limit and cursor as query params", async () => {
    const { registry } = createRegistry();
    mockFetchOk([]);
    await registry.callToolDirect("store_list_apps_with_tools", { limit: 25, cursor: "next-page" });
    const [url] = vi.mocked(fetch).mock.calls[0]!;
    expect(url as string).toContain("limit=25");
    expect(url as string).toContain("cursor=next-page");
  });

  it("omits limit and cursor when not provided", async () => {
    const { registry } = createRegistry();
    mockFetchOk([]);
    await registry.callToolDirect("store_list_apps_with_tools", {});
    const [url] = vi.mocked(fetch).mock.calls[0]!;
    expect(url as string).not.toContain("limit=");
    expect(url as string).not.toContain("cursor=");
  });

  it("wraps errors via safeToolCall returning isError", async () => {
    const { registry } = createRegistry();
    mockFetchError(500, "Service unavailable");
    const result = await registry.callToolDirect("store_list_apps_with_tools", {});
    expect(result.isError).toBe(true);
  });
});

// ─── store_search ─────────────────────────────────────────────────────────────

describe("store_search", () => {
  it("formats search results as markdown list", async () => {
    const { registry } = createRegistry();
    mockFetchOk([
      { name: "Chess Arena", tagline: "Play chess with AI", slug: "chess-arena" },
      { name: "Image Studio", tagline: "AI image tools", slug: "image-studio" },
    ]);

    const result = await registry.callToolDirect("store_search", { query: "chess" });
    const text = getText(result);
    expect(result.isError).toBeUndefined();
    expect(text).toContain('Search Results for "chess"');
    expect(text).toContain("Chess Arena");
    expect(text).toContain("chess-arena");
    expect(text).toContain("Play chess with AI");
  });

  it("returns no-results message when empty array", async () => {
    const { registry } = createRegistry();
    mockFetchOk([]);
    const result = await registry.callToolDirect("store_search", { query: "zzz-nonexistent" });
    expect(getText(result)).toContain('No apps found matching "zzz-nonexistent"');
  });

  it("passes query to the API", async () => {
    const { registry } = createRegistry();
    mockFetchOk([]);
    await registry.callToolDirect("store_search", { query: "productivity tools" });
    const [url] = vi.mocked(fetch).mock.calls[0]!;
    expect(url as string).toContain("query=productivity+tools");
  });

  it("passes optional category filter", async () => {
    const { registry } = createRegistry();
    mockFetchOk([]);
    await registry.callToolDirect("store_search", { query: "image", category: "creative" });
    const [url] = vi.mocked(fetch).mock.calls[0]!;
    expect(url as string).toContain("category=creative");
  });

  it("passes limit param when provided", async () => {
    const { registry } = createRegistry();
    mockFetchOk([]);
    await registry.callToolDirect("store_search", { query: "any", limit: 5 });
    const [url] = vi.mocked(fetch).mock.calls[0]!;
    expect(url as string).toContain("limit=5");
  });

  it("wraps network errors via safeToolCall", async () => {
    const { registry } = createRegistry();
    mockFetchError(429, "Too many requests");
    const result = await registry.callToolDirect("store_search", { query: "x" });
    expect(result.isError).toBe(true);
    expect(getText(result)).toContain("RATE_LIMITED");
  });
});

// ─── store_browse_category ────────────────────────────────────────────────────

describe("store_browse_category", () => {
  it("lists apps in the given category", async () => {
    const { registry } = createRegistry();
    mockFetchOk([
      { name: "VS Code Ext", tagline: "Code fast", slug: "vscode-ext" },
      { name: "Git Helper", tagline: "Git tools", slug: "git-helper" },
    ]);

    const result = await registry.callToolDirect("store_browse_category", {
      category: "developer",
    });
    const text = getText(result);
    expect(result.isError).toBeUndefined();
    expect(text).toContain("developer Apps");
    expect(text).toContain("VS Code Ext");
    expect(text).toContain("git-helper");
  });

  it("returns no-apps message for empty category", async () => {
    const { registry } = createRegistry();
    mockFetchOk([]);
    const result = await registry.callToolDirect("store_browse_category", {
      category: "empty-cat",
    });
    expect(getText(result)).toContain('No apps found in category "empty-cat"');
  });

  it("uses category in the request URL path", async () => {
    const { registry } = createRegistry();
    mockFetchOk([]);
    await registry.callToolDirect("store_browse_category", { category: "productivity" });
    const [url] = vi.mocked(fetch).mock.calls[0]!;
    expect(url as string).toContain("/api/store/category/productivity");
  });

  it("wraps errors via safeToolCall", async () => {
    const { registry } = createRegistry();
    mockFetchError(404, "Category not found");
    const result = await registry.callToolDirect("store_browse_category", { category: "bad-cat" });
    expect(result.isError).toBe(true);
  });
});

// ─── store_featured_apps ─────────────────────────────────────────────────────

describe("store_featured_apps", () => {
  it("returns formatted featured app list", async () => {
    const { registry } = createRegistry();
    mockFetchOk([{ name: "Featured App 1", tagline: "Best app ever", slug: "featured-1" }]);

    const result = await registry.callToolDirect("store_featured_apps", {});
    const text = getText(result);
    expect(result.isError).toBeUndefined();
    expect(text).toContain("Featured Apps");
    expect(text).toContain("Featured App 1");
    expect(text).toContain("featured-1");
  });

  it("returns no-apps message when featured list is empty", async () => {
    const { registry } = createRegistry();
    mockFetchOk([]);
    const result = await registry.callToolDirect("store_featured_apps", {});
    expect(getText(result)).toContain("No featured apps at the moment");
  });

  it("calls /api/store/featured endpoint", async () => {
    const { registry } = createRegistry();
    mockFetchOk([]);
    await registry.callToolDirect("store_featured_apps", {});
    const [url] = vi.mocked(fetch).mock.calls[0]!;
    expect(url as string).toContain("/api/store/featured");
  });

  it("wraps errors via safeToolCall", async () => {
    const { registry } = createRegistry();
    mockFetchError(500);
    const result = await registry.callToolDirect("store_featured_apps", {});
    expect(result.isError).toBe(true);
  });
});

// ─── store_new_apps ───────────────────────────────────────────────────────────

describe("store_new_apps", () => {
  it("returns formatted new app list", async () => {
    const { registry } = createRegistry();
    mockFetchOk([{ name: "Brand New App", tagline: "Just launched", slug: "brand-new" }]);

    const result = await registry.callToolDirect("store_new_apps", {});
    const text = getText(result);
    expect(result.isError).toBeUndefined();
    expect(text).toContain("New Apps");
    expect(text).toContain("Brand New App");
    expect(text).toContain("brand-new");
  });

  it("returns no-apps message when list is empty", async () => {
    const { registry } = createRegistry();
    mockFetchOk([]);
    const result = await registry.callToolDirect("store_new_apps", {});
    expect(getText(result)).toContain("No new apps at the moment");
  });

  it("calls /api/store/new endpoint", async () => {
    const { registry } = createRegistry();
    mockFetchOk([]);
    await registry.callToolDirect("store_new_apps", {});
    const [url] = vi.mocked(fetch).mock.calls[0]!;
    expect(url as string).toContain("/api/store/new");
  });

  it("wraps errors via safeToolCall", async () => {
    const { registry } = createRegistry();
    mockFetchError(503, "Upstream down");
    const result = await registry.callToolDirect("store_new_apps", {});
    expect(result.isError).toBe(true);
  });
});

// ─── store_app_detail ────────────────────────────────────────────────────────

describe("store_app_detail", () => {
  const fullApp = {
    name: "Chess Arena",
    tagline: "Play chess against AI",
    description: "A full-featured chess app with ELO rating system.",
    category: "games",
    tags: ["chess", "ai", "games"],
    pricing: "free",
    toolCount: 12,
    isFeatured: true,
    isNew: false,
  };

  it("renders full app detail card", async () => {
    const { registry } = createRegistry();
    mockFetchOk(fullApp);

    const result = await registry.callToolDirect("store_app_detail", { slug: "chess-arena" });
    const text = getText(result);
    expect(result.isError).toBeUndefined();
    expect(text).toContain("Chess Arena");
    expect(text).toContain("Play chess against AI");
    expect(text).toContain("games");
    expect(text).toContain("free");
    expect(text).toContain("12");
    expect(text).toContain("Yes"); // isFeatured
    expect(text).toContain("No"); // isNew
  });

  it("formats tags as code spans", async () => {
    const { registry } = createRegistry();
    mockFetchOk(fullApp);
    const result = await registry.callToolDirect("store_app_detail", { slug: "chess-arena" });
    const text = getText(result);
    expect(text).toContain("`chess`");
    expect(text).toContain("`ai`");
    expect(text).toContain("`games`");
  });

  it("shows None for empty tags", async () => {
    const { registry } = createRegistry();
    mockFetchOk({ ...fullApp, tags: [] });
    const result = await registry.callToolDirect("store_app_detail", { slug: "chess-arena" });
    expect(getText(result)).toContain("None");
  });

  it("returns not-found message when app is null", async () => {
    const { registry } = createRegistry();
    mockFetchOk(null);
    const result = await registry.callToolDirect("store_app_detail", { slug: "ghost-slug" });
    expect(getText(result)).toContain('"ghost-slug" not found');
  });

  it("uses slug in the request URL", async () => {
    const { registry } = createRegistry();
    mockFetchOk(fullApp);
    await registry.callToolDirect("store_app_detail", { slug: "my-special-app" });
    const [url] = vi.mocked(fetch).mock.calls[0]!;
    expect(url as string).toContain("/api/store/apps/my-special-app");
  });

  it("wraps errors via safeToolCall on 403", async () => {
    const { registry } = createRegistry();
    mockFetchError(403, "Forbidden");
    const result = await registry.callToolDirect("store_app_detail", { slug: "locked" });
    expect(result.isError).toBe(true);
    expect(getText(result)).toContain("PERMISSION_DENIED");
  });
});
