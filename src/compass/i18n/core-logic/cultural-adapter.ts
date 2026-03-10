/**
 * COMPASS i18n — CulturalAdapter
 *
 * Provides culturally-appropriate conversation patterns, date/currency
 * formatting conventions, and the "radically patient" phrasing bundles that
 * are the heart of COMPASS UX.
 *
 * All methods are pure (no I/O, no randomness) and return deterministic
 * results based on the locale code.  Where a locale is unknown the adapter
 * falls back gracefully to `"en"`.
 */

import type { CurrencyFormat, FormalityLevel, PatientPhrasing } from "../types.js";

// ---------------------------------------------------------------------------
// Internal locale data tables
// ---------------------------------------------------------------------------

/**
 * Time-of-day greeting templates.
 *
 * Keys are BCP 47 codes; values map `morning | afternoon | evening | night`
 * to a template string.  `{{name}}` is an optional interpolation placeholder.
 *
 * Cultural notes embedded as comments.
 */
const GREETING_DATA: Record<string, Record<string, string>> = {
  en: {
    morning: "Good morning{{namePart}}!",
    afternoon: "Good afternoon{{namePart}}!",
    evening: "Good evening{{namePart}}!",
    night: "Good evening{{namePart}}!", // English uses "evening" at night too
    default: "Hello{{namePart}}!",
  },
  de: {
    // German: formal "Guten Morgen" — no comma splice, direct salutation
    morning: "Guten Morgen{{namePart}}!",
    afternoon: "Guten Tag{{namePart}}!",
    evening: "Guten Abend{{namePart}}!",
    night: "Guten Abend{{namePart}}!",
    default: "Hallo{{namePart}}!",
  },
  hi: {
    // Hindi: "Namaste" is all-purpose; time variants exist but are less common
    morning: "सुप्रभात{{namePart}}!",
    afternoon: "नमस्ते{{namePart}}!",
    evening: "शुभ संध्या{{namePart}}!",
    night: "शुभ रात्रि{{namePart}}!",
    default: "नमस्ते{{namePart}}!",
  },
  sw: {
    // Swahili: "Habari za asubuhi" = "News of the morning" (how are you, morning)
    morning: "Habari za asubuhi{{namePart}}!",
    afternoon: "Habari za mchana{{namePart}}!",
    evening: "Habari za jioni{{namePart}}!",
    night: "Habari za usiku{{namePart}}!",
    default: "Habari{{namePart}}!",
  },
  ar: {
    morning: "صباح الخير{{namePart}}!",
    afternoon: "مساء الخير{{namePart}}!",
    evening: "مساء الخير{{namePart}}!",
    night: "تصبح على خير{{namePart}}!",
    default: "مرحبا{{namePart}}!",
  },
  fr: {
    morning: "Bonjour{{namePart}} !",
    afternoon: "Bon après-midi{{namePart}} !",
    evening: "Bonsoir{{namePart}} !",
    night: "Bonsoir{{namePart}} !",
    default: "Bonjour{{namePart}} !",
  },
  es: {
    morning: "¡Buenos días{{namePart}}!",
    afternoon: "¡Buenas tardes{{namePart}}!",
    evening: "¡Buenas noches{{namePart}}!",
    night: "¡Buenas noches{{namePart}}!",
    default: "¡Hola{{namePart}}!",
  },
  pt: {
    morning: "Bom dia{{namePart}}!",
    afternoon: "Boa tarde{{namePart}}!",
    evening: "Boa noite{{namePart}}!",
    night: "Boa noite{{namePart}}!",
    default: "Olá{{namePart}}!",
  },
  ja: {
    morning: "おはようございます{{namePart}}。",
    afternoon: "こんにちは{{namePart}}。",
    evening: "こんばんは{{namePart}}。",
    night: "こんばんは{{namePart}}。",
    default: "こんにちは{{namePart}}。",
  },
  zh: {
    morning: "早上好{{namePart}}！",
    afternoon: "下午好{{namePart}}！",
    evening: "晚上好{{namePart}}！",
    night: "晚上好{{namePart}}！",
    default: "你好{{namePart}}！",
  },
};

// ---------------------------------------------------------------------------

