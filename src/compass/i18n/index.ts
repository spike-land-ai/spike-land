/**
 * @compass/i18n — Public API
 *
 * Re-exports everything needed to use the COMPASS i18n framework.
 *
 * Usage:
 * ```ts
 * import { Translator, LocaleRegistry, CulturalAdapter, buildEnBundle } from '@compass/i18n';
 *
 * const registry = new LocaleRegistry([EN_LOCALE, DE_LOCALE]);
 * const translator = new Translator({
 *   defaultLocale: 'en',
 *   fallbackLocale: 'en',
 *   supportedLocales: registry.getSupportedCodes(),
 * });
 * translator.loadLocale(buildEnBundle());
 * translator.loadLocale(buildDeBundle());
 *
 * const adapter = new CulturalAdapter();
 * ```
 */

// Core types
export type {
  BundleMetadata,
  CurrencyFormat,
  FormalityLevel,
  InterpolationParams,
  Locale,
  LocaleBundle,
  LocalizationConfig,
  PatientPhrasing,
  PluralCategory,
  PluralForm,
  PluralRule,
  TextDirection,
  TranslationEntry,
  TranslationKey,
} from "./types.js";

// Core logic
export { Translator } from "./core-logic/translator.js";
export { LocaleRegistry } from "./core-logic/locale-registry.js";
export { CulturalAdapter } from "./core-logic/cultural-adapter.js";

// Locale bundles and descriptors
export { EN_LOCALE, buildEnBundle } from "./locales/en.js";
export { DE_LOCALE, buildDeBundle } from "./locales/de.js";
export { HI_LOCALE, buildHiBundle } from "./locales/hi.js";
export { SW_LOCALE, buildSwBundle } from "./locales/sw.js";
