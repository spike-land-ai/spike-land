import { beforeEach, describe, expect, it, vi } from "vitest";
import { ServerManager } from "../../../../src/spike-cli/multiplexer/server-manager.js";

// Mock UpstreamClient as a class
const mockConnect = vi.hoisted(() => vi.fn());
const mockGetTools = vi.hoisted(() => vi.fn());
const mockCallTool = vi.hoisted(() => vi.fn());
const mockClose = vi.hoisted(() => vi.fn());

vi.mock("../../../../src/spike-cli/multiplexer/upstream-client.js", () => ({
  UpstreamClient: class MockUpstreamClient {
    name: string;
    connected = true;
    connect = mockConnect;
    getTools = mockGetTools;
    callTool = mockCallTool;
    close = mockClose;
    constructor(name: string) {
      this.name = name;
    }
  },
}));

describe("ServerManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnect.mockResolvedValue(undefined);
    mockGetTools.mockReturnValue([
      {
        name: "run_tests",
        description: "Run tests",
        inputSchema: { type: "object" },
      },
    ]);
    mockCallTool.mockResolvedValue({
      content: [{ type: "text", text: "ok" }],
    });
    mockClose.mockResolvedValue(undefined);
  });

  it("connects to all configured servers", async () => {
    const manager = new ServerManager();
    await manager.connectAll({
      servers: {
        vitest: { command: "yarn", args: ["vitest-mcp"] },
        playwright: { command: "npx", args: ["playwright-mcp"] },
      },
    });

    expect(manager.getServerNames()).toEqual(["vitest", "playwright"]);
  });

  it("returns namespaced tools from all servers", async () => {
    const manager = new ServerManager();
    await manager.connectAll({
      servers: {
        vitest: { command: "yarn", args: ["vitest-mcp"] },
      },
    });

    const tools = manager.getAllTools();
    expect(tools).toHaveLength(1);
    expect(tools[0].namespacedName).toBe("vitest__run_tests");
    expect(tools[0].originalName).toBe("run_tests");
    expect(tools[0].serverName).toBe("vitest");
  });

  it("routes tool calls by namespace prefix", async () => {
    const manager = new ServerManager();
    await manager.connectAll({
      servers: {
        vitest: { command: "yarn", args: ["vitest-mcp"] },
      },
    });

    await manager.callTool("vitest__run_tests", { filter: "*.test.ts" });
    expect(mockCallTool).toHaveBeenCalledWith("run_tests", {
      filter: "*.test.ts",
    });
  });

  it("throws on unknown namespaced tool", async () => {
    const manager = new ServerManager();
    await manager.connectAll({
      servers: {
        vitest: { command: "yarn" },
      },
    });

    await expect(manager.callTool("unknown__tool", {})).rejects.toThrow("Cannot resolve tool");
  });

  it("supports noPrefix mode", async () => {
    const manager = new ServerManager({ noPrefix: true });
    await manager.connectAll({
      servers: {
        vitest: { command: "yarn" },
      },
    });

    const tools = manager.getAllTools();
    expect(tools[0].namespacedName).toBe("run_tests");
  });

  it("supports custom separator", async () => {
    const manager = new ServerManager({ separator: "::" });
    await manager.connectAll({
      servers: {
        vitest: { command: "yarn" },
      },
    });

    const tools = manager.getAllTools();
    expect(tools[0].namespacedName).toBe("vitest::run_tests");
  });

  it("isolates upstream failures", async () => {
    mockConnect
      .mockResolvedValueOnce(undefined) // first server succeeds
      .mockRejectedValueOnce(new Error("connection failed")); // second fails

    const manager = new ServerManager();
    await manager.connectAll({
      servers: {
        good: { command: "node", args: ["good.js"] },
        bad: { command: "node", args: ["bad.js"] },
      },
    });

    // Should still have the good server
    expect(manager.getServerNames()).toContain("good");
  });

  it("closes all upstreams", async () => {
    const manager = new ServerManager();
    await manager.connectAll({
      servers: {
        vitest: { command: "yarn" },
      },
    });

    await manager.closeAll();
    expect(mockClose).toHaveBeenCalled();
    expect(manager.getServerNames()).toHaveLength(0);
  });
});
