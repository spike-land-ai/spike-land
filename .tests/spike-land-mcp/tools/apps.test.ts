/**
 * Tests for core-logic/tools/apps.ts
 *
 * Covers: apps_create, apps_list, apps_get, apps_preview, apps_chat,
 * apps_get_messages, apps_set_status, apps_bin, apps_restore,
 * apps_delete_permanent, apps_list_versions, apps_batch_status,
 * apps_clear_messages, apps_upload_images, apps_generate_codespace_id,
 * apps_list_templates — with mocked fetch.
 */

import type { McpServer, RegisteredTool } from "@modelcontextprotocol/sdk/server/mcp.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerAppsTools } from "../../../src/edge-api/spike-land/core-logic/tools/apps";
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

function createRegistry(userId = "user-42") {
  const db = createDb(createMockD1());
  const server = createMockMcpServer();
  const registry = new ToolRegistry(server, userId);
  registerAppsTools(registry, userId, db);
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
    json: async () => ({ error: body }),
  } as Response);
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ─── apps_create ─────────────────────────────────────────────────────────────

describe("apps_create", () => {
  it("creates an app from a prompt and returns formatted output", async () => {
    const { registry } = createRegistry();
    mockFetchOk({
      id: "app-123",
      name: "Todo App",
      slug: "todo-app",
      status: "PROMPTING",
      codespaceId: "bright.cloud.build.abcd",
      codespaceUrl: "https://testing.spike.land/live/bright.cloud.build.abcd",
    });

    const result = await registry.callToolDirect("apps_create", {
      prompt: "Create a todo list app",
    });
    const text = getText(result);
    expect(result.isError).toBeUndefined();
    expect(text).toContain("App Created");
    expect(text).toContain("Todo App");
    expect(text).toContain("app-123");
    expect(text).toContain("PROMPTING");
  });

  it("includes optional fields in POST body when provided", async () => {
    const { registry } = createRegistry();
    mockFetchOk({
      id: "app-456",
      name: "Dashboard App",
      slug: "dashboard",
      status: "PROMPTING",
      codespaceId: "x",
      codespaceUrl: "",
    });

    await registry.callToolDirect("apps_create", {
      prompt: "Build a dashboard",
      codespace_id: "my.custom.id",
      image_ids: ["img-1", "img-2"],
      template_id: "dashboard",
    });

    const [, options] = vi.mocked(fetch).mock.calls[0]!;
    const body = JSON.parse((options as RequestInit).body as string);
    expect(body.codespaceId).toBe("my.custom.id");
    expect(body.imageIds).toEqual(["img-1", "img-2"]);
    expect(body.templateId).toBe("dashboard");
  });

  it("omits optional fields when not provided", async () => {
    const { registry } = createRegistry();
    mockFetchOk({
      id: "app-789",
      name: "Simple",
      slug: "simple",
      status: "PROMPTING",
      codespaceId: "cs",
      codespaceUrl: "",
    });

    await registry.callToolDirect("apps_create", { prompt: "Make something" });
    const [, options] = vi.mocked(fetch).mock.calls[0]!;
    const body = JSON.parse((options as RequestInit).body as string);
    expect(body.codespaceId).toBeUndefined();
    expect(body.imageIds).toBeUndefined();
    expect(body.templateId).toBeUndefined();
  });

  it("returns guidance to use apps_get after creation", async () => {
    const { registry } = createRegistry();
    mockFetchOk({
      id: "app-999",
      name: "Guided",
      slug: "guided",
      status: "BUILDING",
      codespaceId: "g",
      codespaceUrl: "",
    });
    const result = await registry.callToolDirect("apps_create", { prompt: "Help me create" });
    expect(getText(result)).toContain("apps_get");
  });
});

// ─── apps_list ────────────────────────────────────────────────────────────────

