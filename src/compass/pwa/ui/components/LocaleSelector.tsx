import React, { useId } from "react";
import type { LocaleOption } from "../../types.ts";

interface LocaleSelectorProps {
  locales: LocaleOption[];
  currentLocale: string;
  onChange: (locale: string) => void;
  label?: string;
  /** If true, render a compact icon-only trigger (icon + current code) */
  compact?: boolean;
}

/**
 * Language picker dropdown.
 *
 * - Each option is displayed in its own native language name for accessibility
 *   to users who may not read the UI language.
 * - The `dir` attribute is switched based on the currently selected locale's
 *   RTL flag so the dropdown itself renders correctly in RTL environments.
 * - Uses a native <select> for maximum compatibility on low-end devices.
 */
export function LocaleSelector({
  locales,
  currentLocale,
  onChange,
  label = "Language",
  compact = false,
}: LocaleSelectorProps): React.ReactElement {
  const selectId = useId();
  const currentLocaleOption = locales.find((l) => l.code === currentLocale);
  const isRtl = currentLocaleOption?.rtl ?? false;

  const wrapperStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.375rem",
    direction: isRtl ? "rtl" : "ltr",
  };

  const labelStyle: React.CSSProperties = compact
    ? {
        position: "absolute",
        width: "1px",
        height: "1px",
        overflow: "hidden",
        clip: "rect(0,0,0,0)",
        whiteSpace: "nowrap",
      }
    : {
        fontSize: "0.875rem",
        color: "#374151",
        fontWeight: 500,
        cursor: "pointer",
      };

  const selectStyle: React.CSSProperties = {
    appearance: "none",
    WebkitAppearance: "none",
    padding: compact ? "0.25rem 1.75rem 0.25rem 0.5rem" : "0.375rem 2rem 0.375rem 0.625rem",
    fontSize: compact ? "0.8125rem" : "0.9375rem",
    border: "1.5px solid #d1d5db",
    borderRadius: "0.5rem",
    backgroundColor: "#ffffff",
    color: "#111827",
    cursor: "pointer",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: isRtl ? "left 0.5rem center" : "right 0.5rem center",
    backgroundSize: "12px",
    // Give a comfortable tap target height
    minHeight: "36px",
    direction: isRtl ? "rtl" : "ltr",
  };

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    onChange(e.target.value);
  }

  return (
    <div style={wrapperStyle}>
      <label htmlFor={selectId} style={labelStyle}>
        {compact ? (
          /* Globe icon */
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        ) : (
          label
        )}
      </label>

      <select
        id={selectId}
        value={currentLocale}
        onChange={handleChange}
        style={selectStyle}
        aria-label={label}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#1a56db";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(26,86,219,0.25)";
          e.currentTarget.style.outline = "none";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#d1d5db";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {locales.map((locale) => (
          <option key={locale.code} value={locale.code} dir={locale.rtl ? "rtl" : "ltr"}>
            {locale.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Default locale list — covers most jurisdictions COMPASS targets
// ---------------------------------------------------------------------------

export const DEFAULT_LOCALES: LocaleOption[] = [
  { code: "en", nativeName: "English", rtl: false },
  { code: "es", nativeName: "Español", rtl: false },
  { code: "fr", nativeName: "Français", rtl: false },
  { code: "pt", nativeName: "Português", rtl: false },
  { code: "ar", nativeName: "العربية", rtl: true },
  { code: "zh", nativeName: "中文", rtl: false },
  { code: "hi", nativeName: "हिंदी", rtl: false },
  { code: "ru", nativeName: "Русский", rtl: false },
  { code: "uk", nativeName: "Українська", rtl: false },
  { code: "fa", nativeName: "فارسی", rtl: true },
  { code: "so", nativeName: "Soomaali", rtl: false },
  { code: "am", nativeName: "አማርኛ", rtl: false },
  { code: "vi", nativeName: "Tiếng Việt", rtl: false },
  { code: "ko", nativeName: "한국어", rtl: false },
];
