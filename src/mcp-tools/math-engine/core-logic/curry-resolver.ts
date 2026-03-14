/**
 * Math Engine — Curry Resolver (Gap 3)
 *
 * Detects and resolves Curry's paradox in self-referential proof attempts.
 * Injects grounding constraints, distinguishes natural vs injected fixed points.
 */

import type { Finding, LLMProvider, ProofAttempt, SessionState } from "./types.js";
import {
  FALLBACK_TRUNCATION,
  extractJsonBlock,
  parseFindingsFromResponse,
  validateNumberArray,
  validateSeverity,
} from "./parse-utils.js";

interface CurryDetectionResult {
  hasCurryPattern: boolean;
  selfReferentialSteps: number[];
  severity: "none" | "mild" | "critical";
  explanation: string;
  groundingFix?: string | undefined;
}

const CURRY_DETECTION_PROMPT = `You are a logic expert detecting Curry's paradox patterns.

Curry's paradox: Given a self-referential sentence C = "If C is true, then P",
we can prove any proposition P:
1. Assume C is true
2. Then "If C is true, then P" is true (by definition of C)
3. C is true (assumption) and C → P, so P follows by modus ponens
4. We proved: if C is true, then P
5. But that's exactly what C says, so C is true
6. Therefore P

In proof attempts, Curry patterns appear as:
- Self-validating claims: "This system proves its own correctness"
- Circular justification: step N references step N's conclusion
- Bootstrapped truth: assuming the conclusion to derive the conclusion
- Value self-assertion: V(x) is defined in terms of V(x) being valid

Your job: detect these patterns and propose grounding constraints.`;

export async function detectCurryPatterns(
  proofAttempt: ProofAttempt,
  llm: LLMProvider,
): Promise<CurryDetectionResult> {
  const response = await llm.complete({
    temperature: 0.1,
    maxTokens: 1500,
    systemPrompt: CURRY_DETECTION_PROMPT,
    userPrompt: `Analyze this proof attempt for Curry's paradox patterns:

Method: ${proofAttempt.method}
Steps:
${proofAttempt.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Check for:
1. Self-referential steps (does any step reference its own truth/validity?)
2. Circular justification chains
3. Bootstrapped conclusions
4. Self-validating value assertions

Format as JSON:
\`\`\`json
{
  "hasCurryPattern": true/false,
  "selfReferentialSteps": [step numbers],
  "severity": "none|mild|critical",
  "explanation": "...",
  "groundingFix": "proposed fix (if pattern found)"
}
\`\`\``,
  });

  return parseCurryResult(response);
}

function parseCurryResult(response: string): CurryDetectionResult {
  const jsonStr = extractJsonBlock(response);
  if (jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
      return {
        hasCurryPattern: Boolean(parsed.hasCurryPattern),
        selfReferentialSteps: validateNumberArray(parsed.selfReferentialSteps),
        severity: validateSeverity(parsed.severity),
        explanation: String(parsed.explanation ?? ""),
        groundingFix: parsed.groundingFix ? String(parsed.groundingFix) : undefined,
      };
    } catch {
      // fall through
    }
  }

  return {
    hasCurryPattern: false,
    selfReferentialSteps: [],
    severity: "none",
    explanation: "Could not parse LLM response for Curry detection.",
  };
}

export async function resolveGap(session: SessionState, llm: LLMProvider): Promise<Finding[]> {
  const findings: Finding[] = [];

  // Check all proof attempts for Curry patterns
  for (const attempt of session.proofAttempts) {
    try {
      const result = await detectCurryPatterns(attempt, llm);

      if (result.hasCurryPattern) {
        findings.push({
          agentRole: "adversary",
          iteration: session.iteration,
          category: "counterexample",
          content: `Curry pattern detected in proof "${attempt.method}" (severity: ${result.severity}). Steps ${result.selfReferentialSteps.join(", ")} are self-referential. ${result.explanation}`,
          confidence: result.severity === "critical" ? 0.95 : 0.7,
          timestamp: Date.now(),
        });

        if (result.groundingFix) {
          findings.push({
            agentRole: "adversary",
            iteration: session.iteration,
            category: "insight",
            content: `Grounding fix for Curry pattern: ${result.groundingFix}`,
            confidence: 0.6,
            timestamp: Date.now(),
          });
        }
      }
    } catch (error) {
      findings.push({
        agentRole: "adversary",
        iteration: session.iteration,
        category: "gap",
        content: `Curry check failed for "${attempt.method}": ${error instanceof Error ? error.message : String(error)}`,
        confidence: 0.3,
        timestamp: Date.now(),
      });
    }
  }

  // General grounding analysis with bounded context
  const contextFindings = session.findings
    .slice(-20)
    .map((f) => `[${f.agentRole}|${f.category}] ${f.content.slice(0, FALLBACK_TRUNCATION)}`)
    .join("\n");

  const groundingResponse = await llm.complete({
    temperature: 0.2,
    maxTokens: 1500,
    systemPrompt: CURRY_DETECTION_PROMPT,
    userPrompt: `For the self-referential system under analysis, propose grounding constraints that prevent Curry's paradox:

Current findings:
${contextFindings}

Propose:
1. External observable constraints (things that must be checked against reality, not self-assertion)
2. Type-theoretic restrictions (stratification that prevents self-reference)
3. How to distinguish natural fixed points (arising from dynamics) vs injected ones (arbitrary)

Format findings as JSON array:
\`\`\`json
[{"category": "structure|insight", "content": "...", "confidence": 0.0-1.0}]
\`\`\``,
  });

  const parsed = parseFindingsFromResponse(groundingResponse, "adversary", session.iteration);
  findings.push(...parsed);

  return findings;
}

export { type CurryDetectionResult };
