/**
 * Swahili (sw) — Locale Bundle (Kenya / East Africa focus)
 *
 * Cultural notes:
 * - Swahili greetings are elaborate call-and-response; "Habari?" (news/how are you)
 *   is a daily ritual — the response is typically "Nzuri" (fine/good)
 * - "Karibu" (welcome) is extremely common and warm — use it freely
 * - Politeness marker "tafadhali" (please) elevates formality gracefully
 * - Community and family framing resonates: "sisi" (we/us) over "mimi" (I)
 * - "Hakuna matata" is real: genuine cultural philosophy of ease/no worries
 * - Numbers: simple two-form plural (one/other), same as English
 * - Date format: DD/MM/YYYY
 * - Currency: KSh (Kenyan Shilling), prefix
 */

import type { Locale, LocaleBundle, TranslationEntry } from "../types.js";

// ---------------------------------------------------------------------------
// Locale descriptor
// ---------------------------------------------------------------------------

export const SW_LOCALE: Locale = {
  code: "sw",
  name: "Swahili",
  nativeName: "Kiswahili",
  direction: "ltr",
  formality: "adaptive",
  pluralRules: (n) => (n === 1 ? "one" : "other"),
};

// ---------------------------------------------------------------------------
// Bundle factory
// ---------------------------------------------------------------------------

