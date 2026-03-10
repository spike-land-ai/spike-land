/**
 * COMPASS i18n Framework — Core Type Definitions
 *
 * Designed for culturally-aware localization across 50+ languages.
 * Not just translation — culturally appropriate conversation patterns,
 * formality levels, and local idioms.
 */

// ---------------------------------------------------------------------------
// Text direction
// ---------------------------------------------------------------------------

/** Writing direction for a locale. */
export type TextDirection = "ltr" | "rtl";

// ---------------------------------------------------------------------------
// Formality
// ---------------------------------------------------------------------------

/**
 * Formality register for a locale.
 *
 * - `formal`   — always uses the formal register (e.g. German "Sie")
 * - `informal` — always uses the informal/familiar register
 * - `adaptive` — picks the register based on context (default for many locales)
 */
export type FormalityLevel = "formal" | "informal" | "adaptive";

// ---------------------------------------------------------------------------
// Plural rules
// ---------------------------------------------------------------------------

/**
 * CLDR plural-rule category names.
 *
 * @see https://unicode.org/reports/tr35/tr35-numbers.html#Language_Plural_Rules
 */
export type PluralCategory = "zero" | "one" | "two" | "few" | "many" | "other";

/**
 * A function that maps a numeric count to its CLDR plural category for a given
 * locale.  Pure — no side effects.
 */
export type PluralRule = (count: number) => PluralCategory;

// ---------------------------------------------------------------------------
// Locale
// ---------------------------------------------------------------------------

/**
 * Full descriptor for a single supported locale.
 *
 * @example
 * ```ts
 * const de: Locale = {
 *   code: 'de',
 *   name: 'German',
 *   nativeName: 'Deutsch',
 *   direction: 'ltr',
 *   formality: 'formal',
 *   pluralRules: (n) => (n === 1 ? 'one' : 'other'),
 * };
 * ```
 */
export interface Locale {
  /** BCP 47 language tag, e.g. `"en"`, `"pt-BR"`, `"zh-Hant"`. */
  readonly code: string;
  /** English name of the language/locale. */
  readonly name: string;
  /** Name of the language in that language itself. */
  readonly nativeName: string;
  /** Text direction. */
  readonly direction: TextDirection;
  /** Default formality register for this locale. */
  readonly formality: FormalityLevel;
  /**
   * CLDR plural-category resolver.  Receives a raw numeric count and returns
   * the matching category string so translation bundles can pick the right
   * plural form.
   */
  readonly pluralRules: PluralRule;
}

// ---------------------------------------------------------------------------
// Translation keys
// ---------------------------------------------------------------------------

/**
 * Structured identifier for a single translation string.
 *
 * Keys are namespaced so that large bundles remain manageable.
 *
 * @example `{ namespace: 'greetings', key: 'morning' }`
 */
export interface TranslationKey {
  /** Logical grouping (e.g. `"greetings"`, `"errors"`, `"eligibility"`). */
  readonly namespace: string;
  /** Unique key within the namespace. */
  readonly key: string;
}

// ---------------------------------------------------------------------------
// Plural forms
// ---------------------------------------------------------------------------

/**
 * Complete set of plural forms for a translatable string.
 *
 * Only `one` and `other` are required; the rest are optional and depend on the
 * target language's CLDR plural rule set.
 */
export interface PluralForm {
  /** Used when count === 0 (Arabic, Welsh, etc.). */
  readonly zero?: string;
  /** Singular form (most languages). */
  readonly one: string;
  /** Dual form (Arabic, Hebrew, etc.). */
  readonly two?: string;
  /** Paucal / "a few" form (Slavic languages, etc.). */
  readonly few?: string;
  /** "Many" form (Polish, Russian, etc.). */
  readonly many?: string;
  /** Default / catch-all plural form. Required for all languages. */
  readonly other: string;
}

// ---------------------------------------------------------------------------
// Translation entry
// ---------------------------------------------------------------------------

