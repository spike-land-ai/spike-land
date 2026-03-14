/**
 * Math Engine — Convergence Prover (Gap 1)
 *
 * Addresses the convergence proof gap: S_{t+1} = U(S_t, V(D(S_t)))
 * Strategies: contraction mapping, Jacobian spectral radius, Lyapunov functions.
 */

import type { Finding, LLMProvider, Problem, SessionState } from "./types.js";
import { FALLBACK_TRUNCATION, parseFindingsFromResponse } from "./parse-utils.js";

const CONVERGENCE_STRATEGIES = [
  {
    name: "Contraction Mapping",
    description: `Attempt to show the composed operator T = U ∘ V ∘ D is a contraction
on a complete metric space (X, d). Need: d(T(x), T(y)) ≤ k·d(x,y) for some k < 1.
Check: Lipschitz constants of each component compose multiplicatively.`,
    systemPrompt: `You are analyzing a self-referential system S_{t+1} = U(S_t, V(D(S_t)))
for contraction mapping properties. Determine if the composed operator is a contraction.
Consider: What metric space? What are the Lipschitz constants? Does Banach fixed-point apply?`,
  },
  {
    name: "Jacobian Spectral Radius",
    description: `Compute the Jacobian J of the map T at candidate fixed points.
If spectral radius ρ(J) < 1, the fixed point is locally asymptotically stable.
Check: eigenvalue computation, Gershgorin circles, matrix norm bounds.`,
    systemPrompt: `Analyze the Jacobian matrix of the operator T = U ∘ V ∘ D at candidate fixed points.
Compute or bound the spectral radius. Use chain rule for composed maps.
Consider: Is the linearization valid? What about non-differentiable points?`,
  },
  {
    name: "Lyapunov Function",
    description: `Construct a Lyapunov function V(S) that is:
(a) positive definite, (b) strictly decreasing: V(T(S)) < V(S) for S ≠ S*,
(c) V(S*) = 0 at the fixed point. Common choices: quadratic, entropy-based.`,
    systemPrompt: `Construct a Lyapunov function for the dynamical system S_{t+1} = T(S_t).
The function must be positive definite and strictly decrease along trajectories.
Consider: quadratic forms, entropy/KL-divergence, energy functions.`,
  },
];

export function getConvergenceStrategies(): Array<{ name: string; description: string }> {
  return CONVERGENCE_STRATEGIES.map((s) => ({ name: s.name, description: s.description }));
}

export async function analyzeConvergence(
  problem: Problem,
  session: SessionState,
  llm: LLMProvider,
): Promise<Finding[]> {
  const findings: Finding[] = [];
  const priorContext = session.findings
    .filter((f) => f.category === "proof_step" || f.category === "counterexample")
    .slice(-20)
    .map((f) => `[${f.agentRole}] ${f.content.slice(0, FALLBACK_TRUNCATION)}`)
    .join("\n");

  for (const strategy of CONVERGENCE_STRATEGIES) {
    try {
      const response = await llm.complete({
        temperature: 0.1,
        maxTokens: 2000,
        systemPrompt: strategy.systemPrompt,
        userPrompt: `Problem: ${problem.description}

Strategy: ${strategy.name} — ${strategy.description}

Prior findings:
${priorContext || "None yet."}

Analyze whether this convergence strategy can work. Provide:
1. The precise mathematical setup
2. Whether the conditions are met (with justification)
3. Any obstacles or counterexamples
4. Confidence level (0-1)

Format findings as JSON:
\`\`\`json
[{"category": "proof_step|counterexample|gap|insight", "content": "...", "confidence": 0.0-1.0}]
\`\`\``,
      });

      const parsed = parseFindingsFromResponse(response, "analyst", session.iteration);
      findings.push(...parsed);
    } catch (error) {
      findings.push({
        agentRole: "analyst",
        iteration: session.iteration,
        category: "gap",
        content: `Strategy "${strategy.name}" failed: ${error instanceof Error ? error.message : String(error)}`,
        confidence: 0.3,
        timestamp: Date.now(),
      });
    }
  }

  return findings;
}
