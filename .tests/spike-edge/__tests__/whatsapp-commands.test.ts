import { describe, expect, it, vi } from "vitest";
import { parseCommand, dispatchCommand } from "../../../src/spike-edge/lib/whatsapp-commands.js";
import type { CommandContext, ParsedCommand } from "../../../src/spike-edge/lib/whatsapp-commands.js";
import type { Env } from "../../../src/spike-edge/env.js";

// ─── parseCommand ─────────────────────────────────────────────────────────────

describe("parseCommand", () => {
  it("parses /help command", () => {
    const result = parseCommand("/help");
    expect(result.name).toBe("help");
    expect(result.args).toBe("");
  });

  it("parses /bug with args", () => {
    const result = parseCommand("/bug My title | My description");
    expect(result.name).toBe("bug");
    expect(result.args).toBe("My title | My description");
  });

  it("parses /bugs command", () => {
    const result = parseCommand("/bugs");
    expect(result.name).toBe("bugs");
  });

  it("parses /tools with query", () => {
    const result = parseCommand("/tools search-query");
    expect(result.name).toBe("tools");
    expect(result.args).toBe("search-query");
  });

  it("parses /use command", () => {
    const result = parseCommand("/use my_tool {\"key\": \"val\"}");
    expect(result.name).toBe("use");
    expect(result.args).toBe('my_tool {"key": "val"}');
  });

  it("parses /key command", () => {
    const result = parseCommand("/key set openai sk-xxx");
    expect(result.name).toBe("key");
  });

  it("parses /subscribe command", () => {
    const result = parseCommand("/subscribe");
    expect(result.name).toBe("subscribe");
  });

  it("parses /status command", () => {
    const result = parseCommand("/status");
    expect(result.name).toBe("status");
  });

  it("treats unknown slash command as chat", () => {
    const result = parseCommand("/unknown-cmd arg");
    expect(result.name).toBe("chat");
    expect(result.raw).toBe("/unknown-cmd arg");
  });

  it("treats plain text as chat", () => {
    const result = parseCommand("Hello, how are you?");
    expect(result.name).toBe("chat");
    expect(result.args).toBe("Hello, how are you?");
  });

  it("trims whitespace", () => {
    const result = parseCommand("  /help  ");
    expect(result.name).toBe("help");
  });
});

// ─── dispatchCommand ──────────────────────────────────────────────────────────

function buildCtx(tier: "free" | "pro" | "business" = "pro", mcpOk = true): CommandContext {
  const mcpResponse = new Response(
    JSON.stringify({ result: { content: [{ text: "Tool result" }] } }),
    { status: mcpOk ? 200 : 500 },
  );

  return {
    db: {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
        all: vi.fn().mockResolvedValue({ results: [] }),
      }),
    } as unknown as D1Database,
    userId: "user-wa-123",
    tier,
    env: {
      MCP_SERVICE: {
        fetch: vi.fn().mockResolvedValue(mcpResponse),
      },
      GEMINI_API_KEY: "test-gemini-key",
    } as unknown as Env,
    phoneHash: "hash123",
  };
}

