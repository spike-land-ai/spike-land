/**
 * @compass/conversation-engine
 *
 * Public API surface for the COMPASS Conversation Engine.
 *
 * Usage:
 *
 *   import {
 *     ConversationManager,
 *     ConversationStateMachine,
 *     InterviewEngine,
 *     Phase,
 *   } from "@compass/conversation-engine";
 */

// ---------------------------------------------------------------------------
// Types (re-exported in full — consumers should import from here, not types.ts)
// ---------------------------------------------------------------------------

export type {
  // Core domain types
  ConversationState,
  ConversationConfig,
  ConversationEvent,
  Message,
  MessageMetadata,
  MessageRole,
  AnswerMap,
  PatienceLevel,
  // Interview types
  InterviewQuestion,
  QuestionType,
  QuestionValidation,
  // RAG types
  RAGContext,
  RAGDocument,
  // User profile
  UserProfile,
  // LLM abstraction
  LLMProvider,
  LLMMessage,
  LLMCompletionOptions,
  LLMCompletionResult,
  // Process navigation
  Process,
  ProcessStep,
} from "./types.js";

export { Phase } from "./types.js";

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------

export {
  ConversationStateMachine,
  TransitionError,
} from "./core-logic/state-machine.js";

// ---------------------------------------------------------------------------
// Interview engine
// ---------------------------------------------------------------------------

export {
  InterviewEngine,
  validateAnswer,
  isQuestionVisible,
  getVisibleQuestions,
  DEFAULT_INTAKE_QUESTIONS,
} from "./core-logic/interview.js";

export type {
  ValidationResult,
  InterviewStartResult,
  InterviewProgressResult,
  InterviewProcessResult,
} from "./core-logic/interview.js";

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

export {
  buildSystemPrompt,
  buildRAGPrompt,
  buildNavigationPrompt,
} from "./core-logic/prompt-builder.js";

// ---------------------------------------------------------------------------
// Conversation manager
// ---------------------------------------------------------------------------

export {
  ConversationManager,
  SessionNotFoundError,
} from "./core-logic/conversation-manager.js";

export type {
  ConversationManagerOptions,
  SessionStore,
  RAGProvider,
} from "./core-logic/conversation-manager.js";
