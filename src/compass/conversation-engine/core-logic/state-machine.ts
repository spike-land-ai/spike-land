/**
 * COMPASS Conversation State Machine
 *
 * Models the legal phase transitions for a COMPASS guidance session.
 * The machine is pure and immutable — every method returns a new state
 * rather than mutating the input.
 */

import { Phase, ConversationEvent, ConversationState } from "../types.js";

// ---------------------------------------------------------------------------
// Transition table
// ---------------------------------------------------------------------------

/**
 * Maps (currentPhase, event.type) → nextPhase.
 *
 * INTAKE → ELIGIBILITY_INTERVIEW
 *       → PROCESS_NAVIGATION        (skip interview for known eligibility)
 *
 * ELIGIBILITY_INTERVIEW → PROCESS_NAVIGATION
 *
 * PROCESS_NAVIGATION → DOCUMENT_HELP
 *                    → RIGHTS_INFO
 *                    → FOLLOW_UP    (navigate straight to closure)
 *
 * DOCUMENT_HELP → FOLLOW_UP
 * RIGHTS_INFO   → FOLLOW_UP
 *
 * FOLLOW_UP → (terminal — only SESSION_END or RESET allowed)
 *
 * Any phase → INTAKE on RESET.
 */
const TRANSITIONS: ReadonlyMap<Phase, ReadonlyMap<ConversationEvent["type"], Phase>> = new Map([
  [
    Phase.INTAKE,
    new Map<ConversationEvent["type"], Phase>([
      ["START_INTERVIEW", Phase.ELIGIBILITY_INTERVIEW],
      ["START_NAVIGATION", Phase.PROCESS_NAVIGATION],
    ]),
  ],
  [
    Phase.ELIGIBILITY_INTERVIEW,
    new Map<ConversationEvent["type"], Phase>([["INTERVIEW_COMPLETE", Phase.PROCESS_NAVIGATION]]),
  ],
  [
    Phase.PROCESS_NAVIGATION,
    new Map<ConversationEvent["type"], Phase>([
      ["REQUEST_DOCUMENT_HELP", Phase.DOCUMENT_HELP],
      ["REQUEST_RIGHTS_INFO", Phase.RIGHTS_INFO],
      ["NAVIGATION_COMPLETE", Phase.FOLLOW_UP],
      ["REQUEST_FOLLOW_UP", Phase.FOLLOW_UP],
    ]),
  ],
  [
    Phase.DOCUMENT_HELP,
    new Map<ConversationEvent["type"], Phase>([
      ["NAVIGATION_COMPLETE", Phase.FOLLOW_UP],
      ["REQUEST_FOLLOW_UP", Phase.FOLLOW_UP],
      ["START_NAVIGATION", Phase.PROCESS_NAVIGATION],
    ]),
  ],
  [
    Phase.RIGHTS_INFO,
    new Map<ConversationEvent["type"], Phase>([
      ["NAVIGATION_COMPLETE", Phase.FOLLOW_UP],
      ["REQUEST_FOLLOW_UP", Phase.FOLLOW_UP],
      ["START_NAVIGATION", Phase.PROCESS_NAVIGATION],
    ]),
  ],
  [
    Phase.FOLLOW_UP,
    new Map<ConversationEvent["type"], Phase>([
      // Terminal phase — no forward transitions.
    ]),
  ],
]);

// ---------------------------------------------------------------------------
// TransitionError
// ---------------------------------------------------------------------------

export class TransitionError extends Error {
  constructor(
    public readonly fromPhase: Phase,
    public readonly event: ConversationEvent["type"],
  ) {
    super(
      `No transition from phase "${fromPhase}" on event "${event}". ` +
        `Available events: ${[...ConversationStateMachine.getAvailableTransitions(fromPhase).keys()].join(", ") || "none"}.`,
    );
    this.name = "TransitionError";
  }
}

// ---------------------------------------------------------------------------
// ConversationStateMachine
// ---------------------------------------------------------------------------

export class ConversationStateMachine {
  /**
   * Apply an event to the current state and return the updated state.
   * Throws TransitionError if the transition is not valid.
   *
   * The RESET event is universally allowed — it returns the state back to
   * INTAKE regardless of the current phase.
   */
  static transition(state: ConversationState, event: ConversationEvent): ConversationState {
    if (event.type === "SESSION_END") {
      // SESSION_END is a meta-event that does not change the phase but signals
      // to the session manager that the session should be archived.
      return {
        ...state,
        updatedAt: new Date().toISOString(),
      };
    }

    if (event.type === "RESET") {
      return {
        ...state,
        currentPhase: Phase.INTAKE,
        answers: {},
        currentQuestionIndex: 0,
        history: [],
        updatedAt: new Date().toISOString(),
      };
    }

    const nextPhase = TRANSITIONS.get(state.currentPhase)?.get(event.type);

    if (nextPhase === undefined) {
      throw new TransitionError(state.currentPhase, event.type);
    }

    return {
      ...state,
      currentPhase: nextPhase,
      // Reset question index when entering a new interview phase.
      currentQuestionIndex:
        nextPhase === Phase.ELIGIBILITY_INTERVIEW ? 0 : state.currentQuestionIndex,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Return the full transition map for a given phase.
   * Callers can iterate entries to show available actions in a UI.
   */
  static getAvailableTransitions(phase: Phase): ReadonlyMap<ConversationEvent["type"], Phase> {
    return TRANSITIONS.get(phase) ?? new Map();
  }

  /**
   * Check whether a given event is valid from the current phase.
   */
  static canTransition(state: ConversationState, event: ConversationEvent): boolean {
    if (event.type === "RESET" || event.type === "SESSION_END") return true;
    return TRANSITIONS.get(state.currentPhase)?.has(event.type) ?? false;
  }

  /**
   * Return all phases reachable from the given phase (direct neighbours only).
   */
  static reachablePhases(phase: Phase): Phase[] {
    return [...(TRANSITIONS.get(phase)?.values() ?? [])];
  }

  /**
   * True if the phase has no forward transitions (i.e. it is terminal).
   */
  static isTerminal(phase: Phase): boolean {
    return (TRANSITIONS.get(phase)?.size ?? 0) === 0;
  }
}
