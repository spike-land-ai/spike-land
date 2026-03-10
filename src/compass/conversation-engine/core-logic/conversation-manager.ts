/**
 * COMPASS Conversation Manager
 *
 * Orchestrates the full session lifecycle:
 *   createSession → handleMessage* → endSession
 *
 * The manager is designed to work with any LLMProvider implementation.
 * It does not dictate how the LLM is called — that is the provider's
 * responsibility.
 *
 * Concurrency model: sessions are stored in-memory by default.
 * Production deployments should replace the in-memory store with a
 * persistent adapter (D1, KV, Postgres) via the optional SessionStore
 * interface.
 */

import {
  AnswerMap,
  ConversationConfig,
  ConversationEvent,
  ConversationState,
  LLMMessage,
  LLMProvider,
  Message,
  MessageMetadata,
  Phase,
  RAGContext,
} from "../types.js";
import { ConversationStateMachine } from "./state-machine.js";
import { buildRAGPrompt, buildSystemPrompt } from "./prompt-builder.js";

// ---------------------------------------------------------------------------
// ID generation (no external deps)
// ---------------------------------------------------------------------------

function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 9);
  return `${timestamp}-${random}`;
}

// ---------------------------------------------------------------------------
// SessionStore interface
// ---------------------------------------------------------------------------

/** Optional persistence adapter. Defaults to in-memory. */
export interface SessionStore {
  get(sessionId: string): Promise<ConversationState | undefined>;
  set(sessionId: string, state: ConversationState): Promise<void>;
  delete(sessionId: string): Promise<void>;
  listActive(): Promise<string[]>;
}

class InMemorySessionStore implements SessionStore {
  private readonly store = new Map<string, ConversationState>();

  async get(sessionId: string): Promise<ConversationState | undefined> {
    return this.store.get(sessionId);
  }

  async set(sessionId: string, state: ConversationState): Promise<void> {
    this.store.set(sessionId, state);
  }

  async delete(sessionId: string): Promise<void> {
    this.store.delete(sessionId);
  }

  async listActive(): Promise<string[]> {
    return [...this.store.keys()];
  }
}

// ---------------------------------------------------------------------------
// RAGProvider interface (optional enrichment)
// ---------------------------------------------------------------------------

/**
 * Optional retrieval adapter. When provided, relevant documents are
 * fetched before each LLM call and injected into the prompt.
 */
export interface RAGProvider {
  retrieve(query: string, context: ConversationState): Promise<RAGContext>;
}

// ---------------------------------------------------------------------------
// ConversationManagerOptions
// ---------------------------------------------------------------------------

export interface ConversationManagerOptions {
  llm: LLMProvider;
  rag?: RAGProvider;
  store?: SessionStore;
}

// ---------------------------------------------------------------------------
// SessionNotFoundError
// ---------------------------------------------------------------------------

export class SessionNotFoundError extends Error {
  constructor(public readonly sessionId: string) {
    super(`Session "${sessionId}" not found. It may have expired or never existed.`);
    this.name = "SessionNotFoundError";
  }
}

// ---------------------------------------------------------------------------
// ConversationManager
// ---------------------------------------------------------------------------

export class ConversationManager {
  private readonly llm: LLMProvider;
  private readonly rag: RAGProvider | undefined;
  private readonly store: SessionStore;

  constructor(options: ConversationManagerOptions) {
    this.llm = options.llm;
    this.rag = options.rag;
    this.store = options.store ?? new InMemorySessionStore();
  }

  // -------------------------------------------------------------------------
  // Session lifecycle
  // -------------------------------------------------------------------------

  /**
   * Create a new session and return the initial greeting message.
   */
  async createSession(
    userId: string,
    config: ConversationConfig,
  ): Promise<{ sessionId: string; greeting: Message }> {
    const sessionId = generateId();
    const now = new Date().toISOString();

    const initialState: ConversationState = {
      sessionId,
      userId,
      currentPhase: Phase.INTAKE,
      context: { config },
      history: [],
      answers: {} as AnswerMap,
      currentQuestionIndex: 0,
      createdAt: now,
      updatedAt: now,
    };

    await this.store.set(sessionId, initialState);

    // Generate the greeting using the LLM
    const systemPrompt = buildSystemPrompt(config, Phase.INTAKE);
    const result = await this.llm.complete([{ role: "system", content: systemPrompt }], {
      temperature: 0.4,
      maxTokens: 512,
    });

    const greeting = this.makeMessage("assistant", result.content, {
      phase: Phase.INTAKE,
      ragEnriched: false,
      tokenUsage: result.tokenUsage,
    });

    // Persist the greeting in history
    const updatedState: ConversationState = {
      ...initialState,
      history: [greeting],
      updatedAt: new Date().toISOString(),
    };
    await this.store.set(sessionId, updatedState);

    return { sessionId, greeting };
  }

