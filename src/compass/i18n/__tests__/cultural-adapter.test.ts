/**
 * CulturalAdapter — unit tests
 *
 * Covers: greeting adaptation, formality transformation, date formats,
 * currency formats, and patient phrasing bundles across all seeded locales.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { CulturalAdapter } from "../core-logic/cultural-adapter.js";

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------

let adapter: CulturalAdapter;

beforeEach(() => {
  adapter = new CulturalAdapter();
});

// ---------------------------------------------------------------------------
// adaptGreeting
// ---------------------------------------------------------------------------

describe("CulturalAdapter — adaptGreeting", () => {
  // English
  it("returns English morning greeting without name", () => {
    expect(adapter.adaptGreeting("en", "morning")).toBe("Good morning!");
  });

  it("returns English morning greeting with name", () => {
    expect(adapter.adaptGreeting("en", "morning", "Alice")).toBe("Good morning, Alice!");
  });

  it("returns English afternoon greeting", () => {
    expect(adapter.adaptGreeting("en", "afternoon")).toBe("Good afternoon!");
  });

  it("returns English evening greeting", () => {
    expect(adapter.adaptGreeting("en", "evening")).toBe("Good evening!");
  });

  it("falls back to default greeting for unknown time of day", () => {
    expect(adapter.adaptGreeting("en", "brunch")).toBe("Hello!");
  });

  // German
  it("returns German Guten Morgen", () => {
    expect(adapter.adaptGreeting("de", "morning")).toBe("Guten Morgen!");
  });

  it("returns German Guten Tag for afternoon", () => {
    expect(adapter.adaptGreeting("de", "afternoon")).toBe("Guten Tag!");
  });

  it("returns German greeting with name", () => {
    expect(adapter.adaptGreeting("de", "morning", "Lena")).toBe("Guten Morgen, Lena!");
  });

  it("returns German Guten Abend for evening", () => {
    expect(adapter.adaptGreeting("de", "evening")).toBe("Guten Abend!");
  });

  // Hindi
  it("returns Hindi Subprabhat for morning", () => {
    expect(adapter.adaptGreeting("hi", "morning")).toBe("सुप्रभात!");
  });

  it("returns Hindi Shubh Sandhya for evening", () => {
    expect(adapter.adaptGreeting("hi", "evening")).toBe("शुभ संध्या!");
  });

  it("returns Hindi greeting with name", () => {
    expect(adapter.adaptGreeting("hi", "morning", "Priya")).toBe("सुप्रभात, Priya!");
  });

  // Swahili
  it("returns Swahili morning greeting", () => {
    expect(adapter.adaptGreeting("sw", "morning")).toBe("Habari za asubuhi!");
  });

  it("returns Swahili evening greeting", () => {
    expect(adapter.adaptGreeting("sw", "evening")).toBe("Habari za jioni!");
  });

  it("returns Swahili greeting with name", () => {
    expect(adapter.adaptGreeting("sw", "morning", "Amina")).toBe("Habari za asubuhi, Amina!");
  });

  // Fallback: unknown locale → English
  it("falls back to English for an unknown locale", () => {
    expect(adapter.adaptGreeting("xyz", "morning")).toBe("Good morning!");
  });

  // Base-locale fallback: "de-AT" → "de"
  it("resolves de-AT to de greeting via base-locale fallback", () => {
    expect(adapter.adaptGreeting("de-AT", "morning")).toBe("Guten Morgen!");
  });

  // Case insensitivity for timeOfDay
  it("normalises timeOfDay to lowercase", () => {
    expect(adapter.adaptGreeting("en", "MORNING")).toBe("Good morning!");
    expect(adapter.adaptGreeting("en", "Evening")).toBe("Good evening!");
  });
});

// ---------------------------------------------------------------------------
// adaptFormality
// ---------------------------------------------------------------------------

describe("CulturalAdapter — adaptFormality", () => {
  it("replaces contractions with full forms for formal English", () => {
    expect(adapter.adaptFormality("I can't do it", "en", "formal")).toBe("I cannot do it");
  });

  it("replaces 'won't' with 'will not' for formal English", () => {
    expect(adapter.adaptFormality("I won't be late", "en", "formal")).toBe("I will not be late");
  });

  it("replaces 'do not' with contraction for informal English", () => {
    expect(adapter.adaptFormality("Please do not go", "en", "informal")).toBe("Please don't go");
  });

  it("replaces 'hey' with 'hello' for formal English", () => {
    expect(adapter.adaptFormality("hey there", "en", "formal")).toBe("hello there");
  });

  it("returns text unchanged for adaptive formality", () => {
    const text = "Hey, I can't help right now";
    expect(adapter.adaptFormality(text, "en", "adaptive")).toBe(text);
  });

  it("applies formal Sie replacement for German", () => {
    const result = adapter.adaptFormality("du bist herzlich willkommen", "de", "formal");
    expect(result).toContain("Sie");
    expect(result).not.toContain(" du ");
  });

  it("applies informal du replacement for German", () => {
    const result = adapter.adaptFormality("Sie sind willkommen", "de", "informal");
    expect(result).toContain("du");
  });

  it("applies formal आप replacement for Hindi", () => {
    const result = adapter.adaptFormality("तुम यहाँ हो", "hi", "formal");
    expect(result).toContain("आप");
    expect(result).not.toContain("तुम");
  });

  it("returns text unchanged for an unrecognised locale with no pattern table", () => {
    const text = "Sample text here";
    expect(adapter.adaptFormality(text, "xyz-UNKNOWN", "formal")).toBe(text);
  });

  it("returns text unchanged for Swahili informal (no informal patterns defined)", () => {
    const text = "sema hivyo";
    expect(adapter.adaptFormality(text, "sw", "informal")).toBe(text);
  });
});

// ---------------------------------------------------------------------------
// getDateFormat
// ---------------------------------------------------------------------------

describe("CulturalAdapter — getDateFormat", () => {
  it("returns MM/DD/YYYY for en (US)", () => {
    expect(adapter.getDateFormat("en")).toBe("MM/DD/YYYY");
  });

  it("returns DD/MM/YYYY for en-GB", () => {
    expect(adapter.getDateFormat("en-GB")).toBe("DD/MM/YYYY");
  });

  it("returns DD.MM.YYYY for de", () => {
    expect(adapter.getDateFormat("de")).toBe("DD.MM.YYYY");
  });

  it("returns YYYY/MM/DD for ja", () => {
    expect(adapter.getDateFormat("ja")).toBe("YYYY/MM/DD");
  });

  it("returns YYYY-MM-DD for zh", () => {
    expect(adapter.getDateFormat("zh")).toBe("YYYY-MM-DD");
  });

  it("returns DD/MM/YYYY for hi", () => {
    expect(adapter.getDateFormat("hi")).toBe("DD/MM/YYYY");
  });

  it("returns DD/MM/YYYY for sw", () => {
    expect(adapter.getDateFormat("sw")).toBe("DD/MM/YYYY");
  });

  it("returns ISO default for an unknown locale", () => {
    expect(adapter.getDateFormat("xyz-UNKNOWN")).toBe("YYYY-MM-DD");
  });

  it("falls back to base locale for de-CH", () => {
    expect(adapter.getDateFormat("de-CH")).toBe("DD.MM.YYYY");
  });
});

// ---------------------------------------------------------------------------
// getCurrencyFormat
// ---------------------------------------------------------------------------

describe("CulturalAdapter — getCurrencyFormat", () => {
  it("returns USD prefix for en", () => {
    const fmt = adapter.getCurrencyFormat("en");
    expect(fmt.symbol).toBe("$");
    expect(fmt.position).toBe("prefix");
    expect(fmt.decimals).toBe(2);
    expect(fmt.currencyCode).toBe("USD");
  });

  it("returns GBP prefix for en-GB", () => {
    const fmt = adapter.getCurrencyFormat("en-GB");
    expect(fmt.symbol).toBe("£");
    expect(fmt.currencyCode).toBe("GBP");
  });

  it("returns EUR suffix for de", () => {
    const fmt = adapter.getCurrencyFormat("de");
    expect(fmt.symbol).toBe("€");
    expect(fmt.position).toBe("suffix");
    expect(fmt.currencyCode).toBe("EUR");
  });

  it("returns INR prefix for hi", () => {
    const fmt = adapter.getCurrencyFormat("hi");
    expect(fmt.symbol).toBe("₹");
    expect(fmt.position).toBe("prefix");
    expect(fmt.currencyCode).toBe("INR");
  });

  it("returns KES prefix for sw", () => {
    const fmt = adapter.getCurrencyFormat("sw");
    expect(fmt.symbol).toBe("KSh");
    expect(fmt.position).toBe("prefix");
    expect(fmt.currencyCode).toBe("KES");
  });

  it("returns BRL prefix for pt-BR", () => {
    const fmt = adapter.getCurrencyFormat("pt-BR");
    expect(fmt.symbol).toBe("R$");
    expect(fmt.currencyCode).toBe("BRL");
  });

  it("returns JPY with zero decimals for ja", () => {
    const fmt = adapter.getCurrencyFormat("ja");
    expect(fmt.symbol).toBe("¥");
    expect(fmt.decimals).toBe(0);
    expect(fmt.currencyCode).toBe("JPY");
  });

  it("falls back to USD for an unknown locale", () => {
    const fmt = adapter.getCurrencyFormat("xyz-UNKNOWN");
    expect(fmt.currencyCode).toBe("USD");
  });

  it("falls back from es-MX base 'es' when es-MX is specifically registered", () => {
    // es-MX is explicitly registered as MXN
    const fmt = adapter.getCurrencyFormat("es-MX");
    expect(fmt.currencyCode).toBe("MXN");
  });

  it("falls back from es-AR (not registered) to es (EUR)", () => {
    const fmt = adapter.getCurrencyFormat("es-AR");
    expect(fmt.currencyCode).toBe("EUR");
  });
});

// ---------------------------------------------------------------------------
// getPatientPhrasing
// ---------------------------------------------------------------------------

describe("CulturalAdapter — getPatientPhrasing", () => {
  it("returns non-empty encouragement array for English", () => {
    const phrases = adapter.getPatientPhrasing("en");
    expect(phrases.encouragement.length).toBeGreaterThan(0);
    expect(typeof phrases.encouragement[0]).toBe("string");
  });

  it("returns non-empty patience array for English", () => {
    const phrases = adapter.getPatientPhrasing("en");
    expect(phrases.patience.length).toBeGreaterThan(0);
  });

  it("returns non-empty noRush array for English", () => {
    const phrases = adapter.getPatientPhrasing("en");
    expect(phrases.noRush.length).toBeGreaterThan(0);
  });

  it("returns German patience phrases with Sie formality", () => {
    const phrases = adapter.getPatientPhrasing("de");
    const hasSie = phrases.patience.some((p) => p.includes("Sie"));
    expect(hasSie).toBe(true);
  });

  it("returns German encouragement", () => {
    const phrases = adapter.getPatientPhrasing("de");
    expect(phrases.encouragement[0]).toContain("wunderbar");
  });

  it("returns Hindi encouragement in Devanagari", () => {
    const phrases = adapter.getPatientPhrasing("hi");
    // Check non-ASCII content (Devanagari block)
    const hasDevanagari = phrases.encouragement.some((p) => /[\u0900-\u097F]/.test(p));
    expect(hasDevanagari).toBe(true);
  });

  it("returns Swahili 'Hakuna haraka' in noRush", () => {
    const phrases = adapter.getPatientPhrasing("sw");
    expect(phrases.noRush[0]).toBe("Hakuna haraka.");
  });

  it("returns Swahili encouragement in Swahili", () => {
    const phrases = adapter.getPatientPhrasing("sw");
    expect(phrases.encouragement[0]).toBe("Unafanya vizuri sana!");
  });

  it("falls back to English for an unknown locale", () => {
    const phrases = adapter.getPatientPhrasing("xyz-UNKNOWN");
    expect(phrases.noRush[0]).toBe("There's no rush.");
  });

  it("falls back from fr-CA to fr", () => {
    const phrases = adapter.getPatientPhrasing("fr-CA");
    const hasVous = phrases.patience.some((p) => p.includes("votre"));
    expect(hasVous).toBe(true);
  });

  it("all locale bundles have at least 3 phrases in each category", () => {
    const locales = ["en", "de", "hi", "sw", "fr", "es", "ar"];
    for (const locale of locales) {
      const phrases = adapter.getPatientPhrasing(locale);
      expect(phrases.encouragement.length).toBeGreaterThanOrEqual(3);
      expect(phrases.patience.length).toBeGreaterThanOrEqual(3);
      expect(phrases.noRush.length).toBeGreaterThanOrEqual(3);
    }
  });
});

// ---------------------------------------------------------------------------
// LocaleRegistry integration via CulturalAdapter
// ---------------------------------------------------------------------------

describe("CulturalAdapter — RTL / edge-locale handling", () => {
  it("returns Arabic greeting correctly", () => {
    const greeting = adapter.adaptGreeting("ar", "morning");
    expect(greeting).toBe("صباح الخير!");
  });

  it("returns Arabic greeting at night", () => {
    const greeting = adapter.adaptGreeting("ar", "night");
    expect(greeting).toBe("تصبح على خير!");
  });

  it("returns Arabic patient phrasing", () => {
    const phrases = adapter.getPatientPhrasing("ar");
    expect(phrases.noRush[0]).toContain("استعجال");
  });

  it("getCurrencyFormat for ar returns SAR", () => {
    const fmt = adapter.getCurrencyFormat("ar");
    expect(fmt.currencyCode).toBe("SAR");
    expect(fmt.position).toBe("suffix");
  });
});
