/**
 * Math Engine — Computability Checker (Gap 2)
 *
 * Addresses the uncomputability gap via Rice's theorem analysis.
 * Classifies properties as syntactic vs semantic, identifies computability ceilings.
 */

import type { Finding, LLMProvider, Problem, SessionState } from "./types.js";
import { FALLBACK_TRUNCATION, extractJsonBlock } from "./parse-utils.js";

interface ComputabilityClassification {
  property: string;
  classification: "syntactic" | "semantic" | "unknown";
  decidable: boolean;
  justification: string;
  approximation?: string | undefined;
}

const VALID_CLASSIFICATIONS = new Set(["syntactic", "semantic", "unknown"]);

const RICE_THEOREM_PROMPT = `You are analyzing computability properties using Rice's theorem.

Rice's theorem: For any non-trivial semantic property P of partial recursive functions,
the set {i : φ_i has property P} is undecidable.

Key distinction:
- SYNTACTIC properties depend only on the program text (decidable by inspection)
- SEMANTIC properties depend on the program's behavior/output (usually undecidable)

Your task: classify the given properties and identify computable approximations.`;

export async function checkComputability(
  problem: Problem,
  session: SessionState,
  llm: LLMProvider,
): Promise<Finding[]> {
  const response = await llm.complete({
    temperature: 0.1,
    maxTokens: 2000,
    systemPrompt: RICE_THEOREM_PROMPT,
    userPrompt: `Problem: ${problem.description}

For the valuation function V in the self-referential system S_{t+1} = U(S_t, V(D(S_t))):

1. List all properties claimed or implied about V
2. Classify each as syntactic or semantic
3. Apply Rice's theorem to semantic properties
4. For undecidable properties, propose computable approximations
5. Identify the computability ceiling for a bounded automaton (CF Workers)

Format as JSON:
\`\`\`json
{
  "classifications": [
    {
      "property": "...",
      "classification": "syntactic|semantic|unknown",
      "decidable": true/false,
      "justification": "...",
      "approximation": "... (for undecidable properties)"
    }
  ],
  "computability_ceiling": "description of what is computable",
  "honest_assessment": "what we can and cannot compute"
}
\`\`\``,
  });

  return parseComputabilityFindings(response, session.iteration);
}

function parseComputabilityFindings(response: string, iteration: number): Finding[] {
  const findings: Finding[] = [];
  const jsonStr = extractJsonBlock(response);

  if (jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr) as {
        classifications?: Array<Record<string, unknown>>;
        computability_ceiling?: string;
        honest_assessment?: string;
      };

      if (Array.isArray(parsed.classifications)) {
        for (const c of parsed.classifications) {
          const classification = VALID_CLASSIFICATIONS.has(String(c.classification))
            ? (String(c.classification) as ComputabilityClassification["classification"])
            : "unknown";
          const decidable = Boolean(c.decidable);
          // Semantic undecidable properties get lower confidence than syntactic decidable ones
          const confidence =
            classification === "unknown"
              ? 0.3
              : classification === "semantic" && !decidable
                ? 0.6
                : 0.8;

          findings.push({
            agentRole: "analyst",
            iteration,
            category: decidable ? "structure" : "gap",
            content: `[${classification}] ${String(c.property ?? "")}: ${String(c.justification ?? "")}${c.approximation ? ` Approximation: ${String(c.approximation)}` : ""}`,
            confidence,
            timestamp: Date.now(),
          });
        }
      }

      if (parsed.computability_ceiling) {
        findings.push({
          agentRole: "analyst",
          iteration,
          category: "structure",
          content: `Computability ceiling: ${parsed.computability_ceiling}`,
          confidence: 0.7,
          timestamp: Date.now(),
        });
      }

      if (parsed.honest_assessment) {
        findings.push({
          agentRole: "analyst",
          iteration,
          category: "insight",
          content: `Honest assessment: ${parsed.honest_assessment}`,
          confidence: 0.8,
          timestamp: Date.now(),
        });
      }
    } catch {
      findings.push({
        agentRole: "analyst",
        iteration,
        category: "insight",
        content: response.slice(0, FALLBACK_TRUNCATION),
        confidence: 0.3,
        timestamp: Date.now(),
      });
    }
  } else {
    findings.push({
      agentRole: "analyst",
      iteration,
      category: "insight",
      content: response.slice(0, FALLBACK_TRUNCATION),
      confidence: 0.3,
      timestamp: Date.now(),
    });
  }

  return findings;
}

export { type ComputabilityClassification };
