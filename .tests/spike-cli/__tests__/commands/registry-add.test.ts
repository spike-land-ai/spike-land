import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const mockLoadTokens = vi.hoisted(() => vi.fn());
const mockGetRegistryServer = vi.hoisted(() => vi.fn());
const mockSearchRegistry = vi.hoisted(() => vi.fn());

vi.mock("../../../../src/spike-cli/auth/token-store.js", () => ({
  loadTokens: mockLoadTokens,
}));

vi.mock("../../../../src/spike-cli/registry/client.js", () => ({
  searchRegistry: mockSearchRegistry,
  getRegistryServer: mockGetRegistryServer,
}));

// Mock homedir to use temp dir
let tempDir: string;
vi.mock("node:os", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:os")>();
  return {
    ...actual,
    default: actual,
    homedir: () => tempDir,
  };
});

import { registerRegistryCommand } from "../../../../src/spike-cli/commands/registry.js";
import { Command } from "commander";

describe("registry add command", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    tempDir = await mkdtemp(join(tmpdir(), "spike-registry-add-"));
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
    registerRegistryCommand(program);
    return program;
  }

  it("exits with 1 when not logged in", async () => {
    mockLoadTokens.mockResolvedValue(null);
    // Make getRegistryServer throw so it doesn't crash on null tokens
    mockGetRegistryServer.mockRejectedValue(new Error("should not be called"));

    const program = makeProgram();
    // process.exit mock doesn't halt execution, so the action continues after the exit call.
    // We just verify exit(1) was called and the right error message was printed.
    await program.parseAsync(["registry", "add", "chess"], { from: "user" }).catch(() => {});

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Not logged in"));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits with 1 when server is not found in registry", async () => {
    mockLoadTokens.mockResolvedValue({
      baseUrl: "https://spike.land",
      accessToken: "tok",
    });
    mockGetRegistryServer.mockResolvedValue(null);

    const program = makeProgram();
    await program
      .parseAsync(["registry", "add", "unknown-server"], { from: "user" })
      .catch(() => {});

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('"unknown-server" not found'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("adds a URL-based server to ~/.mcp.json", async () => {
    mockLoadTokens.mockResolvedValue({
      baseUrl: "https://spike.land",
      accessToken: "tok",
    });
    mockGetRegistryServer.mockResolvedValue({
      id: "chess",
      name: "Chess",
      description: "Chess MCP",
      url: "https://spike.land/mcp/chess",
      tags: [],
    });

    const program = makeProgram();
    await program.parseAsync(["registry", "add", "chess"], { from: "user" });

    // Verify the config file was written
    const { readFile } = await import("node:fs/promises");
    const configPath = join(tempDir, ".mcp.json");
    const content = JSON.parse(await readFile(configPath, "utf-8")) as {
      mcpServers: Record<string, unknown>;
    };

    expect(content.mcpServers["chess"]).toEqual({
      type: "url",
      url: "https://spike.land/mcp/chess",
    });
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Added"));
  });

  it("adds a command-based server with args to ~/.mcp.json", async () => {
    mockLoadTokens.mockResolvedValue({
      baseUrl: "https://spike.land",
      accessToken: "tok",
    });
    mockGetRegistryServer.mockResolvedValue({
      id: "mypkg",
      name: "My Package",
      description: "Pkg MCP",
      command: "npx",
      args: ["-y", "my-mcp-package"],
      tags: [],
    });

    const program = makeProgram();
    await program.parseAsync(["registry", "add", "mypkg"], { from: "user" });

    const { readFile } = await import("node:fs/promises");
    const configPath = join(tempDir, ".mcp.json");
    const content = JSON.parse(await readFile(configPath, "utf-8")) as {
      mcpServers: Record<string, unknown>;
    };

    expect(content.mcpServers["mypkg"]).toEqual({
      command: "npx",
      args: ["-y", "my-mcp-package"],
    });
  });

  it("adds a command-based server without args to ~/.mcp.json", async () => {
    mockLoadTokens.mockResolvedValue({
      baseUrl: "https://spike.land",
      accessToken: "tok",
    });
    mockGetRegistryServer.mockResolvedValue({
      id: "noargs",
      name: "No Args",
      description: "No args server",
      command: "npx",
      args: [],
      tags: [],
    });

    const program = makeProgram();
    await program.parseAsync(["registry", "add", "noargs"], { from: "user" });

    const { readFile } = await import("node:fs/promises");
    const configPath = join(tempDir, ".mcp.json");
    const content = JSON.parse(await readFile(configPath, "utf-8")) as {
      mcpServers: Record<string, unknown>;
    };

    expect(content.mcpServers["noargs"]).toEqual({ command: "npx" });
  });

  it("exits with 1 when server has no url or command", async () => {
    mockLoadTokens.mockResolvedValue({
      baseUrl: "https://spike.land",
      accessToken: "tok",
    });
    mockGetRegistryServer.mockResolvedValue({
      id: "broken",
      name: "Broken",
      description: "No transport",
      tags: [],
    });

    const program = makeProgram();
    await program.parseAsync(["registry", "add", "broken"], { from: "user" });

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("no url or command"));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("merges into an existing ~/.mcp.json file", async () => {
    // Pre-create a config file
    const { writeFile } = await import("node:fs/promises");
    const configPath = join(tempDir, ".mcp.json");
    await writeFile(
      configPath,
      JSON.stringify({
        mcpServers: { existing: { type: "url", url: "http://existing" } },
      }),
      "utf-8",
    );

    mockLoadTokens.mockResolvedValue({
      baseUrl: "https://spike.land",
      accessToken: "tok",
    });
    mockGetRegistryServer.mockResolvedValue({
      id: "new-server",
      name: "New Server",
      description: "Fresh",
      url: "https://new.example.com/mcp",
      tags: [],
    });

    const program = makeProgram();
    await program.parseAsync(["registry", "add", "new-server"], {
      from: "user",
    });

    const { readFile } = await import("node:fs/promises");
    const content = JSON.parse(await readFile(configPath, "utf-8")) as {
      mcpServers: Record<string, unknown>;
    };

    expect(content.mcpServers["existing"]).toBeDefined();
    expect(content.mcpServers["new-server"]).toBeDefined();
  });

  it("initializes mcpServers when config exists but lacks the key (line 77)", async () => {
    // Pre-create a config file with valid JSON but without mcpServers key
    const { writeFile } = await import("node:fs/promises");
    const configPath = join(tempDir, ".mcp.json");
    await writeFile(configPath, JSON.stringify({ other: "data" }), "utf-8");

    mockLoadTokens.mockResolvedValue({
      baseUrl: "https://spike.land",
      accessToken: "tok",
    });
    mockGetRegistryServer.mockResolvedValue({
      id: "chess",
      name: "Chess",
      description: "Chess MCP",
      url: "https://spike.land/mcp/chess",
      tags: [],
    });

    const program = makeProgram();
    await program.parseAsync(["registry", "add", "chess"], { from: "user" });

    const { readFile } = await import("node:fs/promises");
    const content = JSON.parse(await readFile(configPath, "utf-8")) as {
      mcpServers: Record<string, unknown>;
    };
    expect(content.mcpServers["chess"]).toBeDefined();
  });

  it("handles a corrupt existing config file by starting fresh", async () => {
    const { writeFile } = await import("node:fs/promises");
    const configPath = join(tempDir, ".mcp.json");
    await writeFile(configPath, "this is not json", "utf-8");

    mockLoadTokens.mockResolvedValue({
      baseUrl: "https://spike.land",
      accessToken: "tok",
    });
    mockGetRegistryServer.mockResolvedValue({
      id: "chess",
      name: "Chess",
      description: "Chess MCP",
      url: "https://spike.land/mcp/chess",
      tags: [],
    });

    const program = makeProgram();
    // Should not throw
    await program.parseAsync(["registry", "add", "chess"], { from: "user" });

    const { readFile } = await import("node:fs/promises");
    const content = JSON.parse(await readFile(configPath, "utf-8")) as {
      mcpServers: Record<string, unknown>;
    };
    expect(content.mcpServers["chess"]).toBeDefined();
  });
});

describe("registry search — not-logged-in path", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as never);
  });

  afterEach(() => {
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it("exits with 1 when not logged in and searching", async () => {
    mockLoadTokens.mockResolvedValue(null);
    mockSearchRegistry.mockRejectedValue(new Error("should not be called"));

    const { Command } = await import("commander");
    const program = new Command("spike");
    program.exitOverride();
    registerRegistryCommand(program);
    await program.parseAsync(["registry", "search", "chess"], { from: "user" }).catch(() => {});

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("reports no servers found when search returns empty array", async () => {
    mockLoadTokens.mockResolvedValue({
      baseUrl: "https://spike.land",
      accessToken: "tok",
    });
    mockSearchRegistry.mockResolvedValue([]);

    const { Command } = await import("commander");
    const program = new Command("spike");
    program.exitOverride();
    registerRegistryCommand(program);
    await program.parseAsync(["registry", "search", "nothing"], {
      from: "user",
    });

    expect(errorSpy).toHaveBeenCalledWith("No servers found.");
  });

  it("formats results with tags", async () => {
    mockLoadTokens.mockResolvedValue({
      baseUrl: "https://spike.land",
      accessToken: "tok",
    });
    mockSearchRegistry.mockResolvedValue([
      {
        id: "chess",
        name: "Chess",
        description: "Chess MCP server",
        tags: ["game", "fun"],
      },
    ]);

    const { Command } = await import("commander");
    const program = new Command("spike");
    program.exitOverride();
    registerRegistryCommand(program);
    await program.parseAsync(["registry", "search", "chess"], { from: "user" });

    const output = errorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(output).toContain("chess");
    expect(output).toContain("Chess");
    expect(output).toContain("game");
  });

  it("formats results without tags", async () => {
    mockLoadTokens.mockResolvedValue({
      baseUrl: "https://spike.land",
      accessToken: "tok",
    });
    mockSearchRegistry.mockResolvedValue([
      {
        id: "no-tags",
        name: "No Tags Server",
        description: "Server without tags",
        tags: [],
      },
    ]);

    const { Command } = await import("commander");
    const program = new Command("spike");
    program.exitOverride();
    registerRegistryCommand(program);
    await program.parseAsync(["registry", "search", "notags"], {
      from: "user",
    });

    const output = errorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(output).toContain("No Tags Server");
    expect(output).not.toContain("[");
  });
});