describe("apps_list", () => {
  it("lists apps and formats output with counts", async () => {
    const { registry } = createRegistry();
    mockFetchOk([
      {
        id: "a1",
        name: "App One",
        slug: "app-one",
        status: "LIVE",
        codespaceId: "cs1",
        messageCount: 5,
        versionCount: 3,
      },
      {
        id: "a2",
        name: "App Two",
        slug: "app-two",
        status: "TEST",
        codespaceId: null,
        messageCount: 0,
        versionCount: 1,
      },
    ]);

    const result = await registry.callToolDirect("apps_list", { limit: 20 });
    const text = getText(result);
    expect(result.isError).toBeUndefined();
    expect(text).toContain("My Apps (2)");
    expect(text).toContain("App One");
    expect(text).toContain("LIVE");
    expect(text).toContain("Messages: 5");
    expect(text).toContain("Versions: 3");
  });

  it("returns empty state message when no apps found", async () => {
    const { registry } = createRegistry();
    mockFetchOk([]);
    const result = await registry.callToolDirect("apps_list", {});
    expect(getText(result)).toContain("No apps found");
    expect(getText(result)).toContain("apps_create");
  });

  it("filters by status via query param", async () => {
    const { registry } = createRegistry();
    mockFetchOk([]);
    await registry.callToolDirect("apps_list", { status: "LIVE", limit: 10 });
    const [url] = vi.mocked(fetch).mock.calls[0]!;
    expect(url as string).toContain("status=LIVE");
    expect(url as string).toContain("limit=10");
  });

  it("uses codespace ID as identifier in app listing", async () => {
    const { registry } = createRegistry();
    mockFetchOk([
      {
        id: "a1",
        name: "App",
        slug: "app",
        status: "LIVE",
        codespaceId: "my-cs-id",
        messageCount: 0,
        versionCount: 0,
      },
    ]);
    const result = await registry.callToolDirect("apps_list", {});
    expect(getText(result)).toContain("my-cs-id");
  });
});

// ─── apps_get ─────────────────────────────────────────────────────────────────

describe("apps_get", () => {
  const baseApp = {
    id: "app-detail-1",
    name: "Detail App",
    slug: "detail-app",
    description: "A great app",
    status: "LIVE",
    codespaceId: "live-cs",
    codespaceUrl: "https://testing.spike.land/live/live-cs",
    agentWorking: false,
    lastAgentActivity: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
  };

  it("returns full app detail", async () => {
    const { registry } = createRegistry();
    mockFetchOk(baseApp);
    const result = await registry.callToolDirect("apps_get", { app_id: "app-detail-1" });
    const text = getText(result);
    expect(result.isError).toBeUndefined();
    expect(text).toContain("Detail App");
    expect(text).toContain("LIVE");
    expect(text).toContain("A great app");
    expect(text).toContain("live-cs");
  });

  it("includes preview URL when codespace is set", async () => {
    const { registry } = createRegistry();
    mockFetchOk(baseApp);
    const result = await registry.callToolDirect("apps_get", { app_id: "app-detail-1" });
    expect(getText(result)).toContain("https://testing.spike.land/live/live-cs");
  });

  it("shows count stats when _count is present", async () => {
    const { registry } = createRegistry();
    mockFetchOk({ ...baseApp, _count: { messages: 12, images: 4 } });
    const result = await registry.callToolDirect("apps_get", { app_id: "x" });
    const text = getText(result);
    expect(text).toContain("**Messages:** 12");
    expect(text).toContain("**Images:** 4");
  });

  it("shows status history when present", async () => {
    const { registry } = createRegistry();
    mockFetchOk({
      ...baseApp,
      statusHistory: [
        { status: "PROMPTING", message: "Starting", createdAt: "2026-01-01T00:00:00Z" },
        { status: "BUILDING", message: null, createdAt: "2026-01-01T01:00:00Z" },
      ],
    });
    const result = await registry.callToolDirect("apps_get", { app_id: "x" });
    const text = getText(result);
    expect(text).toContain("PROMPTING: Starting");
    expect(text).toContain("BUILDING");
  });

  it("URL-encodes the app_id in the request", async () => {
    const { registry } = createRegistry();
    mockFetchOk(baseApp);
    await registry.callToolDirect("apps_get", { app_id: "my app/id" });
    const [url] = vi.mocked(fetch).mock.calls[0]!;
    expect(url as string).toContain(encodeURIComponent("my app/id"));
  });
});

// ─── apps_preview ────────────────────────────────────────────────────────────

describe("apps_preview", () => {
  it("returns preview URL when codespace exists", async () => {
    const { registry } = createRegistry();
    mockFetchOk({
      id: "a1",
      name: "Preview App",
      codespaceId: "preview-cs",
      codespaceUrl: "x",
      status: "LIVE",
    });
    const result = await registry.callToolDirect("apps_preview", { app_id: "a1" });
    const text = getText(result);
    expect(result.isError).toBeUndefined();
    expect(text).toContain("https://testing.spike.land/live/preview-cs");
    expect(text).toContain("Preview App");
  });

  it("returns no-preview message when codespaceId is null", async () => {
    const { registry } = createRegistry();
    mockFetchOk({
      id: "a2",
      name: "Building App",
      codespaceId: null,
      codespaceUrl: null,
      status: "BUILDING",
    });
    const result = await registry.callToolDirect("apps_preview", { app_id: "a2" });
    const text = getText(result);
    expect(text).toContain("No Preview Available");
    expect(text).toContain("BUILDING");
  });
});

