/**
 * Math Engine — Shared Parsing Utilities
 *
 * Validates LLM-returned JSON with runtime type checks.
 */

import type { AgentRole, Finding, FindingCategory } from "./types.js";

const PARSE_FAILURE_CONFIDENCE = 0.3;
const FALLBACK_TRUNCATION = 500;

const VALID_CATEGORIES = new Set<FindingCategory>([
  "structure",
  "proof_step",
  "counterexample",
  "gap",
  "insight",
]);

function clampConfidence(value: unknown): number {
  const n = Number(value ?? 0.5);
  if (!Number.isFinite(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}

function validateCategory(value: unknown): FindingCategory {
  const s = String(value ?? "insight");
  return VALID_CATEGORIES.has(s as FindingCategory) ? (s as FindingCategory) : "insight";
}

export function extractJsonBlock(response: string, index = 0): string | null {
  const blocks = [...response.matchAll(/```json\s*([\s\S]*?)```/g)];
  return blocks[index]?.[1] ?? null;
}

export function parseFindingsFromResponse(
  response: string,
  role: AgentRole,
  iteration: number,
): Finding[] {
  const jsonStr = extractJsonBlock(response);
  if (!jsonStr) {
    return [fallbackFinding(response, role, iteration)];
  }

  try {
    const parsed: unknown = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) {
      return [fallbackFinding(response, role, iteration)];
    }
    return parsed.map((f: Record<string, unknown>) => ({
      agentRole: role,
      iteration,
      category: validateCategory(f.category),
      content: String(f.content ?? ""),
      confidence: clampConfidence(f.confidence),
      timestamp: Date.now(),
    }));
  } catch {
    return [fallbackFinding(response, role, iteration)];
  }
}

function fallbackFinding(response: string, role: AgentRole, iteration: number): Finding {
  return {
    agentRole: role,
    iteration,
    category: "insight",
    content: response.slice(0, FALLBACK_TRUNCATION),
    confidence: PARSE_FAILURE_CONFIDENCE,
    timestamp: Date.now(),
  };
}

export function validateSeverity(value: unknown): "none" | "mild" | "critical" {
  const s = String(value ?? "none");
  if (s === "none" || s === "mild" || s === "critical") return s;
  return "none";
}

export function validateNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
}

export { PARSE_FAILURE_CONFIDENCE, FALLBACK_TRUNCATION };
