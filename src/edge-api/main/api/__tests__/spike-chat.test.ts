import { afterEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import {
  buildAetherSystemPrompt,
  buildClassifyPrompt,
  buildPlanPrompt,
  buildExtractPrompt,
  type UserMemory,
  type AetherNote,
} from "../../core-logic/aether-prompt";
import {
  selectNotes,
  updateNoteConfidence,
  pruneNotes,
  parseExtractedNote,
} from "../../core-logic/aether-memory";
import { spikeChat, buildSpikeChatMessages } from "../routes/spike-chat";
import type { Env, Variables } from "../../core-logic/env";

afterEach(() => {
  vi.restoreAllMocks();
});

// --- Prompt Builder Tests ---

describe("buildAetherSystemPrompt", () => {
  it("returns stable prefix that never changes", () => {
    const empty: UserMemory = { lifeSummary: "", notes: [], currentGoals: [] };
    const withNotes: UserMemory = {
      lifeSummary: "A developer",
      notes: [makeNote({ trigger: "code review", lesson: "prefers concise feedback" })],
      currentGoals: ["Ship v2"],
    };

    const a = buildAetherSystemPrompt(empty);
    const b = buildAetherSystemPrompt(withNotes);

    expect(a.stablePrefix).toBe(b.stablePrefix);
    expect(a.stablePrefix).toContain("You are Spike");
  });

  it("includes user life summary in dynamic suffix", () => {
    const state: UserMemory = {
      lifeSummary: "Full-stack developer from Budapest",
      notes: [],
      currentGoals: [],
    };
    const { dynamicSuffix } = buildAetherSystemPrompt(state);
    expect(dynamicSuffix).toContain("Full-stack developer from Budapest");
  });

  it("includes notes in dynamic suffix", () => {
    const state: UserMemory = {
      lifeSummary: "",
      notes: [makeNote({ trigger: "TypeScript question", lesson: "prefers strict mode" })],
      currentGoals: [],
    };
    const { dynamicSuffix } = buildAetherSystemPrompt(state);
    expect(dynamicSuffix).toContain("TypeScript question");
    expect(dynamicSuffix).toContain("prefers strict mode");
  });

  it("includes goals in dynamic suffix", () => {
    const state: UserMemory = {
      lifeSummary: "",
      notes: [],
      currentGoals: ["Launch app store", "Fix CI"],
    };
    const { dynamicSuffix } = buildAetherSystemPrompt(state);
    expect(dynamicSuffix).toContain("Launch app store");
    expect(dynamicSuffix).toContain("Fix CI");
  });

  it("returns empty dynamic suffix when no user state", () => {
    const state: UserMemory = { lifeSummary: "", notes: [], currentGoals: [] };
    const { dynamicSuffix } = buildAetherSystemPrompt(state);
    expect(dynamicSuffix).toBe("");
  });
});

describe("buildClassifyPrompt", () => {
  it("returns a prompt mentioning JSON", () => {
    expect(buildClassifyPrompt()).toContain("JSON");
  });
});

describe("buildPlanPrompt", () => {
  it("includes classified intent and tools", () => {
    const prompt = buildPlanPrompt('{"intent":"task"}', ["search", "calculate"]);
    expect(prompt).toContain('{"intent":"task"}');
    expect(prompt).toContain("search");
    expect(prompt).toContain("calculate");
  });

  it("handles empty tools", () => {
    const prompt = buildPlanPrompt("{}", []);
    expect(prompt).toContain("No tools available");
  });
});

describe("buildExtractPrompt", () => {
  it("returns a prompt mentioning extraction", () => {
    expect(buildExtractPrompt()).toContain("memory extraction");
  });
});

describe("buildSpikeChatMessages", () => {
  it("includes prior user and assistant turns before the current user message", () => {
    const result = buildSpikeChatMessages(
      "System",
      [
        { role: "user", content: "Earlier question" },
        { role: "assistant", content: "Earlier answer" },
      ],
      "Latest question",
    );

    expect(result).toEqual([
      { role: "system", content: "System" },
      { role: "user", content: "Earlier question" },
      { role: "assistant", content: "Earlier answer" },
      { role: "user", content: "Latest question" },
    ]);
  });

  it("drops empty content and unsupported history roles", () => {
    const result = buildSpikeChatMessages(
      "System",
      [
        { role: "system", content: "ignore me" },
        { role: "user", content: "   " },
        { role: "assistant", content: "Kept answer" },
      ],
      "Latest question",
    );

    expect(result).toEqual([
      { role: "system", content: "System" },
      { role: "assistant", content: "Kept answer" },
      { role: "user", content: "Latest question" },
    ]);
  });
});

describe("spikeChat route", () => {
  it("uses a bounded MCP agent surface, executes tool calls, and resumes streaming", async () => {
    const app = new Hono<{ Bindings: Env; Variables: Variables }>();
    app.route("/", spikeChat);

    const fetchBodies: Array<Record<string, unknown>> = [];
    let streamCallCount = 0;
    const fetchMock = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};
      fetchBodies.push(body);

      const stream = body["stream"] === true;
      if (!stream) {
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content:
                    body["max_tokens"] === 200
                      ? '{"intent":"task"}'
                      : body["max_tokens"] === 256
                        ? "null"
                        : '{"plan":"Use MCP tool search/call if needed.","suggestedTools":["mcp_tool_call"],"confidence":0.8}',
                },
              },
            ],
          }),
          {
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      streamCallCount += 1;
      const sse =
        streamCallCount === 1
          ? [
              'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"tool-1","function":{"name":"mcp_tool_call"}}]}}]}\n',
              'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\\"name\\":\\"pricing_lookup\\",\\"arguments\\":{\\"page\\":\\"pricing\\"}}"}}]}}]}\n',
              'data: {"choices":[{"delta":{},"finish_reason":"tool_calls"}]}\n',
              "data: [DONE]\n",
            ].join("\n")
          : [
              'data: {"choices":[{"delta":{"content":"Pricing is $29 for Pro."}}]}\n',
              "data: [DONE]\n",
            ].join("\n");

      return new Response(sse, {
        headers: { "Content-Type": "text/event-stream" },
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    const mcpFetch = vi.fn(async (request: Request) => {
      const url = new URL(request.url);
      if (url.pathname === "/tools") {
        return new Response(
          JSON.stringify({
            tools: [
              {
                name: "pricing_lookup",
                description: "Look up pricing information",
                inputSchema: {
                  type: "object",
                  properties: {
                    page: { type: "string" },
                  },
                },
              },
            ],
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.pathname === "/mcp") {
        const rpcBody = (await request.json()) as {
          params?: { name?: string; arguments?: Record<string, unknown> };
        };

        expect(rpcBody.params?.name).toBe("pricing_lookup");
        expect(rpcBody.params?.arguments).toEqual({ page: "pricing" });

        return new Response(
          JSON.stringify({
            result: {
              content: [{ text: "Pro costs $29/month." }],
            },
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response("Not Found", { status: 404 });
    });

    const env = {
      XAI_API_KEY: "test-key",
      MCP_SERVICE: {
        fetch: mcpFetch,
      },
    } as unknown as Env;

    const res = await app.request(
      "/api/spike-chat",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Inspect the pricing page",
          history: [{ role: "assistant", content: "Earlier answer" }],
        }),
      },
      env,
    );

    expect(res.status).toBe(200);
    const text = await res.text();

    expect(fetchBodies).toHaveLength(5);
    const executeTools = fetchBodies[2]?.["tools"] as Array<{
      type: string;
      function: { name: string };
    }>;
    expect(executeTools.map((tool) => tool.function.name)).toEqual([
      "browser_get_surface",
      "browser_navigate",
      "browser_click",
      "browser_fill",
      "browser_screenshot",
      "browser_read_text",
      "browser_scroll",
      "browser_get_elements",
      "mcp_tool_search",
      "mcp_tool_call",
    ]);
    expect(mcpFetch).toHaveBeenCalledTimes(2);
    expect(text).toContain('"type":"context_sync"');
    expect(text).toContain('"type":"tool_call_start"');
    expect(text).toContain('"toolCallId":"tool-1"');
    expect(text).toContain('"name":"mcp_tool_call"');
    expect(text).toContain('"type":"tool_call_end"');
    expect(text).toContain("Pro costs $29/month.");
    expect(text).toContain("Pricing is $29 for Pro.");
  });
});

// --- Memory System Tests ---

describe("selectNotes", () => {
  it("filters out low-confidence notes", () => {
    const notes = [
      makeNote({ confidence: 0.1 }),
      makeNote({ confidence: 0.5 }),
      makeNote({ confidence: 0.8 }),
    ];
    const selected = selectNotes(notes);
    expect(selected.length).toBe(2);
    expect(selected.every((n) => n.confidence >= 0.3)).toBe(true);
  });

  it("respects token budget", () => {
    const notes = Array.from({ length: 100 }, (_, i) =>
      makeNote({
        trigger: `trigger-${i}-${"x".repeat(50)}`,
        lesson: `lesson-${i}-${"y".repeat(50)}`,
        confidence: 0.9,
      }),
    );
    const selected = selectNotes(notes, 200);
    // Should select fewer than all 100
    expect(selected.length).toBeLessThan(100);
    expect(selected.length).toBeGreaterThan(0);
  });

  it("returns empty for empty input", () => {
    expect(selectNotes([])).toEqual([]);
  });

  it("sorts by confidence × recency", () => {
    const recent = makeNote({ confidence: 0.6, lastUsedAt: Date.now() });
    const old = makeNote({ confidence: 0.6, lastUsedAt: Date.now() - 365 * 24 * 60 * 60 * 1000 });
    const selected = selectNotes([old, recent]);
    expect(selected[0]).toBe(recent);
  });
});

describe("updateNoteConfidence", () => {
  it("increases confidence when helped", () => {
    const note = makeNote({ confidence: 0.5, helpCount: 0 });
    const updated = updateNoteConfidence(note, true);
    expect(updated.confidence).toBeGreaterThan(0.5);
    expect(updated.helpCount).toBe(1);
  });

  it("decreases confidence when not helped", () => {
    const note = makeNote({ confidence: 0.5 });
    const updated = updateNoteConfidence(note, false);
    expect(updated.confidence).toBeLessThan(0.5);
  });

  it("clamps confidence to [0, 1]", () => {
    const high = makeNote({ confidence: 0.98 });
    const low = makeNote({ confidence: 0.05 });
    expect(updateNoteConfidence(high, true).confidence).toBeLessThanOrEqual(1);
    expect(updateNoteConfidence(low, false).confidence).toBeGreaterThanOrEqual(0);
  });

  it("promotes high-performing notes", () => {
    const note = makeNote({ confidence: 0.65, helpCount: 3 });
    const updated = updateNoteConfidence(note, true);
    // Should get promotion boost beyond just the alpha increment
    expect(updated.confidence).toBeGreaterThan(0.65 + 0.15);
  });
});

describe("pruneNotes", () => {
  it("removes notes below threshold", () => {
    const notes = [
      makeNote({ confidence: 0.1 }),
      makeNote({ confidence: 0.5 }),
      makeNote({ confidence: 0.29 }),
    ];
    const pruned = pruneNotes(notes);
    expect(pruned.length).toBe(1);
    expect(pruned[0].confidence).toBe(0.5);
  });

  it("keeps notes at exactly the threshold", () => {
    const notes = [makeNote({ confidence: 0.3 })];
    expect(pruneNotes(notes).length).toBe(1);
  });
});

describe("parseExtractedNote", () => {
  it("parses valid JSON", () => {
    const result = parseExtractedNote(
      JSON.stringify({ trigger: "coding style", lesson: "prefers functional", confidence: 0.5 }),
    );
    expect(result).toEqual({
      trigger: "coding style",
      lesson: "prefers functional",
      confidence: 0.5,
    });
  });

  it("returns null for 'null' response", () => {
    expect(parseExtractedNote("null")).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(parseExtractedNote("not json")).toBeNull();
  });

  it("returns null for missing fields", () => {
    expect(parseExtractedNote(JSON.stringify({ trigger: "x" }))).toBeNull();
  });

  it("clamps confidence to [0.3, 0.7]", () => {
    const result = parseExtractedNote(
      JSON.stringify({ trigger: "t", lesson: "l", confidence: 0.9 }),
    );
    expect(result?.confidence).toBe(0.7);
  });
});

// --- Helpers ---

function makeNote(overrides: Partial<AetherNote> = {}): AetherNote {
  return {
    id: crypto.randomUUID(),
    trigger: "default trigger",
    lesson: "default lesson",
    confidence: 0.5,
    helpCount: 0,
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
    ...overrides,
  };
}
