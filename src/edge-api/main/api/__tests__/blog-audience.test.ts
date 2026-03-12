import { describe, expect, it } from "vitest";
import { buildBlogAnalyticsEvents, deriveBlogAudienceSignal } from "../routes/blog-audience.js";

describe("blog audience targeting", () => {
  it("classifies research-heavy posts for AI researcher audiences", () => {
    const signal = deriveBlogAudienceSignal({
      slug: "how-claude-code-engineers-context",
      title: "How Claude Code Engineers Context: An Interview with Opus 4.6",
      category: "Developer Experience",
      tags: ["ai", "context-engineering", "claude", "llm-internals", "planning"],
    });

    expect(signal).toMatchObject({
      contentCluster: "ai_research",
      targetAudience: "ai_researchers",
      researchFit: "high",
    });
    expect(signal.researchScore).toBeGreaterThanOrEqual(5);
    expect(signal.matchedTopics).toEqual(
      expect.arrayContaining(["context-engineering", "llm-internals"]),
    );
  });

  it("classifies build-oriented posts as AI builder content instead of researcher content", () => {
    const signal = deriveBlogAudienceSignal({
      slug: "getting-started-spike-land",
      title: "Getting Started with spike.land: From Signup to Your First AI Tool Call",
      category: "Tutorial",
      tags: ["mcp", "getting-started", "tutorial", "spike-cli", "tools", "beginner"],
    });

    expect(signal).toEqual({
      contentCluster: "ai_build",
      targetAudience: "ai_builders",
      researchFit: "none",
      researchScore: 1,
      matchedTopics: ["mcp"],
    });
  });

  it("builds a dedicated GA4 event for AI researcher content", () => {
    const { events, signal } = buildBlogAnalyticsEvents({
      slug: "the-grandmother-neuron-fallacy",
      title: "The Grandmother Neuron Fallacy: Why Reductionism Breaks Your AI Tool Chain",
      category: "Developer Experience",
      tags: ["mcp", "ai", "cognitive-bias", "chaos-theory", "complexity", "reductionism"],
    });

    expect(signal.targetAudience).toBe("ai_researchers");
    expect(events.map((event) => event.name)).toEqual(["blog_view", "blog_view_ai_research"]);
    expect(events[0]?.params).toMatchObject({
      slug: "the-grandmother-neuron-fallacy",
      content_cluster: "ai_research",
      target_audience: "ai_researchers",
      ai_research_fit: "high",
    });
    expect(events[0]?.params.matched_topics).toContain("complexity");
  });

  it("keeps general developer posts on the normal blog_view event only", () => {
    const { events, signal } = buildBlogAnalyticsEvents({
      slug: "spike-land-launch",
      title: "Introducing spike.land — The MCP-First AI Platform",
      category: "Product",
      tags: ["platform", "launch", "marketplace"],
    });

    expect(signal).toEqual({
      contentCluster: "general",
      targetAudience: "developers",
      researchFit: "none",
      researchScore: 0,
      matchedTopics: [],
    });
    expect(events).toHaveLength(1);
    expect(events[0]?.name).toBe("blog_view");
  });
});
