import { z } from "zod";
import { PRD_COMPRESSION_SYSTEM_PROMPT } from "./prd-compression-prompt.js";

export const CompressedPrdSchema = z.object({
  intent: z.enum([
    "implementation",
    "debugging",
    "deployment",
    "query",
    "configuration",
    "analysis",
    "creative",
    "conversation",
  ]),
  task: z.string().max(200),
  constraints: z.array(z.string().max(100)).max(5).default([]),
  acceptance: z.array(z.string().max(100)).max(3).default([]),
  context: z.string().max(500).default(""),
  priority: z.enum(["critical", "high", "normal", "low"]).default("normal"),
});

export type CompressedPrd = z.infer<typeof CompressedPrdSchema>;

export interface PrdCompressionConfig {
  mode: "auto" | "always" | "never";
  geminiApiKey?: string;
}

export interface PrdCompressionResult {
  compressed: boolean;
  tier: "passthrough" | "template" | "model";
  prd: CompressedPrd | null;
  formattedMessage: string;
  originalTokenEstimate: number;
  compressedTokenEstimate: number;
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

const STRUCTURED_PATTERN = /^(#{1,3}\s|\*\s|-\s|\d+\.\s)/m;
const SHORT_THRESHOLD = 200;

export function shouldCompress(message: string): boolean {
  if (message.length < SHORT_THRESHOLD) return false;
  if (STRUCTURED_PATTERN.test(message)) return false;
  return true;
}

interface TemplateMatch {
  pattern: RegExp;
  intent: CompressedPrd["intent"];
}

const TEMPLATE_PATTERNS: TemplateMatch[] = [
  { pattern: /^(?:fix|debug|resolve|patch)\s+(.+)/i, intent: "debugging" },
  { pattern: /^(?:build|create|implement|add|make|ship)\s+(.+)/i, intent: "implementation" },
  { pattern: /^(?:deploy|release|publish|push)\s+(.+)/i, intent: "deployment" },
  { pattern: /^(?:what|how|why|where|when|explain|describe)\s+(.+)/i, intent: "query" },
  { pattern: /^(?:configure|setup|set up|enable|disable)\s+(.+)/i, intent: "configuration" },
  { pattern: /^(?:analyze|review|audit|check|inspect)\s+(.+)/i, intent: "analysis" },
  { pattern: /^(?:write|draft|compose|design|brainstorm)\s+(.+)/i, intent: "creative" },
];

export function templateExtract(message: string): CompressedPrd | null {
  const trimmed = message.trim();

  for (const { pattern, intent } of TEMPLATE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      return {
        intent,
        task: trimmed.slice(0, 200),
        constraints: [],
        acceptance: [],
        context: "",
        priority: "normal",
      };
    }
  }

  return null;
}

export function formatPrdAsMessage(prd: CompressedPrd): string {
  const lines: string[] = [
    `[PRD] intent=${prd.intent} | priority=${prd.priority}`,
    `Task: ${prd.task}`,
  ];

  if (prd.constraints.length > 0) {
    lines.push(`Constraints: ${prd.constraints.join("; ")}`);
  }
  if (prd.acceptance.length > 0) {
    lines.push(`Acceptance: ${prd.acceptance.join("; ")}`);
  }
  if (prd.context) {
    lines.push(`Context: ${prd.context}`);
  }

  return lines.join("\n");
}

export async function compressWithModel(
  message: string,
  geminiApiKey: string,
): Promise<CompressedPrd | null> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: PRD_COMPRESSION_SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: message }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 512,
          },
        }),
      },
    );

    if (!res.ok) return null;

    const data = await res.json<{
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    }>();

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!raw) return null;

    const jsonStr = raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(jsonStr) as unknown;
    const result = CompressedPrdSchema.safeParse(parsed);

    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * Resolve PRD context for a route or message text.
 * Returns a serialized PRD string to inject as system context before compression.
 * Uses lazy import to avoid bundling prd-registry when unused.
 */
export async function resolvePrdContext(options: {
  route?: string;
  keywords?: string;
}): Promise<string | null> {
  try {
    const { createPrdRegistry } = await import("../../../prd-registry/manifest.js");
    const registry = createPrdRegistry();

    if (options.route) {
      const resolved = registry.resolveForRoute(options.route);
      return resolved.totalTokens > 0 ? resolved.serialized : null;
    }
    if (options.keywords) {
      const resolved = registry.resolveByKeywords(options.keywords);
      return resolved.totalTokens > 0 ? resolved.serialized : null;
    }
    return null;
  } catch {
    // PRD registry not available — graceful degradation
    return null;
  }
}

export async function compressMessage(
  message: string,
  config: PrdCompressionConfig,
): Promise<PrdCompressionResult> {
  const originalTokenEstimate = estimateTokens(message);

  const passthrough = (
    tier: PrdCompressionResult["tier"] = "passthrough",
  ): PrdCompressionResult => ({
    compressed: false,
    tier,
    prd: null,
    formattedMessage: message,
    originalTokenEstimate,
    compressedTokenEstimate: originalTokenEstimate,
  });

  if (config.mode === "never") {
    return passthrough();
  }

  if (config.mode === "auto" && !shouldCompress(message)) {
    return passthrough();
  }

  // Tier 2: Template extraction
  const templatePrd = templateExtract(message);
  if (templatePrd) {
    const formatted = formatPrdAsMessage(templatePrd);
    return {
      compressed: true,
      tier: "template",
      prd: templatePrd,
      formattedMessage: formatted,
      originalTokenEstimate,
      compressedTokenEstimate: estimateTokens(formatted),
    };
  }

  // Tier 3: Model compression (Gemini Flash)
  if (config.geminiApiKey) {
    const modelPrd = await compressWithModel(message, config.geminiApiKey);
    if (modelPrd) {
      const formatted = formatPrdAsMessage(modelPrd);
      return {
        compressed: true,
        tier: "model",
        prd: modelPrd,
        formattedMessage: formatted,
        originalTokenEstimate,
        compressedTokenEstimate: estimateTokens(formatted),
      };
    }
  }

  // Fallback: passthrough if model compression fails
  return passthrough();
}