  /**
   * Handle an incoming user message and return the assistant's response.
   *
   * Flow:
   *   1. Load session state
   *   2. Append user message to history
   *   3. Optionally retrieve RAG context
   *   4. Build the full message list for the LLM
   *   5. Call the LLM
   *   6. Append assistant message to history
   *   7. Persist updated state
   *   8. Return assistant message
   */
  async handleMessage(sessionId: string, userContent: string): Promise<Message> {
    const state = await this.requireSession(sessionId);
    const config = state.context["config"] as ConversationConfig;

    if (state.history.length >= config.maxTurns * 2) {
      return this.makeMessage(
        "assistant",
        "This session has reached its maximum length. Please start a new session to continue.",
        { phase: state.currentPhase },
      );
    }

    // 1. Append user message
    const userMessage = this.makeMessage("user", userContent, {
      phase: state.currentPhase,
    });

    let currentState: ConversationState = {
      ...state,
      history: [...state.history, userMessage],
      updatedAt: new Date().toISOString(),
    };

    // 2. Optionally retrieve RAG context
    let ragContext: RAGContext | undefined;
    let enrichedUserContent = userContent;

    if (this.rag) {
      try {
        ragContext = await this.rag.retrieve(userContent, currentState);
        if (ragContext.documents.length > 0) {
          enrichedUserContent = buildRAGPrompt(userContent, ragContext);
        }
      } catch {
        // RAG failure is non-fatal — degrade gracefully
        ragContext = undefined;
      }
    }

    // 3. Build LLM message list
    const systemPrompt = buildSystemPrompt(config, currentState.currentPhase);
    const llmMessages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      ...currentState.history.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: enrichedUserContent },
    ];

    // 4. Call LLM
    const result = await this.llm.complete(llmMessages, {
      temperature: 0.3,
      maxTokens: 1024,
    });

    // 5. Assemble assistant message
    const ragEnriched = (ragContext?.documents.length ?? 0) > 0;
    const sourceIds = ragContext?.documents.map((d) => d.id);
    const assistantMessage = this.makeMessage("assistant", result.content, {
      phase: currentState.currentPhase,
      ragEnriched,
      tokenUsage: result.tokenUsage,
      ...(sourceIds !== undefined ? { sourceIds } : {}),
    });

    // 6. Persist
    const finalState: ConversationState = {
      ...currentState,
      history: [...currentState.history, assistantMessage],
      updatedAt: new Date().toISOString(),
    };
    await this.store.set(sessionId, finalState);

    return assistantMessage;
  }

  /**
   * Manually trigger a phase transition.
   * Useful when the host application knows from external signals (e.g. the
   * eligibility engine completing) that the phase should advance.
   */
  async applyEvent(sessionId: string, event: ConversationEvent): Promise<ConversationState> {
    const state = await this.requireSession(sessionId);
    const newState = ConversationStateMachine.transition(state, event);
    await this.store.set(sessionId, newState);
    return newState;
  }

  // -------------------------------------------------------------------------
  // Read-only accessors
  // -------------------------------------------------------------------------

  async getHistory(sessionId: string): Promise<Message[]> {
    const state = await this.requireSession(sessionId);
    return [...state.history];
  }

  async getState(sessionId: string): Promise<ConversationState> {
    return this.requireSession(sessionId);
  }

  async listActiveSessions(): Promise<string[]> {
    return this.store.listActive();
  }

  // -------------------------------------------------------------------------
  // Session termination
  // -------------------------------------------------------------------------

  /**
   * End a session cleanly. Returns the final message history.
   */
  async endSession(sessionId: string): Promise<Message[]> {
    const state = await this.requireSession(sessionId);
    const history = [...state.history];
    await this.store.delete(sessionId);
    return history;
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private async requireSession(sessionId: string): Promise<ConversationState> {
    const state = await this.store.get(sessionId);
    if (!state) throw new SessionNotFoundError(sessionId);
    return state;
  }

  private makeMessage(
    role: "user" | "assistant" | "system",
    content: string,
    metadata: MessageMetadata = {},
  ): Message {
    return {
      id: generateId(),
      role,
      content,
      timestamp: new Date(),
      metadata,
    };
  }
}
