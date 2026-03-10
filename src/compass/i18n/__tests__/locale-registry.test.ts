/**
 * LocaleRegistry — unit tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { LocaleRegistry } from "../core-logic/locale-registry.js";
import { EN_LOCALE } from "../locales/en.js";
import { DE_LOCALE } from "../locales/de.js";
import { HI_LOCALE } from "../locales/hi.js";
import { SW_LOCALE } from "../locales/sw.js";
import type { Locale } from "../types.js";

const PT_LOCALE: Locale = {
  code: "pt",
  name: "Portuguese",
  nativeName: "Português",
  direction: "ltr",
  formality: "adaptive",
  pluralRules: (n) => (n === 0 || n === 1 ? "one" : "other"),
};

const PT_BR_LOCALE: Locale = {
  ...PT_LOCALE,
  code: "pt-BR",
  name: "Portuguese (Brazil)",
  nativeName: "Português (Brasil)",
};

const AR_LOCALE: Locale = {
  code: "ar",
  name: "Arabic",
  nativeName: "العربية",
  direction: "rtl",
  formality: "formal",
  pluralRules: (n) => {
    if (n === 0) return "zero";
    if (n === 1) return "one";
    if (n === 2) return "two";
    const mod100 = n % 100;
    if (mod100 >= 3 && mod100 <= 10) return "few";
    if (mod100 >= 11 && mod100 <= 99) return "many";
    return "other";
  },
};

let registry: LocaleRegistry;

beforeEach(() => {
  registry = new LocaleRegistry([
    EN_LOCALE,
    DE_LOCALE,
    HI_LOCALE,
    SW_LOCALE,
    PT_LOCALE,
    PT_BR_LOCALE,
    AR_LOCALE,
  ]);
});

describe("LocaleRegistry — register and getLocale", () => {
  it("retrieves a registered locale by exact code", () => {
    expect(registry.getLocale("en")).toEqual(EN_LOCALE);
  });

  it("returns undefined for an unregistered code", () => {
    expect(registry.getLocale("it")).toBeUndefined();
  });

  it("overwrites an existing locale on re-registration", () => {
    const updatedEn: Locale = { ...EN_LOCALE, name: "English (Updated)" };
    registry.register(updatedEn);
    expect(registry.getLocale("en")?.name).toBe("English (Updated)");
  });
});

describe("LocaleRegistry — getSupportedLocales", () => {
  it("returns all registered locales sorted by code", () => {
    const codes = registry.getSupportedLocales().map((l) => l.code);
    expect(codes).toEqual([...codes].sort());
  });

  it("includes all seeded locales", () => {
    const codes = registry.getSupportedCodes();
    expect(codes).toContain("en");
    expect(codes).toContain("de");
    expect(codes).toContain("hi");
    expect(codes).toContain("sw");
    expect(codes).toContain("ar");
  });
});

describe("LocaleRegistry — isRTL", () => {
  it("returns false for LTR locales", () => {
    expect(registry.isRTL("en")).toBe(false);
    expect(registry.isRTL("de")).toBe(false);
    expect(registry.isRTL("hi")).toBe(false);
    expect(registry.isRTL("sw")).toBe(false);
  });

  it("returns true for Arabic (RTL)", () => {
    expect(registry.isRTL("ar")).toBe(true);
  });

  it("returns false for an unknown locale (defaults to LTR)", () => {
    expect(registry.isRTL("xyz")).toBe(false);
  });
});

describe("LocaleRegistry — getFormalityLevel", () => {
  it("returns 'adaptive' for English", () => {
    expect(registry.getFormalityLevel("en")).toBe("adaptive");
  });

  it("returns 'formal' for German", () => {
    expect(registry.getFormalityLevel("de")).toBe("formal");
  });

  it("returns 'adaptive' for an unknown locale (safe default)", () => {
    expect(registry.getFormalityLevel("xyz-UNKNOWN")).toBe("adaptive");
  });

  it("returns 'formal' for Arabic", () => {
    expect(registry.getFormalityLevel("ar")).toBe("formal");
  });
});

describe("LocaleRegistry — getClosestLocale", () => {
  it("returns exact match for a registered code", () => {
    expect(registry.getClosestLocale("en")).toBe("en");
    expect(registry.getClosestLocale("pt-BR")).toBe("pt-BR");
  });

  it("strips region subtag to find base locale (pt-PT → pt)", () => {
    // pt-PT is not registered, but pt is
    expect(registry.getClosestLocale("pt-PT")).toBe("pt");
  });

  it("falls back to ultimate fallback for a completely unknown code", () => {
    expect(registry.getClosestLocale("xyz-UNKNOWN")).toBe("en");
  });

  it("resolves zh-Hant-TW through chain: zh-Hant-TW → zh-Hant → zh → en", () => {
    // None of those are registered in our fixture; falls to "en"
    expect(registry.getClosestLocale("zh-Hant-TW")).toBe("en");
  });

  it("uses a custom ultimateFallback", () => {
    expect(registry.getClosestLocale("xyz", "de")).toBe("de");
  });

  it("returns pt for pt-BR base when only pt is registered", () => {
    const smallRegistry = new LocaleRegistry([EN_LOCALE, PT_LOCALE]);
    expect(smallRegistry.getClosestLocale("pt-BR")).toBe("pt");
  });
});
