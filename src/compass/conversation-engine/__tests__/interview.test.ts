import { describe, it, expect, beforeEach } from "vitest";
import {
  InterviewEngine,
  validateAnswer,
  isQuestionVisible,
  getVisibleQuestions,
  DEFAULT_INTAKE_QUESTIONS,
} from "../core-logic/interview.js";
import type { AnswerMap, ConversationState, InterviewQuestion } from "../types.js";
import { Phase } from "../types.js";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeState(overrides: Partial<ConversationState> = {}): ConversationState {
  const now = new Date().toISOString();
  return {
    sessionId: "test-session",
    userId: "user-1",
    currentPhase: Phase.ELIGIBILITY_INTERVIEW,
    context: {},
    history: [],
    answers: {} as AnswerMap,
    currentQuestionIndex: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

const SIMPLE_QUESTIONS: InterviewQuestion[] = [
  {
    id: "q1",
    text: "What is your name?",
    field: "name",
    type: "text",
    validation: { required: true, minLength: 2, maxLength: 100 },
  },
  {
    id: "q2",
    text: "How old are you?",
    field: "age",
    type: "number",
    validation: { required: true, min: 0, max: 130 },
  },
  {
    id: "q3",
    text: "Are you employed?",
    field: "employed",
    type: "choice",
    options: ["yes", "no"],
    validation: { required: true },
  },
  {
    id: "q4",
    text: "What is your employer's name?",
    field: "employer_name",
    type: "text",
    conditionalOn: { field: "employed", value: "yes" },
    validation: { required: true },
  },
];

// ---------------------------------------------------------------------------
// validateAnswer tests
// ---------------------------------------------------------------------------

describe("validateAnswer", () => {
  const textQ: InterviewQuestion = {
    id: "t",
    text: "Describe",
    field: "description",
    type: "text",
    validation: { required: true, minLength: 3, maxLength: 10 },
  };

  it("rejects empty string when required", () => {
    const result = validateAnswer(textQ, "");
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("accepts valid text", () => {
    expect(validateAnswer(textQ, "hello").valid).toBe(true);
  });

  it("rejects text below minLength", () => {
    const result = validateAnswer(textQ, "ab");
    expect(result.valid).toBe(false);
  });

  it("rejects text above maxLength", () => {
    const result = validateAnswer(textQ, "this is way too long");
    expect(result.valid).toBe(false);
  });

  it("accepts optional empty answer", () => {
    const optQ: InterviewQuestion = {
      id: "o",
      text: "Optional",
      field: "opt",
      type: "text",
    };
    expect(validateAnswer(optQ, "").valid).toBe(true);
  });

  it("validates number type — rejects non-numeric", () => {
    const numQ: InterviewQuestion = {
      id: "n",
      text: "Age",
      field: "age",
      type: "number",
      validation: { required: true },
    };
    expect(validateAnswer(numQ, "abc").valid).toBe(false);
  });

  it("validates number type — rejects below min", () => {
    const numQ: InterviewQuestion = {
      id: "n",
      text: "Age",
      field: "age",
      type: "number",
      validation: { required: true, min: 18 },
    };
    expect(validateAnswer(numQ, "16").valid).toBe(false);
  });

  it("validates number type — rejects above max", () => {
    const numQ: InterviewQuestion = {
      id: "n",
      text: "Age",
      field: "age",
      type: "number",
      validation: { required: true, max: 100 },
    };
    expect(validateAnswer(numQ, "150").valid).toBe(false);
  });

  it("validates number type — accepts valid number", () => {
    const numQ: InterviewQuestion = {
      id: "n",
      text: "Age",
      field: "age",
      type: "number",
      validation: { required: true, min: 0, max: 130 },
    };
    expect(validateAnswer(numQ, "35").valid).toBe(true);
  });

  it("validates choice type — rejects unlisted option", () => {
    const choiceQ: InterviewQuestion = {
      id: "c",
      text: "Color",
      field: "color",
      type: "choice",
      options: ["red", "blue", "green"],
      validation: { required: true },
    };
    expect(validateAnswer(choiceQ, "yellow").valid).toBe(false);
  });

  it("validates choice type — accepts listed option", () => {
    const choiceQ: InterviewQuestion = {
      id: "c",
      text: "Color",
      field: "color",
      type: "choice",
      options: ["red", "blue", "green"],
      validation: { required: true },
    };
    expect(validateAnswer(choiceQ, "blue").valid).toBe(true);
  });

  it("validates date type — rejects invalid date", () => {
    const dateQ: InterviewQuestion = {
      id: "d",
      text: "DOB",
      field: "dob",
      type: "date",
      validation: { required: true },
    };
    expect(validateAnswer(dateQ, "not-a-date").valid).toBe(false);
  });

  it("validates date type — accepts ISO date", () => {
    const dateQ: InterviewQuestion = {
      id: "d",
      text: "DOB",
      field: "dob",
      type: "date",
      validation: { required: true },
    };
    expect(validateAnswer(dateQ, "1990-05-15").valid).toBe(true);
  });

  it("validates regex pattern", () => {
    const patternQ: InterviewQuestion = {
      id: "p",
      text: "SSN last 4",
      field: "ssn4",
      type: "text",
      validation: { required: true, pattern: "^\\d{4}$" },
    };
    expect(validateAnswer(patternQ, "1234").valid).toBe(true);
    expect(validateAnswer(patternQ, "12ab").valid).toBe(false);
  });

  it("uses custom errorMessage when provided", () => {
    const q: InterviewQuestion = {
      id: "e",
      text: "Q",
      field: "f",
      type: "text",
      validation: { required: true, errorMessage: "Custom error" },
    };
    const result = validateAnswer(q, "");
    expect(result.error).toBe("Custom error");
  });
});

// ---------------------------------------------------------------------------
// isQuestionVisible / getVisibleQuestions tests
// ---------------------------------------------------------------------------

describe("isQuestionVisible", () => {
  it("returns true for unconditional questions", () => {
    expect(isQuestionVisible(SIMPLE_QUESTIONS[0], {})).toBe(true);
  });

  it("returns false when condition is not met", () => {
    const conditional = SIMPLE_QUESTIONS[3]; // employer_name, requires employed=yes
    expect(isQuestionVisible(conditional, { employed: "no" })).toBe(false);
  });

  it("returns true when condition is met", () => {
    const conditional = SIMPLE_QUESTIONS[3];
    expect(isQuestionVisible(conditional, { employed: "yes" })).toBe(true);
  });
});

describe("getVisibleQuestions", () => {
  it("excludes conditional questions when condition not met", () => {
    const visible = getVisibleQuestions(SIMPLE_QUESTIONS, { employed: "no" });
    const ids = visible.map((q) => q.id);
    expect(ids).not.toContain("q4");
    expect(ids).toContain("q1");
    expect(ids).toContain("q2");
    expect(ids).toContain("q3");
  });

  it("includes conditional questions when condition is met", () => {
    const visible = getVisibleQuestions(SIMPLE_QUESTIONS, { employed: "yes" });
    const ids = visible.map((q) => q.id);
    expect(ids).toContain("q4");
  });

  it("shows all non-conditional questions with empty answers", () => {
    const visible = getVisibleQuestions(SIMPLE_QUESTIONS, {});
    // q4 is conditional so should be hidden
    expect(visible).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// InterviewEngine tests
// ---------------------------------------------------------------------------

describe("InterviewEngine constructor", () => {
  it("throws when constructed with empty question list", () => {
    expect(() => new InterviewEngine([])).toThrow();
  });

  it("accepts a non-empty question list", () => {
    expect(() => new InterviewEngine(SIMPLE_QUESTIONS)).not.toThrow();
  });
});

describe("InterviewEngine.startInterview", () => {
  it("returns the first visible question", () => {
    const engine = new InterviewEngine(SIMPLE_QUESTIONS);
    const result = engine.startInterview();
    expect(result.question.id).toBe("q1");
  });

  it("reports correct totalVisible count", () => {
    const engine = new InterviewEngine(SIMPLE_QUESTIONS);
    const result = engine.startInterview();
    // q4 is conditional and not visible with empty answers
    expect(result.totalVisible).toBe(3);
  });

  it("respects initial answers when determining first visible question", () => {
    // If q1 is already answered, start from q2 indirectly via the question list.
    // (startInterview always returns the first visible question, not the first
    //  unanswered one — callers use state.currentQuestionIndex for that.)
    const engine = new InterviewEngine(SIMPLE_QUESTIONS);
    const result = engine.startInterview({ employed: "yes" });
    expect(result.totalVisible).toBe(4); // all 4 now visible
  });
});

describe("InterviewEngine.processAnswer", () => {
  let engine: InterviewEngine;

  beforeEach(() => {
    engine = new InterviewEngine(SIMPLE_QUESTIONS);
  });

  it("returns validationError and unchanged index on invalid answer", () => {
    const state = makeState();
    const result = engine.processAnswer(state, ""); // name is required
    expect(result.validationError).toBeDefined();
    expect(result.complete).toBe(false);
    expect(result.answers).toEqual({});
  });

  it("advances to next question on valid answer", () => {
    const state = makeState();
    const result = engine.processAnswer(state, "Alice");
    expect(result.validationError).toBeUndefined();
    expect(result.nextQuestion?.id).toBe("q2");
    expect(result.answers["name"]).toBe("Alice");
  });

  it("coerces number type to Number", () => {
    const state = makeState({
      answers: { name: "Alice" } as AnswerMap,
      currentQuestionIndex: 1, // on q2 (age)
    });
    const result = engine.processAnswer(state, "42");
    expect(result.answers["age"]).toBe(42);
    expect(typeof result.answers["age"]).toBe("number");
  });

  it("coerces date type to Date object", () => {
    const dateQ: InterviewQuestion = {
      id: "dq",
      text: "Date",
      field: "start_date",
      type: "date",
      validation: { required: true },
    };
    const dateEngine = new InterviewEngine([dateQ]);
    const state = makeState();
    const result = dateEngine.processAnswer(state, "2024-01-15");
    expect(result.answers["start_date"]).toBeInstanceOf(Date);
  });

  it("marks complete when last question is answered", () => {
    // 3 unconditional questions (q1, q2, q3) — answer all three
    const state = makeState({
      answers: { name: "Alice", age: 30 } as AnswerMap,
      currentQuestionIndex: 2, // on q3 (employed)
    });
    const result = engine.processAnswer(state, "no");
    expect(result.complete).toBe(true);
    expect(result.nextQuestion).toBeUndefined();
  });

  it("dynamically reveals conditional question after trigger answer", () => {
    const state = makeState({
      answers: { name: "Alice", age: 30 } as AnswerMap,
      currentQuestionIndex: 2, // on q3 (employed)
    });
    const result = engine.processAnswer(state, "yes");
    // Now q4 (employer_name) should be the next question
    expect(result.nextQuestion?.id).toBe("q4");
    expect(result.complete).toBe(false);
  });

  it("returns complete=true if already past last question", () => {
    const state = makeState({
      answers: { name: "Alice", age: 30, employed: "no" } as AnswerMap,
      currentQuestionIndex: 99,
    });
    const result = engine.processAnswer(state, "anything");
    expect(result.complete).toBe(true);
  });
});

describe("InterviewEngine.buildProfile", () => {
  it("maps known fields to UserProfile fields", () => {
    const engine = new InterviewEngine(DEFAULT_INTAKE_QUESTIONS);
    const answers: AnswerMap = {
      age: 28,
      residence_state: "California",
      citizenship_status: "US Citizen",
      employment_status: "Employed full-time",
      monthly_income: 3500,
      household_size: 2,
    };
    const profile = engine.buildProfile(answers, "user-1");
    expect(profile.age).toBe(28);
    expect(profile.residenceState).toBe("California");
    expect(profile.citizenshipStatus).toBe("US Citizen");
    expect(profile.employmentStatus).toBe("Employed full-time");
    expect(profile.monthlyIncome).toBe(3500);
    expect(profile.householdSize).toBe(2);
    expect(profile.userId).toBe("user-1");
  });

  it("puts unknown fields in additionalFields", () => {
    const engine = new InterviewEngine(DEFAULT_INTAKE_QUESTIONS);
    const answers: AnswerMap = {
      age: 45,
      favorite_color: "blue",
    };
    const profile = engine.buildProfile(answers, "user-2");
    expect(profile.additionalFields["favorite_color"]).toBe("blue");
    expect(profile.additionalFields["age"]).toBeUndefined();
  });

  it("sets undefined for missing optional fields", () => {
    const engine = new InterviewEngine(DEFAULT_INTAKE_QUESTIONS);
    const profile = engine.buildProfile({}, "user-3");
    expect(profile.age).toBeUndefined();
    expect(profile.householdSize).toBeUndefined();
  });
});

describe("InterviewEngine.getProgress", () => {
  it("returns 0% at the start", () => {
    const engine = new InterviewEngine(SIMPLE_QUESTIONS);
    const state = makeState();
    const progress = engine.getProgress(state);
    expect(progress.percentage).toBe(0);
    expect(progress.answeredCount).toBe(0);
    expect(progress.totalVisible).toBe(3);
  });

  it("returns 100% when all questions answered", () => {
    const engine = new InterviewEngine(SIMPLE_QUESTIONS);
    const state = makeState({ currentQuestionIndex: 3 });
    const progress = engine.getProgress(state);
    expect(progress.percentage).toBe(100);
  });

  it("returns correct percentage mid-interview", () => {
    const engine = new InterviewEngine(SIMPLE_QUESTIONS);
    const state = makeState({ currentQuestionIndex: 1 });
    const progress = engine.getProgress(state);
    // 1 of 3 visible = 33%
    expect(progress.percentage).toBe(33);
  });
});

// ---------------------------------------------------------------------------
// DEFAULT_INTAKE_QUESTIONS smoke test
// ---------------------------------------------------------------------------

describe("DEFAULT_INTAKE_QUESTIONS", () => {
  it("has 6 questions", () => {
    expect(DEFAULT_INTAKE_QUESTIONS).toHaveLength(6);
  });

  it("all questions have unique ids and fields", () => {
    const ids = DEFAULT_INTAKE_QUESTIONS.map((q) => q.id);
    const fields = DEFAULT_INTAKE_QUESTIONS.map((q) => q.field);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(fields).size).toBe(fields.length);
  });

  it("can complete a full interview walk-through", () => {
    const engine = new InterviewEngine(DEFAULT_INTAKE_QUESTIONS);
    let state = makeState();

    const answers = ["28", "California", "US Citizen", "Employed full-time", "3500", "2"];

    for (const answer of answers) {
      const result = engine.processAnswer(state, answer);
      expect(result.validationError).toBeUndefined();
      state = {
        ...state,
        answers: result.answers,
        currentQuestionIndex: state.currentQuestionIndex + 1,
      };
    }

    const progress = engine.getProgress(state);
    expect(progress.percentage).toBe(100);
  });
});
