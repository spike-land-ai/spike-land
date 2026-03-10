/**
 * COMPASS Prompt Builder
 *
 * Constructs LLM prompts that embody COMPASS's core values:
 *  - Radically patient: never rushes, re-explains without complaint.
 *  - Non-judgmental: no assumptions about why someone needs help.
 *  - Accuracy over speed: cite sources, flag uncertainty, never guess at
 *    legal facts.
 *  - Accessible: plain language, no jargon unless defined, short sentences.
 */

import {
  ConversationConfig,
  PatienceLevel,
  Phase,
  Process,
  ProcessStep,
  RAGContext,
} from "../types.js";

// ---------------------------------------------------------------------------
// Patience personality snippets
// ---------------------------------------------------------------------------

const PATIENCE_TONE: Record<PatienceLevel, string> = {
  standard: "Take your time. It is perfectly fine to ask me to repeat or rephrase anything.",
  high:
    "There is no rush. If something is confusing, just tell me and I will explain it " +
    "a different way — as many times as you need.",
  maximum:
    "We will go at whatever pace works for you. There are no stupid questions, and " +
    "you will never be judged for needing more time or more explanation. I am here " +
    "for as long as you need me. Just say 'say that again' or 'I don't understand' " +
    "at any point and I will try a completely fresh approach.",
};

// ---------------------------------------------------------------------------
// Phase-specific focus instructions
// ---------------------------------------------------------------------------

const PHASE_FOCUS: Record<Phase, string> = {
  [Phase.INTAKE]:
    "You are in the initial intake phase. Your goal is to greet the person " +
    "warmly, explain what COMPASS can help with, and set expectations about " +
    "the questions you will ask. Do not ask for information yet.",

  [Phase.ELIGIBILITY_INTERVIEW]:
    "You are conducting an eligibility interview. Ask only the current question. " +
    "Do not ask multiple questions at once. If the person asks why a question is " +
    "being asked, explain briefly and reassure them that all information is " +
    "handled with care.",

  [Phase.PROCESS_NAVIGATION]:
    "You are guiding the person through a bureaucratic process step by step. " +
    "Focus on one step at a time. Confirm understanding before moving to the " +
    "next step. Flag anything that is time-sensitive.",

  [Phase.DOCUMENT_HELP]:
    "You are helping the person understand, locate, or prepare documents. " +
    "Use plain language to describe what each document is and why it is needed. " +
    "If a document might be hard to obtain, explain alternatives.",

  [Phase.RIGHTS_INFO]:
    "You are explaining the person's rights. Be clear and factual. " +
    "Always cite the source of the right (law, regulation, policy). " +
    "If you are unsure, say so explicitly — never speculate about legal rights.",

  [Phase.FOLLOW_UP]:
    "You are wrapping up the session. Summarise what was covered, " +
    "confirm any next steps the person needs to take, and offer " +
    "to answer any remaining questions before closing.",
};

// ---------------------------------------------------------------------------
// Core system prompt builder
// ---------------------------------------------------------------------------

/**
 * Build the base system prompt injected at the start of every LLM call.
 *
 * The prompt is structured as:
 *   1. Identity & mission
 *   2. Behavioural principles (patience, accuracy, non-judgment)
 *   3. Language / accessibility rules
 *   4. Phase-specific focus
 *   5. Any caller-supplied system prompt override / extension
 */
export function buildSystemPrompt(
  config: ConversationConfig,
  phase: Phase,
  additionalContext?: string,
): string {
  const patience = PATIENCE_TONE[config.patience];
  const phaseFocus = PHASE_FOCUS[phase];
  const languageNote =
    config.language && config.language !== "en-US"
      ? `\nRespond in the language matching the locale "${config.language}". ` +
        `If the user writes in a different language, respond in that language.`
      : "";

  const sections: string[] = [
    // 1. Identity
    "You are COMPASS, an AI assistant that helps people navigate bureaucratic " +
      "processes such as government benefits, immigration paperwork, housing " +
      "applications, and legal aid referrals.",

    // 2. Core principles
    [
      "## Your core principles",
      "",
      "- **Radically patient.** " + patience,
      "- **Never judgmental.** You do not judge why someone needs help, " +
        "their past choices, their documentation status, or their ability " +
        "to understand. Treat every person with equal dignity.",
      "- **Accuracy over speed.** If you are unsure of a fact, say so clearly. " +
        'Use phrases like "I believe…" or "You should confirm this with…" ' +
        "rather than presenting uncertain information as definitive. " +
        "For legal or regulatory facts, always cite the source.",
      "- **Plain language.** Use short sentences. Avoid jargon. When you must " +
        "use a technical term, define it immediately in parentheses.",
      "- **One thing at a time.** Ask only one question per turn. " +
        "Give instructions one step at a time.",
    ].join("\n"),

    // 3. Language
    `## Language${languageNote || " (English)"}`,

    // 4. Phase focus
    "## Current focus\n\n" + phaseFocus,
  ];

  // 5. Caller extension
  if (config.systemPrompt && config.systemPrompt.trim()) {
    sections.push("## Additional guidance\n\n" + config.systemPrompt.trim());
  }

  if (additionalContext && additionalContext.trim()) {
    sections.push("## Session context\n\n" + additionalContext.trim());
  }

  return sections.join("\n\n");
}

