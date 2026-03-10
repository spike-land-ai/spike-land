/**
 * Hindi (hi) — Locale Bundle
 *
 * Cultural notes:
 * - Honorific "आप" (aap) used for second person — respectful, not overly stiff
 * - "नमस्ते" (Namaste) is universal greeting — appropriate any time of day
 * - Warmth and family-oriented framing resonate strongly
 * - Questions phrased indirectly when possible to avoid confrontation
 * - Large numbers: lakh (1,00,000) and crore (1,00,00,000) systems
 * - Plural: zero or one → "one" form; everything else → "other"
 * - Date format: DD/MM/YYYY
 * - Currency: ₹ INR, prefix
 */

import type { Locale, LocaleBundle, TranslationEntry } from "../types.js";

// ---------------------------------------------------------------------------
// Locale descriptor
// ---------------------------------------------------------------------------

export const HI_LOCALE: Locale = {
  code: "hi",
  name: "Hindi",
  nativeName: "हिन्दी",
  direction: "ltr",
  formality: "adaptive",
  // Hindi: 0 and 1 → "one"; all others → "other"
  pluralRules: (n) => (n === 0 || n === 1 ? "one" : "other"),
};

// ---------------------------------------------------------------------------
// Bundle factory
// ---------------------------------------------------------------------------

