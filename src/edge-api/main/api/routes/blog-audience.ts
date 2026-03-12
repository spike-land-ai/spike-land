import type { GA4Event } from "../../lazy-imports/ga4.js";

export interface BlogAudienceInput {
  slug: string;
  title: string;
  category: string;
  tags: string[];
}

export interface BlogAudienceSignal {
  contentCluster: "ai_research" | "ai_build" | "general";
  targetAudience: "ai_researchers" | "ai_builders" | "developers";
  researchFit: "none" | "medium" | "high";
  researchScore: number;
  matchedTopics: string[];
}

const TAG_WEIGHTS: Record<string, number> = {
  "llm-internals": 4,
  "context-engineering": 3,
  "prompt-engineering": 2,
  "tool-calling": 2,
  "context-window": 2,
  protocol: 2,
  complexity: 2,
  "chaos-theory": 2,
  reductionism: 2,
  "cognitive-bias": 2,
  architecture: 1,
  agents: 1,
  "ai-agents": 1,
  mcp: 1,
  planning: 1,
  performance: 1,
};

const TITLE_PATTERNS: Array<{ topic: string; weight: number; pattern: RegExp }> = [
  { topic: "llm-internals", weight: 4, pattern: /\b(llm|internals?)\b/i },
  { topic: "context-engineering", weight: 3, pattern: /\bcontext\b/i },
  { topic: "protocol", weight: 2, pattern: /\bprotocol\b/i },
  { topic: "complexity", weight: 2, pattern: /\b(complexity|reductionism|chaos)\b/i },
  { topic: "architecture", weight: 1, pattern: /\barchitecture\b/i },
  { topic: "agents", weight: 1, pattern: /\bagents?\b/i },
];

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.filter(Boolean)));
}

export function deriveBlogAudienceSignal(input: BlogAudienceInput): BlogAudienceSignal {
  const normalizedTags = input.tags.map(normalizeTag);
  const matchedTopics: string[] = [];
  let researchScore = 0;

  for (const tag of normalizedTags) {
    const weight = TAG_WEIGHTS[tag];
    if (!weight) continue;
    researchScore += weight;
    matchedTopics.push(tag);
  }

  for (const { topic, weight, pattern } of TITLE_PATTERNS) {
    if (!pattern.test(input.title)) continue;
    researchScore += weight;
    matchedTopics.push(topic);
  }

  if (/^(architecture|engineering)$/i.test(input.category)) {
    researchScore += 1;
    matchedTopics.push("architecture");
  }

  const uniqueTopics = unique(matchedTopics);
  const researchFit = researchScore >= 5 ? "high" : researchScore >= 3 ? "medium" : "none";
  const contentCluster =
    researchFit !== "none"
      ? "ai_research"
      : normalizedTags.some((tag) => ["ai", "mcp", "agents", "developer-tools"].includes(tag))
        ? "ai_build"
        : "general";
  const targetAudience =
    researchFit !== "none"
      ? "ai_researchers"
      : contentCluster === "ai_build"
        ? "ai_builders"
        : "developers";

  return {
    contentCluster,
    targetAudience,
    researchFit,
    researchScore,
    matchedTopics: uniqueTopics.slice(0, 8),
  };
}

export function buildBlogAnalyticsEvents(input: BlogAudienceInput): {
  events: GA4Event[];
  signal: BlogAudienceSignal;
} {
  const signal = deriveBlogAudienceSignal(input);
  const params = {
    page_path: `/api/blog/${input.slug}`,
    slug: input.slug,
    blog_category: input.category || "unknown",
    blog_tags_csv: unique(input.tags.map(normalizeTag)).join("|"),
    content_cluster: signal.contentCluster,
    target_audience: signal.targetAudience,
    ai_research_fit: signal.researchFit,
    ai_research_score: signal.researchScore,
    matched_topics: signal.matchedTopics.join("|"),
  };

  const events: GA4Event[] = [{ name: "blog_view", params }];

  if (signal.researchFit !== "none") {
    events.push({
      name: "blog_view_ai_research",
      params,
    });
  }

  return { events, signal };
}
