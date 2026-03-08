import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock environment variables before importing client
vi.stubEnv("VITE_DEMO_TOKEN", "test-token");

import { listTools, callTool } from "./client";

describe("listTools", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();

    // Mock storage implementations if not present in the environment
    if (!global.sessionStorage) {
      const mockStorage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn(), length: 0, key: vi.fn() };
      vi.stubGlobal("sessionStorage", mockStorage);
    } else {
      vi.spyOn(global.sessionStorage, 'getItem').mockReturnValue(null);
    }

    if (!global.localStorage) {
      const mockStorage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn(), length: 0, key: vi.fn() };
      vi.stubGlobal("localStorage", mockStorage);
    } else {
      vi.spyOn(global.localStorage, 'getItem').mockReturnValue(null);
    }
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should fetch and return a list of tools", async () => {
    const mockTools = [
      {
        name: "test-tool",
        description: "A test tool",
        category: "test",
        tier: "free",
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tools: mockTools }),
    });

    const result = await listTools();

    expect(global.fetch).toHaveBeenCalledWith("/api/tools", expect.objectContaining({
      headers: expect.objectContaining({
        "Content-Type": "application/json",
        "Authorization": expect.stringContaining("Bearer ")
      })
    }));

    expect(result).toEqual(mockTools);
  });

  it("should handle API errors", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });

    await expect(listTools()).rejects.toThrow("API error 500: Internal Server Error");
    expect(global.fetch).toHaveBeenCalledWith("/api/tools", expect.any(Object));
  });
});

describe("callTool", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();

    // Mock storage implementations if not present in the environment
    if (!global.sessionStorage) {
      const mockStorage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn(), length: 0, key: vi.fn() };
      vi.stubGlobal("sessionStorage", mockStorage);
    } else {
      vi.spyOn(global.sessionStorage, 'getItem').mockReturnValue(null);
    }

    if (!global.localStorage) {
      const mockStorage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn(), length: 0, key: vi.fn() };
      vi.stubGlobal("localStorage", mockStorage);
    } else {
      vi.spyOn(global.localStorage, 'getItem').mockReturnValue(null);
    }
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should successfully call a tool with arguments", async () => {
    const mockToolResult = {
      content: [{ type: "text", text: "Tool success" }],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: mockToolResult }),
    });

    const result = await callTool("test-tool", { arg1: "value1" });

    expect(global.fetch).toHaveBeenCalledWith("/api/tool", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({
        "Content-Type": "application/json",
        "Authorization": expect.stringContaining("Bearer ")
      }),
      body: JSON.stringify({ name: "test-tool", arguments: { arg1: "value1" } })
    }));

    expect(result).toEqual(mockToolResult);
  });

  it("should default to an empty object for arguments if none are provided", async () => {
    const mockToolResult = {
      content: [{ type: "text", text: "Tool success no args" }],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: mockToolResult }),
    });

    const result = await callTool("test-tool-no-args");

    expect(global.fetch).toHaveBeenCalledWith("/api/tool", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({
        "Content-Type": "application/json",
        "Authorization": expect.stringContaining("Bearer ")
      }),
      body: JSON.stringify({ name: "test-tool-no-args", arguments: {} })
    }));

    expect(result).toEqual(mockToolResult);
  });

  it("should handle API errors", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => "Bad Request",
    });

    await expect(callTool("test-tool-error")).rejects.toThrow("API error 400: Bad Request");
    expect(global.fetch).toHaveBeenCalledWith("/api/tool", expect.any(Object));
  });
});
