/**
 * Translator — unit tests
 *
 * Covers: basic lookup, interpolation, plural handling, fallback chain,
 * locale switching, missing-key sentinel, getMissingKeys, hasTranslation.
 */

import { describe, it, expect } from "vitest";
import { Translator } from "../core-logic/translator.js";
import { buildEnBundle } from "../locales/en.js";
import { buildDeBundle } from "../locales/de.js";
import { buildHiBundle } from "../locales/hi.js";
import { buildSwBundle } from "../locales/sw.js";
import type { LocaleBundle, LocalizationConfig } from "../types.js";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const CONFIG: LocalizationConfig = {
  defaultLocale: "en",
  fallbackLocale: "en",
  supportedLocales: ["en", "de", "hi", "sw", "pt-BR"],
};

function makeTranslator(): Translator {
  const t = new Translator(CONFIG);
  t.loadLocale(buildEnBundle());
  t.loadLocale(buildDeBundle());
  t.loadLocale(buildHiBundle());
  t.loadLocale(buildSwBundle());
  return t;
}

// ---------------------------------------------------------------------------
// Basic lookup
// ---------------------------------------------------------------------------

describe("Translator — basic lookup", () => {
  it("returns the translation string for a known key", () => {
    const tr = makeTranslator();
    expect(tr.t("common.yes")).toBe("Yes");
  });

  it("returns the key itself as a visible sentinel for missing keys", () => {
    const tr = makeTranslator();
    expect(tr.t("totally.unknown.key")).toBe("totally.unknown.key");
  });

  it("returns the correct string after switching locale", () => {
    const tr = makeTranslator();
    tr.setLocale("de");
    expect(tr.t("common.yes")).toBe("Ja");
  });

  it("translates in German after setLocale('de')", () => {
    const tr = makeTranslator();
    tr.setLocale("de");
    expect(tr.t("navigation.back")).toBe("Zurück");
  });

  it("translates in Hindi after setLocale('hi')", () => {
    const tr = makeTranslator();
    tr.setLocale("hi");
    expect(tr.t("common.yes")).toBe("हाँ");
  });

  it("translates in Swahili after setLocale('sw')", () => {
    const tr = makeTranslator();
    tr.setLocale("sw");
    expect(tr.t("common.yes")).toBe("Ndiyo");
  });
});

// ---------------------------------------------------------------------------
// Interpolation
// ---------------------------------------------------------------------------

describe("Translator — interpolation", () => {
  it("replaces a single {{placeholder}} with the param value", () => {
    const tr = makeTranslator();
    // navigation.step_of = "Step {{current}} of {{total}}"
    expect(tr.t("navigation.step_of", { current: 2, total: 5 })).toBe("Step 2 of 5");
  });

  it("leaves unknown placeholders as-is", () => {
    const tr = makeTranslator();
    expect(tr.t("navigation.step_of", { current: 1 })).toBe("Step 1 of {{total}}");
  });

  it("coerces numeric params to strings", () => {
    const tr = makeTranslator();
    expect(tr.t("navigation.step_of", { current: 3, total: 10 })).toBe("Step 3 of 10");
  });

  it("coerces boolean params to strings", () => {
    const tr = makeTranslator();
    // Use a key with one interpolation slot and inject a boolean
    expect(tr.t("navigation.step_of", { current: true, total: false })).toBe("Step true of false");
  });

  it("works with German interpolation", () => {
    const tr = makeTranslator();
    tr.setLocale("de");
    expect(tr.t("navigation.step_of", { current: 1, total: 3 })).toBe("Schritt 1 von 3");
  });

  it("works with Swahili interpolation", () => {
    const tr = makeTranslator();
    tr.setLocale("sw");
    expect(tr.t("navigation.step_of", { current: 2, total: 4 })).toBe("Hatua 2 kati ya 4");
  });
});

// ---------------------------------------------------------------------------
// Plural handling
// ---------------------------------------------------------------------------