// ---------------------------------------------------------------------------
// RAG prompt builder
// ---------------------------------------------------------------------------

/**
 * Build a user-turn prompt that injects retrieved documents before the query.
 *
 * Format:
 *   [RETRIEVED CONTEXT]
 *   ...documents...
 *   [END CONTEXT]
 *
 *   User question: <query>
 *
 * The model is instructed to prefer the provided context over its parametric
 * knowledge and to cite document IDs inline.
 */
export function buildRAGPrompt(query: string, ragContext: RAGContext): string {
  if (ragContext.documents.length === 0) {
    return query;
  }

  const documentBlocks = ragContext.documents.map((doc, i) => {
    const score = ragContext.relevanceScores[i];
    const scoreNote = score !== undefined ? ` (relevance: ${(score * 100).toFixed(0)}%)` : "";
    const dateNote = doc.date ? ` — published ${doc.date}` : "";
    const sectionNote = doc.section ? `, §${doc.section}` : "";

    const header = `[DOC:${doc.id}] ${doc.title}${sectionNote}${dateNote}${scoreNote}`;
    const source = `Source: ${doc.source}`;
    return `${header}\n${source}\n\n${doc.content}`;
  });

  const contextBlock =
    "[RETRIEVED CONTEXT]\n\n" + documentBlocks.join("\n\n---\n\n") + "\n\n[END CONTEXT]";

  const instruction =
    "Using the retrieved context above as your primary source:\n" +
    "- Prefer information from the documents over your general knowledge.\n" +
    "- Cite documents by their ID (e.g. [DOC:abc123]) when referencing them.\n" +
    "- If the documents do not contain enough information to answer fully, " +
    "say so clearly and indicate what additional sources the person should consult.\n" +
    "- Do not invent facts not present in the documents or your verified knowledge.";

  return [contextBlock, instruction, `User question: ${query}`].join("\n\n");
}

// ---------------------------------------------------------------------------
// Navigation prompt builder
// ---------------------------------------------------------------------------

/**
 * Build a prompt that presents a single process step in a clear,
 * actionable format.
 *
 * @param process         The full process being navigated.
 * @param currentStep     The step the user is currently on.
 * @param userContext     Free-text summary of what we know about the user
 *                        (e.g. eligibility notes, collected profile fields).
 */
export function buildNavigationPrompt(
  process: Process,
  currentStep: ProcessStep,
  userContext: string,
): string {
  const totalSteps = process.steps.length;
  const stepLabel = `Step ${currentStep.stepNumber} of ${totalSteps}`;
  const progressBar = buildProgressBar(currentStep.stepNumber, totalSteps);

  const parts: string[] = [
    `## ${process.name}\n${process.description}`,
    `### ${stepLabel}  ${progressBar}`,
    `**${currentStep.title}**`,
    currentStep.description,
  ];

  if (currentStep.requiredDocuments && currentStep.requiredDocuments.length > 0) {
    parts.push(
      "**Documents you will need:**\n" +
        currentStep.requiredDocuments.map((d) => `- ${d}`).join("\n"),
    );
  }

  if (currentStep.estimatedTime) {
    parts.push(`**Estimated time:** ${currentStep.estimatedTime}`);
  }

  if (currentStep.warnings && currentStep.warnings.length > 0) {
    parts.push("**Important warnings:**\n" + currentStep.warnings.map((w) => `⚠ ${w}`).join("\n"));
  }

  if (currentStep.tips && currentStep.tips.length > 0) {
    parts.push("**Helpful tips:**\n" + currentStep.tips.map((t) => `• ${t}`).join("\n"));
  }

  if (userContext.trim()) {
    parts.push("**About this person:**\n" + userContext.trim());
  }

  parts.push(
    "Present this step to the person in plain language. " +
      "Confirm they understand before asking if they are ready for the next step. " +
      "If they have questions about this step, answer them before moving on.",
  );

  return parts.join("\n\n");
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildProgressBar(current: number, total: number): string {
  const filled = Math.round((current / total) * 10);
  const empty = 10 - filled;
  return `[${"█".repeat(filled)}${"░".repeat(empty)}] ${current}/${total}`;
}
