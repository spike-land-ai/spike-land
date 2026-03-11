/**
 * COMPASS Interview Engine
 *
 * Manages the structured intake interview that collects the information
 * needed to assess eligibility and route the user to the right process.
 *
 * Design principles:
 *  - Pure functions where possible — no hidden state.
 *  - Conditional questions are evaluated lazily against the current answers.
 *  - Progress is expressed as a fraction of visible questions.
 */

import type {
  AnswerMap,
  ConversationState,
  InterviewQuestion,
  QuestionType,
  UserProfile,
} from "../types.js";

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateAnswer(question: InterviewQuestion, rawAnswer: string): ValidationResult {
  const v = question.validation;

  if (v?.required && rawAnswer.trim() === "") {
    return {
      valid: false,
      error: v.errorMessage ?? "This field is required.",
    };
  }

  if (rawAnswer.trim() === "") {
    return { valid: true }; // optional empty answer
  }

  if (question.type === "number") {
    const n = Number(rawAnswer);
    if (Number.isNaN(n)) {
      return { valid: false, error: v?.errorMessage ?? "Please enter a number." };
    }
    if (v?.min !== undefined && n < v.min) {
      return {
        valid: false,
        error: v.errorMessage ?? `Minimum value is ${v.min}.`,
      };
    }
    if (v?.max !== undefined && n > v.max) {
      return {
        valid: false,
        error: v.errorMessage ?? `Maximum value is ${v.max}.`,
      };
    }
  }

  if (question.type === "text") {
    if (v?.minLength !== undefined && rawAnswer.length < v.minLength) {
      return {
        valid: false,
        error: v.errorMessage ?? `Minimum ${v.minLength} characters required.`,
      };
    }
    if (v?.maxLength !== undefined && rawAnswer.length > v.maxLength) {
      return {
        valid: false,
        error: v.errorMessage ?? `Maximum ${v.maxLength} characters allowed.`,
      };
    }
    if (v?.pattern !== undefined) {
      const re = new RegExp(v.pattern);
      if (!re.test(rawAnswer)) {
        return {
          valid: false,
          error: v.errorMessage ?? "The value does not match the required format.",
        };
      }
    }
  }

  if (question.type === "choice") {
    const allowed = question.options ?? [];
    if (allowed.length > 0 && !allowed.includes(rawAnswer)) {
      return {
        valid: false,
        error: v?.errorMessage ?? `Please choose one of: ${allowed.join(", ")}.`,
      };
    }
  }

  if (question.type === "date") {
    const d = Date.parse(rawAnswer);
    if (Number.isNaN(d)) {
      return {
        valid: false,
        error: v?.errorMessage ?? "Please enter a valid date (YYYY-MM-DD).",
      };
    }
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// Visibility / conditionality
// ---------------------------------------------------------------------------

/**
 * Returns true when the question should be presented to the user given the
 * answers collected so far.
 */
export function isQuestionVisible(question: InterviewQuestion, answers: AnswerMap): boolean {
  if (!question.conditionalOn) return true;
  const { field, value } = question.conditionalOn;
  return answers[field] === value;
}

/**
 * Filter and order the full question list to only those that are currently
 * relevant given the accumulated answers.
 */
export function getVisibleQuestions(
  questions: InterviewQuestion[],
  answers: AnswerMap,
): InterviewQuestion[] {
  return questions.filter((q) => isQuestionVisible(q, answers));
}

// ---------------------------------------------------------------------------
// Answer coercion
// ---------------------------------------------------------------------------

function coerceAnswer(type: QuestionType, raw: string): string | number | Date | string[] {
  switch (type) {
    case "number":
      return Number(raw);
    case "date":
      return new Date(raw);
    case "choice":
      return raw;
    case "text":
    default:
      return raw;
  }
}

// ---------------------------------------------------------------------------
// InterviewEngine
// ---------------------------------------------------------------------------

export interface InterviewStartResult {
  question: InterviewQuestion;
  totalVisible: number;
}

export interface InterviewProgressResult {
  /** 0–100 */
  percentage: number;
  answeredCount: number;
  totalVisible: number;
}

export type InterviewProcessResult =
  | {
      nextQuestion: InterviewQuestion;
      answers: AnswerMap;
      complete: false;
      validationError: string;
    }
  | {
      nextQuestion: InterviewQuestion;
      answers: AnswerMap;
      complete: false;
      validationError?: never;
    }
  | {
      nextQuestion?: never;
      answers: AnswerMap;
      complete: true;
      validationError?: never;
    };

export class InterviewEngine {
  private readonly questions: InterviewQuestion[];

  constructor(questions: InterviewQuestion[]) {
    if (questions.length === 0) {
      throw new Error("InterviewEngine requires at least one question.");
    }
    this.questions = questions;
  }

  /**
   * Return the first visible question for a fresh session.
   */
  startInterview(initialAnswers: AnswerMap = {}): InterviewStartResult {
    const visible = getVisibleQuestions(this.questions, initialAnswers);
    const first = visible[0];
    if (!first) {
      throw new Error("No visible questions found for the given initial answers.");
    }
    return { question: first, totalVisible: visible.length };
  }

  /**
   * Process the user's answer to the current question.
   *
   * Returns a validation error and the unchanged question index when the
   * answer is invalid, or advances to the next question.
   */
  processAnswer(state: ConversationState, rawAnswer: string): InterviewProcessResult {
    const visible = getVisibleQuestions(this.questions, state.answers);
    const currentQuestion = visible[state.currentQuestionIndex];

    if (!currentQuestion) {
      // Already past the last question — nothing to process.
      return { answers: state.answers, complete: true };
    }

    // Validate
    const validation = validateAnswer(currentQuestion, rawAnswer);
    if (!validation.valid) {
      return {
        nextQuestion: currentQuestion,
        answers: state.answers,
        complete: false,
        validationError: validation.error ?? "Invalid answer.",
      };
    }

    // Store coerced answer
    const updatedAnswers: AnswerMap = {
      ...state.answers,
      [currentQuestion.field]: coerceAnswer(currentQuestion.type, rawAnswer),
    };

    // Re-evaluate visible questions with the newly stored answer
    const updatedVisible = getVisibleQuestions(this.questions, updatedAnswers);
    const nextIndex = state.currentQuestionIndex + 1;
    const nextQuestion = updatedVisible[nextIndex];

    if (nextQuestion === undefined) {
      return { answers: updatedAnswers, complete: true };
    }

    return {
      nextQuestion,
      answers: updatedAnswers,
      complete: false,
    };
  }

  /**
   * Build a partial UserProfile from the collected answers.
   * Fields are mapped by convention from well-known field names.
   */
  buildProfile(answers: AnswerMap, userId: string): UserProfile {
    const pick = <T>(key: string): T | undefined =>
      answers[key] !== undefined ? (answers[key] as T) : undefined;

    const knownFields = new Set([
      "age",
      "household_size",
      "monthly_income",
      "citizenship_status",
      "residence_state",
      "employment_status",
    ]);

    const additionalFields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(answers)) {
      if (!knownFields.has(k)) {
        additionalFields[k] = v;
      }
    }

    return {
      userId,
      additionalFields,
      ...(pick<number>("age") !== undefined ? { age: pick<number>("age") as number } : {}),
      ...(pick<number>("household_size") !== undefined
        ? { householdSize: pick<number>("household_size") as number }
        : {}),
      ...(pick<number>("monthly_income") !== undefined
        ? { monthlyIncome: pick<number>("monthly_income") as number }
        : {}),
      ...(pick<string>("citizenship_status") !== undefined
        ? { citizenshipStatus: pick<string>("citizenship_status") as string }
        : {}),
      ...(pick<string>("residence_state") !== undefined
        ? { residenceState: pick<string>("residence_state") as string }
        : {}),
      ...(pick<string>("employment_status") !== undefined
        ? { employmentStatus: pick<string>("employment_status") as string }
        : {}),
    };
  }

  /**
   * Compute interview completion percentage based on current question index
   * relative to visible questions.
   */
  getProgress(state: ConversationState): InterviewProgressResult {
    const visible = getVisibleQuestions(this.questions, state.answers);
    const totalVisible = visible.length;
    const answeredCount = Math.min(state.currentQuestionIndex, totalVisible);
    const percentage = totalVisible === 0 ? 100 : Math.round((answeredCount / totalVisible) * 100);

    return { percentage, answeredCount, totalVisible };
  }

  /**
   * Return the questions list (read-only copy).
   */
  getQuestions(): readonly InterviewQuestion[] {
    return [...this.questions];
  }
}

// ---------------------------------------------------------------------------
// Default intake question set
// ---------------------------------------------------------------------------

export const DEFAULT_INTAKE_QUESTIONS: InterviewQuestion[] = [
  {
    id: "q_age",
    text: "How old are you?",
    field: "age",
    type: "number",
    hint: "Please enter your age in years.",
    validation: {
      required: true,
      min: 0,
      max: 130,
      errorMessage: "Please enter a valid age.",
    },
  },
  {
    id: "q_residence_state",
    text: "Which state do you currently live in?",
    field: "residence_state",
    type: "text",
    validation: {
      required: true,
      minLength: 2,
      maxLength: 50,
      errorMessage: "Please enter your state of residence.",
    },
  },
  {
    id: "q_citizenship_status",
    text: "What is your citizenship or immigration status?",
    field: "citizenship_status",
    type: "choice",
    options: [
      "US Citizen",
      "Permanent Resident",
      "Temporary Visa Holder",
      "Refugee/Asylee",
      "Undocumented",
      "Other",
    ],
    validation: { required: true },
  },
  {
    id: "q_employment_status",
    text: "What is your current employment situation?",
    field: "employment_status",
    type: "choice",
    options: [
      "Employed full-time",
      "Employed part-time",
      "Self-employed",
      "Unemployed",
      "Unable to work",
      "Retired",
    ],
    validation: { required: true },
  },
  {
    id: "q_monthly_income",
    text: "What is your approximate total monthly household income (before taxes)?",
    field: "monthly_income",
    type: "number",
    hint: "Include all income sources. Enter 0 if you have no income.",
    validation: {
      required: true,
      min: 0,
      errorMessage: "Please enter a number greater than or equal to 0.",
    },
  },
  {
    id: "q_household_size",
    text: "How many people, including yourself, live in your household?",
    field: "household_size",
    type: "number",
    validation: {
      required: true,
      min: 1,
      max: 30,
      errorMessage: "Please enter the number of people in your household.",
    },
  },
];
