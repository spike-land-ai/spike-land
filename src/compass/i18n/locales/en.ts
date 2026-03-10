/**
 * English (en) — Base Locale Bundle
 *
 * This is the reference locale.  All other bundles are measured for
 * completeness against the keys defined here.
 *
 * Key namespaces:
 *   greetings.*     — Time-of-day and generic greetings
 *   common.*        — Shared UI strings and prompts
 *   eligibility.*   — Questions and responses in the eligibility flow
 *   navigation.*    — Flow navigation controls
 *   errors.*        — Error and validation messages
 *   encouragement.* — Positive reinforcement phrases
 *   patience.*      — "Radically patient" conversation markers
 */

import type { Locale, LocaleBundle, TranslationEntry } from "../types.js";

// ---------------------------------------------------------------------------
// Locale descriptor
// ---------------------------------------------------------------------------

export const EN_LOCALE: Locale = {
  code: "en",
  name: "English",
  nativeName: "English",
  direction: "ltr",
  formality: "adaptive",
  pluralRules: (n) => (n === 1 ? "one" : "other"),
};

// ---------------------------------------------------------------------------
// Bundle factory
// ---------------------------------------------------------------------------

/**
 * Build the English locale bundle.
 *
 * Using a factory function lets callers tree-shake unused locale bundles and
 * keeps the Map construction lazy.
 */
