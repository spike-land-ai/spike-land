/**
 * German (de) — Locale Bundle
 *
 * Cultural notes:
 * - Formal "Sie" used throughout (German bureaucratic/service context demands it)
 * - Compound nouns rather than comma-heavy clauses
 * - Direct and respectful — avoid over-effusive phrasing which feels insincere
 * - Encouragement phrases exist but are more measured than English equivalents
 * - Date format: DD.MM.YYYY
 * - Currency: Euro, symbol suffix with space ("12,50 €")
 */

import type { Locale, LocaleBundle } from "../types.js";

// ---------------------------------------------------------------------------
// Locale descriptor
// ---------------------------------------------------------------------------

export const DE_LOCALE: Locale = {
  code: "de",
  name: "German",
  nativeName: "Deutsch",
  direction: "ltr",
  formality: "formal", // German service contexts default to formal Sie
  pluralRules: (n) => (n === 1 ? "one" : "other"),
};

// ---------------------------------------------------------------------------
// Bundle factory
// ---------------------------------------------------------------------------

export function buildDeBundle(): LocaleBundle {
  const entries = [
    // -----------------------------------------------------------------------
    // greetings
    // -----------------------------------------------------------------------
    {
      key: "greetings.hello",
      value: "Hallo{{namePart}}!",
    },
    {
      key: "greetings.morning",
      value: "Guten Morgen{{namePart}}!",
    },
    {
      key: "greetings.afternoon",
      value: "Guten Tag{{namePart}}!",
    },
    {
      key: "greetings.evening",
      value: "Guten Abend{{namePart}}!",
    },
    {
      key: "greetings.welcome_back",
      value: "Willkommen zurück{{namePart}}!",
    },
    {
      key: "greetings.first_time",
      value: "Herzlich willkommen! Schön, dass Sie da sind.",
    },

    // -----------------------------------------------------------------------
    // common
    // -----------------------------------------------------------------------
    {
      key: "common.yes",
      value: "Ja",
    },
    {
      key: "common.no",
      value: "Nein",
    },
    {
      key: "common.continue",
      value: "Weiter",
    },
    {
      key: "common.save",
      value: "Speichern",
    },
    {
      key: "common.cancel",
      value: "Abbrechen",
    },
    {
      key: "common.done",
      value: "Fertig",
    },
    {
      key: "common.loading",
      value: "Wird geladen…",
    },
    {
      key: "common.saving",
      value: "Wird gespeichert…",
    },
    {
      key: "common.please_wait",
      value: "Bitte warten Sie einen Moment.",
    },
    {
      key: "common.optional",
      value: "(optional)",
    },
    {
      key: "common.required",
      value: "Pflichtfeld",
    },
    {
      key: "common.or",
      value: "oder",
    },
    {
      key: "common.and",
      value: "und",
    },
    {
      key: "common.not_sure",
      value: "Ich bin nicht sicher",
    },
    {
      key: "common.skip",
      value: "Vorerst überspringen",
    },
    {
      key: "common.help",
      value: "Benötigen Sie Hilfe?",
    },

    // -----------------------------------------------------------------------
    // eligibility
    // -----------------------------------------------------------------------
    {
      key: "eligibility.intro",
      value:
        "Ich stelle Ihnen einige Fragen, um die passende Unterstützung für Sie zu finden. " +
        "Es gibt keine falschen Antworten.",
    },
    {
      key: "eligibility.age_question",
      value: "Wie alt sind Sie?",
    },
    {
      key: "eligibility.age_placeholder",
      value: "Ihr Alter eingeben",
    },
    {
      key: "eligibility.residency_question",
      value: "In welchem Land oder welcher Region leben Sie derzeit?",
    },
    {
      key: "eligibility.income_question",
      value:
        "Wie hoch ist Ihr ungefähres Jahreshaushaltseinkommen? " +
        "Diese Angabe hilft uns, finanzielle Unterstützungsprogramme zu finden.",
    },
    {
      key: "eligibility.income_placeholder",
      value: "Betrag eingeben",
    },
    {
      key: "eligibility.household_size_question",
      value: "Wie viele Personen leben in Ihrem Haushalt, einschließlich Ihrer Person?",
    },
    {
      key: "eligibility.employment_question",
      value: "Was ist Ihr aktueller Beschäftigungsstatus?",
    },
    {
      key: "eligibility.health_question",
      value:
        "Haben Sie gesundheitliche Einschränkungen, die wir für die Anspruchsermittlung berücksichtigen sollen?",
    },
    {
      key: "eligibility.documents_question",
      value: "Welche der folgenden Dokumente haben Sie zur Hand?",
    },
    {
      key: "eligibility.eligible_title",
      value: "Gute Neuigkeiten — Sie könnten berechtigt sein!",
    },
    {
      key: "eligibility.not_eligible_title",
      value: "Wir haben keine genaue Übereinstimmung gefunden, aber wir suchen weiter.",
    },
    {
      key: "eligibility.review_answers",
      value: "Antworten überprüfen",
    },
    {
      key: "eligibility.items_found",
      value: {
        one: "{{count}} Programm für Sie gefunden.",
        other: "{{count}} Programme für Sie gefunden.",
      },
    },

    // -----------------------------------------------------------------------
    // navigation
    // -----------------------------------------------------------------------
    {
      key: "navigation.back",
      value: "Zurück",
    },
    {
      key: "navigation.next",
      value: "Weiter",
    },
    {
      key: "navigation.previous_question",
      value: "Vorherige Frage",
    },
    {
      key: "navigation.next_question",
      value: "Nächste Frage",
    },
    {
      key: "navigation.finish",
      value: "Abschließen",
    },
    {
      key: "navigation.step_of",
      value: "Schritt {{current}} von {{total}}",
    },
    {
      key: "navigation.start_over",
      value: "Von vorne beginnen",
    },
    {
      key: "navigation.exit",
      value: "Beenden",
    },
    {
      key: "navigation.home",
      value: "Startseite",
    },

    // -----------------------------------------------------------------------
    // errors
    // -----------------------------------------------------------------------
    {
      key: "errors.required_field",
      value: "Dieses Feld ist ein Pflichtfeld.",
    },
    {
      key: "errors.invalid_age",
      value: "Bitte geben Sie ein gültiges Alter ein (0–120).",
    },
    {
      key: "errors.invalid_income",
      value: "Bitte geben Sie einen gültigen Einkommensbetrag ein.",
    },
    {
      key: "errors.network_error",
      value:
        "Beim Verbinden mit unseren Servern ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
    },
    {
      key: "errors.session_expired",
      value: "Ihre Sitzung ist abgelaufen. Fangen wir neu an.",
    },
    {
      key: "errors.unexpected",
      value: "Etwas Unerwartetes ist passiert. Wir kümmern uns darum!",
    },
    {
      key: "errors.not_found",
      value: "Wir konnten nicht finden, was Sie gesucht haben.",
    },
    {
      key: "errors.too_many_requests",
      value: "Sie sind sehr schnell! Bitte warten Sie einen Moment und versuchen Sie es erneut.",
    },

    // -----------------------------------------------------------------------
    // encouragement
    // -----------------------------------------------------------------------
    {
      key: "encouragement.great_job",
      value: "Sie machen das sehr gut!",
    },
    {
      key: "encouragement.almost_done",
      value: "Fast geschafft — nur noch ein paar Fragen.",
    },
    {
      key: "encouragement.good_answer",
      value: "Das ist eine sehr gute Antwort, vielen Dank.",
    },
    {
      key: "encouragement.halfway",
      value: "Sie haben die Hälfte geschafft!",
    },
    {
      key: "encouragement.first_step",
      value: "Sie haben den ersten Schritt getan — das ist das Schwerste.",
    },
    {
      key: "encouragement.saved",
      value: "Ihr Fortschritt wurde gespeichert.",
    },

    // -----------------------------------------------------------------------
    // patience
    // -----------------------------------------------------------------------
    {
      key: "patience.take_your_time",
      value: "Lassen Sie sich ruhig Zeit — es eilt nicht.",
    },
    {
      key: "patience.no_wrong_answers",
      value: "Es gibt hier keine falschen Antworten.",
    },
    {
      key: "patience.come_back_later",
      value: "Sie können jederzeit zurückkommen und das später abschließen.",
    },
    {
      key: "patience.pause_anytime",
      value: "Sie können jederzeit pausieren.",
    },
    {
      key: "patience.your_pace",
      value: "Wir gehen in Ihrem Tempo vor.",
    },
    {
      key: "patience.need_break",
      value: "Brauchen Sie eine Pause? Kein Problem — Ihre Antworten sind gespeichert.",
    },
    {
      key: "patience.no_pressure",
      value: "Es besteht absolut kein Druck.",
    },
    {
      key: "patience.here_to_help",
      value: "Wir sind hier um zu helfen, nicht um zu urteilen.",
    },
    {
      key: "patience.privacy_assured",
      value: "Alles, was Sie mitteilen, ist privat und sicher.",
    },
    {
      key: "patience.repeat_question",
      value: "Möchten Sie, dass ich die Frage anders formuliere?",
    },
  ] as const;

  const translations = new Map(entries.map((e) => [e.key, { key: e.key, value: e.value }]));

  return {
    locale: "de",
    translations,
    metadata: {
      version: "1.0.0",
      completeness: 1.0,
      lastUpdated: "2026-03-10T00:00:00Z",
    },
  };
}
