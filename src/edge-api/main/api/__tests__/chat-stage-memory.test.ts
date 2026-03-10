import { describe, expect, it } from "vitest";
import {
  appendStageSummary,
  buildHistoricalContextMessage,
  buildStageUserMessage,
  createStageMemoryBudget,
  summarizeCompletedStage,
  type StageMemoryBudget,
} from "../routes/chat-stage-memory.js";

function makeBudget(overrides?: Partial<StageMemoryBudget>): StageMemoryBudget {
  return {
    ...createStageMemoryBudget(32_000),
    ...overrides,
  };
}

describe("chat stage memory helpers", () => {
  it("builds compressed historical context from prior rounds", () => {
    const budget = makeBudget({
      maxHistoricalRounds: 4,
      maxHistoricalTokens: 200,
    });

    const historicalContext = buildHistoricalContextMessage(
      [
        {
          inputRole: "user",
          inputContent: "Help me inspect the pricing page and figure out why checkout breaks.",
          assistantBlocks: [
            {
              type: "tool_call",
              name: "mcp_tool_search",
              args: { query: "pricing checkout stripe" },
              result: "Found tools for pricing and checkout diagnostics.",
              status: "done",
              transport: "mcp",
            },
          ],
        },
        {
          inputRole: "user",
          inputContent: "Now check if the pricing CTA links to the wrong route.",
          assistantBlocks: [
            {
              type: "text",
              text: "I inspected the CTA and found it still points at the legacy checkout route.",
            },
          ],
        },
      ],
      budget,
    );

    expect(historicalContext).toContain("Compressed conversation memory");
    expect(historicalContext).toContain("pricing CTA");
    expect(historicalContext).toContain("legacy checkout route");
  });

  it("collapses older stage summaries when the budget is exceeded", () => {
    const budget = makeBudget({
      maxStageEntries: 2,
      maxStageTokens: 30,
    });

    const summary = summarizeCompletedStage(
      [
        {
          type: "tool_call",
          name: "mcp_tool_call",
          args: { name: "search_docs", arguments: { query: "checkout route" } },
          result: "The docs confirm the new route is /checkout/pro.",
          status: "done",
          transport: "mcp",
        },
      ],
      budget,
    );

    expect(summary).toBeTruthy();

    const compacted = appendStageSummary(
      appendStageSummary(
        appendStageSummary([], summary ?? "", budget),
        "Completed stage\nTool 1: browser_read_text(body) -> legacy route still rendered",
        budget,
      ),
      "Completed stage\nTool 1: browser_click(.cta-primary) -> opened /checkout-old",
      budget,
    );

    expect(compacted.length).toBeLessThanOrEqual(2);
    expect(compacted.join("\n")).toContain("Compressed earlier stages");
  });

  it("builds a stage user message with bounded working memory", () => {
    const budget = makeBudget({
      maxStageTokens: 80,
    });

    const message = buildStageUserMessage(
      "Fix the broken checkout path and explain what changed.",
      [
        "Completed stage\nTool 1: browser_read_text(body) -> CTA points to /checkout-old",
        "Completed stage\nTool 1: mcp_tool_call(update_route) -> CTA now points to /checkout/pro",
      ],
      budget,
    );

    expect(message).toContain("User request");
    expect(message).toContain("Working memory from completed stages");
    expect(message).toContain("checkout/pro");
  });

  it("summarizes browser surface payloads as compact stage artifacts", () => {
    const budget = makeBudget({
      maxResultChars: 260,
    });

    const summary = summarizeCompletedStage(
      [
        {
          type: "tool_call",
          name: "browser_get_surface",
          args: {},
          result: JSON.stringify({
            success: true,
            surface: {
              surfaceId: "surface-1",
              url: "https://spike.land/pricing",
              title: "Pricing",
              textPreview:
                "Choose a plan and continue to checkout. Legacy CTA still points at the old route.",
              elements: [
                { targetId: "t1", role: "button", label: "Start Pro", selectorHint: "#start-pro" },
                {
                  targetId: "t2",
                  role: "link",
                  label: "Enterprise",
                  selectorHint: "a[href='/enterprise']",
                },
              ],
            },
          }),
          status: "done",
          transport: "browser",
        },
      ],
      budget,
    );

    expect(summary).toContain("surface=");
    expect(summary).toContain("Pricing @ https://spike.land/pricing");
    expect(summary).toContain("targets=t1:button:Start Pro");
    expect(summary).not.toContain('"surfaceId"');
  });

  it("compacts browser tool args down to target-oriented summaries", () => {
    const budget = makeBudget({
      maxArgsChars: 80,
      maxResultChars: 120,
    });

    const summary = summarizeCompletedStage(
      [
        {
          type: "tool_call",
          name: "browser_fill",
          args: {
            surfaceId: "surface-123",
            targetId: "t7",
            selector: "input[name='email']",
            value: "founder@spike.land",
          },
          result: JSON.stringify({
            success: true,
            filled: "t7",
          }),
          status: "done",
          transport: "browser",
        },
      ],
      budget,
    );

    expect(summary).toContain("browser_fill(target=t7, value=founder@spike.land)");
    expect(summary).not.toContain("surface-123");
    expect(summary).not.toContain("input[name='email']");
  });
});