export function buildSwBundle(): LocaleBundle {
  const entries = [
    // -----------------------------------------------------------------------
    // greetings
    // -----------------------------------------------------------------------
    {
      key: "greetings.hello",
      value: "Habari{{namePart}}!",
      context: "Swahili greeting meaning 'news?' / 'how are you?' — universally appropriate",
    },
    {
      key: "greetings.morning",
      value: "Habari za asubuhi{{namePart}}!",
    },
    {
      key: "greetings.afternoon",
      value: "Habari za mchana{{namePart}}!",
    },
    {
      key: "greetings.evening",
      value: "Habari za jioni{{namePart}}!",
    },
    {
      key: "greetings.welcome_back",
      value: "Karibu tena{{namePart}}!",
      context: "'Karibu' = welcome; 'tena' = again/back",
    },
    {
      key: "greetings.first_time",
      value: "Karibu! Tunafurahi kuwa nawe.",
    },

    // -----------------------------------------------------------------------
    // common
    // -----------------------------------------------------------------------
    {
      key: "common.yes",
      value: "Ndiyo",
    },
    {
      key: "common.no",
      value: "Hapana",
    },
    {
      key: "common.continue",
      value: "Endelea",
    },
    {
      key: "common.save",
      value: "Hifadhi",
    },
    {
      key: "common.cancel",
      value: "Ghairi",
    },
    {
      key: "common.done",
      value: "Imekamilika",
    },
    {
      key: "common.loading",
      value: "Inapakia…",
    },
    {
      key: "common.saving",
      value: "Inahifadhi…",
    },
    {
      key: "common.please_wait",
      value: "Tafadhali subiri kidogo.",
    },
    {
      key: "common.optional",
      value: "(hiari)",
    },
    {
      key: "common.required",
      value: "Inahitajika",
    },
    {
      key: "common.or",
      value: "au",
    },
    {
      key: "common.and",
      value: "na",
    },
    {
      key: "common.not_sure",
      value: "Sijui",
    },
    {
      key: "common.skip",
      value: "Ruka kwa sasa",
    },
    {
      key: "common.help",
      value: "Unahitaji msaada?",
    },

    // -----------------------------------------------------------------------
    // eligibility
    // -----------------------------------------------------------------------
    {
      key: "eligibility.intro",
      value:
        "Nitakuuliza maswali machache ili kupata msaada unaofaa kwako. " + "Hakuna majibu mabaya.",
    },
    {
      key: "eligibility.age_question",
      value: "Una umri gani?",
    },
    {
      key: "eligibility.age_placeholder",
      value: "Ingiza umri wako",
    },
    {
      key: "eligibility.residency_question",
      value: "Unaishi nchi au mkoa gani kwa sasa?",
    },
    {
      key: "eligibility.income_question",
      value:
        "Mapato ya kila mwaka ya kaya yako ni kiasi gani takriban? " +
        "Hii inatusaidia kupata programu za msaada wa kifedha.",
    },
    {
      key: "eligibility.income_placeholder",
      value: "Ingiza kiasi",
    },
    {
      key: "eligibility.household_size_question",
      value: "Watu wangapi wanaishi katika nyumba yako, ukijumuisha wewe mwenyewe?",
    },
    {
      key: "eligibility.employment_question",
      value: "Hali yako ya sasa ya ajira ni ipi?",
    },
    {
      key: "eligibility.health_question",
      value: "Je, una hali yoyote ya kiafya ambayo tunapaswa kujua kwa madhumuni ya ustahili?",
    },
    {
      key: "eligibility.documents_question",
      value: "Je, una hati zozote zifuatazo zinazopatikana?",
    },
    {
      key: "eligibility.eligible_title",
      value: "Habari njema — unaweza kuwa na haki ya kupata msaada!",
    },
    {
      key: "eligibility.not_eligible_title",
      value: "Hatukupata mechi sahihi, lakini tutaendelea kutafuta.",
    },
    {
      key: "eligibility.review_answers",
      value: "Kagua majibu yako",
    },
    {
      key: "eligibility.items_found",
      value: {
        one: "Programu {{count}} imepatikana kwako.",
        other: "Programu {{count}} zimepatikana kwako.",
      },
    },

    // -----------------------------------------------------------------------
    // navigation
    // -----------------------------------------------------------------------
    {
      key: "navigation.back",
      value: "Rudi",
    },
    {
      key: "navigation.next",
      value: "Mbele",
    },
    {
      key: "navigation.previous_question",
      value: "Swali la awali",
    },
    {
      key: "navigation.next_question",
      value: "Swali lijalo",
    },
    {
      key: "navigation.finish",
      value: "Maliza",
    },
    {
      key: "navigation.step_of",
      value: "Hatua {{current}} kati ya {{total}}",
    },
    {
      key: "navigation.start_over",
      value: "Anza upya",
    },
    {
      key: "navigation.exit",
      value: "Toka",
    },
    {
      key: "navigation.home",
      value: "Nyumbani",
    },

    // -----------------------------------------------------------------------
    // errors
    // -----------------------------------------------------------------------
    {
      key: "errors.required_field",
      value: "Sehemu hii inahitajika.",
    },
    {
      key: "errors.invalid_age",
      value: "Tafadhali ingiza umri halali (0–120).",
    },
    {
      key: "errors.invalid_income",
      value: "Tafadhali ingiza kiasi halali cha mapato.",
    },
    {
      key: "errors.network_error",
      value: "Kuna tatizo la kuunganika na seva zetu. Tafadhali jaribu tena.",
    },
    {
      key: "errors.session_expired",
      value: "Kikao chako kimeisha. Tuanze upya.",
    },
    {
      key: "errors.unexpected",
      value: "Kitu kisichotarajiwa kimetokea. Tunashughulikia!",
    },
    {
      key: "errors.not_found",
      value: "Hatukuweza kupata ulichokuwa unatafuta.",
    },
    {
      key: "errors.too_many_requests",
      value: "Unasonga haraka sana! Tafadhali subiri kidogo kisha ujaribu tena.",
    },

    // -----------------------------------------------------------------------
    // encouragement
    // -----------------------------------------------------------------------
    {
      key: "encouragement.great_job",
      value: "Unafanya vizuri sana!",
    },
    {
      key: "encouragement.almost_done",
      value: "Karibu kumaliza — maswali machache zaidi.",
    },
    {
      key: "encouragement.good_answer",
      value: "Hiyo ni jibu zuri sana, asante.",
    },
    {
      key: "encouragement.halfway",
      value: "Uko nusu ya njia!",
    },
    {
      key: "encouragement.first_step",
      value: "Umechukua hatua ya kwanza — hiyo ndiyo ngumu zaidi.",
    },
    {
      key: "encouragement.saved",
      value: "Maendeleo yako yamehifadhiwa.",
    },

    // -----------------------------------------------------------------------
    // patience
    // -----------------------------------------------------------------------
    {
      key: "patience.take_your_time",
      value: "Chukua muda wako — hakuna haraka.",
    },
    {
      key: "patience.no_wrong_answers",
      value: "Hakuna majibu mabaya hapa.",
    },
    {
      key: "patience.come_back_later",
      value: "Unaweza kurudi wakati wowote na kumaliza baadaye.",
    },
    {
      key: "patience.pause_anytime",
      value: "Jisikie huru kusimama wakati wowote.",
    },
    {
      key: "patience.your_pace",
      value: "Tutaendelea kwa kasi yako.",
    },
    {
      key: "patience.need_break",
      value: "Unahitaji mapumziko? Hakuna shida — majibu yako yamehifadhiwa.",
    },
    {
      key: "patience.no_pressure",
      value: "Hakuna shinikizo hapa kabisa.",
    },
    {
      key: "patience.here_to_help",
      value: "Tuko hapa kusaidia, si kukuhukumu.",
    },
    {
      key: "patience.privacy_assured",
      value: "Kila unachoshiriki ni cha siri na salama.",
    },
    {
      key: "patience.repeat_question",
      value: "Je, ungependa niulize swali hilo kwa njia tofauti?",
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
    locale: "sw",
    translations,
    metadata: {
      version: "1.0.0",
      completeness: 1.0,
      lastUpdated: "2026-03-10T00:00:00Z",
    },
  };
}
