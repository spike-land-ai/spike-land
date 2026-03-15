/**
 * Math Engine — Conjecture Explorer
 *
 * AI-assisted exploration of Erdos conjectures and open problems.
 */

import type { Finding, LLMProvider, Problem, SessionState } from "./types.js";
import { FALLBACK_TRUNCATION, parseFindingsFromResponse } from "./parse-utils.js";

interface ExplorationStrategy {
  name: string;
  description: string;
  applicableTo: string[];
}

const STRATEGIES: ExplorationStrategy[] = [
  {
    name: "Parametric Family Search",
    description: "Search for parametric families of solutions that cover special cases",
    applicableTo: ["erdos-straus", "erdos-ginzburg-ziv"],
  },
  {
    name: "Modular Arithmetic",
    description: "Analyze the problem modulo small primes and residue classes",
    applicableTo: ["erdos-straus", "covering-systems", "collatz"],
  },
  {
    name: "Algebraic Geometry",
    description: "Translate to algebraic curves/varieties and use intersection theory",
    applicableTo: ["unit-distance", "erdos-straus"],
  },
  {
    name: "Probabilistic Method",
    description: "Use random constructions to prove existence bounds",
    applicableTo: ["covering-systems", "erdos-ginzburg-ziv", "unit-distance"],
  },
  {
    name: "Computational Verification",
    description: "Verify conjecture for specific cases and look for patterns",
    applicableTo: [
      "erdos-straus",
      "erdos-ginzburg-ziv",
      "covering-systems",
      "unit-distance",
      "collatz",
    ],
  },
  {
    name: "Dynamical Systems Analysis",
    description: "Analyze orbit structure, attractors, stopping times, and Lyapunov exponents",
    applicableTo: ["collatz"],
  },
  {
    name: "Probabilistic Heuristics",
    description: "Apply random walk models and stochastic convergence bounds",
    applicableTo: ["collatz"],
  },
  {
    name: "p-adic Analysis",
    description: "Extend to p-adic integers and study convergence in p-adic topology",
    applicableTo: ["collatz"],
  },
];

export function getApplicableStrategies(problemId: string): ExplorationStrategy[] {
  return STRATEGIES.filter((s) => s.applicableTo.includes(problemId));
}

export async function exploreConjecture(
  problem: Problem,
  session: SessionState,
  llm: LLMProvider,
): Promise<Finding[]> {
  const strategies = getApplicableStrategies(problem.id);
  const findings: Finding[] = [];
  const priorContext = session.findings
    .slice(-20)
    .map((f) => `[${f.agentRole}|${f.category}] ${f.content.slice(0, FALLBACK_TRUNCATION)}`)
    .join("\n");

  for (const strategy of strategies) {
    try {
      const response = await llm.complete({
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt: `You are a research mathematician exploring open conjectures.
Use the ${strategy.name} approach to make progress on the given conjecture.
Be creative but mathematically rigorous. Identify partial results, patterns, and new angles of attack.`,
        userPrompt: `## Conjecture: ${problem.title}

${problem.description}

## Strategy: ${strategy.name}
${strategy.description}

## Prior findings from this session:
${priorContext || "None yet."}

Apply this strategy to the conjecture. Report:
1. Setup: How does this strategy apply?
2. Observations: What patterns emerge?
3. Partial results: Any provable special cases?
4. Obstacles: What blocks further progress?
5. New directions: What should be explored next?

Format key findings as JSON:
\`\`\`json
[
  {"category": "structure|proof_step|gap|insight", "content": "...", "confidence": 0.0-1.0}
]
\`\`\``,
      });

      // Prefix each finding with the strategy name for traceability
      const parsed = parseFindingsFromResponse(response, "constructor", session.iteration);
      for (const f of parsed) {
        f.content = `[${strategy.name}] ${f.content}`;
      }
      findings.push(...parsed);
    } catch (error) {
      findings.push({
        agentRole: "constructor",
        iteration: session.iteration,
        category: "gap",
        content: `[${strategy.name}] Failed: ${error instanceof Error ? error.message : String(error)}`,
        confidence: 0.3,
        timestamp: Date.now(),
      });
    }
  }

  return findings;
}
