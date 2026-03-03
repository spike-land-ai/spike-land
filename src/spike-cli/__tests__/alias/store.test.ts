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
const { loadAliases, saveAliases, addAlias, removeAlias, getAliasPath } = await import(
  "../../alias/store.js"
);

describe("alias store", () => {
  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "spike-alias-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("returns default empty config when file is missing", async () => {
    const config = await loadAliases();
    expect(config.version).toBe(1);
    expect(config.commands).toEqual({});
    expect(config.tools).toEqual({});
    expect(config.servers).toEqual({});
    expect(config.composite).toEqual({});
  });

  it("save/load round-trip preserves data", async () => {
    const config = {
      version: 1,
      commands: { s: "serve" },
      tools: { rt: "vitest__run_tests" },
      servers: { prod: "production" },
      composite: {
        test: { tool: "vitest__run_tests", args: { filter: "*.test.ts" } },
      },
    };
    await saveAliases(config);
    const loaded = await loadAliases();
    expect(loaded).toEqual(config);
  });

  it("addAlias adds to commands section", async () => {
    const result = await addAlias("commands", "s", "serve");
    expect(result.commands.s).toBe("serve");
  });

  it("addAlias adds to tools section", async () => {
    const result = await addAlias("tools", "rt", "vitest__run_tests");
    expect(result.tools.rt).toBe("vitest__run_tests");
  });

  it("addAlias adds to servers section", async () => {
    const result = await addAlias("servers", "prod", "production");
    expect(result.servers.prod).toBe("production");
  });

  it("addAlias adds to composite section", async () => {
    const composite = {
      tool: "vitest__run_tests",
      args: { filter: "*.test.ts" },
    };
    const result = await addAlias("composite", "test", composite);
    expect(result.composite.test).toEqual(composite);
  });

  it("removeAlias removes from correct section", async () => {
    await addAlias("commands", "s", "serve");
    await addAlias("tools", "rt", "vitest__run_tests");

    const result = await removeAlias("s");
    expect(result.removed).toBe(true);
    expect(result.section).toBe("commands");

    const loaded = await loadAliases();
    expect(loaded.commands.s).toBeUndefined();
    expect(loaded.tools.rt).toBe("vitest__run_tests");
  });

  it("removeAlias returns false for missing alias", async () => {
    const result = await removeAlias("nonexistent");
    expect(result.removed).toBe(false);
    expect(result.section).toBeUndefined();
  });

  it("getAliasPath returns expected path", () => {
    const path = getAliasPath();
    expect(path).toContain(".spike");
    expect(path).toContain("aliases.json");
  });
});
