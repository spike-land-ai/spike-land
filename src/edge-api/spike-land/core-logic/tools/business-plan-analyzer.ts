/**
 * Business Plan Analyzer MCP Tools (CF Workers)
 *
 * Fetches a website URL and produces an investor-perspective analysis
 * following the OUTPUT_SCHEMA_PRO_V1 format. Uses Claude AI to analyze
 * extracted content and produce a structured report.
 */

import { z } from "zod";
import type { ToolRegistry } from "../../lazy-imports/registry";
import { freeTool, textResult } from "../../lazy-imports/procedures-index.ts";
import { McpError, McpErrorCode, safeToolCall } from "../lib/tool-helpers";
import type { DrizzleDB } from "../../db/db/db-index.ts";
import type { Env } from "../env";

/** Minimal env fields required by business plan analyzer tools. */
type BizAnalyzerEnv = Pick<Env, "ANTHROPIC_API_KEY">;

// ─── Website Content Extraction ──────────────────────────────────────────────

export interface ExtractedContent {
  title: string;
  description: string;
  bodyText: string;
  links: string[];
  metaTags: Record<string, string>;
  fetchedAt: string;
}

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    .replace(/&#x([a-fA-F0-9]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

export async function fetchWebsiteContent(url: string): Promise<ExtractedContent> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: controller.signal as AbortSignal,
      redirect: "follow",
    });
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new McpError(`Fetch timed out after 15 seconds for ${url}`, McpErrorCode.TIMEOUT, true);
    }
    throw new McpError(
      `Failed to fetch ${url}: ${error instanceof Error ? error.message : "Unknown error"}`,
      McpErrorCode.UPSTREAM_SERVICE_ERROR,
      true,
    );
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new McpError(
      `HTTP ${response.status} fetching ${url}`,
      response.status === 429 ? McpErrorCode.RATE_LIMITED : McpErrorCode.UPSTREAM_SERVICE_ERROR,
      response.status === 429,
    );
  }

  const html = await response.text();

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeHtmlEntities(titleMatch[1]!.trim()) : "";

  // Extract meta tags
  const metaTags: Record<string, string> = {};
  const metaRegex =
    /<meta\s+(?:[^>]*?\s)?(?:name|property)=["']([^"']+)["'][^>]*?\scontent=["']([^"']*?)["'][^>]*?>/gi;
  const metaRegexAlt =
    /<meta\s+(?:[^>]*?\s)?content=["']([^"']*?)["'][^>]*?\s(?:name|property)=["']([^"']+)["'][^>]*?>/gi;
  let metaMatch: RegExpExecArray | null;
  while ((metaMatch = metaRegex.exec(html)) !== null) {
    metaTags[metaMatch[1]!] = decodeHtmlEntities(metaMatch[2]!);
  }
  while ((metaMatch = metaRegexAlt.exec(html)) !== null) {
    metaTags[metaMatch[2]!] = decodeHtmlEntities(metaMatch[1]!);
  }
  const description = metaTags["description"] ?? metaTags["og:description"] ?? "";

  // Extract links
  const links: string[] = [];
  const linkRegex = /<a\s+[^>]*?href=["']([^"'#][^"']*?)["'][^>]*?>/gi;
  let linkMatch: RegExpExecArray | null;
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const href = linkMatch[1]!.trim();
    if (href.startsWith("http") || href.startsWith("/")) {
      links.push(href);
    }
    if (links.length >= 200) break;
  }

  // Strip non-content elements and extract body text
  let bodyHtml = html;
  // Remove script, style, nav, footer, header tags and their contents
  bodyHtml = bodyHtml.replace(/<script[\s\S]*?<\/script>/gi, " ");
  bodyHtml = bodyHtml.replace(/<style[\s\S]*?<\/style>/gi, " ");
  bodyHtml = bodyHtml.replace(/<nav[\s\S]*?<\/nav>/gi, " ");
  bodyHtml = bodyHtml.replace(/<footer[\s\S]*?<\/footer>/gi, " ");
  bodyHtml = bodyHtml.replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  bodyHtml = bodyHtml.replace(/<svg[\s\S]*?<\/svg>/gi, " ");
  // Remove all remaining HTML tags
  bodyHtml = bodyHtml.replace(/<[^>]+>/g, " ");
  // Decode entities and normalize whitespace
  bodyHtml = decodeHtmlEntities(bodyHtml);
  bodyHtml = bodyHtml.replace(/\s+/g, " ").trim();

  // Truncate to ~100K chars for Anthropic context limit
  const MAX_BODY_LENGTH = 100_000;
  const bodyText =
    bodyHtml.length > MAX_BODY_LENGTH ? bodyHtml.slice(0, MAX_BODY_LENGTH) : bodyHtml;

  return {
    title,
    description,
    bodyText,
    links: [...new Set(links)],
    metaTags,
    fetchedAt: new Date().toISOString(),
  };
}