describe("dispatchCommand — help", () => {
  it("returns help text", async () => {
    const ctx = buildCtx();
    const cmd: ParsedCommand = { name: "help", args: "", raw: "/help" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toContain("Available commands");
  });
});

describe("dispatchCommand — bug", () => {
  it("submits bug report successfully", async () => {
    const ctx = buildCtx("pro", true);
    const cmd: ParsedCommand = { name: "bug", args: "My Bug | Some description", raw: "/bug My Bug | Some description" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toContain("Bug report submitted");
    expect(result).toContain("My Bug");
  });

  it("returns usage message when no title provided", async () => {
    const ctx = buildCtx();
    const cmd: ParsedCommand = { name: "bug", args: "", raw: "/bug" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toContain("Usage:");
  });

  it("returns error when MCP fails", async () => {
    const ctx = buildCtx("pro", false);
    const cmd: ParsedCommand = { name: "bug", args: "Title | Desc", raw: "/bug Title | Desc" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toContain("Failed");
  });
});

describe("dispatchCommand — bugs", () => {
  it("returns bug list from MCP", async () => {
    const ctx = buildCtx();
    const cmd: ParsedCommand = { name: "bugs", args: "", raw: "/bugs" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toBe("Tool result");
  });

  it("returns error when MCP fails", async () => {
    const ctx = buildCtx("pro", false);
    const cmd: ParsedCommand = { name: "bugs", args: "", raw: "/bugs" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toContain("Failed");
  });

  it("returns default message when no text content", async () => {
    const mcpResponse = new Response(
      JSON.stringify({ result: { content: [] } }),
      { status: 200 },
    );
    const ctx = buildCtx();
    (ctx.env.MCP_SERVICE.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mcpResponse);
    const cmd: ParsedCommand = { name: "bugs", args: "", raw: "/bugs" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toBe("No bug reports found.");
  });
});

describe("dispatchCommand — tools", () => {
  it("searches tools with query", async () => {
    const ctx = buildCtx();
    const cmd: ParsedCommand = { name: "tools", args: "image", raw: "/tools image" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toBe("Tool result");
  });

  it("searches tools without query", async () => {
    const ctx = buildCtx();
    const cmd: ParsedCommand = { name: "tools", args: "", raw: "/tools" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toBe("Tool result");
  });

  it("returns error when MCP fails", async () => {
    const ctx = buildCtx("pro", false);
    const cmd: ParsedCommand = { name: "tools", args: "", raw: "/tools" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toContain("Failed");
  });

  it("returns default message when no text", async () => {
    const mcpResponse = new Response(
      JSON.stringify({ result: {} }),
      { status: 200 },
    );
    const ctx = buildCtx();
    (ctx.env.MCP_SERVICE.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mcpResponse);
    const cmd: ParsedCommand = { name: "tools", args: "", raw: "/tools" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toBe("No tools found.");
  });
});

describe("dispatchCommand — use", () => {
  it("returns upgrade message for free tier users", async () => {
    const ctx = buildCtx("free");
    const cmd: ParsedCommand = { name: "use", args: "my_tool", raw: "/use my_tool" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toContain("pro or business plan");
  });

  it("returns usage when no tool name", async () => {
    const ctx = buildCtx("pro");
    const cmd: ParsedCommand = { name: "use", args: "", raw: "/use" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toContain("Usage:");
  });

  it("returns JSON parse error for bad args", async () => {
    const ctx = buildCtx("pro");
    const cmd: ParsedCommand = { name: "use", args: "my_tool {invalid json}", raw: "/use my_tool {invalid}" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toContain("Invalid JSON");
  });

  it("executes tool successfully", async () => {
    const ctx = buildCtx("pro", true);
    const cmd: ParsedCommand = { name: "use", args: 'my_tool {"param": "value"}', raw: '/use my_tool {"param": "value"}' };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toBe("Tool result");
  });

  it("returns MCP error message when tool has error", async () => {
    const mcpResponse = new Response(
      JSON.stringify({ error: { message: "Tool not found" } }),
      { status: 200 },
    );
    const ctx = buildCtx("pro");
    (ctx.env.MCP_SERVICE.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mcpResponse);
    const cmd: ParsedCommand = { name: "use", args: "bad_tool", raw: "/use bad_tool" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toContain("Error: Tool not found");
  });

  it("returns fallback when tool executed with no output", async () => {
    const mcpResponse = new Response(
      JSON.stringify({ result: {} }),
      { status: 200 },
    );
    const ctx = buildCtx("pro");
    (ctx.env.MCP_SERVICE.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mcpResponse);
    const cmd: ParsedCommand = { name: "use", args: "my_tool", raw: "/use my_tool" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toBe("Tool executed (no output).");
  });

  it("returns failure message when MCP returns non-ok", async () => {
    const ctx = buildCtx("pro", false);
    const cmd: ParsedCommand = { name: "use", args: "my_tool", raw: "/use my_tool" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toContain('Failed to execute tool "my_tool"');
  });

  it("executes tool with no args (uses empty JSON)", async () => {
    const ctx = buildCtx("business");
    const cmd: ParsedCommand = { name: "use", args: "tool_name", raw: "/use tool_name" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toBe("Tool result");
  });
});

describe("dispatchCommand — key", () => {
  it("returns usage when format is wrong", async () => {
    const ctx = buildCtx();
    const cmd: ParsedCommand = { name: "key", args: "openai sk-xxx", raw: "/key openai sk-xxx" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toContain("Usage:");
  });

  it("stores key successfully", async () => {
    const ctx = buildCtx("pro", true);
    const cmd: ParsedCommand = { name: "key", args: "set openai sk-my-key", raw: "/key set openai sk-my-key" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toContain("openai");
    expect(result).toContain("stored successfully");
  });

  it("returns error when MCP fails", async () => {
    const ctx = buildCtx("pro", false);
    const cmd: ParsedCommand = { name: "key", args: "set anthropic ant-key", raw: "/key set anthropic ant-key" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toContain("Failed");
  });
});

describe("dispatchCommand — subscribe", () => {
  it("returns upgrade link for free tier", async () => {
    const ctx = buildCtx("free");
    const cmd: ParsedCommand = { name: "subscribe", args: "", raw: "/subscribe" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toContain("https://spike.land/pricing");
  });

  it("returns already subscribed message for pro tier", async () => {
    const ctx = buildCtx("pro");
    const cmd: ParsedCommand = { name: "subscribe", args: "", raw: "/subscribe" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toContain("pro");
    expect(result).toContain("already on the");
  });

  it("returns already subscribed message for business tier", async () => {
    const ctx = buildCtx("business");
    const cmd: ParsedCommand = { name: "subscribe", args: "", raw: "/subscribe" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toContain("business");
  });
});

describe("dispatchCommand — status", () => {
  it("returns status with no ELO or grants", async () => {
    const ctx = buildCtx("free");
    const cmd: ParsedCommand = { name: "status", args: "", raw: "/status" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toContain("Plan: free");
    expect(result).toContain("ELO:");
  });

  it("returns status with active grants", async () => {
    const ctx = buildCtx("pro");
    const expiresAt = Date.now() + 86400000;
    (ctx.db.prepare as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ elo: 1300, tier: "pro", event_count: 10 }),
      })
      .mockReturnValueOnce({
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({
          results: [{ grant_type: "bug_bounty", tier: "pro", expires_at: expiresAt }],
        }),
      });

    const cmd: ParsedCommand = { name: "status", args: "", raw: "/status" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toContain("Plan: pro");
    expect(result).toContain("ELO: 1300");
    expect(result).toContain("Active grants");
    expect(result).toContain("bug_bounty");
  });
});

describe("dispatchCommand — chat", () => {
  it("returns upgrade message for free tier", async () => {
    const ctx = buildCtx("free");
    const cmd: ParsedCommand = { name: "chat", args: "Hello AI", raw: "Hello AI" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toContain("Natural language chat requires");
  });

  it("sends chat request to Gemini for pro tier", async () => {
    const geminiResponse = new Response(
      JSON.stringify({
        candidates: [{ content: { parts: [{ text: "Hello from Gemini" }] } }],
      }),
      { status: 200 },
    );
    globalThis.fetch = vi.fn().mockResolvedValueOnce(geminiResponse);

    const ctx = buildCtx("pro");
    const cmd: ParsedCommand = { name: "chat", args: "What is MCP?", raw: "What is MCP?" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toBe("Hello from Gemini");
  });

  it("returns error when Gemini is unavailable", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(new Response("{}", { status: 500 }));

    const ctx = buildCtx("business");
    const cmd: ParsedCommand = { name: "chat", args: "Hello", raw: "Hello" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toContain("temporarily unavailable");
  });

  it("returns fallback when Gemini response has no candidates", async () => {
    const geminiResponse = new Response(
      JSON.stringify({ candidates: [] }),
      { status: 200 },
    );
    globalThis.fetch = vi.fn().mockResolvedValueOnce(geminiResponse);

    const ctx = buildCtx("pro");
    const cmd: ParsedCommand = { name: "chat", args: "Empty response", raw: "Empty response" };
    const result = await dispatchCommand(cmd, ctx);
    expect(result).toBe("No response from chat service.");
  });
});
