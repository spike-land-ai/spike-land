import type { SplitPrompt, UserMemory } from "./types.js";

const STABLE_PREFIX = `You are Spike, an AI assistant on the spike.land platform.

## Identity
- You are helpful, direct, and technically sharp.
- You speak concisely — no filler, no hedging.
- When uncertain, you say so. When confident, you act.

## Values
- Truth over comfort: never fabricate facts or hallucinate references.
- Usefulness over impressiveness: solve the user's actual problem.
- Memory over repetition: use stored notes to avoid re-asking.

## Memory System
You have access to a Bayesian memory system. Notes from past conversations
are injected below when relevant. Each note has a confidence score (0-1).
Trust high-confidence notes. Be skeptical of low-confidence ones.

## Tool Usage
When you have access to tools, use them proactively:
- Don't ask "should I search?" — just search.
- Don't ask "should I run this?" — run it and report.
- Chain tools when needed. Report results clearly.

## Response Style
- Lead with the answer, then explain if needed.
- Use code blocks for code. Use bullet points for lists.
- Keep responses under 500 words unless the task requires more.`;

/**
 * Build the Aether system prompt from stable prefix + dynamic user state.
 * The stable prefix never changes (maximises KV-cache hits on the LLM side).
 * The dynamic suffix is pruned to fit within ~800 tokens.
 */
export function buildAetherSystemPrompt(userState: UserMemory): SplitPrompt {
  const dynamicParts: string[] = [];

  if (userState.lifeSummary.trim()) {
    dynamicParts.push(`## About This User\n${userState.lifeSummary.trim()}`);
  }

  if (userState.currentGoals.length > 0) {
    const goalsList = userState.currentGoals.map((g) => `- ${g}`).join("\n");
    dynamicParts.push(`## Current Goals\n${goalsList}`);
  }

  if (userState.notes.length > 0) {
    const noteLines = userState.notes
      .map((n) => `- [${n.confidence.toFixed(2)}] When "${n.trigger}" → ${n.lesson}`)
      .join("\n");
    dynamicParts.push(`## Memory Notes\n${noteLines}`);
  }

  const dynamicSuffix = dynamicParts.join("\n\n");

  return { stablePrefix: STABLE_PREFIX, dynamicSuffix };
}

/**
 * Build the classification prompt for stage 1.
 */
export function buildClassifyPrompt(): string {
  return `You are a message classifier. Analyze the user's message and respond with ONLY a JSON object:
{
  "intent": "question" | "task" | "conversation" | "feedback",
  "domain": string,
  "urgency": "low" | "medium" | "high",
  "suggestedTools": string[]
}
Do not include any text outside the JSON object.`;
}

/**
 * Build the planning prompt for stage 2.
 */
export function buildPlanPrompt(classifiedIntent: string, availableTools: string[]): string {
  return `You are a response planner. Given the classified intent and available tools, produce a response plan.

## Classified Intent
${classifiedIntent}

## Available Tools
${availableTools.length > 0 ? availableTools.map((t) => `- ${t}`).join("\n") : "No tools available."}

Respond with ONLY a JSON object:
{
  "plan": "brief description of how to respond",
  "suggestedTools": string[],
  "confidence": number
}
Do not include any text outside the JSON object.`;
}

/**
 * Build the note extraction prompt for stage 4.
 */
export function buildExtractPrompt(): string {
  return `You are a memory extraction system. Given a user message and assistant response,
determine if there is a reusable lesson worth remembering.

If yes, respond with ONLY a JSON object:
{
  "trigger": "short description of when this note is relevant",
  "lesson": "the reusable insight or preference",
  "confidence": number between 0.3 and 0.7
}

If no useful lesson, respond with: null

Do not include any text outside the JSON or null.`;
}
