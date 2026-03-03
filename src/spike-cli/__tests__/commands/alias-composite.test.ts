import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

let tempDir: string;

vi.mock("node:os", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:os")>();
  return {
    ...actual,
    default: actual,
    homedir: () => tempDir,
  };
});

const { registerAliasCommand } = await import("../../commands/alias.js");
const { Command } = await import("commander");
const { loadAliases } = await import("../../alias/store.js");

describe("alias set-composite", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "spike-alias-composite-"));
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as never);
  });

  afterEach(async () => {
    errorSpy.mockRestore();
    exitSpy.mockRestore();
    await rm(tempDir, { recursive: true, force: true });
  });

  function makeProgram() {
    const program = new Command("spike");
    program.exitOverride();
    registerAliasCommand(program);
    return program;
  }

  it("creates a composite alias with JSON args", async () => {
    const program = makeProgram();
    await program.parseAsync(
      ["alias", "set-composite", "myalias", "chess__move", '{"from":"e2","to":"e4"}'],
      { from: "user" },
    );

    const aliases = await loadAliases();
    expect(aliases.composite["myalias"]).toEqual({
      tool: "chess__move",
      args: { from: "e2", to: "e4" },
    });

    const output = errorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(output).toContain("Composite alias set");
    expect(output).toContain("myalias");
  });

  it("creates a composite alias without JSON args", async () => {
    const program = makeProgram();
    await program.parseAsync(["alias", "set-composite", "quicktool", "search__query"], {
      from: "user",
    });

    const aliases = await loadAliases();
    expect(aliases.composite["quicktool"]).toEqual({
      tool: "search__query",
      args: undefined,
    });

    const output = errorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(output).toContain("Composite alias set");
    expect(output).toContain("quicktool");
    expect(output).toContain("search__query");
  });

  it("exits with 1 when JSON args are invalid", async () => {
    const program = makeProgram();
    await program.parseAsync(["alias", "set-composite", "broken", "tool__name", "not-valid-json"], {
      from: "user",
    });

    expect(exitSpy).toHaveBeenCalledWith(1);
    const output = errorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(output).toContain("Invalid JSON");
  });

  it("exits with 1 when name is reserved", async () => {
    const program = makeProgram();
    // "alias" is in the RESERVED_NAMES set in AliasResolver
    await program.parseAsync(["alias", "set-composite", "help", "tool__name"], { from: "user" });

    expect(exitSpy).toHaveBeenCalledWith(1);
    const output = errorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(output).toContain("reserved");
  });
});

describe("alias set — section detection", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "spike-alias-section-"));
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    errorSpy.mockRestore();
    await rm(tempDir, { recursive: true, force: true });
  });

  function makeProgram() {
    const program = new Command("spike");
    program.exitOverride();
    registerAliasCommand(program);
    return program;
  }

  it("detects 'tools' section for expansions containing '__'", async () => {
    const program = makeProgram();
    await program.parseAsync(["alias", "set", "mytool", "chess__move"], { from: "user" });

    const output = errorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(output).toContain("tools");
  });

  it("detects 'servers' section for non-command, non-tool expansions", async () => {
    const program = makeProgram();
    await program.parseAsync(["alias", "set", "myserver", "my-custom-server"], { from: "user" });

    const output = errorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(output).toContain("servers");
  });

  it("exits with 1 when setting alias with reserved name", async () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as never);

    const program = makeProgram();
    // "quit" is in the RESERVED_NAMES set in AliasResolver
    await program.parseAsync(["alias", "set", "quit", "some-expansion"], { from: "user" });

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});

describe("alias list — multiple sections", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "spike-alias-list-"));
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    errorSpy.mockRestore();
    await rm(tempDir, { recursive: true, force: true });
  });

  it("shows all populated sections in list output", async () => {
    // Add aliases across multiple sections
    const { addAlias } = await import("../../alias/store.js");
    await addAlias("commands", "s", "serve");
    await addAlias("tools", "mv", "chess__move");
    await addAlias("servers", "sp", "spike-land");

    const program = new Command("spike");
    program.exitOverride();
    registerAliasCommand(program);

    await program.parseAsync(["alias", "list"], { from: "user" });

    const output = errorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(output).toContain("Commands:");
    expect(output).toContain("Tools:");
    expect(output).toContain("Servers:");
    expect(output).toContain("s");
    expect(output).toContain("serve");
    expect(output).toContain("mv");
    expect(output).toContain("chess__move");
  });

  it("shows composite alias as JSON in list output", async () => {
    const { addAlias } = await import("../../alias/store.js");
    await addAlias("composite", "quickmove", { tool: "chess__move", args: { from: "e2" } });

    const program = new Command("spike");
    program.exitOverride();
    registerAliasCommand(program);

    await program.parseAsync(["alias", "list"], { from: "user" });

    const output = errorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(output).toContain("quickmove");
    expect(output).toContain("chess__move");
  });
});
