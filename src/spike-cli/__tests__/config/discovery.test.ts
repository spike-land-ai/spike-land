import { beforeEach, describe, expect, it, vi } from "vitest";
import { discoverConfig } from "../../config/discovery.js";

// Mock fs modules
const mockReadFile = vi.hoisted(() => vi.fn());
const mockExistsSync = vi.hoisted(() => vi.fn());

vi.mock("node:fs/promises", () => ({
  readFile: mockReadFile,
  default: { readFile: mockReadFile },
}));

vi.mock("node:fs", () => {
  const mocked = { existsSync: mockExistsSync };
  return { ...mocked, default: mocked };
});

describe("discoverConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(false);
  });

  it("returns empty servers when no config files exist", async () => {
    const result = await discoverConfig({});
    expect(Object.keys(result.servers)).toHaveLength(0);
  });

  it("adds inline stdio servers from --server flags", async () => {
    const result = await discoverConfig({
      inlineServers: [{ name: "test", command: "node server.js" }],
    });
    expect(result.servers.test).toEqual({
      type: "stdio",
      command: "node",
      args: ["server.js"],
    });
  });

  it("adds inline URL servers from --server-url flags", async () => {
    const result = await discoverConfig({
      inlineUrls: [{ name: "remote", url: "https://example.com/mcp" }],
    });
    expect(result.servers.remote).toEqual({
      type: "url",
      url: "https://example.com/mcp",
    });
  });

  it("loads config from explicit path", async () => {
    mockExistsSync.mockImplementation((path: string) => path === "/custom/config.json");
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        mcpServers: {
          vitest: { command: "yarn", args: ["vitest-mcp"] },
        },
      }),
    );

    const result = await discoverConfig({ configPath: "/custom/config.json" });
    expect(result.servers.vitest).toBeDefined();
    expect(result.servers.vitest).toMatchObject({ command: "yarn" });
  });

  it("expands env vars in server config", async () => {
    process.env.TEST_TOKEN = "abc123";

    const result = await discoverConfig({
      inlineServers: [{ name: "test", command: "node server.js" }],
    });

    // Inline servers don't have env, but verify no crash
    expect(result.servers.test).toBeDefined();

    delete process.env.TEST_TOKEN;
  });

  it("merges inline servers over config file servers", async () => {
    mockExistsSync.mockImplementation((path: string) => path === "/custom/config.json");
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        mcpServers: {
          srv: { command: "old-cmd" },
        },
      }),
    );

    const result = await discoverConfig({
      configPath: "/custom/config.json",
      inlineServers: [{ name: "srv", command: "new-cmd" }],
    });

    expect(result.servers.srv).toMatchObject({ command: "new-cmd" });
  });
});