// ─── apps_chat ────────────────────────────────────────────────────────────────

describe("apps_chat", () => {
  it("sends message and returns confirmation", async () => {
    const { registry } = createRegistry();
    mockFetchOk({
      id: "msg-1",
      content: "Processing...",
      role: "AGENT",
      createdAt: "2026-01-01T00:00:00Z",
    });
    const result = await registry.callToolDirect("apps_chat", {
      app_id: "a1",
      message: "Make it purple",
    });
    const text = getText(result);
    expect(result.isError).toBeUndefined();
    expect(text).toContain("Message Sent");
    expect(text).toContain("msg-1");
  });

  it("includes imageIds in request body when provided", async () => {
    const { registry } = createRegistry();
    mockFetchOk({ id: "msg-2", content: "x", role: "AGENT", createdAt: "" });
    await registry.callToolDirect("apps_chat", {
      app_id: "a1",
      message: "Use this image",
      image_ids: ["img-abc"],
    });
    const [, options] = vi.mocked(fetch).mock.calls[0]!;
    const body = JSON.parse((options as RequestInit).body as string);
    expect(body.imageIds).toEqual(["img-abc"]);
    expect(body.role).toBe("USER");
  });

  it("does not include imageIds when array is empty", async () => {
    const { registry } = createRegistry();
    mockFetchOk({ id: "msg-3", content: "x", role: "AGENT", createdAt: "" });
    await registry.callToolDirect("apps_chat", {
      app_id: "a1",
      message: "No images",
      image_ids: [],
    });
    const [, options] = vi.mocked(fetch).mock.calls[0]!;
    const body = JSON.parse((options as RequestInit).body as string);
    expect(body.imageIds).toBeUndefined();
  });
});

// ─── apps_get_messages ────────────────────────────────────────────────────────

describe("apps_get_messages", () => {
  it("formats messages with role and content", async () => {
    const { registry } = createRegistry();
    mockFetchOk([
      { id: "m1", role: "USER", content: "Hello agent", createdAt: "2026-01-01T00:00:00Z" },
      {
        id: "m2",
        role: "AGENT",
        content: "Hello user",
        createdAt: "2026-01-01T00:01:00Z",
        codeVersionHash: "abc123",
      },
    ]);
    const result = await registry.callToolDirect("apps_get_messages", { app_id: "a1" });
    const text = getText(result);
    expect(result.isError).toBeUndefined();
    expect(text).toContain("You");
    expect(text).toContain("Agent");
    expect(text).toContain("Hello agent");
    expect(text).toContain("abc123");
  });

  it("returns empty state when no messages", async () => {
    const { registry } = createRegistry();
    mockFetchOk([]);
    const result = await registry.callToolDirect("apps_get_messages", { app_id: "a1" });
    expect(getText(result)).toContain("No messages yet");
  });

  it("truncates long message content at 300 chars", async () => {
    const { registry } = createRegistry();
    const longContent = "x".repeat(500);
    mockFetchOk([{ id: "m1", role: "USER", content: longContent, createdAt: "" }]);
    const result = await registry.callToolDirect("apps_get_messages", { app_id: "a1" });
    const text = getText(result);
    expect(text).toContain("...");
    // Should not contain the full content
    const truncated = text.match(/x+/)?.[0] ?? "";
    expect(truncated.length).toBeLessThanOrEqual(300);
  });

  it("passes cursor and limit as query params", async () => {
    const { registry } = createRegistry();
    mockFetchOk([]);
    await registry.callToolDirect("apps_get_messages", {
      app_id: "a1",
      cursor: "cur-xyz",
      limit: 5,
    });
    const [url] = vi.mocked(fetch).mock.calls[0]!;
    expect(url as string).toContain("cursor=cur-xyz");
    expect(url as string).toContain("limit=5");
  });
});

// ─── apps_set_status ─────────────────────────────────────────────────────────