export function buildHiBundle(): LocaleBundle {
  const entries = [
    // -----------------------------------------------------------------------
    // greetings
    // -----------------------------------------------------------------------
    {
      key: "greetings.hello",
      value: "नमस्ते{{namePart}}!",
    },
    {
      key: "greetings.morning",
      value: "सुप्रभात{{namePart}}!",
    },
    {
      key: "greetings.afternoon",
      value: "नमस्ते{{namePart}}!",
      context:
        "Hindi uses namaste throughout the day; morning/afternoon variants are formal but less common",
    },
    {
      key: "greetings.evening",
      value: "शुभ संध्या{{namePart}}!",
    },
    {
      key: "greetings.welcome_back",
      value: "वापस स्वागत है{{namePart}}!",
    },
    {
      key: "greetings.first_time",
      value: "स्वागत है! हमें खुशी है कि आप यहाँ हैं।",
    },

    // -----------------------------------------------------------------------
    // common
    // -----------------------------------------------------------------------
    {
      key: "common.yes",
      value: "हाँ",
    },
    {
      key: "common.no",
      value: "नहीं",
    },
    {
      key: "common.continue",
      value: "जारी रखें",
    },
    {
      key: "common.save",
      value: "सहेजें",
    },
    {
      key: "common.cancel",
      value: "रद्द करें",
    },
    {
      key: "common.done",
      value: "हो गया",
    },
    {
      key: "common.loading",
      value: "लोड हो रहा है…",
    },
    {
      key: "common.saving",
      value: "सहेजा जा रहा है…",
    },
    {
      key: "common.please_wait",
      value: "कृपया एक क्षण प्रतीक्षा करें।",
    },
    {
      key: "common.optional",
      value: "(वैकल्पिक)",
    },
    {
      key: "common.required",
      value: "आवश्यक",
    },
    {
      key: "common.or",
      value: "या",
    },
    {
      key: "common.and",
      value: "और",
    },
    {
      key: "common.not_sure",
      value: "मुझे यकीन नहीं है",
    },
    {
      key: "common.skip",
      value: "अभी के लिए छोड़ें",
    },
    {
      key: "common.help",
      value: "सहायता चाहिए?",
    },

    // -----------------------------------------------------------------------
    // eligibility
    // -----------------------------------------------------------------------
    {
      key: "eligibility.intro",
      value: "मैं आपके लिए सही सहायता खोजने के लिए कुछ प्रश्न पूछूँगा। " + "कोई भी उत्तर गलत नहीं होता।",
    },
    {
      key: "eligibility.age_question",
      value: "आपकी उम्र क्या है?",
    },
    {
      key: "eligibility.age_placeholder",
      value: "अपनी उम्र दर्ज करें",
    },
    {
      key: "eligibility.residency_question",
      value: "आप वर्तमान में किस देश या क्षेत्र में रहते हैं?",
    },
    {
      key: "eligibility.income_question",
      value:
        "आपके परिवार की अनुमानित वार्षिक आय क्या है? " +
        "इससे हमें वित्तीय सहायता कार्यक्रम खोजने में मदद मिलती है।",
    },
    {
      key: "eligibility.income_placeholder",
      value: "राशि दर्ज करें",
    },
    {
      key: "eligibility.household_size_question",
      value: "आपके घर में आपके सहित कितने लोग रहते हैं?",
    },
    {
      key: "eligibility.employment_question",
      value: "आपकी वर्तमान रोजगार स्थिति क्या है?",
    },
    {
      key: "eligibility.health_question",
      value: "क्या आपकी कोई स्वास्थ्य स्थिति है जिसे हमें पात्रता के लिए जानना चाहिए?",
    },
    {
      key: "eligibility.documents_question",
      value: "क्या आपके पास निम्नलिखित में से कोई दस्तावेज़ उपलब्ध हैं?",
    },
    {
      key: "eligibility.eligible_title",
      value: "बहुत अच्छी खबर — आप पात्र हो सकते हैं!",
    },
    {
      key: "eligibility.not_eligible_title",
      value: "हमें सटीक मिलान नहीं मिला, लेकिन हम खोज जारी रखेंगे।",
    },
    {
      key: "eligibility.review_answers",
      value: "अपने उत्तर देखें",
    },
    {
      key: "eligibility.items_found",
      value: {
        one: "आपके लिए {{count}} कार्यक्रम मिला।",
        other: "आपके लिए {{count}} कार्यक्रम मिले।",
      },
    },

    // -----------------------------------------------------------------------
    // navigation
    // -----------------------------------------------------------------------
    {
      key: "navigation.back",
      value: "वापस",
    },
    {
      key: "navigation.next",
      value: "अगला",
    },
    {
      key: "navigation.previous_question",
      value: "पिछला प्रश्न",
    },
    {
      key: "navigation.next_question",
      value: "अगला प्रश्न",
    },
    {
      key: "navigation.finish",
      value: "समाप्त करें",
    },
    {
      key: "navigation.step_of",
      value: "चरण {{current}} / {{total}}",
    },
    {
      key: "navigation.start_over",
      value: "फिर से शुरू करें",
    },
    {
      key: "navigation.exit",
      value: "बाहर निकलें",
    },
    {
      key: "navigation.home",
      value: "होम",
    },

    // -----------------------------------------------------------------------
    // errors
    // -----------------------------------------------------------------------
    {
      key: "errors.required_field",
      value: "यह फ़ील्ड आवश्यक है।",
    },
    {
      key: "errors.invalid_age",
      value: "कृपया एक वैध उम्र दर्ज करें (0–120)।",
    },
    {
      key: "errors.invalid_income",
      value: "कृपया एक वैध आय राशि दर्ज करें।",
    },
    {
      key: "errors.network_error",
      value: "हमारे सर्वर से कनेक्ट करने में कुछ समस्या हुई। कृपया पुनः प्रयास करें।",
    },
    {
      key: "errors.session_expired",
      value: "आपका सत्र समाप्त हो गया है। नए सिरे से शुरू करते हैं।",
    },
    {
      key: "errors.unexpected",
      value: "कुछ अप्रत्याशित हुआ। हम इसे ठीक कर रहे हैं!",
    },
    {
      key: "errors.not_found",
      value: "हमें वह नहीं मिला जो आप खोज रहे थे।",
    },
    {
      key: "errors.too_many_requests",
      value: "आप बहुत तेज़ी से आगे बढ़ रहे हैं! कृपया एक पल रुकें और फिर प्रयास करें।",
    },

    // -----------------------------------------------------------------------
    // encouragement
    // -----------------------------------------------------------------------
    {
      key: "encouragement.great_job",
      value: "आप बहुत अच्छा कर रहे हैं!",
    },
    {
      key: "encouragement.almost_done",
      value: "लगभग हो गया — बस कुछ और प्रश्न बचे हैं।",
    },
    {
      key: "encouragement.good_answer",
      value: "यह एक बेहतरीन उत्तर है, धन्यवाद।",
    },
    {
      key: "encouragement.halfway",
      value: "आप आधे रास्ते पर पहुँच गए हैं!",
    },
    {
      key: "encouragement.first_step",
      value: "आपने पहला कदम उठाया — यही सबसे मुश्किल होता है।",
    },
    {
      key: "encouragement.saved",
      value: "आपकी प्रगति सहेज ली गई है।",
    },

    // -----------------------------------------------------------------------
    // patience
    // -----------------------------------------------------------------------
    {
      key: "patience.take_your_time",
      value: "अपना समय लें — कोई जल्दी नहीं है।",
    },
    {
      key: "patience.no_wrong_answers",
      value: "यहाँ कोई गलत उत्तर नहीं होता।",
    },
    {
      key: "patience.come_back_later",
      value: "आप कभी भी वापस आकर इसे बाद में पूरा कर सकते हैं।",
    },
    {
      key: "patience.pause_anytime",
      value: "किसी भी समय रुकने में संकोच न करें।",
    },
    {
      key: "patience.your_pace",
      value: "हम आपकी गति से चलते हैं।",
    },
    {
      key: "patience.need_break",
      value: "क्या आपको विराम चाहिए? कोई बात नहीं — आपके उत्तर सहेजे गए हैं।",
    },
    {
      key: "patience.no_pressure",
      value: "यहाँ बिल्कुल भी कोई दबाव नहीं है।",
    },
    {
      key: "patience.here_to_help",
      value: "हम यहाँ मदद करने के लिए हैं, आँकने के लिए नहीं।",
    },
    {
      key: "patience.privacy_assured",
      value: "आप जो भी साझा करते हैं वह निजी और सुरक्षित है।",
    },
    {
      key: "patience.repeat_question",
      value: "क्या आप चाहेंगे कि मैं यह प्रश्न दूसरे तरीके से पूछूँ?",
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
    locale: "hi",
    translations,
    metadata: {
      version: "1.0.0",
      completeness: 1.0,
      lastUpdated: "2026-03-10T00:00:00Z",
    },
  };
}
