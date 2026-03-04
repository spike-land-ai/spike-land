import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCompleter } from "../../../../src/spike-cli/shell/completer.js";
import type { ServerManager } from "../../../../src/spike-cli/multiplexer/server-manager.js";

describe("createCompleter", () => {
  let mockManager: ServerManager;

  beforeEach(() => {
    mockManager = {
      getServerNames: vi.fn().mockReturnValue(["vitest", "playwright"]),
      getAllTools: vi.fn().mockReturnValue([
        {
          namespacedName: "vitest__run_tests",
          originalName: "run_tests",
          serverName: "vitest",
          description: "Run tests",
          inputSchema: {},
        },
        {
          namespacedName: "vitest__list_tests",
          originalName: "list_tests",
          serverName: "vitest",
          description: "List tests",
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
    } as unknown as ServerManager;
  });

  it("completes REPL commands with empty input", () => {
    const completer = createCompleter(mockManager);
    const [completions, partial] = completer("");
    expect(completions).toContain("servers");
    expect(completions).toContain("tools");
    expect(completions).toContain("call");
    expect(completions).toContain("help");
    expect(partial).toBe("");
  });

  it("completes REPL commands with partial input", () => {
    const completer = createCompleter(mockManager);
    const [completions, partial] = completer("se");
    expect(completions).toContain("servers");
    expect(partial).toBe("se");
  });

  it("completes tool names after 'call '", () => {
    const completer = createCompleter(mockManager);
    const [completions, partial] = completer("call ");
    expect(completions).toContain("vitest__run_tests");
    expect(completions).toContain("vitest__list_tests");
    expect(completions).toContain("playwright__navigate");
    expect(partial).toBe("");
  });

  it("fuzzy-filters tool names after 'call ' with partial", () => {
    const completer = createCompleter(mockManager);
    const [completions, partial] = completer("call run");
    expect(completions).toContain("vitest__run_tests");
    expect(partial).toBe("run");
  });

  it("completes server names after 'tools '", () => {
    const completer = createCompleter(mockManager);
    const [completions, partial] = completer("tools ");
    expect(completions).toContain("vitest");
    expect(completions).toContain("playwright");
    expect(partial).toBe("");
  });

  it("completes server names after 'reconnect '", () => {
    const completer = createCompleter(mockManager);
    const [completions, partial] = completer("reconnect vi");
    expect(completions).toContain("vitest");
    expect(partial).toBe("vi");
  });

  it("completes alias subcommands after 'alias '", () => {
    const completer = createCompleter(mockManager);
    const [completions, partial] = completer("alias ");
    expect(completions).toContain("set");
    expect(completions).toContain("remove");
    expect(completions).toContain("list");
    expect(partial).toBe("");
  });

  it("includes alias names in command completion when resolver provided", () => {
    const aliasResolver = {
      getAliasNames: vi.fn().mockReturnValue(["myalias"]),
    };
    const completer = createCompleter(mockManager, aliasResolver);
    const [completions] = completer("");
    expect(completions).toContain("myalias");
  });

  it("returns empty completions for unknown command arguments", () => {
    const completer = createCompleter(mockManager);
    const [completions] = completer("help extra");
    expect(completions).toEqual([]);
  });

  it("returns empty completions for 'call' with more than 2 parts", () => {
    const completer = createCompleter(mockManager);
    const [completions, partial] = completer("call some-tool extra-arg");
    expect(completions).toEqual([]);
    expect(partial).toBe("extra-arg");
  });

  it("returns empty completions for 'tools' with more than 2 parts", () => {
    const completer = createCompleter(mockManager);
    const [completions, partial] = completer("tools vitest extra");
    expect(completions).toEqual([]);
    expect(partial).toBe("extra");
  });

  it("returns empty completions for 'reconnect' with more than 2 parts", () => {
    const completer = createCompleter(mockManager);
    const [completions, partial] = completer("reconnect vitest extra");
    expect(completions).toEqual([]);
    expect(partial).toBe("extra");
  });

  it("completes alias subcommands with partial match", () => {
    const completer = createCompleter(mockManager);
    const [completions, partial] = completer("alias se");
    expect(completions).toContain("set");
    expect(partial).toBe("se");
  });

  it("returns all alias subcommands when fuzzy yields no match", () => {
    const completer = createCompleter(mockManager);
    const [completions] = completer("alias zzzzz");
    expect(completions).toEqual(["set", "remove", "list"]);
  });

  it("returns all commands when fuzzy yields no match", () => {
    const completer = createCompleter(mockManager);
    const [completions] = completer("zzzzz");
    expect(completions).toContain("servers");
    expect(completions).toContain("tools");
  });

  it("fuzzy-filters server names after 'reconnect ' with partial", () => {
    const completer = createCompleter(mockManager);
    const [completions] = completer("reconnect zzzzz");
    expect(completions).toEqual(["vitest", "playwright"]);
  });

  it("fuzzy-filters tool names after 'call ' when no match returns all", () => {
    const completer = createCompleter(mockManager);
    const [completions] = completer("call zzzzz");
    expect(completions).toContain("vitest__run_tests");
  });

  it("returns empty completions for 'alias' with more than 2 parts (line 92)", () => {
    const completer = createCompleter(mockManager);
    const [completions, partial] = completer("alias set name extra");
    expect(completions).toEqual([]);
    expect(partial).toBe("extra");
  });
});