export function buildEnBundle(): LocaleBundle {
  const entries = [
    // -----------------------------------------------------------------------
    // greetings
    // -----------------------------------------------------------------------
    {
      key: "greetings.hello",
      value: "Hello{{namePart}}!",
      context: "Generic greeting. {{namePart}} is ', Name' or empty string.",
    },
    {
      key: "greetings.morning",
      value: "Good morning{{namePart}}!",
    },
    {
      key: "greetings.afternoon",
      value: "Good afternoon{{namePart}}!",
    },
    {
      key: "greetings.evening",
      value: "Good evening{{namePart}}!",
    },
    {
      key: "greetings.welcome_back",
      value: "Welcome back{{namePart}}!",
    },
    {
      key: "greetings.first_time",
      value: "Welcome! We're glad you're here.",
    },

    // -----------------------------------------------------------------------
    // common
    // -----------------------------------------------------------------------
    {
      key: "common.yes",
      value: "Yes",
    },
    {
      key: "common.no",
      value: "No",
    },
    {
      key: "common.continue",
      value: "Continue",
    },
    {
      key: "common.save",
      value: "Save",
    },
    {
      key: "common.cancel",
      value: "Cancel",
    },
    {
      key: "common.done",
      value: "Done",
    },
    {
      key: "common.loading",
      value: "Loading…",
    },
    {
      key: "common.saving",
      value: "Saving…",
    },
    {
      key: "common.please_wait",
      value: "Please wait a moment.",
    },
    {
      key: "common.optional",
      value: "(optional)",
    },
    {
      key: "common.required",
      value: "Required",
    },
    {
      key: "common.or",
      value: "or",
    },
    {
      key: "common.and",
      value: "and",
    },
    {
      key: "common.not_sure",
      value: "I'm not sure",
    },
    {
      key: "common.skip",
      value: "Skip for now",
    },
    {
      key: "common.help",
      value: "Need help?",
    },

    // -----------------------------------------------------------------------
    // eligibility
    // -----------------------------------------------------------------------
    {
      key: "eligibility.intro",
      value:
        "I'll ask you a few questions to find the right support for you. " +
        "There are no wrong answers.",
      context: "Introductory statement before the eligibility questionnaire.",
    },
    {
      key: "eligibility.age_question",
      value: "How old are you?",
    },
    {
      key: "eligibility.age_placeholder",
      value: "Enter your age",
    },
    {
      key: "eligibility.residency_question",
      value: "Which country or region do you currently live in?",
    },
    {
      key: "eligibility.income_question",
      value:
        "What is your approximate annual household income? " +
        "This helps us find financial assistance programs.",
    },
    {
      key: "eligibility.income_placeholder",
      value: "Enter an amount",
    },
    {
      key: "eligibility.household_size_question",
      value: "How many people live in your household, including yourself?",
    },
    {
      key: "eligibility.employment_question",
      value: "What is your current employment status?",
    },
    {
      key: "eligibility.health_question",
      value: "Do you have any health conditions we should know about for eligibility purposes?",
      context: "Sensitive — always display with empathy preamble.",
    },
    {
      key: "eligibility.documents_question",
      value: "Do you have any of the following documents available?",
    },
    {
      key: "eligibility.eligible_title",
      value: "Great news — you may be eligible!",
    },
    {
      key: "eligibility.not_eligible_title",
      value: "We couldn't find an exact match, but let's keep looking.",
      context: "Soft phrasing — never say 'not eligible' bluntly.",
    },
    {
      key: "eligibility.review_answers",
      value: "Review your answers",
    },
    {
      key: "eligibility.items_found",
      value: {
        one: "{{count}} program found for you.",
        other: "{{count}} programs found for you.",
      },
    },

    // -----------------------------------------------------------------------
    // navigation
    // -----------------------------------------------------------------------
    {
      key: "navigation.back",
      value: "Back",
    },
    {
      key: "navigation.next",
      value: "Next",
    },
    {
      key: "navigation.previous_question",
      value: "Previous question",
    },
    {
      key: "navigation.next_question",
      value: "Next question",
    },
    {
      key: "navigation.finish",
      value: "Finish",
    },
    {
      key: "navigation.step_of",
      value: "Step {{current}} of {{total}}",
    },
    {
      key: "navigation.start_over",
      value: "Start over",
    },
    {
      key: "navigation.exit",
      value: "Exit",
    },
    {
      key: "navigation.home",
      value: "Home",
    },

    // -----------------------------------------------------------------------
    // errors
    // -----------------------------------------------------------------------
    {
      key: "errors.required_field",
      value: "This field is required.",
    },
    {
      key: "errors.invalid_age",
      value: "Please enter a valid age (0–120).",
    },
    {
      key: "errors.invalid_income",
      value: "Please enter a valid income amount.",
    },
    {
      key: "errors.network_error",
      value: "Something went wrong connecting to our servers. Please try again.",
    },
    {
      key: "errors.session_expired",
      value: "Your session has expired. Let's start fresh.",
    },
    {
      key: "errors.unexpected",
      value: "Something unexpected happened. We're on it!",
    },
    {
      key: "errors.not_found",
      value: "We couldn't find what you were looking for.",
    },
    {
      key: "errors.too_many_requests",
      value: "You're moving quickly! Please wait a moment and try again.",
    },

    // -----------------------------------------------------------------------
    // encouragement
    // -----------------------------------------------------------------------
    {
      key: "encouragement.great_job",
      value: "You're doing great!",
    },
    {
      key: "encouragement.almost_done",
      value: "Almost there — just a few more questions.",
    },
    {
      key: "encouragement.good_answer",
      value: "That's a great answer, thank you.",
    },
    {
      key: "encouragement.halfway",
      value: "You're halfway through!",
    },
    {
      key: "encouragement.first_step",
      value: "You've taken the first step — that's the hardest part.",
    },
    {
      key: "encouragement.saved",
      value: "Your progress has been saved.",
    },

    // -----------------------------------------------------------------------
    // patience
    // -----------------------------------------------------------------------
    {
      key: "patience.take_your_time",
      value: "Take your time — there's no rush.",
    },
    {
      key: "patience.no_wrong_answers",
      value: "There are no wrong answers here.",
    },
    {
      key: "patience.come_back_later",
      value: "You can always come back and finish this later.",
    },
    {
      key: "patience.pause_anytime",
      value: "Feel free to pause at any point.",
    },
    {
      key: "patience.your_pace",
      value: "We go at your pace.",
    },
    {
      key: "patience.need_break",
      value: "Need a break? No problem — your answers are saved.",
    },
    {
      key: "patience.no_pressure",
      value: "There's absolutely no pressure here.",
    },
    {
      key: "patience.here_to_help",
      value: "We're here to help, not to judge.",
    },
    {
      key: "patience.privacy_assured",
      value: "Everything you share is private and secure.",
    },
    {
      key: "patience.repeat_question",
      value: "Would you like me to rephrase that question?",
    },
  ] as const;

  const translations: Map<string, TranslationEntry> = new Map(
    entries.map((e) => {
      const entry: TranslationEntry =
        "context" in e
          ? { key: e.key, value: e.value, context: e.context }
          : { key: e.key, value: e.value };
      return [e.key, entry] as const;
    }),
  );

  return {
    locale: "en",
    translations,
    metadata: {
      version: "1.0.0",
      completeness: 1.0,
      lastUpdated: "2026-03-10T00:00:00Z",
    },
  };
}
