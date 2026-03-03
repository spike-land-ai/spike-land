/**
 * Extended tests for shell/commands.ts — covers toolsets, alias handling,
 * tool alias resolution, and the isError branch of handleCall.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  handleAlias,
  handleCall,
  handleLoadToolset,
  handleReconnect,
  handleToolsets,
  type ShellContext,
} from "../../shell/commands.js";
import type { ServerManager } from "../../multiplexer/server-manager.js";
import type { ResolvedConfig } from "../../config/types.js";
import type { AliasResolver } from "../../alias/resolver.js";
import type { ToolsetManager } from "../../multiplexer/toolset-manager.js";

// Isolate alias store operations in a temp directory
let tempDir: string;

vi.mock("node:os", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:os")>();
  return {
    ...actual,
    default: actual,
    homedir: () => tempDir,
  };
});

function makeManager(overrides: Partial<ServerManager> = {}): ServerManager {
  return {
    getServerNames: vi.fn().mockReturnValue([]),
    isConnected: vi.fn().mockReturnValue(true),
    getServerTools: vi.fn().mockReturnValue([]),
    getAllTools: vi.fn().mockReturnValue([]),
    callTool: vi.fn().mockResolvedValue({
      content: [{ type: "text", text: "ok" }],
    }),
    reconnect: vi.fn().mockResolvedValue(undefined),
    toolsetManager: undefined,
    ...overrides,
  } as unknown as ServerManager;
}

function makeCtx(overrides: Partial<ShellContext> = {}): ShellContext {
  return {
    manager: makeManager(),
    config: { servers: {} } as ResolvedConfig,
    ...overrides,
  };
}

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "spike-shell-cmds-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("handleCall — alias resolution", () => {
  it("resolves a tool alias to a different tool name", async () => {
    const mockCallTool = vi.fn().mockResolvedValue({
      content: [{ type: "text", text: "resolved!" }],
    });
    const manager = makeManager({ callTool: mockCallTool });

    const resolver = {
      resolveTool: vi.fn().mockReturnValue({
        type: "tool",
        toolName: "chess__move",
      }),
      isReserved: vi.fn().mockReturnValue(false),
    } as unknown as AliasResolver;

    const ctx = makeCtx({ manager, resolver });
    const output = await handleCall(ctx, "mv");

    expect(mockCallTool).toHaveBeenCalledWith("chess__move", {});
    expect(output).toContain("resolved!");
  });

  it("resolves a composite alias, merging default and user args", async () => {
    const mockCallTool = vi.fn().mockResolvedValue({
      content: [{ type: "text", text: "composite!" }],
    });
    const manager = makeManager({ callTool: mockCallTool });

    const resolver = {
      resolveTool: vi.fn().mockReturnValue({
        type: "composite",
        toolName: "chess__move",
        args: { from: "e2" },
      }),
      isReserved: vi.fn().mockReturnValue(false),
    } as unknown as AliasResolver;

    const ctx = makeCtx({ manager, resolver });
    const output = await handleCall(ctx, "mv", '{"to":"e4"}');

    expect(mockCallTool).toHaveBeenCalledWith("chess__move", {
      from: "e2",
      to: "e4",
    });
    expect(output).toContain("composite!");
  });

  it("uses original tool name when resolver returns a non-tool type", async () => {
    const mockCallTool = vi.fn().mockResolvedValue({
      content: [{ type: "text", text: "direct" }],
    });
    const manager = makeManager({ callTool: mockCallTool });

    // Resolver returns something other than 'tool' or 'composite'
    const resolver = {
      resolveTool: vi.fn().mockReturnValue({ type: "unknown" }),
      isReserved: vi.fn().mockReturnValue(false),
    } as unknown as AliasResolver;

    const ctx = makeCtx({ manager, resolver });
    await handleCall(ctx, "mytool");

    expect(mockCallTool).toHaveBeenCalledWith("mytool", {});
  });
});

describe("handleCall — isError result", () => {
  it("formats error result when tool returns isError: true", async () => {
    const manager = makeManager({
      callTool: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: "Something went wrong" }],
        isError: true,
      }),
    });

    const ctx = makeCtx({ manager });
    const output = await handleCall(ctx, "chess__move", "{}");

    expect(output).toContain("Something went wrong");
  });

  it("handles content items with undefined text in error result", async () => {
    const manager = makeManager({
      callTool: vi.fn().mockResolvedValue({
        content: [{ type: "image" }],
        isError: true,
      }),
    });

    const ctx = makeCtx({ manager });
    const output = await handleCall(ctx, "chess__move", "{}");
    // Should not throw; text will be empty string
    expect(typeof output).toBe("string");
  });
});

describe("handleReconnect — error path", () => {
  it("shows error when reconnect throws", async () => {
    const manager = makeManager({
      getServerNames: vi.fn().mockReturnValue(["srv"]),
      isConnected: vi.fn().mockReturnValue(true),
      getServerTools: vi.fn().mockReturnValue([]),
      reconnect: vi.fn().mockRejectedValue(new Error("connection reset")),
    });
    const ctx = makeCtx({
      manager,
      config: {
        servers: {
          srv: { command: "srv" } as ResolvedConfig["servers"][string],
        },
      } as ResolvedConfig,
    });

    const output = await handleReconnect(ctx, "srv");
    expect(output).toContain("connection reset");
    expect(output).toContain("Reconnect failed");
  });
});

describe("handleToolsets", () => {
  it("shows message when no toolset manager is set", () => {
    const manager = makeManager({ toolsetManager: undefined });
    const ctx = makeCtx({ manager });

    const output = handleToolsets(ctx);
    expect(output).toContain("Lazy loading is not enabled");
  });

  it("shows message when toolset manager has no toolsets", () => {
    const tsManager = {
      listToolsets: vi.fn().mockReturnValue([]),
    } as unknown as ToolsetManager;

    const manager = makeManager({ toolsetManager: tsManager });
    const ctx = makeCtx({ manager });

    const output = handleToolsets(ctx);
    expect(output).toContain("No toolsets configured");
  });

  it("lists loaded and unloaded toolsets", () => {
    const tsManager = {
      listToolsets: vi.fn().mockReturnValue([
        {
          name: "chess",
          loaded: true,
          servers: ["chess-server"],
          toolCount: 5,
          description: "Chess tools",
        },
        {
          name: "weather",
          loaded: false,
          servers: ["weather-server"],
          toolCount: 3,
          description: "",
        },
      ]),
    } as unknown as ToolsetManager;

    const manager = makeManager({ toolsetManager: tsManager });
    const ctx = makeCtx({ manager });

    const output = handleToolsets(ctx);
    expect(output).toContain("chess");
    expect(output).toContain("loaded");
    expect(output).toContain("weather");
    expect(output).toContain("unloaded");
    expect(output).toContain("5 tools");
    expect(output).toContain("Chess tools");
  });

  it("handles toolset without description", () => {
    const tsManager = {
      listToolsets: vi.fn().mockReturnValue([
        {
          name: "bare",
          loaded: false,
          servers: ["srv"],
          toolCount: 0,
        },
      ]),
    } as unknown as ToolsetManager;

    const manager = makeManager({ toolsetManager: tsManager });
    const ctx = makeCtx({ manager });

    const output = handleToolsets(ctx);
    expect(output).toContain("bare");
  });
});

describe("handleLoadToolset", () => {
  it("shows error when no name is provided", () => {
    const ctx = makeCtx();
    const output = handleLoadToolset(ctx, "");
    expect(output).toContain("Usage: load <toolset>");
  });

  it("shows error when no toolset manager is set", () => {
    const manager = makeManager({ toolsetManager: undefined });
    const ctx = makeCtx({ manager });

    const output = handleLoadToolset(ctx, "chess");
    expect(output).toContain("Lazy loading is not enabled");
  });

  it("loads a toolset and shows confirmation", () => {
    const tsManager = {
      loadToolset: vi.fn().mockReturnValue({
        loaded: ["chess-server"],
        toolCount: 12,
      }),
    } as unknown as ToolsetManager;

    const manager = makeManager({ toolsetManager: tsManager });
    const ctx = makeCtx({ manager });

    const output = handleLoadToolset(ctx, "chess");
    expect(output).toContain("chess");
    expect(output).toContain("12 tools");
  });

  it("shows error when loadToolset throws", () => {
    const tsManager = {
      loadToolset: vi.fn().mockImplementation(() => {
        throw new Error("Toolset not found: chess");
      }),
    } as unknown as ToolsetManager;

    const manager = makeManager({ toolsetManager: tsManager });
    const ctx = makeCtx({ manager });

    const output = handleLoadToolset(ctx, "chess");
    expect(output).toContain("Toolset not found: chess");
  });
});

describe("handleAlias", () => {
  it("lists aliases when no subcommand is given", async () => {
    const { addAlias } = await import("../../alias/store.js");
    await addAlias("commands", "s", "serve");

    const ctx = makeCtx();
    const output = await handleAlias(ctx, []);
    expect(output).toContain("Commands:");
    expect(output).toContain("s");
    expect(output).toContain("serve");
  });

  it("lists aliases for explicit 'list' subcommand", async () => {
    const ctx = makeCtx();
    const output = await handleAlias(ctx, ["list"]);
    // May be empty but should not throw
    expect(typeof output).toBe("string");
  });

  it("shows 'No aliases configured' when store is empty", async () => {
    const ctx = makeCtx();
    const output = await handleAlias(ctx, ["list"]);
    expect(output).toContain("No aliases configured");
  });

  it("sets a tool alias (expansion contains __)", async () => {
    const ctx = makeCtx();
    const output = await handleAlias(ctx, ["set", "mv", "chess__move"]);
    expect(output).toContain("Alias set");
    expect(output).toContain("tools");
  });

  it("sets a command alias (expansion is a known command)", async () => {
    const ctx = makeCtx();
    const output = await handleAlias(ctx, ["set", "sh", "shell"]);
    expect(output).toContain("Alias set");
    expect(output).toContain("commands");
  });

  it("sets a server alias (default section)", async () => {
    const ctx = makeCtx();
    const output = await handleAlias(ctx, ["set", "sp", "spike-land"]);
    expect(output).toContain("Alias set");
    expect(output).toContain("servers");
  });

  it("returns error when 'set' is missing name or expansion", async () => {
    const ctx = makeCtx();
    const output = await handleAlias(ctx, ["set"]);
    expect(output).toContain("Usage:");
  });

  it("returns error when 'set' expansion is missing", async () => {
    const ctx = makeCtx();
    const output = await handleAlias(ctx, ["set", "myalias"]);
    expect(output).toContain("Usage:");
  });

  it("prevents setting a reserved name", async () => {
    const resolver = {
      isReserved: vi.fn().mockReturnValue(true),
      resolveTool: vi.fn(),
    } as unknown as AliasResolver;

    const ctx = makeCtx({ resolver });
    const output = await handleAlias(ctx, ["set", "serve", "serve"]);
    expect(output).toContain("reserved");
  });

  it("removes an existing alias", async () => {
    const { addAlias } = await import("../../alias/store.js");
    await addAlias("commands", "delme", "serve");

    const ctx = makeCtx();
    const output = await handleAlias(ctx, ["remove", "delme"]);
    expect(output).toContain("Removed alias");
    expect(output).toContain("delme");
  });

  it("returns error when removing a non-existent alias", async () => {
    const ctx = makeCtx();
    const output = await handleAlias(ctx, ["remove", "ghost"]);
    expect(output).toContain("No alias found");
  });

  it("returns error when 'remove' has no name", async () => {
    const ctx = makeCtx();
    const output = await handleAlias(ctx, ["remove"]);
    expect(output).toContain("Usage:");
  });

  it("returns error for unknown subcommand", async () => {
    const ctx = makeCtx();
    const output = await handleAlias(ctx, ["badcmd"]);
    expect(output).toContain("Unknown alias subcommand");
  });

  it("shows JSON representation for composite alias values in list", async () => {
    const { addAlias } = await import("../../alias/store.js");
    await addAlias("composite", "qm", {
      tool: "chess__move",
      args: { from: "e2" },
    });

    const ctx = makeCtx();
    const output = await handleAlias(ctx, ["list"]);
    expect(output).toContain("qm");
    expect(output).toContain("chess__move");
  });
});
