import { beforeEach, describe, expect, it, vi } from "vitest";
import { collectStatus, formatStatus, registerStatusCommand } from "../../../../src/spike-cli/commands/status.js";

// Mock UpstreamClient and discoverConfig
const mockConnect = vi.hoisted(() => vi.fn());
const mockGetTools = vi.hoisted(() => vi.fn());
const mockClose = vi.hoisted(() => vi.fn());
const mockConnected = vi.hoisted(() => vi.fn());
const mockDiscoverConfig = vi.hoisted(() => vi.fn());

vi.mock("../../../../src/spike-cli/multiplexer/upstream-client.js", () => ({
  UpstreamClient: class MockUpstreamClient {
    name: string;
    connect = mockConnect;
    getTools = mockGetTools;
    close = mockClose;
    get connected() {
      return mockConnected();
    }
    constructor(name: string) {
      this.name = name;
    }
  },
}));

vi.mock("../../../../src/spike-cli/config/discovery.js", () => ({
  discoverConfig: mockDiscoverConfig,
}));

describe("status command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("collectStatus", () => {
    it("reports connected servers with tool counts", async () => {
      mockDiscoverConfig.mockResolvedValue({
        servers: {
          vitest: { command: "yarn", args: ["vitest-mcp"] },
        },
      });
      mockConnect.mockResolvedValue(undefined);
      mockConnected.mockReturnValue(true);
      mockGetTools.mockReturnValue([
        { name: "run_tests", description: "Run tests", inputSchema: {} },
      ]);
      mockClose.mockResolvedValue(undefined);

      const result = await collectStatus();

      expect(result.servers).toHaveLength(1);
      expect(result.servers[0].name).toBe("vitest");
      expect(result.servers[0].connected).toBe(true);
      expect(result.servers[0].toolCount).toBe(1);
      expect(result.servers[0].latencyMs).toBeGreaterThanOrEqual(0);
    });

    it("reports failed servers with error", async () => {
      mockDiscoverConfig.mockResolvedValue({
        servers: {
          bad: { type: "sse", url: "http://localhost:9999/mcp" },
        },
      });
      mockConnect.mockRejectedValue(new Error("Connection refused"));
      mockClose.mockResolvedValue(undefined);

      const result = await collectStatus();

      expect(result.servers).toHaveLength(1);
      expect(result.servers[0].name).toBe("bad");
      expect(result.servers[0].connected).toBe(false);
      expect(result.servers[0].error).toBe("Connection refused");
    });

    it("reports servers with 0 tools as not connected", async () => {
      mockDiscoverConfig.mockResolvedValue({
        servers: {
          empty: { type: "url", url: "http://localhost:3000/api/mcp" },
        },
      });
      mockConnect.mockResolvedValue(undefined);
      mockConnected.mockReturnValue(true);
      mockGetTools.mockReturnValue([]);
      mockClose.mockResolvedValue(undefined);

      const result = await collectStatus();

      expect(result.servers).toHaveLength(1);
      expect(result.servers[0].name).toBe("empty");
      expect(result.servers[0].connected).toBe(false);
      expect(result.servers[0].toolCount).toBe(0);
      expect(result.servers[0].error).toContain("0 tools");
    });

    it("reports env vars", async () => {
      mockDiscoverConfig.mockResolvedValue({ servers: {} });

      const original = process.env.CLAUDE_CODE_OAUTH_TOKEN;
      process.env.CLAUDE_CODE_OAUTH_TOKEN = "test-token";

      const result = await collectStatus();

      expect(result.env.CLAUDE_CODE_OAUTH_TOKEN).toBe(true);

      if (original) {
        process.env.CLAUDE_CODE_OAUTH_TOKEN = original;
      } else {
        delete process.env.CLAUDE_CODE_OAUTH_TOKEN;
      }
    });

    it("handles mixed success and failure", async () => {
      mockDiscoverConfig.mockResolvedValue({
        servers: {
          good: { command: "yarn", args: ["vitest-mcp"] },
          bad: { type: "sse", url: "http://localhost:9999/mcp" },
        },
      });

      let callCount = 0;
      mockConnect.mockImplementation(async () => {
        callCount++;
        if (callCount === 2) throw new Error("fail");
      });
      mockConnected.mockReturnValue(true);
      mockGetTools.mockReturnValue([
        {
          name: "t1",
          description: "",
          inputSchema: {},
        },
      ]);
      mockClose.mockResolvedValue(undefined);

      const result = await collectStatus();

      expect(result.servers).toHaveLength(2);
      const connected = result.servers.filter((s) => s.connected);
      const failed = result.servers.filter((s) => !s.connected);
      expect(connected).toHaveLength(1);
      expect(failed).toHaveLength(1);
    });

    it("times out on slow connections", async () => {
      mockDiscoverConfig.mockResolvedValue({
        servers: {
          slow: { type: "url", url: "http://localhost:9999/mcp" },
        },
      });
      mockConnect.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 5000)));
      mockClose.mockResolvedValue(undefined);

      const result = await collectStatus(undefined, 50);

      expect(result.servers).toHaveLength(1);
      expect(result.servers[0].connected).toBe(false);
      expect(result.servers[0].error).toContain("timed out");
    });

    it("includes configSources from discovery", async () => {
      mockDiscoverConfig.mockResolvedValue({
        servers: {},
        configSources: ["/path/to/.mcp.json"],
      });

      const result = await collectStatus();

      expect(result.configSources).toEqual(["/path/to/.mcp.json"]);
    });
  });

  describe("formatStatus", () => {
    it("formats connected server with checkmark", () => {
      const output = formatStatus({
        servers: [
          {
            name: "vitest",
            connected: true,
            toolCount: 5,
            latencyMs: 42,
          },
        ],
        env: { CLAUDE_CODE_OAUTH_TOKEN: true, MCP_API_KEY: false },
      });

      expect(output).toContain("✅");
      expect(output).toContain("vitest");
      expect(output).toContain("5 tools");
      expect(output).toContain("1/1 servers");
    });

    it("formats failed server with cross", () => {
      const output = formatStatus({
        servers: [
          {
            name: "bad",
            connected: false,
            toolCount: 0,
            error: "refused",
            latencyMs: 10,
          },
        ],
        env: {},
      });

      expect(output).toContain("❌");
      expect(output).toContain("bad");
      expect(output).toContain("refused");
    });

    it("shows env var status", () => {
      const output = formatStatus({
        servers: [],
        env: { CLAUDE_CODE_OAUTH_TOKEN: true, OPENAI_API_KEY: false },
      });

      expect(output).toContain("✅ CLAUDE_CODE_OAUTH_TOKEN");
      expect(output).toContain("⬜ OPENAI_API_KEY");
    });

    it("shows config sources", () => {
      const output = formatStatus({
        servers: [],
        env: {},
        configSources: ["/home/user/.mcp.json", "/project/.mcp.json"],
        configPath: "/project/.mcp.json",
      });

      expect(output).toContain("Config: /project/.mcp.json");
      expect(output).toContain("Config sources:");
      expect(output).toContain("/home/user/.mcp.json");
      expect(output).toContain("/project/.mcp.json");
    });

    it("shows (none configured) when no servers", () => {
      const output = formatStatus({
        servers: [],
        env: {},
      });

      expect(output).toContain("(none configured)");
    });

    it("shows config path when provided", () => {
      const output = formatStatus({
        servers: [],
        env: {},
        configPath: "/Users/z/project/.mcp.json",
      });

      expect(output).toContain("Config: /Users/z/project/.mcp.json");
    });

    it("shows 'none' when no config path", () => {
      const output = formatStatus({
        servers: [],
        env: {},
      });

      expect(output).toContain("Config: none (no .mcp.json found)");
    });
  });

  describe("collectStatus configPath", () => {
    it("includes configPath from the last config source", async () => {
      mockDiscoverConfig.mockResolvedValue({
        servers: {},
        configSources: ["/home/user/.mcp.json", "/project/.mcp.json"],
      });

      const result = await collectStatus();

      expect(result.configPath).toBe("/project/.mcp.json");
    });

    it("returns undefined configPath when no config sources", async () => {
      mockDiscoverConfig.mockResolvedValue({
        servers: {},
        configSources: [],
      });

      const result = await collectStatus();

      expect(result.configPath).toBeUndefined();
    });
  });

  describe("exit code", () => {
    let exitSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as never);
    });

    it("exits with 1 when a server has an error", async () => {
      mockDiscoverConfig.mockResolvedValue({
        servers: {
          bad: { type: "sse", url: "http://localhost:9999/mcp" },
        },
      });
      mockConnect.mockRejectedValue(new Error("Connection refused"));
      mockClose.mockResolvedValue(undefined);

      const { Command } = await import("commander");
      const testProgram = new Command();
      registerStatusCommand(testProgram);

      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      await testProgram.parseAsync(["status"], { from: "user" });
      logSpy.mockRestore();

      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it("exits with 0 when all servers connect successfully", async () => {
      mockDiscoverConfig.mockResolvedValue({
        servers: {
          good: { command: "yarn", args: ["vitest-mcp"] },
        },
      });
      mockConnect.mockResolvedValue(undefined);
      mockConnected.mockReturnValue(true);
      mockGetTools.mockReturnValue([
        { name: "run_tests", description: "Run tests", inputSchema: {} },
      ]);
      mockClose.mockResolvedValue(undefined);

      const { Command } = await import("commander");
      const testProgram = new Command();
      registerStatusCommand(testProgram);

      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      await testProgram.parseAsync(["status"], { from: "user" });
      logSpy.mockRestore();

      expect(exitSpy).toHaveBeenCalledWith(0);
    });

    it("exits with 1 when no servers are configured", async () => {
      mockDiscoverConfig.mockResolvedValue({
        servers: {},
      });

      const { Command } = await import("commander");
      const testProgram = new Command();
      registerStatusCommand(testProgram);

      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      await testProgram.parseAsync(["status"], { from: "user" });
      logSpy.mockRestore();

      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it("includes configPath in JSON output", async () => {
      mockDiscoverConfig.mockResolvedValue({
        servers: {},
        configSources: ["/project/.mcp.json"],
      });

      const { Command } = await import("commander");
      const testProgram = new Command();
      registerStatusCommand(testProgram);

      let jsonOutput = "";
      const logSpy = vi.spyOn(console, "log").mockImplementation((msg: string) => {
        jsonOutput = msg;
      });

      await testProgram.parseAsync(["status", "--json"], { from: "user" });
      logSpy.mockRestore();

      const parsed = JSON.parse(jsonOutput);
      expect(parsed.configPath).toBe("/project/.mcp.json");
    });
  });
});
