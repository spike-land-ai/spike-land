import { describe, it, expect } from "vitest";
import { ConversationStateMachine, TransitionError } from "../core-logic/state-machine.js";
import type { ConversationState, ConversationEvent, AnswerMap } from "../types.js";
import { Phase } from "../types.js";

// ---------------------------------------------------------------------------
// Test fixture helpers
// ---------------------------------------------------------------------------

function makeState(phase: Phase): ConversationState {
  const now = new Date().toISOString();
  return {
    sessionId: "test-session",
    userId: "test-user",
    currentPhase: phase,
    context: {},
    history: [],
    answers: {} as AnswerMap,
    currentQuestionIndex: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function event(type: ConversationEvent["type"]): ConversationEvent {
  return { type } as ConversationEvent;
}

// ---------------------------------------------------------------------------
// Phase transition tests
// ---------------------------------------------------------------------------

describe("ConversationStateMachine.transition", () => {
  it("transitions INTAKE → ELIGIBILITY_INTERVIEW on START_INTERVIEW", () => {
    const state = makeState(Phase.INTAKE);
    const next = ConversationStateMachine.transition(state, event("START_INTERVIEW"));
    expect(next.currentPhase).toBe(Phase.ELIGIBILITY_INTERVIEW);
  });

  it("transitions INTAKE → PROCESS_NAVIGATION on START_NAVIGATION", () => {
    const state = makeState(Phase.INTAKE);
    const next = ConversationStateMachine.transition(state, event("START_NAVIGATION"));
    expect(next.currentPhase).toBe(Phase.PROCESS_NAVIGATION);
  });

  it("transitions ELIGIBILITY_INTERVIEW → PROCESS_NAVIGATION on INTERVIEW_COMPLETE", () => {
    const state = makeState(Phase.ELIGIBILITY_INTERVIEW);
    const next = ConversationStateMachine.transition(state, event("INTERVIEW_COMPLETE"));
    expect(next.currentPhase).toBe(Phase.PROCESS_NAVIGATION);
  });

  it("transitions PROCESS_NAVIGATION → DOCUMENT_HELP on REQUEST_DOCUMENT_HELP", () => {
    const state = makeState(Phase.PROCESS_NAVIGATION);
    const next = ConversationStateMachine.transition(state, event("REQUEST_DOCUMENT_HELP"));
    expect(next.currentPhase).toBe(Phase.DOCUMENT_HELP);
  });

  it("transitions PROCESS_NAVIGATION → RIGHTS_INFO on REQUEST_RIGHTS_INFO", () => {
    const state = makeState(Phase.PROCESS_NAVIGATION);
    const next = ConversationStateMachine.transition(state, event("REQUEST_RIGHTS_INFO"));
    expect(next.currentPhase).toBe(Phase.RIGHTS_INFO);
  });

  it("transitions PROCESS_NAVIGATION → FOLLOW_UP on NAVIGATION_COMPLETE", () => {
    const state = makeState(Phase.PROCESS_NAVIGATION);
    const next = ConversationStateMachine.transition(state, event("NAVIGATION_COMPLETE"));
    expect(next.currentPhase).toBe(Phase.FOLLOW_UP);
  });

  it("transitions DOCUMENT_HELP → FOLLOW_UP on NAVIGATION_COMPLETE", () => {
    const state = makeState(Phase.DOCUMENT_HELP);
    const next = ConversationStateMachine.transition(state, event("NAVIGATION_COMPLETE"));
    expect(next.currentPhase).toBe(Phase.FOLLOW_UP);
  });

  it("transitions DOCUMENT_HELP → PROCESS_NAVIGATION on START_NAVIGATION", () => {
    const state = makeState(Phase.DOCUMENT_HELP);
    const next = ConversationStateMachine.transition(state, event("START_NAVIGATION"));
    expect(next.currentPhase).toBe(Phase.PROCESS_NAVIGATION);
  });

  it("transitions RIGHTS_INFO → FOLLOW_UP on REQUEST_FOLLOW_UP", () => {
    const state = makeState(Phase.RIGHTS_INFO);
    const next = ConversationStateMachine.transition(state, event("REQUEST_FOLLOW_UP"));
    expect(next.currentPhase).toBe(Phase.FOLLOW_UP);
  });

  it("transitions RIGHTS_INFO → PROCESS_NAVIGATION on START_NAVIGATION", () => {
    const state = makeState(Phase.RIGHTS_INFO);
    const next = ConversationStateMachine.transition(state, event("START_NAVIGATION"));
    expect(next.currentPhase).toBe(Phase.PROCESS_NAVIGATION);
  });

  it("does not change phase on SESSION_END", () => {
    const state = makeState(Phase.PROCESS_NAVIGATION);
    const next = ConversationStateMachine.transition(state, event("SESSION_END"));
    expect(next.currentPhase).toBe(Phase.PROCESS_NAVIGATION);
  });

  it("resets to INTAKE and clears answers/history on RESET", () => {
    const state: ConversationState = {
      ...makeState(Phase.FOLLOW_UP),
      answers: { age: 35 },
      currentQuestionIndex: 4,
      history: [
        {
          id: "m1",
          role: "user",
          content: "hi",
          timestamp: new Date(),
          metadata: {},
        },
      ],
    };
    const next = ConversationStateMachine.transition(state, event("RESET"));
    expect(next.currentPhase).toBe(Phase.INTAKE);
    expect(next.answers).toEqual({});
    expect(next.history).toHaveLength(0);
    expect(next.currentQuestionIndex).toBe(0);
  });

  it("resets question index to 0 when entering ELIGIBILITY_INTERVIEW", () => {
    const state: ConversationState = {
      ...makeState(Phase.INTAKE),
      currentQuestionIndex: 3,
    };
    const next = ConversationStateMachine.transition(state, event("START_INTERVIEW"));
    expect(next.currentQuestionIndex).toBe(0);
  });

  it("preserves session metadata on valid transitions", () => {
    // Use a clearly past timestamp so updatedAt is guaranteed to differ.
    const state: ConversationState = {
      ...makeState(Phase.INTAKE),
      updatedAt: "2020-01-01T00:00:00.000Z",
    };
    const next = ConversationStateMachine.transition(state, event("START_INTERVIEW"));
    expect(next.sessionId).toBe(state.sessionId);
    expect(next.userId).toBe(state.userId);
    expect(next.createdAt).toBe(state.createdAt);
    expect(next.updatedAt).not.toBe("2020-01-01T00:00:00.000Z");
  });
});

// ---------------------------------------------------------------------------
// TransitionError tests
// ---------------------------------------------------------------------------

describe("ConversationStateMachine.transition — invalid transitions", () => {
  it("throws TransitionError for invalid event from INTAKE", () => {
    const state = makeState(Phase.INTAKE);
    expect(() => ConversationStateMachine.transition(state, event("INTERVIEW_COMPLETE"))).toThrow(
      TransitionError,
    );
  });

  it("throws TransitionError when trying to leave FOLLOW_UP", () => {
    const state = makeState(Phase.FOLLOW_UP);
    expect(() => ConversationStateMachine.transition(state, event("START_INTERVIEW"))).toThrow(
      TransitionError,
    );
  });

  it("TransitionError contains the offending phase and event type", () => {
    const state = makeState(Phase.INTAKE);
    let caught: TransitionError | undefined;
    try {
      ConversationStateMachine.transition(state, event("NAVIGATION_COMPLETE"));
    } catch (e) {
      caught = e as TransitionError;
    }
    expect(caught).toBeInstanceOf(TransitionError);
    expect(caught?.fromPhase).toBe(Phase.INTAKE);
    expect(caught?.event).toBe("NAVIGATION_COMPLETE");
  });
});

// ---------------------------------------------------------------------------
// canTransition tests
// ---------------------------------------------------------------------------

describe("ConversationStateMachine.canTransition", () => {
  it("returns true for a valid transition", () => {
    const state = makeState(Phase.INTAKE);
    expect(ConversationStateMachine.canTransition(state, event("START_INTERVIEW"))).toBe(true);
  });

  it("returns false for an invalid transition", () => {
    const state = makeState(Phase.INTAKE);
    expect(ConversationStateMachine.canTransition(state, event("NAVIGATION_COMPLETE"))).toBe(false);
  });

  it("always returns true for RESET", () => {
    for (const phase of Object.values(Phase)) {
      const state = makeState(phase);
      expect(ConversationStateMachine.canTransition(state, event("RESET"))).toBe(true);
    }
  });

  it("always returns true for SESSION_END", () => {
    for (const phase of Object.values(Phase)) {
      const state = makeState(phase);
      expect(ConversationStateMachine.canTransition(state, event("SESSION_END"))).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// getAvailableTransitions tests
// ---------------------------------------------------------------------------

describe("ConversationStateMachine.getAvailableTransitions", () => {
  it("returns two options from INTAKE", () => {
    const map = ConversationStateMachine.getAvailableTransitions(Phase.INTAKE);
    expect(map.size).toBe(2);
    expect(map.has("START_INTERVIEW")).toBe(true);
    expect(map.has("START_NAVIGATION")).toBe(true);
  });

  it("returns an empty map from FOLLOW_UP (terminal)", () => {
    const map = ConversationStateMachine.getAvailableTransitions(Phase.FOLLOW_UP);
    expect(map.size).toBe(0);
  });

  it("maps to correct target phases from PROCESS_NAVIGATION", () => {
    const map = ConversationStateMachine.getAvailableTransitions(Phase.PROCESS_NAVIGATION);
    expect(map.get("REQUEST_DOCUMENT_HELP")).toBe(Phase.DOCUMENT_HELP);
    expect(map.get("REQUEST_RIGHTS_INFO")).toBe(Phase.RIGHTS_INFO);
    expect(map.get("NAVIGATION_COMPLETE")).toBe(Phase.FOLLOW_UP);
  });
});

// ---------------------------------------------------------------------------
// isTerminal / reachablePhases tests
// ---------------------------------------------------------------------------

describe("ConversationStateMachine helpers", () => {
  it("identifies FOLLOW_UP as terminal", () => {
    expect(ConversationStateMachine.isTerminal(Phase.FOLLOW_UP)).toBe(true);
  });

  it("does not identify other phases as terminal", () => {
    const nonTerminal = [
      Phase.INTAKE,
      Phase.ELIGIBILITY_INTERVIEW,
      Phase.PROCESS_NAVIGATION,
      Phase.DOCUMENT_HELP,
      Phase.RIGHTS_INFO,
    ];
    for (const phase of nonTerminal) {
      expect(ConversationStateMachine.isTerminal(phase)).toBe(false);
    }
  });

  it("reachablePhases returns correct neighbours for PROCESS_NAVIGATION", () => {
    const reachable = ConversationStateMachine.reachablePhases(Phase.PROCESS_NAVIGATION);
    expect(reachable).toContain(Phase.DOCUMENT_HELP);
    expect(reachable).toContain(Phase.RIGHTS_INFO);
    expect(reachable).toContain(Phase.FOLLOW_UP);
  });

  it("reachablePhases returns empty array for FOLLOW_UP", () => {
    expect(ConversationStateMachine.reachablePhases(Phase.FOLLOW_UP)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Full happy-path walkthrough
// ---------------------------------------------------------------------------

describe("full happy-path phase progression", () => {
  it("INTAKE → ELIGIBILITY_INTERVIEW → PROCESS_NAVIGATION → DOCUMENT_HELP → FOLLOW_UP", () => {
    let state = makeState(Phase.INTAKE);

    state = ConversationStateMachine.transition(state, event("START_INTERVIEW"));
    expect(state.currentPhase).toBe(Phase.ELIGIBILITY_INTERVIEW);

    state = ConversationStateMachine.transition(state, event("INTERVIEW_COMPLETE"));
    expect(state.currentPhase).toBe(Phase.PROCESS_NAVIGATION);

    state = ConversationStateMachine.transition(state, event("REQUEST_DOCUMENT_HELP"));
    expect(state.currentPhase).toBe(Phase.DOCUMENT_HELP);

    state = ConversationStateMachine.transition(state, event("NAVIGATION_COMPLETE"));
    expect(state.currentPhase).toBe(Phase.FOLLOW_UP);

    expect(ConversationStateMachine.isTerminal(state.currentPhase)).toBe(true);
  });

  it("INTAKE → PROCESS_NAVIGATION → RIGHTS_INFO → PROCESS_NAVIGATION → FOLLOW_UP", () => {
    let state = makeState(Phase.INTAKE);

    state = ConversationStateMachine.transition(state, event("START_NAVIGATION"));
    expect(state.currentPhase).toBe(Phase.PROCESS_NAVIGATION);

    state = ConversationStateMachine.transition(state, event("REQUEST_RIGHTS_INFO"));
    expect(state.currentPhase).toBe(Phase.RIGHTS_INFO);

    state = ConversationStateMachine.transition(state, event("START_NAVIGATION"));
    expect(state.currentPhase).toBe(Phase.PROCESS_NAVIGATION);

    state = ConversationStateMachine.transition(state, event("NAVIGATION_COMPLETE"));
    expect(state.currentPhase).toBe(Phase.FOLLOW_UP);
  });
});