/**
 * A single entry in a locale bundle.
 *
 * The `value` is either a plain string or a {@link PluralForm} object.
 * Interpolation placeholders use double-brace syntax: `{{name}}`.
 */
export interface TranslationEntry {
  /** Dot-namespaced key, e.g. `"greetings.morning"`. */
  readonly key: string;
  /** The translation string or plural variants. */
  readonly value: string | PluralForm;
  /**
   * Optional translator note describing when this string is used, tonal
   * requirements, or cultural context.
   */
  readonly context?: string;
}

// ---------------------------------------------------------------------------
// Locale bundle
// ---------------------------------------------------------------------------

/**
 * A complete set of translations for one locale, ready to be loaded into the
 * {@link Translator}.
 */
export interface LocaleBundle {
  /** BCP 47 locale code this bundle belongs to. */
  readonly locale: string;
  /**
   * Map from dot-namespaced key to its {@link TranslationEntry}.
   *
   * e.g. `"greetings.morning"` → `{ key: ..., value: "Good morning!" }`
   */
  readonly translations: Map<string, TranslationEntry>;
  /** Bundle-level metadata for tooling and completeness tracking. */
  readonly metadata: BundleMetadata;
}

/**
 * Metadata attached to every {@link LocaleBundle}.
 */
export interface BundleMetadata {
  /** Semantic version of the bundle, e.g. `"1.0.0"`. */
  readonly version: string;
  /**
   * Fraction of base-locale keys present in this bundle (0–1).
   * 1.0 means 100% complete.
   */
  readonly completeness: number;
  /** ISO 8601 date-time of the last update, e.g. `"2026-03-10T00:00:00Z"`. */
  readonly lastUpdated: string;
}

// ---------------------------------------------------------------------------
// Localization config
// ---------------------------------------------------------------------------

/**
 * Top-level configuration for the COMPASS i18n system.
 */
export interface LocalizationConfig {
  /** BCP 47 code of the primary locale. */
  readonly defaultLocale: string;
  /**
   * BCP 47 code used when a key is missing in the requested locale.
   * Typically `"en"`.
   */
  readonly fallbackLocale: string;
  /** All BCP 47 codes that this deployment supports. */
  readonly supportedLocales: readonly string[];
}

// ---------------------------------------------------------------------------
// Currency format descriptor
// ---------------------------------------------------------------------------

/**
 * Locale-specific currency display preferences returned by
 * {@link CulturalAdapter.getCurrencyFormat}.
 */
export interface CurrencyFormat {
  /** ISO 4217 currency symbol or local glyph, e.g. `"$"`, `"€"`, `"₹"`. */
  readonly symbol: string;
  /** Whether the symbol appears before or after the amount. */
  readonly position: "prefix" | "suffix";
  /** Number of decimal places conventionally used. */
  readonly decimals: number;
  /** ISO 4217 currency code, e.g. `"USD"`, `"EUR"`. */
  readonly currencyCode: string;
}

// ---------------------------------------------------------------------------
// Patient phrasing bundle
// ---------------------------------------------------------------------------

/**
 * Culturally-adapted "patient" conversation phrases used throughout COMPASS to
 * create a warm, unhurried interaction style.
 */
export interface PatientPhrasing {
  /** Short encouraging phrases ("You're doing great!"). */
  readonly encouragement: readonly string[];
  /** Phrases that signal patience ("Take your time."). */
  readonly patience: readonly string[];
  /** Phrases that remove urgency ("There's no rush."). */
  readonly noRush: readonly string[];
}

// ---------------------------------------------------------------------------
// Interpolation params
// ---------------------------------------------------------------------------

/**
 * Generic parameter bag passed to `t()` / `tp()` for string interpolation.
 * Values are coerced to strings via `String(v)` before substitution.
 */
export type InterpolationParams = Record<string, unknown>;
