/**
 * COMPASS Conversation Engine — Core Types
 *
 * Shared type definitions for guided interviews, navigation Q&A,
 * and step-by-step bureaucratic process guidance.
 */

// ---------------------------------------------------------------------------
// Phase
// ---------------------------------------------------------------------------

export enum Phase {
  /** Initial intake: collect basic identity and situational context. */
  INTAKE = "INTAKE",
  /** Structured interview to determine eligibility for a benefit or process. */
  ELIGIBILITY_INTERVIEW = "ELIGIBILITY_INTERVIEW",
  /** Walk the user step-by-step through a specific process. */
  PROCESS_NAVIGATION = "PROCESS_NAVIGATION",
  /** Help the user understand, find, or prepare documents. */
  DOCUMENT_HELP = "DOCUMENT_HELP",
  /** Explain the user's legal or procedural rights. */
  RIGHTS_INFO = "RIGHTS_INFO",
  /** Closing phase: confirm completion, offer next steps, schedule reminders. */
  FOLLOW_UP = "FOLLOW_UP",
}

// ---------------------------------------------------------------------------
// Message
// ---------------------------------------------------------------------------

export type MessageRole = "user" | "assistant" | "system";

export interface MessageMetadata {
  /** Phase active when this message was produced. */
  phase?: Phase;
  /** Unique identifier of the interview question this message answers. */
  questionId?: string;
  /** Source document identifiers referenced by this message. */
  sourceIds?: string[];
  /** True when the message was generated from RAG retrieval. */
  ragEnriched?: boolean;
  /** Raw token counts for cost tracking (populated by LLMProvider). */
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface Message {
  readonly id: string;
  readonly role: MessageRole;
  readonly content: string;
  readonly timestamp: Date;
  readonly metadata: MessageMetadata;
}

// ---------------------------------------------------------------------------
// ConversationState
// ---------------------------------------------------------------------------

/** Answers collected during the interview keyed by question field name. */
export type AnswerMap = Record<string, string | number | Date | string[]>;

export interface ConversationState {
  readonly sessionId: string;
  readonly userId: string;
  readonly currentPhase: Phase;
  /** Arbitrary context bag shared across phases (process ID, locale, etc.). */
  readonly context: Record<string, unknown>;
  /** Full ordered message history for this session. */
  readonly history: Message[];
  /** Interview answers collected so far. */
  readonly answers: AnswerMap;
  /** Index of the current interview question within the active question list. */
  readonly currentQuestionIndex: number;
  /** ISO timestamp when the session was created. */
  readonly createdAt: string;
  /** ISO timestamp of the last state mutation. */
  readonly updatedAt: string;
}

// ---------------------------------------------------------------------------
// InterviewQuestion
// ---------------------------------------------------------------------------

export type QuestionType = "text" | "choice" | "number" | "date";

export interface QuestionValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  /** Human-readable error message shown when validation fails. */
  errorMessage?: string;
}

export interface InterviewQuestion {
  /** Unique stable identifier for this question (e.g. "income_monthly"). */
  readonly id: string;
  /** The plain-language question text shown to the user. */
  readonly text: string;
  /** The key under which the answer is stored in AnswerMap. */
  readonly field: string;
  readonly type: QuestionType;
  /** Available choices for "choice" type questions. */
  readonly options?: string[];
  readonly validation?: QuestionValidation;
  /** Optional clarifying hint shown below the question. */
  readonly hint?: string;
  /** Follow-up questions that are only relevant given a specific answer. */
  readonly conditionalOn?: {
    field: string;
    value: string | number;
  };
}

// ---------------------------------------------------------------------------
// ConversationConfig
// ---------------------------------------------------------------------------

/**
 * Patience level controls retry tolerance, simpler language, and the number
 * of additional clarifying exchanges allowed before escalating.
 */
export type PatienceLevel = "standard" | "high" | "maximum";

export interface ConversationConfig {
  /**
   * Base system prompt injected at the start of every LLM call.
   * Will be augmented with RAG context and phase-specific instructions.
   */
  readonly systemPrompt: string;
  /** Hard cap on the number of turns before the session is auto-closed. */
  readonly maxTurns: number;
  /** BCP-47 language tag (e.g. "en-US", "es-MX"). */
  readonly language: string;
  readonly patience: PatienceLevel;
  /** Identifier for the question set / interview script to use. */
  readonly interviewScriptId?: string;
  /** Identifier for the process the user is navigating. */
  readonly processId?: string;
}

// ---------------------------------------------------------------------------
// RAGContext
// ---------------------------------------------------------------------------

export interface RAGDocument {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  /** Source URL, file path, or citation reference. */
  readonly source: string;
  /** Section or chapter within the source, if applicable. */
  readonly section?: string;
  /** Publication or last-updated date (ISO string). */
  readonly date?: string;
}

export interface RAGContext {
  readonly documents: RAGDocument[];
  /** Cosine similarity or BM25 scores in the same order as documents. */
  readonly relevanceScores: number[];
  /** Human-readable citation labels, one per document. */
  readonly sources: string[];
  /** The original query that produced this retrieval result. */
  readonly query: string;
}

// ---------------------------------------------------------------------------
// UserProfile (partial — built up through the interview)
// ---------------------------------------------------------------------------

export interface UserProfile {
  readonly userId: string;
  readonly age?: number;
  readonly householdSize?: number;
  readonly monthlyIncome?: number;
  readonly citizenshipStatus?: string;
  readonly residenceState?: string;
  readonly employmentStatus?: string;
  /** Additional domain-specific fields collected during the interview. */
  readonly additionalFields: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// LLMProvider contract
// ---------------------------------------------------------------------------

export interface LLMMessage {
  role: MessageRole;
  content: string;
}

export interface LLMCompletionOptions {
  /** Sampling temperature (0–1). Lower = more deterministic. */
  temperature?: number;
  /** Maximum tokens to generate. */
  maxTokens?: number;
  /** Stop sequences. */
  stop?: string[];
}

export interface LLMCompletionResult {
  content: string;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Model name or version used for this completion (for audit). */
  model: string;
}

/**
 * LLMProvider is the abstraction boundary for all language-model calls.
 * Implementations may wrap OpenAI, Anthropic, a local model, or a mock.
 */
export interface LLMProvider {
  complete(messages: LLMMessage[], options?: LLMCompletionOptions): Promise<LLMCompletionResult>;
}

// ---------------------------------------------------------------------------
// Session event types (used by the state machine)
// ---------------------------------------------------------------------------

export type ConversationEvent =
  | { type: "START_INTERVIEW" }
  | { type: "INTERVIEW_COMPLETE" }
  | { type: "START_NAVIGATION" }
  | { type: "REQUEST_DOCUMENT_HELP" }
  | { type: "REQUEST_RIGHTS_INFO" }
  | { type: "NAVIGATION_COMPLETE" }
  | { type: "REQUEST_FOLLOW_UP" }
  | { type: "SESSION_END" }
  | { type: "RESET" };

// ---------------------------------------------------------------------------
// Process navigation types
// ---------------------------------------------------------------------------

export interface ProcessStep {
  readonly stepNumber: number;
  readonly title: string;
  readonly description: string;
  readonly requiredDocuments?: string[];
  readonly estimatedTime?: string;
  readonly warnings?: string[];
  readonly tips?: string[];
}

export interface Process {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly steps: ProcessStep[];
  readonly totalEstimatedTime?: string;
  readonly eligibilityNotes?: string;
}