// ─── Analysis Prompt Builder ────────────────────────────────────────────────

type FocusType = "general" | "saas" | "marketplace" | "deeptech" | "consumer" | "fintech";

const FOCUS_INSTRUCTIONS: Record<FocusType, string> = {
  general: "Analyze from a general investor perspective across all business model types.",
  saas: "Focus on SaaS metrics: ARR, MRR, churn, LTV/CAC, net revenue retention, expansion revenue, and cohort analysis.",
  marketplace:
    "Focus on marketplace dynamics: GMV, take rate, liquidity, supply/demand balance, network effects, and unit economics per transaction.",
  deeptech:
    "Focus on deep tech indicators: IP moat, technical differentiation, time-to-market, regulatory pathway, and scientific validation.",
  consumer:
    "Focus on consumer metrics: DAU/MAU ratio, retention curves, viral coefficient, engagement depth, and monetization per user.",
  fintech:
    "Focus on fintech specifics: regulatory compliance, money transmission licenses, payment volume, fraud rates, and financial partnerships.",
};

export function buildAnalysisPrompt(
  content: ExtractedContent,
  focus: FocusType,
): { system: string; user: string } {
  const today = new Date().toISOString().split("T")[0];

  const system = `You are a senior venture capital analyst conducting due diligence. You produce structured investment analyses following the OUTPUT_SCHEMA_PRO_V1 format.

${FOCUS_INSTRUCTIONS[focus]}

## GOLDEN RULE
No material statement without evidence_ids + confidence score.
- facts → extracted_facts
- claims → claim_register
- proof → evidence_library
- citations → reference_library
- judgment → risk_engine

## OUTPUT FORMAT
Produce a plain-text report with exactly these 12 sections, using the exact headers shown below. Each section uses key: value pairs. Confidence scores are 0.0-1.0. Evidence references use [E001] format. Claims use [C001] format. Risks use [R001] format.

==============================
COMPANY
==============================
company_name: <name>
tagline: <one-line pitch>
stage: <idea|pre_seed|seed|series_a|series_b|growth|public>
sector: <primary sector>
sub_sector: <specific niche>
business_model_primary: <saas|marketplace|hardware|services|consumer|fintech|deeptech|other>
business_model_secondary: <if applicable or "none">
geography: <HQ location>
summary: <2-3 sentence summary> [confidence: X.X] [evidence: E001, E002]

==============================
CLASSIFICATION
==============================
plan_type: <pitch_deck|landing_page|whitepaper|investor_memo|product_page|blog|unknown> [confidence: X.X]
commercialization_status: <pre_revenue|early_revenue|scaling|mature> [confidence: X.X]
funding_intent: <actively_raising|exploring|not_raising|unknown> [confidence: X.X]
target_audience: <investors|customers|partners|general> [confidence: X.X]

==============================
EXECUTIVE VIEW
==============================
investment_thesis: <1-2 sentences on why this could be a good investment> [confidence: X.X] [evidence: ...]
key_strengths: <bulleted list>
key_concerns: <bulleted list>
overall_signal: <strong_positive|positive|neutral|negative|strong_negative> [confidence: X.X]

==============================
CLAIM REGISTER
==============================
[C001] claim: <verbatim or paraphrased claim> | category: <market_size|traction|team|tech|financial> | verifiable: <yes|no|partially> | confidence: X.X | evidence: E00X
[C002] ...
(List all material claims found on the page)

==============================
TRACTION ANALYSIS
==============================
reported_metrics: <list any metrics mentioned: users, revenue, growth, etc.> [evidence: ...]
growth_trajectory: <assessment> [confidence: X.X]
product_market_fit_signals: <assessment> [confidence: X.X]
notable_customers_partners: <if mentioned> [evidence: ...]

==============================
FINANCIAL ANALYSIS
==============================
revenue_model: <how they make money> [confidence: X.X] [evidence: ...]
pricing_strategy: <if visible> [evidence: ...]
unit_economics: <if discernible> [confidence: X.X]
funding_history: <if mentioned> [evidence: ...]
burn_indicators: <if any signals> [confidence: X.X]

==============================
TEAM ANALYSIS
==============================
founders: <names and roles if mentioned> [evidence: ...]
team_size: <if mentioned> [evidence: ...]
relevant_experience: <assessment> [confidence: X.X]
advisors_board: <if mentioned> [evidence: ...]

==============================
RISK ENGINE
==============================
[R001] risk: <description> | category: <market|execution|technical|regulatory|financial|team> | severity: <critical|high|medium|low> | likelihood: <high|medium|low> | mitigation: <suggested>
[R002] ...
(Identify all material risks)

==============================
DILIGENCE ASSISTANT
==============================
information_gaps: <what critical information is missing>
suggested_questions: <5-10 questions an investor should ask>
red_flags: <any concerning patterns>
next_steps: <recommended diligence actions>

==============================
EVIDENCE LIBRARY
==============================
[E001] "<quoted or closely paraphrased text>" | source: company_website | section: <hero|about|pricing|features|team|footer|meta|other> | confidence: X.X | supports: C001
[E002] ...
(Every piece of evidence extracted from the page)

==============================
REFERENCE LIBRARY
==============================
[REF001] Company Website | url: <url> | accessed: ${today} | trust: primary
[REF002] ...

==============================
META
==============================
analysis_model: claude-4-6-sonnet
analysis_date: ${today}
schema_version: PRO_V1
focus_mode: ${focus}
content_length: ${content.bodyText.length} chars
extraction_quality: <assessment of how much useful content was extracted> [confidence: X.X]`;

  const metaSection = Object.entries(content.metaTags)
    .map(([k, v]) => `  ${k}: ${v}`)
    .join("\n");

  const user = `Analyze the following website content as a potential investment opportunity.

## PAGE METADATA
Title: ${content.title}
Description: ${content.description}
Fetched: ${content.fetchedAt}
Meta tags:
${metaSection || "  (none)"}

## LINKS FOUND (first 50)
${content.links.slice(0, 50).join("\n") || "(none)"}

## PAGE CONTENT
${content.bodyText}`;

  return { system, user };
}