/**
 * Formality-transformation lookup tables.
 *
 * Rather than attempting full grammatical re-inflection (which requires NLP),
 * we provide a pragmatic set of replacements for common English patterns and
 * marker words in each language.  The adapter signals its cultural intent; the
 * full formal/informal rewrite is expected to be handled by the translation
 * bundle strings themselves.
 *
 * Format: `{ formal: [searchPattern, replacement][], informal: [...] }`
 */
const FORMALITY_PATTERNS: Record<
  string,
  {
    formal: Array<[RegExp, string]>;
    informal: Array<[RegExp, string]>;
  }
> = {
  en: {
    formal: [
      [/\bcan't\b/gi, "cannot"],
      [/\bwon't\b/gi, "will not"],
      [/\bdon't\b/gi, "do not"],
      [/\bI'm\b/gi, "I am"],
      [/\byou're\b/gi, "you are"],
      [/\bwe're\b/gi, "we are"],
      [/\bhey\b/gi, "hello"],
      [/\byeah\b/gi, "yes"],
    ],
    informal: [
      [/\bcannot\b/gi, "can't"],
      [/\bwill not\b/gi, "won't"],
      [/\bdo not\b/gi, "don't"],
      [/\bhello\b/gi, "hey"],
    ],
  },
  de: {
    // Replace informal "du" forms with formal "Sie" forms (surface markers only)
    formal: [
      [/\bdu\b/g, "Sie"],
      [/\bdein\b/g, "Ihr"],
      [/\bdeine\b/g, "Ihre"],
      [/\bdeinen\b/g, "Ihren"],
    ],
    informal: [
      [/\bSie\b/g, "du"],
      [/\bIhr\b/g, "dein"],
      [/\bIhre\b/g, "deine"],
    ],
  },
  hi: {
    // आप (formal you) vs तुम/तू (informal)
    // \b does not work with Unicode Devanagari — use lookahead/lookbehind on
    // whitespace/start-of-string/end-of-string boundaries instead.
    formal: [
      [/(?<![^\s])तुम(?![^\s])/gu, "आप"],
      [/(?<![^\s])तू(?![^\s])/gu, "आप"],
    ],
    informal: [[/(?<![^\s])आप(?![^\s])/gu, "तुम"]],
  },
  sw: {
    // Swahili has fewer grammatical formality markers; politeness is via
    // "tafadhali" (please) and certain verb prefixes.  We inject "tafadhali".
    formal: [[/\bsema\b/g, "tafadhali sema"]],
    informal: [],
  },
};

// ---------------------------------------------------------------------------

/** Locale → date format string (using strftime-like tokens). */
const DATE_FORMATS: Record<string, string> = {
  en: "MM/DD/YYYY",
  "en-GB": "DD/MM/YYYY",
  de: "DD.MM.YYYY",
  fr: "DD/MM/YYYY",
  es: "DD/MM/YYYY",
  pt: "DD/MM/YYYY",
  "pt-BR": "DD/MM/YYYY",
  hi: "DD/MM/YYYY",
  sw: "DD/MM/YYYY",
  ja: "YYYY/MM/DD",
  zh: "YYYY-MM-DD",
  "zh-TW": "YYYY/MM/DD",
  ko: "YYYY.MM.DD",
  ar: "DD/MM/YYYY",
  ru: "DD.MM.YYYY",
  pl: "DD.MM.YYYY",
  tr: "DD.MM.YYYY",
  nl: "DD-MM-YYYY",
  sv: "YYYY-MM-DD",
  da: "DD-MM-YYYY",
  nb: "DD.MM.YYYY",
  fi: "D.M.YYYY",
  // Default
  _default: "YYYY-MM-DD",
};

// ---------------------------------------------------------------------------

/** Locale → currency format. */
const CURRENCY_FORMATS: Record<string, CurrencyFormat> = {
  en: { symbol: "$", position: "prefix", decimals: 2, currencyCode: "USD" },
  "en-GB": { symbol: "£", position: "prefix", decimals: 2, currencyCode: "GBP" },
  "en-AU": { symbol: "A$", position: "prefix", decimals: 2, currencyCode: "AUD" },
  "en-CA": { symbol: "CA$", position: "prefix", decimals: 2, currencyCode: "CAD" },
  de: { symbol: "€", position: "suffix", decimals: 2, currencyCode: "EUR" },
  fr: { symbol: "€", position: "suffix", decimals: 2, currencyCode: "EUR" },
  es: { symbol: "€", position: "suffix", decimals: 2, currencyCode: "EUR" },
  "es-MX": { symbol: "$", position: "prefix", decimals: 2, currencyCode: "MXN" },
  pt: { symbol: "€", position: "suffix", decimals: 2, currencyCode: "EUR" },
  "pt-BR": { symbol: "R$", position: "prefix", decimals: 2, currencyCode: "BRL" },
  hi: { symbol: "₹", position: "prefix", decimals: 2, currencyCode: "INR" },
  sw: { symbol: "KSh", position: "prefix", decimals: 2, currencyCode: "KES" },
  ja: { symbol: "¥", position: "prefix", decimals: 0, currencyCode: "JPY" },
  zh: { symbol: "¥", position: "prefix", decimals: 2, currencyCode: "CNY" },
  ko: { symbol: "₩", position: "prefix", decimals: 0, currencyCode: "KRW" },
  ar: { symbol: "ر.س", position: "suffix", decimals: 2, currencyCode: "SAR" },
  ru: { symbol: "₽", position: "suffix", decimals: 2, currencyCode: "RUB" },
  tr: { symbol: "₺", position: "prefix", decimals: 2, currencyCode: "TRY" },
  nl: { symbol: "€", position: "prefix", decimals: 2, currencyCode: "EUR" },
  sv: { symbol: "kr", position: "suffix", decimals: 2, currencyCode: "SEK" },
  pl: { symbol: "zł", position: "suffix", decimals: 2, currencyCode: "PLN" },
};

// ---------------------------------------------------------------------------

/**
 * Locale → patient phrasing bundles.
 *
 * These are the "radically patient" phrases that make COMPASS feel warm and
 * unhurried in every language.
 */
const PATIENT_PHRASING_DATA: Record<string, PatientPhrasing> = {
  en: {
    encouragement: [
      "You're doing great!",
      "That's a great answer.",
      "Perfect, thank you!",
      "Every detail helps.",
      "You're almost there!",
    ],
    patience: [
      "Take your time.",
      "No worries at all.",
      "We can slow down whenever you'd like.",
      "There's no pressure here.",
      "Whenever you're ready.",
    ],
    noRush: [
      "There's no rush.",
      "We can come back to this.",
      "We can pause here if you need.",
      "This can wait — your comfort matters most.",
      "Let's go at your pace.",
    ],
  },
  de: {
    // Formal German — "Sie" throughout, warm but structured
    encouragement: [
      "Sie machen das wunderbar!",
      "Das ist eine tolle Antwort.",
      "Perfekt, vielen Dank!",
      "Jedes Detail ist hilfreich.",
      "Sie sind fast fertig!",
    ],
    patience: [
      "Lassen Sie sich ruhig Zeit.",
      "Kein Problem.",
      "Wir können jederzeit langsamer werden.",
      "Es gibt keinerlei Druck.",
      "Wenn Sie so weit sind.",
    ],
    noRush: [
      "Es eilt nicht.",
      "Wir können das jederzeit nachholen.",
      "Wir können hier gerne pausieren.",
      "Das hat Zeit — Ihr Wohlbefinden hat Vorrang.",
      "Wir gehen in Ihrem Tempo.",
    ],
  },
  hi: {
    encouragement: [
      "आप बहुत अच्छा कर रहे हैं!",
      "यह एक बढ़िया जवाब है।",
      "बिल्कुल सही, धन्यवाद!",
      "हर विवरण मददगार है।",
      "आप लगभग पहुँच गए हैं!",
    ],
    patience: [
      "अपना समय लें।",
      "कोई चिंता नहीं।",
      "हम जब चाहें धीमे हो सकते हैं।",
      "यहाँ कोई दबाव नहीं है।",
      "जब आप तैयार हों।",
    ],
    noRush: [
      "कोई जल्दी नहीं है।",
      "हम इस पर बाद में वापस आ सकते हैं।",
      "हम यहाँ रुक सकते हैं।",
      "यह प्रतीक्षा कर सकता है — आपकी सुविधा सबसे महत्वपूर्ण है।",
      "हम आपकी गति से चलेंगे।",
    ],
  },
  sw: {
    encouragement: [
      "Unafanya vizuri sana!",
      "Hiyo ni jibu zuri sana.",
      "Vizuri kabisa, asante!",
      "Kila undani unasaidia.",
      "Uko karibu sana!",
    ],
    patience: [
      "Chukua muda wako.",
      "Hakuna wasiwasi.",
      "Tunaweza kupunguza kasi wakati wowote.",
      "Hakuna shinikizo hapa.",
      "Unapokuwa tayari.",
    ],
    noRush: [
      "Hakuna haraka.",
      "Tunaweza kurudi hapa baadaye.",
      "Tunaweza kusimama hapa ukihitaji.",
      "Hii inaweza kusubiri — faraja yako ndiyo muhimu zaidi.",
      "Tutaendelea kwa kasi yako.",
    ],
  },
  fr: {
    encouragement: [
      "Vous vous en sortez très bien !",
      "C'est une excellente réponse.",
      "Parfait, merci !",
      "Chaque détail est utile.",
      "Vous y êtes presque !",
    ],
    patience: [
      "Prenez votre temps.",
      "Pas de souci.",
      "Nous pouvons ralentir quand vous le souhaitez.",
      "Il n'y a aucune pression ici.",
      "Quand vous êtes prêt(e).",
    ],
    noRush: [
      "Il n'y a pas de précipitation.",
      "Nous pouvons y revenir.",
      "Nous pouvons faire une pause ici.",
      "Cela peut attendre — votre confort est primordial.",
      "Allons à votre rythme.",
    ],
  },
  es: {
    encouragement: [
      "¡Lo está haciendo muy bien!",
      "Esa es una respuesta excelente.",
      "¡Perfecto, gracias!",
      "Cada detalle es de ayuda.",
      "¡Ya casi termina!",
    ],
    patience: [
      "Tómese su tiempo.",
      "No se preocupe.",
      "Podemos ir más despacio cuando quiera.",
      "No hay ninguna presión.",
      "Cuando esté listo/a.",
    ],
    noRush: [
      "No hay prisa.",
      "Podemos volver a esto.",
      "Podemos pausar aquí si necesita.",
      "Esto puede esperar — su comodidad es lo más importante.",
      "Vamos a su ritmo.",
    ],
  },
  ar: {
    encouragement: [
      "أنت تبلي بلاءً حسناً!",
      "هذه إجابة رائعة.",
      "ممتاز، شكراً لك!",
      "كل التفاصيل مفيدة.",
      "لقد اقتربت كثيراً!",
    ],
    patience: [
      "خذ وقتك.",
      "لا داعي للقلق.",
      "يمكننا التباطؤ متى أردت.",
      "لا يوجد أي ضغط هنا.",
      "عندما تكون مستعداً.",
    ],
    noRush: [
      "لا استعجال.",
      "يمكننا العودة إلى هذا لاحقاً.",
      "يمكننا التوقف هنا إن احتجت.",
      "هذا يمكن أن ينتظر — راحتك هي الأهم.",
      "سنسير بالوتيرة التي تناسبك.",
    ],
  },
};

// ---------------------------------------------------------------------------
// CulturalAdapter
// ---------------------------------------------------------------------------

/**
 * Provides culturally-adapted content for COMPASS conversations.
 *
 * None of the methods throw — unknown locales fall back to English
 * so the application degrades gracefully for any of the 50+ Phase-1
 * locales that may not yet have full data tables.
 */
export class CulturalAdapter {
  // -------------------------------------------------------------------------
  // Greetings
  // -------------------------------------------------------------------------

  /**
   * Return a culturally appropriate greeting for the given locale and time of
   * day.
   *
   * @param locale   - BCP 47 locale code.
   * @param timeOfDay - One of `"morning"`, `"afternoon"`, `"evening"`,
   *                    `"night"`, or any string (falls back to `"default"`).
   * @param name      - Optional addressee name to weave into the greeting.
   *
   * @example
   * ```ts
   * adapter.adaptGreeting('de', 'morning', 'Lena'); // "Guten Morgen, Lena!"
   * adapter.adaptGreeting('hi', 'evening');          // "शुभ संध्या!"
   * ```
   */
  adaptGreeting(locale: string, timeOfDay: string, name?: string): string {
    const data =
      GREETING_DATA[locale] ?? GREETING_DATA[this.baseLocale(locale)] ?? GREETING_DATA["en"]!;

    const key = timeOfDay.toLowerCase();
    const template = (data[key] ?? data["default"])!;

    // Build the name interpolation part, inserting a comma separator
    // only when a name is provided — e.g. "Good morning, Lena!"
    const namePart = name ? `, ${name}` : "";
    return template.replace("{{namePart}}", namePart);
  }

  // -------------------------------------------------------------------------
  // Formality adaptation
  // -------------------------------------------------------------------------

  /**
   * Apply surface-level formality markers to `text` for the given locale.
   *
   * This is a best-effort transformation useful for runtime overrides.  For
   * structured content the translation bundle strings should already carry the
   * correct register; this method is for dynamic / AI-generated text.
   *
   * @param text     - Input text in the target locale.
   * @param locale   - BCP 47 locale code.
   * @param formality - Desired output formality level.
   */
  adaptFormality(text: string, locale: string, formality: FormalityLevel): string {
    if (formality === "adaptive") return text; // no-op

    const patterns = FORMALITY_PATTERNS[locale] ?? FORMALITY_PATTERNS[this.baseLocale(locale)];

    if (!patterns) return text;

    const replacements = formality === "formal" ? patterns.formal : patterns.informal;
    return replacements.reduce(
      (acc, [pattern, replacement]) => acc.replace(pattern, replacement),
      text,
    );
  }

  // -------------------------------------------------------------------------
  // Date format
  // -------------------------------------------------------------------------

  /**
   * Return the conventional date format token string for `locale`.
   *
   * Tokens follow a strftime-like convention:
   * - `DD`   — zero-padded day
   * - `MM`   — zero-padded month
   * - `YYYY` — four-digit year
   *
   * @example
   * ```ts
   * adapter.getDateFormat('de');     // "DD.MM.YYYY"
   * adapter.getDateFormat('ja');     // "YYYY/MM/DD"
   * adapter.getDateFormat('en-US');  // "MM/DD/YYYY"
   * ```
   */
  getDateFormat(locale: string): string {
    return (
      DATE_FORMATS[locale] ?? DATE_FORMATS[this.baseLocale(locale)] ?? DATE_FORMATS["_default"]!
    );
  }

  // -------------------------------------------------------------------------
  // Currency format
  // -------------------------------------------------------------------------

  /**
   * Return the {@link CurrencyFormat} descriptor for `locale`.
   *
   * Falls back to USD/en when the locale is unrecognised.
   *
   * @example
   * ```ts
   * adapter.getCurrencyFormat('de');  // { symbol: '€', position: 'suffix', ... }
   * adapter.getCurrencyFormat('hi');  // { symbol: '₹', position: 'prefix', ... }
   * ```
   */
  getCurrencyFormat(locale: string): CurrencyFormat {
    return (
      CURRENCY_FORMATS[locale] ??
      CURRENCY_FORMATS[this.baseLocale(locale)] ??
      CURRENCY_FORMATS["en"]!
    );
  }

  // -------------------------------------------------------------------------
  // Patient phrasing
  // -------------------------------------------------------------------------

  /**
   * Return the "radically patient" phrasing bundle for `locale`.
   *
   * Falls back through base locale then English so every locale always gets
   * meaningful content.
   *
   * @example
   * ```ts
   * const phrases = adapter.getPatientPhrasing('sw');
   * phrases.noRush[0]; // "Hakuna haraka."
   * ```
   */
  getPatientPhrasing(locale: string): PatientPhrasing {
    return (
      PATIENT_PHRASING_DATA[locale] ??
      PATIENT_PHRASING_DATA[this.baseLocale(locale)] ??
      PATIENT_PHRASING_DATA["en"]!
    );
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------

  /** Extract the base language tag from a BCP 47 code. */
  private baseLocale(code: string): string {
    return code.split("-")[0] ?? code;
  }
}