describe("Translator — plural handling (tp)", () => {
  it("uses 'one' form for count === 1 in English", () => {
    const tr = makeTranslator();
    // eligibility.items_found.one = "{{count}} program found for you."
    expect(tr.tp("eligibility.items_found", 1)).toBe("1 program found for you.");
  });

  it("uses 'other' form for count === 0 in English", () => {
    const tr = makeTranslator();
    expect(tr.tp("eligibility.items_found", 0)).toBe("0 programs found for you.");
  });

  it("uses 'other' form for count > 1 in English", () => {
    const tr = makeTranslator();
    expect(tr.tp("eligibility.items_found", 5)).toBe("5 programs found for you.");
  });

  it("injects count automatically into params", () => {
    const tr = makeTranslator();
    const result = tr.tp("eligibility.items_found", 3);
    expect(result).toContain("3");
  });

  it("merges extra params with count", () => {
    const tr = makeTranslator();
    // Fabricate a bundle with a plural entry that uses extra params
    const customBundle: LocaleBundle = {
      locale: "en",
      translations: new Map([
        [
          "test.plural_extra",
          {
            key: "test.plural_extra",
            value: {
              one: "{{count}} item in {{location}}",
              other: "{{count}} items in {{location}}",
            },
          },
        ],
      ]),
      metadata: { version: "1.0.0", completeness: 1.0, lastUpdated: "2026-03-10T00:00:00Z" },
    };
    tr.loadLocale(customBundle);
    expect(tr.tp("test.plural_extra", 1, { location: "cart" })).toBe("1 item in cart");
    expect(tr.tp("test.plural_extra", 4, { location: "cart" })).toBe("4 items in cart");
  });

  it("uses 'one' form for count 0 or 1 in Hindi (CLDR rule)", () => {
    const tr = makeTranslator();
    tr.setLocale("hi");
    expect(tr.tp("eligibility.items_found", 0)).toBe("आपके लिए 0 कार्यक्रम मिला।");
    expect(tr.tp("eligibility.items_found", 1)).toBe("आपके लिए 1 कार्यक्रम मिला।");
  });

  it("uses 'other' for count > 1 in Hindi", () => {
    const tr = makeTranslator();
    tr.setLocale("hi");
    expect(tr.tp("eligibility.items_found", 3)).toBe("आपके लिए 3 कार्यक्रम मिले।");
  });

  it("returns key as sentinel when plural key is missing", () => {
    const tr = makeTranslator();
    expect(tr.tp("no.such.key", 5)).toBe("no.such.key");
  });

  it("handles plain-string values in tp (no plural object)", () => {
    const tr = makeTranslator();
    // common.yes is a plain string — tp should still return it
    expect(tr.tp("common.yes", 1)).toBe("Yes");
    expect(tr.tp("common.yes", 2)).toBe("Yes");
  });
});

// ---------------------------------------------------------------------------
// Fallback chain
// ---------------------------------------------------------------------------

describe("Translator — fallback chain", () => {
  it("falls back to English for a key missing in German", () => {
    const tr = makeTranslator();
    tr.setLocale("de");

    // Add a key only to English bundle
    const enBundle: LocaleBundle = {
      locale: "en",
      translations: new Map([["only.in.english", { key: "only.in.english", value: "EN only" }]]),
      metadata: { version: "1.0.0", completeness: 1.0, lastUpdated: "2026-03-10T00:00:00Z" },
    };
    tr.loadLocale(enBundle);

    expect(tr.t("only.in.english")).toBe("EN only");
  });

  it("falls back from regional to base locale (pt-BR → pt)", () => {
    const ptBundle: LocaleBundle = {
      locale: "pt",
      translations: new Map([["common.yes", { key: "common.yes", value: "Sim" }]]),
      metadata: { version: "1.0.0", completeness: 0.5, lastUpdated: "2026-03-10T00:00:00Z" },
    };
    const tr = makeTranslator();
    tr.loadLocale(ptBundle);
    tr.setLocale("pt-BR"); // not loaded, should fall to "pt"
    expect(tr.t("common.yes")).toBe("Sim");
  });

  it("falls back from pt-BR to en when pt is also missing the key", () => {
    const tr = makeTranslator();
    tr.setLocale("pt-BR"); // neither pt-BR nor pt loaded
    // Should fall all the way back to "en"
    expect(tr.t("common.yes")).toBe("Yes");
  });

  it("throws when setLocale is called with an unsupported code", () => {
    const tr = makeTranslator();
    expect(() => tr.setLocale("xyz-UNSUPPORTED")).toThrow(/not in supportedLocales/);
  });
});

// ---------------------------------------------------------------------------
// hasTranslation
// ---------------------------------------------------------------------------

