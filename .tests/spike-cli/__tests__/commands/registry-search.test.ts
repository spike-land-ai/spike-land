import { beforeEach, describe, expect, it, vi } from "vitest";

const mockLoadTokens = vi.hoisted(() => vi.fn());
const mockSearchRegistry = vi.hoisted(() => vi.fn());

vi.mock("../../../../src/spike-cli/auth/token-store.js", () => ({
  loadTokens: mockLoadTokens,
}));

vi.mock("../../../../src/spike-cli/registry/client.js", () => ({
  searchRegistry: mockSearchRegistry,
  getRegistryServer: vi.fn(),
}));

import { registerRegistryCommand } from "../../../../src/spike-cli/commands/registry.js";

describe("registry search command", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  async function runSearch(args: string[]) {
    const { Command } = await import("commander");
    const program = new Command("spike");
    program.exitOverride();
    registerRegistryCommand(program);
    await program.parseAsync(["registry", "search", ...args], {
      from: "user",
    });
  }

  it("shows help message when no query is provided", async () => {
    await runSearch([]);

    expect(errorSpy).toHaveBeenCalledWith(
      "Provide a search term. Example: spike registry search chess",
    );
    expect(mockSearchRegistry).not.toHaveBeenCalled();
  });

  it("searches the registry when a query is provided", async () => {
    mockLoadTokens.mockResolvedValue({
      baseUrl: "https://spike.land",
      accessToken: "tok",
    });
    mockSearchRegistry.mockResolvedValue([
      { id: "chess", name: "Chess", description: "Chess MCP", tags: [] },
    ]);

    await runSearch(["chess"]);

    expect(mockSearchRegistry).toHaveBeenCalledWith("chess", "https://spike.land", "tok");
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Found 1 server(s)"));
  });
});
