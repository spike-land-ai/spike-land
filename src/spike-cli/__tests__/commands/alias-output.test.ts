import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Mock homedir to use temp directory
let tempDir: string;

vi.mock("node:os", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:os")>();
  return {
    ...actual,
    default: actual,
    homedir: () => tempDir,
  };
});

// Import after mock setup
const { addAlias } = await import("../../alias/store.js");

// The alias command handlers call console.error for user feedback.
// We import the command registration to test its action handlers.
const { registerAliasCommand } = await import("../../commands/alias.js");

// We use Commander to build a program and invoke the actions
const { Command } = await import("commander");

describe("alias command output", () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "spike-alias-output-"));
    stderrSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    stderrSpy.mockRestore();
    await rm(tempDir, { recursive: true, force: true });
  });

  it("prints confirmation to stderr after 'alias set'", async () => {
    const program = new Command();
    program.exitOverride(); // prevent process.exit
    registerAliasCommand(program);

    await program.parseAsync(["node", "spike", "alias", "set", "foo", "serve"]);

    const output = stderrSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(output).toContain("Alias set");
    expect(output).toContain("foo");
    expect(output).toContain("serve");
  });

  it("prints alias names to stderr after 'alias list' with aliases", async () => {
    // Pre-populate an alias
    await addAlias("commands", "s", "serve");

    const program = new Command();
    program.exitOverride();
    registerAliasCommand(program);

    await program.parseAsync(["node", "spike", "alias", "list"]);

    const output = stderrSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(output).toContain("Commands:");
    expect(output).toContain("s");
    expect(output).toContain("serve");
  });

  it("prints 'No aliases' to stderr after 'alias list' with no aliases", async () => {
    const program = new Command();
    program.exitOverride();
    registerAliasCommand(program);

    await program.parseAsync(["node", "spike", "alias", "list"]);

    const output = stderrSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(output).toContain("No aliases configured");
  });

  it("prints confirmation to stderr after 'alias remove'", async () => {
    // First create an alias to remove
    await addAlias("commands", "foo", "serve");

    const program = new Command();
    program.exitOverride();
    registerAliasCommand(program);

    await program.parseAsync(["node", "spike", "alias", "remove", "foo"]);

    const output = stderrSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(output).toContain("Removed alias");
    expect(output).toContain("foo");
  });
});