describe("apps_set_status", () => {
  it("updates status and returns confirmation", async () => {
    const { registry } = createRegistry();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
      text: async () => "",
    } as Response);
    const result = await registry.callToolDirect("apps_set_status", {
      app_id: "a1",
      status: "LIVE",
    });
    expect(getText(result)).toContain("LIVE");
    expect(getText(result)).toContain("Status Updated");
  });

  it("adds archive warning for ARCHIVED status", async () => {
    const { registry } = createRegistry();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
      text: async () => "",
    } as Response);
    const result = await registry.callToolDirect("apps_set_status", {
      app_id: "a1",
      status: "ARCHIVED",
    });
    expect(getText(result)).toContain("removed from your active list");
  });
});

// ─── apps_bin ─────────────────────────────────────────────────────────────────

describe("apps_bin", () => {
  it("moves app to bin and returns recovery info", async () => {
    const { registry } = createRegistry();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => null,
      text: async () => "",
    } as Response);
    const result = await registry.callToolDirect("apps_bin", { app_id: "a1" });
    const text = getText(result);
    expect(text).toContain("Moved to Bin");
    expect(text).toContain("30 days");
    expect(text).toContain("apps_restore");
  });
});

// ─── apps_restore ────────────────────────────────────────────────────────────

describe("apps_restore", () => {
  it("restores an app from the bin", async () => {
    const { registry } = createRegistry();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => null,
      text: async () => "",
    } as Response);
    const result = await registry.callToolDirect("apps_restore", { app_id: "a1" });
    const text = getText(result);
    expect(text).toContain("Restored");
    expect(text).toContain("apps_get");
  });
});

// ─── apps_delete_permanent ───────────────────────────────────────────────────

describe("apps_delete_permanent", () => {
  it("blocks deletion when confirm is false", async () => {
    const { registry } = createRegistry();
    const result = await registry.callToolDirect("apps_delete_permanent", {
      app_id: "a1",
      confirm: false,
    });
    const text = getText(result);
    expect(text).toContain("Safety Check Failed");
    expect(text).toContain("confirm=true");
    // Should NOT have called fetch
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it("permanently deletes when confirm is true", async () => {
    const { registry } = createRegistry();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => null,
      text: async () => "",
    } as Response);
    const result = await registry.callToolDirect("apps_delete_permanent", {
      app_id: "a1",
      confirm: true,
    });
    const text = getText(result);
    expect(text).toContain("Permanently Deleted");
    expect(text).toContain("cannot be undone");
  });

  it("uses DELETE method", async () => {
    const { registry } = createRegistry();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => null,
      text: async () => "",
    } as Response);
    await registry.callToolDirect("apps_delete_permanent", { app_id: "a1", confirm: true });
    const [, options] = vi.mocked(fetch).mock.calls[0]!;
    expect((options as RequestInit).method).toBe("DELETE");
  });
});

// ─── apps_list_versions ───────────────────────────────────────────────────────

describe("apps_list_versions", () => {
  it("lists versions with hash and date", async () => {
    const { registry } = createRegistry();
    mockFetchOk([
      {
        id: "v1",
        hash: "abcdef1234567890",
        description: "Initial version",
        createdAt: "2026-01-01T00:00:00Z",
      },
      { id: "v2", hash: "deadbeef12345678", description: null, createdAt: "2026-01-02T00:00:00Z" },
    ]);
    const result = await registry.callToolDirect("apps_list_versions", { app_id: "a1" });
    const text = getText(result);
    expect(result.isError).toBeUndefined();
    expect(text).toContain("abcdef12"); // first 8 chars
    expect(text).toContain("Initial version");
    expect(text).toContain("**Versions for a1** (2)");
  });

  it("returns empty state when no versions", async () => {
    const { registry } = createRegistry();
    mockFetchOk([]);
    const result = await registry.callToolDirect("apps_list_versions", { app_id: "a1" });
    expect(getText(result)).toContain("No code versions yet");
  });
});

// ─── apps_batch_status ───────────────────────────────────────────────────────

describe("apps_batch_status", () => {
  it("succeeds for all apps", async () => {
    const { registry } = createRegistry();
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
        text: async () => "",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
        text: async () => "",
      } as Response);

    const result = await registry.callToolDirect("apps_batch_status", {
      app_ids: ["a1", "a2"],
      status: "ARCHIVED",
    });
    const text = getText(result);
    expect(text).toContain("**Succeeded:** 2/2");
    expect(text).toContain("ARCHIVED");
  });

  it("reports partial failures", async () => {
    const { registry } = createRegistry();
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
        text: async () => "",
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: "Not found" }),
        text: async () => "Not found",
      } as Response);

    const result = await registry.callToolDirect("apps_batch_status", {
      app_ids: ["a1", "a2"],
      status: "LIVE",
    });
    const text = getText(result);
    expect(text).toContain("**Succeeded:** 1/2");
    expect(text).toContain("**Failed:**");
  });
});

