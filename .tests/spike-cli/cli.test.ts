import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { program } from "commander";
import * as auth from "../../src/spike-cli/commands/auth";
import * as alias from "../../src/spike-cli/commands/alias";
import { main } from "../../src/spike-cli/cli";

// Mock the commands so we don't trigger real logic
vi.mock("../../src/spike-cli/commands/auth", () => ({ registerAuthCommand: vi.fn() }));
vi.mock("../../src/spike-cli/commands/alias", () => ({ registerAliasCommand: vi.fn() }));
vi.mock("../../src/spike-cli/commands/completions", () => ({ registerCompletionsCommand: vi.fn() }));
vi.mock("../../src/spike-cli/commands/registry", () => ({ registerRegistryCommand: vi.fn() }));
vi.mock("../../src/spike-cli/commands/agent", () => ({ registerAgentCommand: vi.fn() }));
vi.mock("../../src/spike-cli/alias/store", () => ({ loadAliases: vi.fn().mockResolvedValue({ commands: {} }) }));

describe("cli", () => {
  const originalArgv = process.argv;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    // Reset program state
    // @ts-expect-error - reaching into commander internals
    program.commands = [];
    // @ts-expect-error - reaching into commander internals
    program.options = [];
    vi.spyOn(program, "parse").mockImplementation(() => program as unknown as typeof program);
  });

  afterEach(() => {
    process.argv = originalArgv;
  });

  it("registers all commands", async () => {
    process.argv = ["node", "spike"];
    await main();

    expect(auth.registerAuthCommand).toHaveBeenCalled();
    expect(alias.registerAliasCommand).toHaveBeenCalled();
  });

  it("handles --generate-completions", async () => {
    process.argv = ["node", "spike", "--generate-completions"];
    await main();

    expect(console.log).toHaveBeenCalledWith("auth");
    expect(console.log).toHaveBeenCalledWith("--verbose");
    // Should NOT have called parse because it exits early
    expect(program.parse).not.toHaveBeenCalled();
  });

  it("rewrites command aliases", async () => {
    const store = await import("../../src/spike-cli/alias/store");
    vi.mocked(store.loadAliases).mockResolvedValue({
      commands: { st: "status" },
    } as unknown as { commands: Record<string, string> });

    process.argv = ["node", "spike", "st"];
    await main();

    expect(process.argv[2]).toBe("status");
  });

  it("preAction hook sets verbose when --verbose is passed", async () => {
    const logger = await import("../../src/spike-cli/util/logger");
    const setVerboseSpy = vi.spyOn(logger, "setVerbose");

    // Restore real parse to let the preAction hook fire
    vi.mocked(program.parse).mockRestore?.();
    vi.spyOn(program, "parse").mockImplementation((argv, opts) => {
      // Manually invoke preAction by simulating what commander does:
      // walk hooks and call preAction with a command that has verbose=true
      const hooks = (program as Record<string, unknown>)._lifeCycleHooks as
        | Record<string, Array<(cmd: unknown) => void>>
        | undefined;
      if (hooks?.["preAction"]) {
        for (const hook of hooks["preAction"]) {
          hook(Object.assign(Object.create(program), {
            opts: () => ({ verbose: true }),
          }));
        }
      }
      return program as unknown as typeof program;
    });

    process.argv = ["node", "spike", "--verbose", "auth"];
    await main();

    expect(setVerboseSpy).toHaveBeenCalledWith(true);
    // cleanup
    logger.setVerbose(false);
  });

});
