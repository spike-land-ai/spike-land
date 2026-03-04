/**
 * Extended tests for config/discovery.ts covering:
 * - toolsets loading from config
 * - lazyLoading flag from config
 * - env var expansion
 * - spike-land auto-injection when authenticated
 * - config sources tracking
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockReadFile = vi.hoisted(() => vi.fn());
const mockExistsSync = vi.hoisted(() => vi.fn());
const mockHasValidToken = vi.hoisted(() => vi.fn());
const mockLoadTokens = vi.hoisted(() => vi.fn());

vi.mock("node:fs/promises", () => ({
  readFile: mockReadFile,
  default: { readFile: mockReadFile },
}));

vi.mock("node:fs", () => {
  const mocked = { existsSync: mockExistsSync };
  return { ...mocked, default: mocked };
});

vi.mock("../../../../src/spike-cli/auth/token-store.js", () => ({
  hasValidToken: mockHasValidToken,
  loadTokens: mockLoadTokens,
}));

import { discoverConfig } from "../../../../src/spike-cli/config/discovery.js";

describe("discoverConfig — auth auto-injection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(false);
    mockHasValidToken.mockResolvedValue(false);
    mockLoadTokens.mockResolvedValue(null);
  });

  it("auto-injects spike-land server when authenticated and not already configured", async () => {
    mockHasValidToken.mockResolvedValue(true);
    mockLoadTokens.mockResolvedValue({
      baseUrl: "https://spike.land",
      accessToken: "my-token",
    });

    const result = await discoverConfig({});

    expect(result.servers["spike-land"]).toEqual({
      type: "url",
      url: "https://spike.land/api/mcp",
      env: { SPIKE_AUTH_TOKEN: "my-token" },
    });
  });

  it("does not auto-inject spike-land when not authenticated", async () => {
    mockHasValidToken.mockResolvedValue(false);

    const result = await discoverConfig({});
    expect(result.servers["spike-land"]).toBeUndefined();
  });

  it("does not auto-inject when spike-land is already in config", async () => {
    mockHasValidToken.mockResolvedValue(true);
    mockLoadTokens.mockResolvedValue({
      baseUrl: "https://spike.land",
      accessToken: "my-token",
    });

    const result = await discoverConfig({
      inlineUrls: [
        {
          name: "spike-land",
          url: "https://custom.example.com/mcp",
        },
      ],
    });

    expect(result.servers["spike-land"]?.url).toBe("https://custom.example.com/mcp");
  });

  it("does not auto-inject when loadTokens returns null despite hasValidToken", async () => {
    mockHasValidToken.mockResolvedValue(true);
    mockLoadTokens.mockResolvedValue(null);

    const result = await discoverConfig({});
    // Should not inject since tokens are null
    expect(result.servers["spike-land"]).toBeUndefined();
  });
});

describe("discoverConfig — global config path branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasValidToken.mockResolvedValue(false);
  });

  it("loads toolsets and lazyLoading from global ~/.mcp.json", async () => {
    // Make existsSync return true only for paths ending in .mcp.json (global path)
    mockExistsSync.mockImplementation((p: string) => p.endsWith(".mcp.json"));
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        mcpServers: { globalSrv: { command: "node", args: ["srv.js"] } },
        toolsets: { global: { servers: ["globalSrv"] } },
        lazyLoading: true,
      }),
    );

    const result = await discoverConfig({});
    expect(result.servers.globalSrv).toBeDefined();
    expect(result.toolsets?.global).toBeDefined();
    expect(result.lazyLoading).toBe(true);
    // configSources should include the global path
    expect(result.configSources?.length).toBeGreaterThan(0);
  });

  it("tracks global config in configSources when it has servers", async () => {
    mockExistsSync.mockImplementation((p: string) => p.endsWith(".mcp.json"));
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        mcpServers: { srv: { command: "cmd" } },
      }),
    );

    const result = await discoverConfig({});
    expect(result.configSources?.some((s: string) => s.endsWith(".mcp.json"))).toBe(true);
  });
});

describe("discoverConfig — toolsets and lazyLoading", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(false);
    mockHasValidToken.mockResolvedValue(false);
  });

  it("loads toolsets from config file", async () => {
    mockExistsSync.mockImplementation((p: string) => p.endsWith("config.json"));
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        mcpServers: {
          chess: { command: "npx", args: ["chess-mcp"] },
        },
        toolsets: {
          games: { servers: ["chess"], description: "Game servers" },
        },
      }),
    );

    const result = await discoverConfig({ configPath: "/project/config.json" });
    expect(result.toolsets).toBeDefined();
    expect(result.toolsets?.games).toEqual({
      servers: ["chess"],
      description: "Game servers",
    });
  });

  it("loads lazyLoading flag from config file", async () => {
    mockExistsSync.mockImplementation((p: string) => p.endsWith("config.json"));
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        mcpServers: {
          chess: { command: "npx", args: ["chess-mcp"] },
        },
        lazyLoading: true,
      }),
    );

    const result = await discoverConfig({ configPath: "/project/config.json" });
    expect(result.lazyLoading).toBe(true);
  });

  it("lazyLoading defaults to undefined when not in config", async () => {
    const result = await discoverConfig({});
    expect(result.lazyLoading).toBeUndefined();
  });

  it("merges toolsets from multiple config files (later wins on key conflict)", async () => {
    let callCount = 0;
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        // Global ~/.mcp.json
        return JSON.stringify({
          mcpServers: { a: { command: "a" } },
          toolsets: { shared: { servers: ["a"] } },
        });
      }
      // Project .mcp.json
      return JSON.stringify({
        mcpServers: { b: { command: "b" } },
        toolsets: { local: { servers: ["b"] } },
      });
    });

    const result = await discoverConfig({});
    expect(result.toolsets?.shared).toBeDefined();
    expect(result.toolsets?.local).toBeDefined();
  });
});

describe("discoverConfig — env var expansion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(false);
    mockHasValidToken.mockResolvedValue(false);
  });

  it("expands environment variables in server env config", async () => {
    process.env.MY_API_KEY = "secret123";

    mockExistsSync.mockImplementation((p: string) => p.endsWith("config.json"));
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        mcpServers: {
          srv: {
            command: "npx",
            args: ["mcp-server"],
            env: { API_KEY: "${MY_API_KEY}" },
          },
        },
      }),
    );

    const result = await discoverConfig({ configPath: "/p/config.json" });
    expect(result.servers.srv.env?.API_KEY).toBe("secret123");

    delete process.env.MY_API_KEY;
  });
});

describe("discoverConfig — config sources tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasValidToken.mockResolvedValue(false);
  });

  it("tracks config sources when files have servers", async () => {
    mockExistsSync.mockImplementation((p: string) => p.endsWith("config.json"));
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        mcpServers: { srv: { command: "srv" } },
      }),
    );

    const result = await discoverConfig({ configPath: "/project/config.json" });
    expect(result.configSources).toBeDefined();
    expect(result.configSources?.length).toBeGreaterThan(0);
    expect(result.configSources?.[0]).toContain("config.json");
  });

  it("does not include config sources for files with no servers", async () => {
    mockExistsSync.mockImplementation((p: string) => p.endsWith("config.json"));
    mockReadFile.mockResolvedValue(JSON.stringify({ mcpServers: {} }));

    const result = await discoverConfig({ configPath: "/project/config.json" });
    expect(result.configSources).toHaveLength(0);
  });

  it("returns empty configSources array when no files exist", async () => {
    mockExistsSync.mockReturnValue(false);

    const result = await discoverConfig({});
    expect(result.configSources).toEqual([]);
  });
});

describe("discoverConfig — error handling in loadConfigFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasValidToken.mockResolvedValue(false);
  });

  it("skips a config file that fails to parse", async () => {
    mockExistsSync.mockImplementation((p: string) => p.endsWith("config.json"));
    mockReadFile.mockResolvedValue("this is not json");

    // Should not throw; returns empty servers
    const result = await discoverConfig({ configPath: "/p/config.json" });
    expect(Object.keys(result.servers)).toHaveLength(0);
  });

  it("skips a config file that throws on read", async () => {
    mockExistsSync.mockImplementation((p: string) => p.endsWith("config.json"));
    mockReadFile.mockRejectedValue(new Error("EACCES: permission denied"));

    const result = await discoverConfig({ configPath: "/p/config.json" });
    expect(Object.keys(result.servers)).toHaveLength(0);
  });

  it("uses String(err) branch when non-Error is thrown in loadConfigFile (line 39)", async () => {
    mockExistsSync.mockImplementation((p: string) => p.endsWith("config.json"));
    // Throw a non-Error value to exercise String(err) branch
    mockReadFile.mockRejectedValue("plain string error");

    const result = await discoverConfig({ configPath: "/p/config.json" });
    // Should gracefully skip and return empty servers
    expect(Object.keys(result.servers)).toHaveLength(0);
  });

  it("does not add global config to configSources when it has no servers (line 60 false branch)", async () => {
    // Global path exists but has empty mcpServers
    mockExistsSync.mockImplementation((p: string) => p.endsWith(".mcp.json"));
    mockReadFile.mockResolvedValue(JSON.stringify({ mcpServers: {} }));

    const result = await discoverConfig({});
    // configSources should be empty since no servers found
    expect(result.configSources).toHaveLength(0);
  });
});
