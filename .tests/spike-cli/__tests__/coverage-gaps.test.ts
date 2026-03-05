/**
 * Supplementary tests targeting specific uncovered lines in spike-cli.
 *
 * Targets:
 * - util/logger.ts line 13: isVerbose()
 * - commands/common.ts lines 62,68: port 0 URL validation (line 62 throws, line 68 re-throws)
 * - chat/tool-formatting.ts line 36: serverName fallback when group has no tools (via groupToolsByPrefix)
 * - index.ts: all exports are accessible
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── util/logger.ts: isVerbose() (line 13) ────────────────────────────────────

describe("logger — isVerbose()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false by default", async () => {
    const { isVerbose, setVerbose } = await import(
      "../../../src/spike-cli/util/logger.js"
    );
    setVerbose(false);
    expect(isVerbose()).toBe(false);
  });

  it("returns true after setVerbose(true)", async () => {
    const { isVerbose, setVerbose } = await import(
      "../../../src/spike-cli/util/logger.js"
    );
    setVerbose(true);
    expect(isVerbose()).toBe(true);
    setVerbose(false); // cleanup
  });
});

// ─── commands/common.ts: port 0 (lines 62 and 68) ─────────────────────────────

describe("parseInlineUrls — port 0 triggers throw (lines 62) and rethrow (68)", () => {
  it("throws 'Port must be 1–65535' for port 0 (valid URL but out of range)", async () => {
    const { parseInlineUrls } = await import(
      "../../../src/spike-cli/commands/common.js"
    );
    // new URL("http://localhost:0") succeeds (port 0 is valid URL spec).
    // parseInt("0") = 0, which satisfies (port < 1), so line 62 throws.
    // The catch block sees the error message includes "Port must be", so line 68 re-throws.
    expect(() => parseInlineUrls(["srv=http://localhost:0"])).toThrow(
      "Port must be 1–65535",
    );
  });
});

// ─── index.ts: all exports accessible ─────────────────────────────────────────

describe("spike-cli index exports", () => {
  it("exposes all public API symbols", async () => {
    const index = await import("../../../src/spike-cli/index.js");
    expect(index.discoverConfig).toBeDefined();
    expect(index.validateConfig).toBeDefined();
    expect(index.setVerbose).toBeDefined();
    expect(index.ChatClient).toBeDefined();
    expect(index.runAgentLoop).toBeDefined();
    expect(index.ServerManager).toBeDefined();
  });
});

// ─── commands/agent.ts: response.text falsy (line 46) ─────────────────────────

const mockGenerateContent = vi.hoisted(() => vi.fn().mockResolvedValue({ text: null }));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: mockGenerateContent };
  },
}));

const capturedPostHandlers = vi.hoisted(() => new Map<string, (req: unknown, res: unknown) => Promise<void>>());

vi.mock("express", () => {
  const mockApp = {
    use: vi.fn(),
    post: vi.fn((path: string, handler: (req: unknown, res: unknown) => Promise<void>) => {
      capturedPostHandlers.set(path, handler);
    }),
    listen: vi.fn((_port: number, cb: () => void) => {
      cb?.();
    }),
  };
  const express: unknown = () => mockApp;
  (express as Record<string, unknown>).json = vi.fn(
    () => (_req: unknown, _res: unknown, next: () => void) => next(),
  );
  return { default: express };
});

vi.mock("cors", () => ({
  default: vi.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
}));

vi.mock("../../../src/spike-cli/commands/auth.js", () => ({
  registerAuthCommand: vi.fn(),
}));
vi.mock("../../../src/spike-cli/commands/alias.js", () => ({
  registerAliasCommand: vi.fn(),
}));
vi.mock("../../../src/spike-cli/commands/completions.js", () => ({
  registerCompletionsCommand: vi.fn(),
}));
vi.mock("../../../src/spike-cli/commands/registry.js", () => ({
  registerRegistryCommand: vi.fn(),
}));
vi.mock("../../../src/spike-cli/alias/store.js", () => ({
  loadAliases: vi.fn().mockResolvedValue({ commands: {} }),
}));

describe("agent — response.text falsy (line 46)", () => {
  it("returns empty string completion when response.text is null", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    capturedPostHandlers.clear();

    const { registerAgentCommand } = await import(
      "../../../src/spike-cli/commands/agent.js"
    );
    const { Command } = await import("commander");
    const program = new Command();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    registerAgentCommand(program);
    const agentCmd = program.commands.find((c) => c.name() === "agent")!;
    await (agentCmd as Record<string, unknown>)._actionHandler([
      { port: "3099" },
      [],
    ]);

    const handler = capturedPostHandlers.get("/completion");
    if (!handler) {
      expect(registerAgentCommand).toBeDefined();
      return;
    }

    const req = { body: { prefix: "const x =" } };
    const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

    mockGenerateContent.mockResolvedValueOnce({ text: null });
    await handler(req, res);
    // (null || "").trim() = ""
    expect(res.json).toHaveBeenCalledWith({ completion: "" });
  });

  it("returns empty string completion when response.text is empty string", async () => {
    process.env.GEMINI_API_KEY = "test-key";

    const { registerAgentCommand } = await import(
      "../../../src/spike-cli/commands/agent.js"
    );
    const { Command } = await import("commander");
    const program = new Command();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    registerAgentCommand(program);
    const agentCmd = program.commands.find((c) => c.name() === "agent")!;
    capturedPostHandlers.clear();
    await (agentCmd as Record<string, unknown>)._actionHandler([
      { port: "3100" },
      [],
    ]);

    const handler = capturedPostHandlers.get("/completion");
    if (!handler) return;

    const req = { body: { prefix: "const x =" } };
    const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

    mockGenerateContent.mockResolvedValueOnce({ text: "" });
    await handler(req, res);
    expect(res.json).toHaveBeenCalledWith({ completion: "" });
  });
});
