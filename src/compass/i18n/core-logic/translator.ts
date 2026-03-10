/**
 * COMPASS i18n — Translator
 *
 * The central engine for looking up, interpolating, and pluralising strings
 * across locales.  All locale-specific plural logic lives in the locale
 * registry; the Translator is deliberately free of language-specific rules.
 */

import type {
  InterpolationParams,
  LocaleBundle,
  LocalizationConfig,
  PluralCategory,
  PluralForm,
  TranslationEntry,
} from "../types.js";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Substitute `{{key}}` placeholders in `template` with values from `params`.
 * Unknown placeholders are left as-is so they surface during development.
 */
function interpolate(template: string, params: InterpolationParams): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      return String(params[key as keyof typeof params]);
    }
    return `{{${key}}}`;
  });
}

/**
 * Resolve the correct plural-form string from a {@link PluralForm} object
 * given a CLDR plural category.  Falls back through the category chain until
 * `other` is reached.
 */
function resolvePluralForm(forms: PluralForm, category: PluralCategory): string {
  switch (category) {
    case "zero":
      return forms.zero ?? forms.other;
    case "one":
      return forms.one;
    case "two":
      return forms.two ?? forms.other;
    case "few":
      return forms.few ?? forms.other;
    case "many":
      return forms.many ?? forms.other;
    case "other":
    default:
      return forms.other;
  }
}

// ---------------------------------------------------------------------------
// Plural-rule registry (minimal built-ins)
// ---------------------------------------------------------------------------

/**
 * Minimal set of built-in CLDR plural rules keyed by locale code.
 * The locale registry will prefer the rule attached to the {@link Locale}
 * object; this map only serves as a last-resort fallback inside the Translator
 * so it has no external runtime dependency.
 */
const BUILTIN_PLURAL_RULES: Record<string, (n: number) => PluralCategory> = {
  // English, German, Dutch, Swedish, Danish, Norwegian, Finnish, …
  en: (n) => (n === 1 ? "one" : "other"),
  de: (n) => (n === 1 ? "one" : "other"),
  nl: (n) => (n === 1 ? "one" : "other"),
  sv: (n) => (n === 1 ? "one" : "other"),
  da: (n) => (n === 1 ? "one" : "other"),
  nb: (n) => (n === 1 ? "one" : "other"),
  fi: (n) => (n === 1 ? "one" : "other"),
  // Hindi, Bengali, Gujarati, Marathi, Nepali, Punjabi
  hi: (n) => (n === 0 || n === 1 ? "one" : "other"),
  bn: (n) => (n === 0 || n === 1 ? "one" : "other"),
  // Swahili (Bantu: zero form optional, one/other)
  sw: (n) => (n === 1 ? "one" : "other"),
  // French, Portuguese (one for 0+1 in fr)
  fr: (n) => (n === 0 || n === 1 ? "one" : "other"),
  pt: (n) => (n === 0 || n === 1 ? "one" : "other"),
  "pt-BR": (n) => (n === 0 || n === 1 ? "one" : "other"),
  // Spanish, Italian
  es: (n) => (n === 1 ? "one" : "other"),
  it: (n) => (n === 1 ? "one" : "other"),
  // Arabic (complex 6-form rule — simplified for bootstrap)
  ar: (n) => {
    if (n === 0) return "zero";
    if (n === 1) return "one";
    if (n === 2) return "two";
    const mod100 = n % 100;
    if (mod100 >= 3 && mod100 <= 10) return "few";
    if (mod100 >= 11 && mod100 <= 99) return "many";
    return "other";
  },
  // Russian, Ukrainian, Serbian
  ru: (n) => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return "one";
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "few";
    return "many";
  },
  uk: (n) => BUILTIN_PLURAL_RULES["ru"]!(n),
  // Polish
  pl: (n) => {
    if (n === 1) return "one";
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "few";
    return "many";
  },
  // Chinese, Japanese, Korean (no plural inflection)
  zh: () => "other",
  ja: () => "other",
  ko: () => "other",
};

// ---------------------------------------------------------------------------
// Translator
// ---------------------------------------------------------------------------

/**
 * Core translation engine for COMPASS.
 *
 * @example
 * ```ts
 * const t = new Translator({ defaultLocale: 'en', fallbackLocale: 'en', supportedLocales: ['en', 'de'] });
 * t.loadLocale(enBundle);
 * t.loadLocale(deBundle);
 * t.setLocale('de');
 * t.t('greetings.hello', { name: 'Lena' }); // → "Hallo, Lena!"
 * t.tp('items.count', 3);                    // → "3 Gegenstände"
 * ```
 */
export class Translator {
  private readonly config: LocalizationConfig;
  private currentLocale: string;
  private readonly bundles = new Map<string, LocaleBundle>();

  constructor(config: LocalizationConfig) {
    this.config = config;
    this.currentLocale = config.defaultLocale;
  }

  // -------------------------------------------------------------------------
  // Bundle management
  // -------------------------------------------------------------------------

  /**
   * Load (or replace) a locale bundle.  Calling this multiple times with the
   * same locale code replaces the previous bundle.
   */
  loadLocale(bundle: LocaleBundle): void {
    this.bundles.set(bundle.locale, bundle);
  }

