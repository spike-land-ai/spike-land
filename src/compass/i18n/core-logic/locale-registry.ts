/**
 * COMPASS i18n — LocaleRegistry
 *
 * Central registry of all supported {@link Locale} descriptors.  Provides
 * lookup, RTL detection, formality resolution, and a "closest locale"
 * fallback algorithm.
 */

import type { FormalityLevel, Locale } from "../types.js";

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/**
 * Registry of locale descriptors.
 *
 * Locale codes follow BCP 47 (e.g. `"en"`, `"pt-BR"`, `"zh-Hant-TW"`).
 * The registry supports prefix-based fallback so that a narrower code
 * (`"pt-BR"`) gracefully degrades to a broader code (`"pt"`) and ultimately
 * to the configured ultimate fallback (`"en"`).
 */
export class LocaleRegistry {
  private readonly locales = new Map<string, Locale>();

  /**
   * Seed the registry with a set of pre-defined locales at construction time.
   *
   * @example
   * ```ts
   * const registry = new LocaleRegistry([EN_LOCALE, DE_LOCALE]);
   * ```
   */
  constructor(initial: readonly Locale[] = []) {
    for (const locale of initial) {
      this.register(locale);
    }
  }

  // -------------------------------------------------------------------------
  // Registration
  // -------------------------------------------------------------------------

  /**
   * Add or replace a locale descriptor in the registry.
   * Overwrites any existing entry for the same code.
   */
  register(locale: Locale): void {
    this.locales.set(locale.code, locale);
  }

  // -------------------------------------------------------------------------
  // Lookup
  // -------------------------------------------------------------------------

  /**
   * Return the {@link Locale} for `code`, or `undefined` if not registered.
   * Does NOT perform fallback — use {@link getClosestLocale} for that.
   */
  getLocale(code: string): Locale | undefined {
    return this.locales.get(code);
  }

  /**
   * Return all registered {@link Locale} objects, ordered by locale code.
   */
  getSupportedLocales(): Locale[] {
    return [...this.locales.values()].sort((a, b) => a.code.localeCompare(b.code));
  }

  /**
   * Return an array of all registered BCP 47 codes.
   */
  getSupportedCodes(): string[] {
    return this.getSupportedLocales().map((l) => l.code);
  }

  // -------------------------------------------------------------------------
  // RTL detection
  // -------------------------------------------------------------------------

  /**
   * Returns `true` when the locale uses a right-to-left script.
   *
   * Falls back through the usual chain — an unknown code is assumed LTR.
   */
  isRTL(code: string): boolean {
    const resolved = this.resolveLocale(code);
    return resolved?.direction === "rtl";
  }

  // -------------------------------------------------------------------------
  // Formality
  // -------------------------------------------------------------------------

  /**
   * Return the default formality level for `code`.
   *
   * Falls back through the locale chain; if nothing is registered, defaults
   * to `"adaptive"` (the safest choice for an unknown locale).
   */
  getFormalityLevel(code: string): FormalityLevel {
    return this.resolveLocale(code)?.formality ?? "adaptive";
  }

  // -------------------------------------------------------------------------
  // Closest-locale fallback
  // -------------------------------------------------------------------------

  /**
   * Return the BCP 47 code of the closest registered locale to `code`.
   *
   * Fallback algorithm (first match wins):
   *   1. Exact match                    (`"pt-BR"`)
   *   2. Strip rightmost subtag          (`"pt"`)
   *   3. Repeat until single base tag   (`"pt"` → registered? done)
   *   4. Ultimate fallback              (`"en"`)
   *
   * @example
   * ```ts
   * registry.getClosestLocale('pt-BR');  // → 'pt-BR' if registered
   * registry.getClosestLocale('pt-PT');  // → 'pt' if pt-PT not registered but pt is
   * registry.getClosestLocale('xyz');    // → 'en'
   * ```
   */
  getClosestLocale(code: string, ultimateFallback = "en"): string {
    const candidate = this.resolveLocale(code, ultimateFallback);
    return candidate?.code ?? ultimateFallback;
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  /**
   * Walk the BCP 47 subtag chain from most-specific to least-specific,
   * returning the first registered {@link Locale} found.
   *
   * @example `"zh-Hant-TW"` → tries `"zh-Hant-TW"`, `"zh-Hant"`, `"zh"`,
   *           then `ultimateFallback`.
   */
  private resolveLocale(code: string, ultimateFallback = "en"): Locale | undefined {
    // 1. Exact match
    if (this.locales.has(code)) return this.locales.get(code);

    // 2. Walk BCP 47 subtag chain
    const parts = code.split("-");
    for (let i = parts.length - 1; i >= 1; i--) {
      const candidate = parts.slice(0, i).join("-");
      if (this.locales.has(candidate)) return this.locales.get(candidate);
    }

    // 3. Ultimate fallback
    return this.locales.get(ultimateFallback);
  }
}