// ─── Anthropic API Call ──────────────────────────────────────────────────────

interface AnthropicContentBlock {
  type: string;
  text?: string;
}

interface AnthropicResponse {
  content: AnthropicContentBlock[];
  usage: { input_tokens: number; output_tokens: number };
}

export async function callAnthropicAnalysis(
  env: BizAnalyzerEnv,
  message: string,
  systemPrompt: string,
): Promise<{ text: string; usage: { input_tokens: number; output_tokens: number } }> {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new McpError("ANTHROPIC_API_KEY not configured.", McpErrorCode.AUTH_ERROR, false);
  }

  const body = {
    model: "claude-4-6-sonnet",
    max_tokens: 16384,
    temperature: 0.2,
    system: systemPrompt,
    messages: [{ role: "user" as const, content: message }],
  };

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new McpError(
      `Anthropic API error (${response.status}): ${errorText}`,
      response.status === 429 ? McpErrorCode.RATE_LIMITED : McpErrorCode.UPSTREAM_SERVICE_ERROR,
      response.status === 429,
    );
  }

  const data = (await response.json()) as AnthropicResponse;
  const textParts: string[] = [];
  for (const block of data.content) {
    if (block.type === "text" && block.text) textParts.push(block.text);
  }

  return { text: textParts.join("\n"), usage: data.usage };
}

// ─── Signal Extraction (no AI) ──────────────────────────────────────────────