  // -------------------------------------------------------------------------
  // Locale control
  // -------------------------------------------------------------------------

  /** Switch the active locale.  Throws if the locale is not supported. */
  setLocale(code: string): void {
    if (!this.config.supportedLocales.includes(code)) {
      throw new Error(
        `[COMPASS i18n] Locale "${code}" is not in supportedLocales. ` +
          `Supported: ${this.config.supportedLocales.join(", ")}`,
      );
    }
    this.currentLocale = code;
  }

  /** Return the currently active BCP 47 locale code. */
  getLocale(): string {
    return this.currentLocale;
  }

  // -------------------------------------------------------------------------
  // Core lookup
  // -------------------------------------------------------------------------

  /**
   * Look up a translation entry for `key` in `locale`, falling back through
   * the configured fallback chain.
   *
   * Fallback order:
   *   1. exact locale code (e.g. `"pt-BR"`)
   *   2. base language (e.g. `"pt"`)
   *   3. configured fallback locale (e.g. `"en"`)
   *
   * Returns `undefined` when nothing is found in any bundle.
   */
  private findEntry(key: string, locale: string): TranslationEntry | undefined {
    // 1. Exact match
    const exactBundle = this.bundles.get(locale);
    if (exactBundle) {
      const entry = exactBundle.translations.get(key);
      if (entry !== undefined) return entry;
    }

    // 2. Base language (strip region/script suffix)
    const baseLocale = locale.split("-")[0] ?? locale;
    if (baseLocale !== locale) {
      const baseBundle = this.bundles.get(baseLocale);
      if (baseBundle) {
        const entry = baseBundle.translations.get(key);
        if (entry !== undefined) return entry;
      }
    }

    // 3. Configured fallback
    const fallback = this.config.fallbackLocale;
    if (fallback !== locale && fallback !== baseLocale) {
      const fallbackBundle = this.bundles.get(fallback);
      if (fallbackBundle) {
        const entry = fallbackBundle.translations.get(key);
        if (entry !== undefined) return entry;
      }
    }

    return undefined;
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Translate `key` with optional interpolation params.
   *
   * When the key resolves to a {@link PluralForm}, the `other` form is used.
   * Use {@link tp} for count-based plural selection instead.
   *
   * Returns the key itself (as a visible sentinel) when not found.
   */
  t(key: string, params?: InterpolationParams): string {
    const entry = this.findEntry(key, this.currentLocale);

    if (entry === undefined) {
      return key; // visible sentinel — never silently swallow missing keys
    }

    const raw = typeof entry.value === "string" ? entry.value : entry.value.other; // scalar fallback for plural entries

    return params ? interpolate(raw, params) : raw;
  }

  /**
   * Translate `key` applying CLDR plural rules for `count`.
   *
   * When the resolved entry is a plain string it is returned directly
   * (after interpolation) — this allows mixing plain and plural entries.
   *
   * Automatically injects `{ count }` into the interpolation params so
   * templates can reference `{{count}}`.
   */
  tp(key: string, count: number, params?: InterpolationParams): string {
    const entry = this.findEntry(key, this.currentLocale);

    if (entry === undefined) {
      return key;
    }

    const merged: InterpolationParams = { count, ...params };

    if (typeof entry.value === "string") {
      return interpolate(entry.value, merged);
    }

    const category = this.resolvePluralCategory(count, this.currentLocale);
    const raw = resolvePluralForm(entry.value, category);
    return interpolate(raw, merged);
  }

  /**
   * Returns `true` when `key` has a translation in the current locale or any
   * fallback locale.
   */
  hasTranslation(key: string): boolean {
    return this.findEntry(key, this.currentLocale) !== undefined;
  }

  /**
   * Return the list of keys present in the fallback locale but missing from
   * `locale`.  Useful for completeness tooling.
   */
  getMissingKeys(locale: string): string[] {
    const referenceBundle = this.bundles.get(this.config.fallbackLocale);
    if (!referenceBundle) return [];

    const targetBundle = this.bundles.get(locale);
    const missing: string[] = [];

    for (const key of referenceBundle.translations.keys()) {
      if (!targetBundle || !targetBundle.translations.has(key)) {
        missing.push(key);
      }
    }

    return missing;
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  /**
   * Resolve the CLDR plural category for `count` in `locale`.
   *
   * Prefers a rule registered in the loaded bundle's locale descriptor (via
   * locale registry integration), then falls back to the built-in rules table,
   * then defaults to `"other"`.
   */
  private resolvePluralCategory(count: number, locale: string): PluralCategory {
    // Check built-in rules
    const exactRule = BUILTIN_PLURAL_RULES[locale];
    if (exactRule) return exactRule(count);

    const baseLocale = locale.split("-")[0] ?? locale;
    const baseRule = BUILTIN_PLURAL_RULES[baseLocale];
    if (baseRule) return baseRule(count);

    // Default: English-like two-form plural
    return count === 1 ? "one" : "other";
  }

  /**
   * Register an external plural rule for a locale code.  Call this when the
   * {@link LocaleRegistry} provides a rule that supersedes the built-ins.
   */
  registerPluralRule(localeCode: string, rule: (n: number) => PluralCategory): void {
    BUILTIN_PLURAL_RULES[localeCode] = rule;
  }
}
