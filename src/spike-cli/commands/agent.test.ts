import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Command } from "commander";
import { registerAgentCommand } from "./agent";

// Mock the HTTP client
const mockSql = vi.fn().mockResolvedValue([]);
const mockCallReducer = vi.fn().mockResolvedValue(undefined);

vi.mock("@spike-land-ai/spacetimedb-platform/stdb-http-client", () => ({
  createStdbHttpClient: () => ({
    sql: mockSql,
    callReducer: mockCallReducer,
  }),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = {
      generateContent: vi.fn().mockResolvedValue({ text: "mock response" }),
    };
  },
}));

vi.mock("express", () => {
  const mockApp = {
    use: vi.fn(),
    post: vi.fn(),
    listen: vi.fn((port: number, cb: () => void) => cb?.()),
  };
  const express: unknown = () => mockApp;
  (express as Record<string, unknown>).json = vi.fn(
    () => (req: unknown, res: unknown, next: () => void) => next(),
  );
  return {
    default: express,
  };
});

describe("agent command", () => {
  let program: Command;

  beforeEach(() => {
    vi.useFakeTimers();
    program = new Command();
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("registers the agent command", () => {
    registerAgentCommand(program);
    expect(program.commands.find((c) => c.name() === "agent")).toBeDefined();
  });

  it("errors and exits if no API key set", async () => {
    const origKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.CLAUDE_CODE_OAUTH_TOKEN;

    registerAgentCommand(program);
    const agentCmd = program.commands.find((c) => c.name() === "agent")!;

    vi.spyOn(console, "error").mockImplementation(() => {});
    await (agentCmd as Record<string, unknown>)._actionHandler([{}, []]);

    expect(process.exit).toHaveBeenCalledWith(1);
    process.env.GEMINI_API_KEY = origKey;
  });

  it("initSpacetimeDB connects via HTTP client", async () => {
    const { initSpacetimeDB } = await import("./agent");
    initSpacetimeDB("ws://test", "mod");
    // Allow the async connection to resolve
    await vi.advanceTimersByTimeAsync(0);
    expect(mockSql).toHaveBeenCalledWith("SELECT 1");
  });

  it("handleSessionUpdate handles user message", async () => {
    const { handleSessionUpdate, ai } = await import("./agent");
    const generateSpy = vi.spyOn(ai.models, "generateContent");

    await handleSessionUpdate({
      codeSpace: "s1",
      messagesJson: JSON.stringify([{ role: "user", content: "hi" }]),
    });
    expect(generateSpy).toHaveBeenCalled();
  });

  it("handleSessionUpdate skips assistant message", async () => {
    const { handleSessionUpdate, ai } = await import("./agent");
    const generateSpy = vi.spyOn(ai.models, "generateContent");
    generateSpy.mockClear();

    await handleSessionUpdate({
      codeSpace: "s2",
      messagesJson: JSON.stringify([{ role: "assistant", content: "hi" }]),
    });
    expect(generateSpy).not.toHaveBeenCalled();
  });

  it("handleSessionUpdate skips empty messages", async () => {
    const { handleSessionUpdate, ai } = await import("./agent");
    const generateSpy = vi.spyOn(ai.models, "generateContent");
    generateSpy.mockClear();

    await handleSessionUpdate({
      codeSpace: "s3",
      messagesJson: "[]",
    });
    expect(generateSpy).not.toHaveBeenCalled();
  });

  it("handles completion POST request", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const express = await import("express");
    const app = (
      express.default as unknown as () => Record<string, { mock: { calls: Array<Array<unknown>> } }>
    )();

    registerAgentCommand(program);
    const agentCmd = program.commands.find((c) => c.name() === "agent")!;
    await (agentCmd as Record<string, unknown>)._actionHandler([{ port: "3005" }, []]);

    const postCall = app.post.mock.calls.find((c: Array<unknown>) => c[0] === "/completion");
    expect(postCall).toBeDefined();

    const handler = postCall![1] as (req: unknown, res: unknown) => Promise<void>;
    const req = { body: { prefix: "const x =" } };
    const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

    await handler(req, res);
    expect(res.json).toHaveBeenCalledWith({ completion: "mock response" });
  });
});
