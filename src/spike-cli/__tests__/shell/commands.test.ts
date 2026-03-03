import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  handleCall,
  handleHelp,
  handleReconnect,
  handleServers,
  handleTools,
  type ShellContext,
} from "../../shell/commands.js";
import type { ServerManager } from "../../multiplexer/server-manager.js";
import type { ResolvedConfig } from "../../config/types.js";

describe("shell commands", () => {
  let ctx: ShellContext;
  let mockManager: ServerManager;

  beforeEach(() => {
    mockManager = {
      getServerNames: vi.fn().mockReturnValue(["vitest", "playwright"]),
      isConnected: vi.fn().mockReturnValue(true),
      getServerTools: vi
        .fn()
        .mockReturnValue([{ name: "run_tests", description: "Run tests", inputSchema: {} }]),
      getAllTools: vi.fn().mockReturnValue([
        {
          namespacedName: "vitest__run_tests",
          originalName: "run_tests",
          serverName: "vitest",
          description: "Run tests",
          inputSchema: {},
        },
        {
          namespacedName: "playwright__navigate",
          originalName: "navigate",
          serverName: "playwright",
          description: "Navigate",
          inputSchema: {},
        },
      ]),
      callTool: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: "result" }],
      }),
      reconnect: vi.fn().mockResolvedValue(undefined),
    } as unknown as ServerManager;

    const config: ResolvedConfig = {
      servers: {
        vitest: { command: "yarn", args: ["vitest-mcp"] },
        playwright: { command: "npx", args: ["playwright-mcp"] },
      },
    };

    ctx = { manager: mockManager, config };
  });

  describe("handleServers", () => {
    it("lists connected servers", () => {
      const output = handleServers(ctx);
      expect(output).toContain("vitest");
      expect(output).toContain("playwright");
      expect(output).toContain("connected");
    });

    it("shows 'No servers' when empty", () => {
      (mockManager.getServerNames as ReturnType<typeof vi.fn>).mockReturnValue([]);
      expect(handleServers(ctx)).toBe("No servers connected.");
    });
  });

  describe("handleTools", () => {
    it("lists all tools without filter", () => {
      const output = handleTools(ctx);
      expect(output).toContain("vitest__run_tests");
      expect(output).toContain("playwright__navigate");
    });

    it("lists tools for a specific server", () => {
      const output = handleTools(ctx, "vitest");
      expect(output).toContain("run_tests");
    });

    it("shows message for unknown server", () => {
      (mockManager.getServerTools as ReturnType<typeof vi.fn>).mockReturnValue([]);
      const output = handleTools(ctx, "unknown");
      expect(output).toContain("No tools found");
    });
  });

  describe("handleCall", () => {
    it("calls a tool and returns result", async () => {
      const output = await handleCall(ctx, "vitest__run_tests", '{"filter":"*.test.ts"}');
      expect(mockManager.callTool).toHaveBeenCalledWith("vitest__run_tests", {
        filter: "*.test.ts",
      });
      expect(output).toContain("result");
    });

    it("calls a tool without args", async () => {
      const _output = await handleCall(ctx, "vitest__run_tests");
      expect(mockManager.callTool).toHaveBeenCalledWith("vitest__run_tests", {});
    });

    it("shows error for invalid JSON", async () => {
      const output = await handleCall(ctx, "tool", "not-json");
      expect(output).toContain("Invalid JSON");
    });

    it("shows error when tool call fails", async () => {
      (mockManager.callTool as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("failed"));
      const output = await handleCall(ctx, "bad__tool", "{}");
      expect(output).toContain("failed");
    });

    it("shows usage when no tool name", async () => {
      const output = await handleCall(ctx, "");
      expect(output).toContain("Usage");
    });
  });

  describe("handleReconnect", () => {
    it("reconnects to a known server", async () => {
      const output = await handleReconnect(ctx, "vitest");
      expect(mockManager.reconnect).toHaveBeenCalled();
      expect(output).toContain("Reconnected");
    });

    it("shows error for unknown server", async () => {
      const output = await handleReconnect(ctx, "unknown");
      expect(output).toContain("Unknown server");
    });

    it("shows usage when no server name", async () => {
      const output = await handleReconnect(ctx, "");
      expect(output).toContain("Usage");
    });
  });

  describe("handleHelp", () => {
    it("lists all available commands", () => {
      const output = handleHelp();
      expect(output).toContain("servers");
      expect(output).toContain("tools");
      expect(output).toContain("call");
      expect(output).toContain("reconnect");
      expect(output).toContain("help");
      expect(output).toContain("quit");
    });
  });
});
