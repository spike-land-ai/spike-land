/**
 * Extended tests for ServerManager covering the branches not hit by
 * the baseline server-manager.test.ts.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockConnect = vi.hoisted(() => vi.fn());
const mockGetTools = vi.hoisted(() => vi.fn());
const mockCallTool = vi.hoisted(() => vi.fn());
const mockClose = vi.hoisted(() => vi.fn());
const mockConnectedGetter = vi.hoisted(() => vi.fn().mockReturnValue(true));

vi.mock("../../../../src/spike-cli/multiplexer/upstream-client.js", () => ({
  UpstreamClient: class MockUpstreamClient {
    name: string;
    config: unknown;
    connect = mockConnect;
    getTools = mockGetTools;
    callTool = mockCallTool;
    close = mockClose;
    get connected() {
      return mockConnectedGetter();
    }
    constructor(name: string, config: unknown) {
      this.name = name;
      this.config = config;
    }
  },
}));

import { ServerManager } from "../../../../src/spike-cli/multiplexer/server-manager.js";
import type { ResolvedConfig } from "../../../../src/spike-cli/config/types.js";
import type { ToolsetManager } from "../../../../src/spike-cli/multiplexer/toolset-manager.js";

function cfg(servers: Record<string, object> = {}): ResolvedConfig {
  return { servers: servers as ResolvedConfig["servers"] };
}

function makeMockTsManager(
  overrides: Partial<{
    isServerVisible: boolean;
    metaTools: Array<{
      name: string;
      description: string;
      inputSchema: Record<string, unknown>;
    }>;
    isMetaTool: boolean;
    metaToolResult: { content: Array<{ type: string; text: string }> };
  }> = {},
): ToolsetManager {
  return {
    isServerVisible: vi.fn().mockReturnValue(overrides.isServerVisible ?? true),
    getMetaTools: vi.fn().mockReturnValue(overrides.metaTools ?? []),
    isMetaTool: vi.fn().mockReturnValue(overrides.isMetaTool ?? false),
    handleMetaTool: vi
      .fn()
      .mockResolvedValue(overrides.metaToolResult ?? { content: [{ type: "text", text: "meta" }] }),
    listToolsets: vi.fn().mockReturnValue([]),
    loadToolset: vi.fn(),
  } as unknown as ToolsetManager;
}

describe("ServerManager — toolset visibility in getAllTools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnect.mockResolvedValue(undefined);
    mockClose.mockResolvedValue(undefined);
    mockGetTools.mockReturnValue([
      {
        name: "run",
        description: "Run",
        inputSchema: {},
      },
    ]);
  });

  it("skips tools from servers hidden by toolset manager", async () => {
    const manager = new ServerManager();
    await manager.connectAll(cfg({ hidden: { command: "h" } }));

    manager.setToolsetManager(makeMockTsManager({ isServerVisible: false }));

    const tools = manager.getAllTools();
    expect(tools.filter((t) => t.serverName === "hidden")).toHaveLength(0);
  });

  it("includes tools from servers visible to toolset manager", async () => {
    const manager = new ServerManager();
    await manager.connectAll(cfg({ visible: { command: "v" } }));

    manager.setToolsetManager(makeMockTsManager({ isServerVisible: true }));

    const tools = manager.getAllTools();
    expect(tools.filter((t) => t.serverName === "visible")).toHaveLength(1);
  });

  it("includes meta-tools from toolset manager", async () => {
    const manager = new ServerManager();
    await manager.connectAll(cfg({}));

    manager.setToolsetManager(
      makeMockTsManager({
        metaTools: [
          {
            name: "load_toolset",
            description: "Load",
            inputSchema: {},
          },
        ],
      }),
    );

    const tools = manager.getAllTools();
    const meta = tools.find((t) => t.namespacedName === "load_toolset");
    expect(meta).toBeDefined();
    expect(meta?.serverName).toBe("spike");
    expect(meta?.originalName).toBe("load_toolset");
  });
});

describe("ServerManager — callTool with toolset manager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnect.mockResolvedValue(undefined);
    mockClose.mockResolvedValue(undefined);
    mockConnectedGetter.mockReturnValue(true);
    mockGetTools.mockReturnValue([
      {
        name: "run",
        description: "Run",
        inputSchema: {},
      },
    ]);
    mockCallTool.mockResolvedValue({ content: [{ type: "text", text: "ok" }] });
  });

  it("routes meta-tool calls through toolset manager handleMetaTool", async () => {
    const manager = new ServerManager();
    await manager.connectAll(cfg({}));

    const ts = makeMockTsManager({
      isMetaTool: true,
      metaToolResult: { content: [{ type: "text", text: "loaded!" }] },
    });
    manager.setToolsetManager(ts);

    const result = await manager.callTool("load_toolset", { name: "chess" });
    expect(ts.handleMetaTool as ReturnType<typeof vi.fn>).toHaveBeenCalledWith("load_toolset", {
      name: "chess",
    });
    expect(result.content[0].text).toBe("loaded!");
  });

  it("throws when namespaced tool's server is hidden by toolset", async () => {
    const manager = new ServerManager();
    await manager.connectAll(cfg({ srv: { command: "srv" } }));

    manager.setToolsetManager(makeMockTsManager({ isServerVisible: false }));

    await expect(manager.callTool("srv__run", {})).rejects.toThrow(/toolset not loaded/);
  });

  it("throws in noPrefix mode when server is hidden by toolset", async () => {
    const manager = new ServerManager({ noPrefix: true });
    await manager.connectAll(cfg({ srv: { command: "srv" } }));

    manager.setToolsetManager(makeMockTsManager({ isServerVisible: false }));

    await expect(manager.callTool("run", {})).rejects.toThrow(/Tool not found/);
  });
});

describe("ServerManager — reconnect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnect.mockResolvedValue(undefined);
    mockClose.mockResolvedValue(undefined);
    mockGetTools.mockReturnValue([]);
  });

  it("replaces an existing connection", async () => {
    const manager = new ServerManager();
    await manager.connectAll(cfg({ srv: { command: "v1" } }));

    mockConnect.mockClear();
    mockClose.mockClear();

    await manager.reconnect("srv", { command: "v2" } as ResolvedConfig["servers"][string]);

    expect(mockClose).toHaveBeenCalledTimes(1);
    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(manager.getServerNames()).toContain("srv");
  });

  it("adds a brand-new server on reconnect if not previously connected", async () => {
    const manager = new ServerManager();
    await manager.reconnect("brand-new", { command: "new" } as ResolvedConfig["servers"][string]);

    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(manager.getServerNames()).toContain("brand-new");
  });
});

describe("ServerManager — disconnectServer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnect.mockResolvedValue(undefined);
    mockClose.mockResolvedValue(undefined);
    mockGetTools.mockReturnValue([]);
  });

  it("removes only the specified server", async () => {
    const manager = new ServerManager();
    await manager.connectAll(cfg({ a: { command: "a" }, b: { command: "b" } }));
    await manager.disconnectServer("a");

    expect(manager.getServerNames()).not.toContain("a");
    expect(manager.getServerNames()).toContain("b");
  });

  it("is a no-op for a server that was never connected", async () => {
    const manager = new ServerManager();
    await manager.disconnectServer("ghost");
    expect(mockClose).not.toHaveBeenCalled();
  });
});

describe("ServerManager — applyConfigDiff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnect.mockResolvedValue(undefined);
    mockClose.mockResolvedValue(undefined);
    mockGetTools.mockReturnValue([]);
  });

  it("adds new servers", async () => {
    const manager = new ServerManager();
    const oldCfg = cfg({ existing: { command: "e" } });
    const newCfg = cfg({ existing: { command: "e" }, fresh: { command: "f" } });

    await manager.connectAll(oldCfg);
    mockConnect.mockClear();

    const diff = await manager.applyConfigDiff(oldCfg, newCfg);

    expect(diff.added).toContain("fresh");
    expect(diff.removed).toHaveLength(0);
    expect(diff.changed).toHaveLength(0);
    expect(manager.getServerNames()).toContain("fresh");
  });

  it("removes deleted servers", async () => {
    const manager = new ServerManager();
    const oldCfg = cfg({ keep: { command: "k" }, gone: { command: "g" } });
    const newCfg = cfg({ keep: { command: "k" } });

    await manager.connectAll(oldCfg);

    const diff = await manager.applyConfigDiff(oldCfg, newCfg);

    expect(diff.removed).toContain("gone");
    expect(diff.added).toHaveLength(0);
    expect(manager.getServerNames()).not.toContain("gone");
  });

  it("reconnects servers with changed config", async () => {
    const manager = new ServerManager();
    const oldCfg = cfg({ srv: { command: "old-cmd" } });
    const newCfg = cfg({ srv: { command: "new-cmd" } });

    await manager.connectAll(oldCfg);
    mockConnect.mockClear();
    mockClose.mockClear();

    const diff = await manager.applyConfigDiff(oldCfg, newCfg);

    expect(diff.changed).toContain("srv");
    expect(mockClose).toHaveBeenCalled();
    expect(mockConnect).toHaveBeenCalled();
  });

  it("leaves unchanged servers alone", async () => {
    const manager = new ServerManager();
    const config = cfg({ a: { command: "a" }, b: { command: "b" } });

    await manager.connectAll(config);
    mockConnect.mockClear();
    mockClose.mockClear();

    const diff = await manager.applyConfigDiff(config, config);

    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
    expect(diff.changed).toHaveLength(0);
    expect(mockClose).not.toHaveBeenCalled();
    expect(mockConnect).not.toHaveBeenCalled();
  });

  it("gracefully handles new server connect failure", async () => {
    const manager = new ServerManager();
    const oldCfg = cfg({});
    const newCfg = cfg({ broken: { command: "b" } });

    mockConnect.mockRejectedValueOnce(new Error("nope"));

    const diff = await manager.applyConfigDiff(oldCfg, newCfg);
    // Should not throw; broken server not in added
    expect(diff.added).not.toContain("broken");
  });

  it("gracefully handles changed server reconnect failure", async () => {
    const manager = new ServerManager();
    const oldCfg = cfg({ srv: { command: "old" } });
    const newCfg = cfg({ srv: { command: "new" } });

    await manager.connectAll(oldCfg);
    mockClose.mockResolvedValue(undefined);
    mockConnect.mockRejectedValueOnce(new Error("reconnect fail"));

    const diff = await manager.applyConfigDiff(oldCfg, newCfg);
    expect(diff.changed).not.toContain("srv");
  });
});

describe("ServerManager — isConnected / getServerTools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnect.mockResolvedValue(undefined);
    mockClose.mockResolvedValue(undefined);
  });

  it("reflects the upstream connected state", async () => {
    const manager = new ServerManager();
    await manager.connectAll(cfg({ srv: { command: "s" } }));

    mockConnectedGetter.mockReturnValue(true);
    expect(manager.isConnected("srv")).toBe(true);

    mockConnectedGetter.mockReturnValue(false);
    expect(manager.isConnected("srv")).toBe(false);
  });

  it("returns false for unknown server in isConnected", () => {
    const manager = new ServerManager();
    expect(manager.isConnected("nobody")).toBe(false);
  });

  it("returns tool list for known server", async () => {
    mockGetTools.mockReturnValue([
      {
        name: "ping",
        description: "Ping",
        inputSchema: {},
      },
    ]);

    const manager = new ServerManager();
    await manager.connectAll(cfg({ srv: { command: "s" } }));

    const tools = manager.getServerTools("srv");
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe("ping");
  });

  it("returns empty array for unknown server in getServerTools", () => {
    const manager = new ServerManager();
    expect(manager.getServerTools("unknown")).toEqual([]);
  });
});

describe("ServerManager — noPrefix mode callTool success (lines 132-134)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnect.mockResolvedValue(undefined);
    mockClose.mockResolvedValue(undefined);
    mockConnectedGetter.mockReturnValue(true);
    mockCallTool.mockResolvedValue({ content: [{ type: "text", text: "pong" }] });
  });

  it("calls tool directly by name in noPrefix mode when tool exists", async () => {
    mockGetTools.mockReturnValue([{ name: "ping", description: "", inputSchema: {} }]);

    const manager = new ServerManager({ noPrefix: true });
    await manager.connectAll(cfg({ srv: { command: "s" } }));

    const result = await manager.callTool("ping", {});
    expect(mockCallTool).toHaveBeenCalledWith("ping", {});
    expect(result.content[0].text).toBe("pong");
  });

  it("skips servers without tool and finds it in second server (line 133 false branch)", async () => {
    // First server has no tools, second server has "ping"
    mockGetTools
      .mockReturnValueOnce([]) // first server: no tools
      .mockReturnValue([{ name: "ping", description: "", inputSchema: {} }]); // second server

    const manager = new ServerManager({ noPrefix: true });
    await manager.connectAll(cfg({ srv1: { command: "s1" }, srv2: { command: "s2" } }));

    const result = await manager.callTool("ping", {});
    expect(result.content[0].text).toBe("pong");
  });
});

describe("ServerManager — reconnect with unknown server throws (line 168)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnect.mockResolvedValue(undefined);
    mockClose.mockResolvedValue(undefined);
  });

  it("throws when reconnecting unknown server with no config provided", async () => {
    const manager = new ServerManager();
    // Server "ghost" was never connected and no config given
    await expect(manager.reconnect("ghost")).rejects.toThrow("Unknown server: ghost");
  });
});

describe("ServerManager — getServerConfig always returns undefined (line 236)", () => {
  it("getServerConfig returns undefined", () => {
    const manager = new ServerManager();
    expect(manager.getServerConfig("any")).toBeUndefined();
  });
});

describe("ServerManager — callTool filtered tool check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnect.mockResolvedValue(undefined);
    mockClose.mockResolvedValue(undefined);
    mockConnectedGetter.mockReturnValue(true);
  });

  it("throws when the resolved tool name does not exist on the server", async () => {
    mockGetTools.mockReturnValue([]);

    const manager = new ServerManager();
    await manager.connectAll(cfg({ srv: { command: "s" } }));

    await expect(manager.callTool("srv__nonexistent", {})).rejects.toThrow(/Tool not found/);
  });

  it("calls the tool when it exists after filtering", async () => {
    mockGetTools.mockReturnValue([
      {
        name: "ping",
        description: "",
        inputSchema: {},
      },
    ]);
    mockCallTool.mockResolvedValue({
      content: [{ type: "text", text: "pong" }],
    });

    const manager = new ServerManager();
    await manager.connectAll(cfg({ srv: { command: "s" } }));

    const result = await manager.callTool("srv__ping", {});
    expect(result.content[0].text).toBe("pong");
  });
});