describe("Translator — hasTranslation", () => {
  it("returns true for a key present in current locale", () => {
    const tr = makeTranslator();
    expect(tr.hasTranslation("common.yes")).toBe(true);
  });

  it("returns true when key is only in fallback locale", () => {
    const tr = makeTranslator();
    tr.setLocale("de");

    const enBundle: LocaleBundle = {
      locale: "en",
      translations: new Map([["fallback.only", { key: "fallback.only", value: "exists" }]]),
      metadata: { version: "1.0.0", completeness: 1.0, lastUpdated: "2026-03-10T00:00:00Z" },
    };
    tr.loadLocale(enBundle);

    expect(tr.hasTranslation("fallback.only")).toBe(true);
  });

  it("returns false for a completely unknown key", () => {
    const tr = makeTranslator();
    expect(tr.hasTranslation("does.not.exist.anywhere")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getMissingKeys
// ---------------------------------------------------------------------------

describe("Translator — getMissingKeys", () => {
  it("returns empty array when locale is complete", () => {
    const tr = makeTranslator();
    // de bundle has all the same keys as en
    const missing = tr.getMissingKeys("de");
    expect(missing).toHaveLength(0);
  });

  it("returns missing keys when a partial bundle is loaded", () => {
    const tr = new Translator(CONFIG);

    const enBundle: LocaleBundle = {
      locale: "en",
      translations: new Map([
        ["key.a", { key: "key.a", value: "A" }],
        ["key.b", { key: "key.b", value: "B" }],
        ["key.c", { key: "key.c", value: "C" }],
      ]),
      metadata: { version: "1.0.0", completeness: 1.0, lastUpdated: "2026-03-10T00:00:00Z" },
    };

    const partialBundle: LocaleBundle = {
      locale: "fr",
      translations: new Map([
        ["key.a", { key: "key.a", value: "A-fr" }],
        // key.b and key.c missing
      ]),
      metadata: { version: "1.0.0", completeness: 0.33, lastUpdated: "2026-03-10T00:00:00Z" },
    };

    tr.loadLocale(enBundle);
    tr.loadLocale(partialBundle);

    const missing = tr.getMissingKeys("fr");
    expect(missing).toEqual(expect.arrayContaining(["key.b", "key.c"]));
    expect(missing).not.toContain("key.a");
    expect(missing).toHaveLength(2);
  });

  it("returns all reference keys when target locale has no bundle", () => {
    const tr = new Translator(CONFIG);

    const enBundle: LocaleBundle = {
      locale: "en",
      translations: new Map([
        ["x", { key: "x", value: "X" }],
        ["y", { key: "y", value: "Y" }],
      ]),
      metadata: { version: "1.0.0", completeness: 1.0, lastUpdated: "2026-03-10T00:00:00Z" },
    };

    tr.loadLocale(enBundle);
    const missing = tr.getMissingKeys("it"); // no Italian bundle loaded
    expect(missing).toEqual(expect.arrayContaining(["x", "y"]));
  });

  it("returns empty array when fallback bundle is not loaded", () => {
    const tr = new Translator({
      defaultLocale: "en",
      fallbackLocale: "en",
      supportedLocales: ["en"],
    });
    // No bundles loaded at all
    expect(tr.getMissingKeys("de")).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// getLocale / setLocale
// ---------------------------------------------------------------------------

describe("Translator — getLocale / setLocale", () => {
  it("returns the default locale before any setLocale call", () => {
    const tr = makeTranslator();
    expect(tr.getLocale()).toBe("en");
  });

  it("reflects the locale after setLocale", () => {
    const tr = makeTranslator();
    tr.setLocale("sw");
    expect(tr.getLocale()).toBe("sw");
  });

  it("allows switching locales multiple times", () => {
    const tr = makeTranslator();
    tr.setLocale("de");
    tr.setLocale("hi");
    tr.setLocale("en");
    expect(tr.getLocale()).toBe("en");
    expect(tr.t("common.yes")).toBe("Yes");
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("Translator — edge cases", () => {
  it("handles empty params object gracefully", () => {
    const tr = makeTranslator();
    expect(tr.t("common.yes", {})).toBe("Yes");
  });

  it("loadLocale replaces an existing bundle for the same locale", () => {
    const tr = makeTranslator();

    const override: LocaleBundle = {
      locale: "en",
      translations: new Map([["common.yes", { key: "common.yes", value: "Absolutely" }]]),
      metadata: { version: "2.0.0", completeness: 0.01, lastUpdated: "2026-03-10T00:00:00Z" },
    };

    tr.loadLocale(override);
    expect(tr.t("common.yes")).toBe("Absolutely");
  });

  it("returns the 'other' plural form when tp is called on a PluralForm entry via t()", () => {
    const tr = makeTranslator();
    // t() on a plural entry should return 'other'
    const result = tr.t("eligibility.items_found");
    expect(result).toBe("{{count}} programs found for you.");
  });

  it("registers and uses a custom plural rule", () => {
    const tr = makeTranslator();
    // Register a trivial rule: everything is "one"
    tr.registerPluralRule("test-lang", () => "one");

    const bundle: LocaleBundle = {
      locale: "test-lang",
      translations: new Map([
        [
          "items",
          {
            key: "items",
            value: { one: "singular {{count}}", other: "plural {{count}}" },
          },
        ],
      ]),
      metadata: { version: "1.0.0", completeness: 1.0, lastUpdated: "2026-03-10T00:00:00Z" },
    };

    // We need test-lang in supportedLocales to call setLocale; bypass via direct access
    // Instead test via tp with a custom translator
    const customConfig: LocalizationConfig = {
      defaultLocale: "test-lang",
      fallbackLocale: "en",
      supportedLocales: ["test-lang", "en"],
    };
    const customTr = new Translator(customConfig);
    customTr.loadLocale(bundle);
    customTr.registerPluralRule("test-lang", () => "one");
    // Count of 99 — our rule says always "one"
    expect(customTr.tp("items", 99)).toBe("singular 99");
  });
});
