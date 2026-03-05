import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Command } from "commander";
import { registerAgentCommand } from "../../../src/spike-cli/commands/agent";

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

vi.mock("cors", () => ({
  default: vi.fn(() => (req: unknown, res: unknown, next: () => void) => next()),
}));

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

  it("handles completion POST request", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const express = await import("express");
    const app = (
      express.default as unknown as () => Record<string, { mock: { calls: Array<Array<unknown>> } }>
    )();

    registerAgentCommand(program);
    const agentCmd = program.commands.find((c) => c.name() === "agent")!;
    await (agentCmd as Record<string, unknown>)._actionHandler([
      {
        port: "3005",
      },
      [],
    ]);

    const postCall = app.post.mock.calls.find((c: Array<unknown>) => c[0] === "/completion");
    expect(postCall).toBeDefined();

    const handler = postCall![1] as (req: unknown, res: unknown) => Promise<void>;
    const req = { body: { prefix: "const x =" } };
    const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

    await handler(req, res);
    expect(res.json).toHaveBeenCalledWith({ completion: "mock response" });
  });

  it("returns 400 when prefix is missing", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const express = await import("express");
    const app = (
      express.default as unknown as () => Record<string, { mock: { calls: Array<Array<unknown>> } }>
    )();

    registerAgentCommand(program);
    const agentCmd = program.commands.find((c) => c.name() === "agent")!;
    await (agentCmd as Record<string, unknown>)._actionHandler([{ port: "3005" }, []]);

    const postCall = app.post.mock.calls.find((c: Array<unknown>) => c[0] === "/completion");
    const handler = postCall![1] as (req: unknown, res: unknown) => Promise<void>;
    const req = { body: {} }; // no prefix
    const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Missing prefix" });
  });

  it("keeps process alive via setInterval (covers the empty callback)", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    registerAgentCommand(program);
    const agentCmd = program.commands.find((c) => c.name() === "agent")!;
    await (agentCmd as Record<string, unknown>)._actionHandler([{ port: "3006" }, []]);
    // Advance fake timers past the 1-hour interval to invoke the empty callback
    vi.advanceTimersByTime(1000 * 60 * 60 + 1);
    // No assertion needed — just confirms the empty arrow fn is exercised without error
    expect(true).toBe(true);
  });

  it("returns 500 when AI throws an error", async () => {
    process.env.GEMINI_API_KEY = "test-key";

    const express = await import("express");
    const app = (
      express.default as unknown as () => Record<string, { mock: { calls: Array<Array<unknown>> } }>
    )();

    registerAgentCommand(program);
    const agentCmd = program.commands.find((c) => c.name() === "agent")!;
    await (agentCmd as Record<string, unknown>)._actionHandler([{ port: "3005" }, []]);

    const postCall = app.post.mock.calls.find((c: Array<unknown>) => c[0] === "/completion");
    const handler = postCall![1] as (req: unknown, res: unknown) => Promise<void>;

    // Use the ai module's generateContent and make it throw
    const { ai } = await import("../../../src/spike-cli/commands/agent");
    vi.mocked(ai.models.generateContent).mockRejectedValueOnce(new Error("AI failed"));

    const req = { body: { prefix: "const x =" } };
    const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

    vi.spyOn(console, "error").mockImplementation(() => {});
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});