function extractRawSignals(content: ExtractedContent): string {
  const signals: string[] = [];

  signals.push("=== RAW SIGNAL EXTRACTION ===\n");
  signals.push(`Title: ${content.title}`);
  signals.push(`Description: ${content.description}`);
  signals.push(`Fetched: ${content.fetchedAt}`);
  signals.push(`Body length: ${content.bodyText.length} chars`);
  signals.push(`Links found: ${content.links.length}`);

  // Extract numbers/metrics
  const metricPatterns = [
    { label: "Revenue/ARR mentions", pattern: /\$[\d,.]+[MBKmk]?(?:\s*(?:ARR|MRR|revenue))?/gi },
    {
      label: "User/customer counts",
      pattern: /[\d,.]+[MBKmk]?\+?\s*(?:users?|customers?|clients?|members?)/gi,
    },
    {
      label: "Growth percentages",
      pattern: /[\d,.]+%\s*(?:growth|increase|MoM|YoY|year[\s-]over[\s-]year)/gi,
    },
    {
      label: "Funding mentions",
      pattern:
        /(?:raised|funding|round|series\s+[A-Z]|seed|pre-seed)\s*(?:of\s*)?\$?[\d,.]+[MBKmk]?/gi,
    },
    {
      label: "Team size",
      pattern: /(?:team\s+of\s+)[\d]+|[\d]+\s*(?:employees?|team\s+members?|engineers?)/gi,
    },
    {
      label: "Year references",
      pattern: /(?:founded|since|established|launched)\s*(?:in\s+)?20\d{2}/gi,
    },
  ];

  signals.push("\n=== EXTRACTED METRICS ===");
  for (const { label, pattern } of metricPatterns) {
    const matches = content.bodyText.match(pattern);
    if (matches && matches.length > 0) {
      signals.push(`\n${label}:`);
      for (const match of [...new Set(matches)].slice(0, 10)) {
        signals.push(`  - ${match.trim()}`);
      }
    }
  }

  // Meta tags of interest
  const interestingMeta = [
    "og:title",
    "og:description",
    "og:type",
    "og:site_name",
    "twitter:title",
    "twitter:description",
  ];
  const foundMeta = interestingMeta.filter((key) => content.metaTags[key]);
  if (foundMeta.length > 0) {
    signals.push("\n=== RELEVANT META TAGS ===");
    for (const key of foundMeta) {
      signals.push(`  ${key}: ${content.metaTags[key]}`);
    }
  }

  // External links (potential partnerships, press, etc.)
  const externalLinks = content.links.filter(
    (l) =>
      l.startsWith("http") &&
      !l.includes(new URL(content.links[0] ?? "https://example.com").hostname),
  );
  if (externalLinks.length > 0) {
    signals.push("\n=== EXTERNAL LINKS (first 20) ===");
    for (const link of externalLinks.slice(0, 20)) {
      signals.push(`  - ${link}`);
    }
  }

  // First 500 chars of body as preview
  signals.push("\n=== CONTENT PREVIEW (first 500 chars) ===");
  signals.push(content.bodyText.slice(0, 500));

  return signals.join("\n");
}

// ─── Tool Registration ──────────────────────────────────────────────────────

export function registerBusinessPlanAnalyzerTools(
  registry: ToolRegistry,
  userId: string,
  db: DrizzleDB,
  env: BizAnalyzerEnv,
): void {
  // Tool 1: biz_analyze_url — Full PRO_V1 investor analysis
  registry.registerBuilt(
    freeTool(userId, db)
      .tool(
        "biz_analyze_url",
        "Fetch a website URL and produce a structured investor-perspective analysis (PRO_V1 schema). Covers company profile, claims, traction, financials, team, risks, diligence questions, and evidence traceability.",
        {
          url: z.string().url().describe("The website URL to analyze."),
          focus: z
            .enum(["general", "saas", "marketplace", "deeptech", "consumer", "fintech"])
            .optional()
            .default("general")
            .describe("Analysis focus mode tailored to the business model type."),
        },
      )
      .meta({ category: "business-analysis", tier: "workspace" })
      .examples([
        {
          name: "analyze_startup",
          input: { url: "https://example-startup.com", focus: "saas" },
          description: "Analyze a SaaS startup landing page",
        },
      ])
      .handler(async ({ input }) => {
        const { url, focus = "general" } = input;
        return safeToolCall(
          "biz_analyze_url",
          async () => {
            const content = await fetchWebsiteContent(url);
            const prompt = buildAnalysisPrompt(content, focus);
            const result = await callAnthropicAnalysis(env, prompt.user, prompt.system);

            return textResult(
              `**Business Plan Analysis** (${focus} focus, ${result.usage.input_tokens} in / ${result.usage.output_tokens} out)\n` +
                `**Source:** ${url}\n` +
                `**Fetched:** ${content.fetchedAt}\n\n` +
                result.text,
            );
          },
          { timeoutMs: 55000 },
        );
      }),
  );

  // Tool 2: biz_extract_signals — Raw signal extraction without AI (debugging)
  registry.registerBuilt(
    freeTool(userId, db)
      .tool(
        "biz_extract_signals",
        "Fetch a website URL and extract raw business signals (metrics, links, meta tags) without AI analysis. Useful for debugging or quick signal checks.",
        {
          url: z.string().url().describe("The website URL to extract signals from."),
        },
      )
      .meta({ category: "business-analysis", tier: "free" })
      .handler(async ({ input }) => {
        const { url } = input;
        return safeToolCall(
          "biz_extract_signals",
          async () => {
            const content = await fetchWebsiteContent(url);
            const signals = extractRawSignals(content);
            return textResult(signals);
          },
          { timeoutMs: 20000 },
        );
      }),
  );
}