// ─── apps_clear_messages ─────────────────────────────────────────────────────

describe("apps_clear_messages", () => {
  it("clears all messages and returns confirmation", async () => {
    const { registry } = createRegistry();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => null,
      text: async () => "",
    } as Response);
    const result = await registry.callToolDirect("apps_clear_messages", { app_id: "a1" });
    const text = getText(result);
    expect(text).toContain("Chat Cleared");
    expect(text).toContain("a1");
  });
});

// ─── apps_upload_images ───────────────────────────────────────────────────────

describe("apps_upload_images", () => {
  it("returns upload instructions without calling fetch", async () => {
    const { registry } = createRegistry();
    const result = await registry.callToolDirect("apps_upload_images", {
      app_id: "a1",
      image_count: 3,
    });
    const text = getText(result);
    expect(result.isError).toBeUndefined();
    expect(text).toContain("Image Upload Instructions");
    expect(text).toContain("/api/apps/a1/images");
    expect(text).toContain("3");
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });
});

// ─── apps_generate_codespace_id ───────────────────────────────────────────────

describe("apps_generate_codespace_id", () => {
  it("generates an ID in adjective.noun.verb.suffix format", async () => {
    const { registry } = createRegistry();
    const result = await registry.callToolDirect("apps_generate_codespace_id", {});
    const text = getText(result);
    expect(result.isError).toBeUndefined();
    expect(text).toContain("Generated Codespace ID");
    // Format: word.word.word.4chars
    const match = text.match(/`([a-z]+\.[a-z]+\.[a-z]+\.[a-z0-9]{4})`/);
    expect(match).not.toBeNull();
  });

  it("generates different IDs on repeated calls", async () => {
    const { registry } = createRegistry();
    const ids = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const result = await registry.callToolDirect("apps_generate_codespace_id", {});
      const match = getText(result).match(/`([^`]+)`/);
      if (match) ids.add(match[1]);
    }
    // At least some variety (extremely unlikely to get 5 identical)
    expect(ids.size).toBeGreaterThan(1);
  });

  it("does not call fetch", async () => {
    const { registry } = createRegistry();
    await registry.callToolDirect("apps_generate_codespace_id", {});
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });
});

// ─── apps_list_templates ──────────────────────────────────────────────────────

describe("apps_list_templates", () => {
  it("lists all built-in templates", async () => {
    const { registry } = createRegistry();
    const result = await registry.callToolDirect("apps_list_templates", {});
    const text = getText(result);
    expect(result.isError).toBeUndefined();
    expect(text).toContain("Available App Templates");
    expect(text).toContain("blank");
    expect(text).toContain("dashboard");
    expect(text).toContain("landing-page");
    expect(text).toContain("portfolio");
    expect(text).toContain("chat-app");
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it("shows 5 templates", async () => {
    const { registry } = createRegistry();
    const result = await registry.callToolDirect("apps_list_templates", {});
    expect(getText(result)).toContain("(5)");
  });

  it("mentions apps_create usage", async () => {
    const { registry } = createRegistry();
    const result = await registry.callToolDirect("apps_list_templates", {});
    expect(getText(result)).toContain("apps_create");
  });
});

// ─── Error propagation ────────────────────────────────────────────────────────

describe("apps tools error handling", () => {
  it("apps_create propagates fetch 500 error", async () => {
    const { registry } = createRegistry();
    mockFetchError(500, "Internal Server Error");
    const result = await registry.callToolDirect("apps_create", { prompt: "Make anything" });
    // McpError is thrown; safeToolCall is not used here so it propagates as thrown
    // The tool handler throws — callToolDirect will propagate the error
    // (apps tools do NOT use safeToolCall wrapper)
    expect(result.isError).toBe(true);
  });

  it("apps_get returns error on 404", async () => {
    const { registry } = createRegistry();
    mockFetchError(404, "Not found");
    const result = await registry.callToolDirect("apps_get", { app_id: "missing" });
    expect(result.isError).toBe(true);
  });
});
