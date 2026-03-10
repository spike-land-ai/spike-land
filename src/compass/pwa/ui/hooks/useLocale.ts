import { useCallback, useEffect, useState } from "react";
import type { LocaleOption } from "../../types.ts";

const STORAGE_KEY = "compass_locale";
const FALLBACK_LOCALE = "en";

/**
 * Resolves the best initial locale with this priority:
 *  1. localStorage (user's explicit choice)
 *  2. navigator.languages[0] (browser preference)
 *  3. navigator.language
 *  4. Fallback: "en"
 *
 * Only resolves to a code present in `supportedLocales`.
 */
function resolveInitialLocale(supportedLocales: LocaleOption[]): string {
  const supported = new Set(supportedLocales.map((l) => l.code));

  // 1. Persisted preference
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && supported.has(stored)) return stored;
  } catch {
    // localStorage unavailable (e.g. private browsing with strict settings)
  }

  // 2 & 3. Browser language preferences
  const browserLangs =
    typeof navigator !== "undefined"
      ? navigator.languages?.length
        ? [...navigator.languages]
        : navigator.language
          ? [navigator.language]
          : []
      : [];

  for (const lang of browserLangs) {
    // Exact match first (e.g. "en-US")
    if (supported.has(lang)) return lang;
    // Base language match (e.g. "en" from "en-US")
    const base = lang.split("-")[0];
    if (base && supported.has(base)) return base;
  }

  return FALLBACK_LOCALE;
}

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

interface UseLocaleReturn {
  locale: string;
  /** Whether the current locale is RTL */
  isRtl: boolean;
  setLocale: (code: string) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Manages the application locale with localStorage persistence.
 *
 * Also updates the `<html lang>` and `<html dir>` attributes so that CSS
 * and browser accessibility features pick up the language and directionality.
 */
export function useLocale(supportedLocales: LocaleOption[]): UseLocaleReturn {
  const [locale, setLocaleState] = useState<string>(() => resolveInitialLocale(supportedLocales));

  const currentOption = supportedLocales.find((l) => l.code === locale);
  const isRtl = currentOption?.rtl ?? false;

  // Sync <html> attributes
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
  }, [locale, isRtl]);

  const setLocale = useCallback(
    (code: string): void => {
      const isSupported = supportedLocales.some((l) => l.code === code);
      if (!isSupported) {
        console.warn(`[useLocale] Locale "${code}" is not in the supported list.`);
        return;
      }
      setLocaleState(code);
      try {
        localStorage.setItem(STORAGE_KEY, code);
      } catch {
        // Silently ignore write failures (e.g. storage quota exceeded)
      }
    },
    [supportedLocales],
  );

  return { locale, isRtl, setLocale };
}
