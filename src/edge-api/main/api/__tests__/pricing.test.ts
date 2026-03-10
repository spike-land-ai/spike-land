/**
 * Tests for src/edge-api/main/core-logic/pricing.ts
 *
 * Covers:
 *   VALID_LOOKUP_KEYS  — Set membership
 *   CREDIT_PACKS       — Tuple correctness
 *   SERVICE_PRODUCTS   — Shape, lookup key alignment, success paths
 */

import { describe, expect, it } from "vitest";
import { CREDIT_PACKS, SERVICE_PRODUCTS, VALID_LOOKUP_KEYS } from "../../core-logic/pricing.js";

// ─── VALID_LOOKUP_KEYS ───────────────────────────────────────────────────────

describe("VALID_LOOKUP_KEYS", () => {
  it("is a Set", () => {
    expect(VALID_LOOKUP_KEYS).toBeInstanceOf(Set);
  });

  it("contains the subscription lookup keys", () => {
    expect(VALID_LOOKUP_KEYS.has("pro_monthly")).toBe(true);
    expect(VALID_LOOKUP_KEYS.has("pro_annual")).toBe(true);
    expect(VALID_LOOKUP_KEYS.has("business_monthly")).toBe(true);
    expect(VALID_LOOKUP_KEYS.has("business_annual")).toBe(true);
  });

  it("contains the migration service lookup keys", () => {
    expect(VALID_LOOKUP_KEYS.has("migration_blog_42000")).toBe(true);
    expect(VALID_LOOKUP_KEYS.has("migration_script_100000")).toBe(true);
    expect(VALID_LOOKUP_KEYS.has("migration_mcp_1000000")).toBe(true);
  });

  it("has exactly 7 entries", () => {
    expect(VALID_LOOKUP_KEYS.size).toBe(7);
  });

  it("rejects unknown keys", () => {
    expect(VALID_LOOKUP_KEYS.has("enterprise_monthly")).toBe(false);
    expect(VALID_LOOKUP_KEYS.has("free")).toBe(false);
    expect(VALID_LOOKUP_KEYS.has("")).toBe(false);
  });

  it("does not contain credit pack lookup keys (those are separate)", () => {
    expect(VALID_LOOKUP_KEYS.has("credits_500")).toBe(false);
    expect(VALID_LOOKUP_KEYS.has("credits_2500")).toBe(false);
    expect(VALID_LOOKUP_KEYS.has("credits_7500")).toBe(false);
  });
});

// ─── CREDIT_PACKS ───────────────────────────────────────────────────────────

describe("CREDIT_PACKS", () => {
  it("contains exactly 3 packs", () => {
    expect(CREDIT_PACKS).toHaveLength(3);
  });

  it("packs are ordered by increasing credit count", () => {
    const credits = CREDIT_PACKS.map((p) => p.credits);
    expect(credits).toEqual([500, 2500, 7500]);
  });

  it("each pack has credits, priceCents, and lookupKey fields", () => {
    for (const pack of CREDIT_PACKS) {
      expect(typeof pack.credits).toBe("number");
      expect(typeof pack.priceCents).toBe("number");
      expect(typeof pack.lookupKey).toBe("string");
      expect(pack.lookupKey.length).toBeGreaterThan(0);
    }
  });

  it("provides volume discount — lower price per credit as pack size grows", () => {
    const [small, medium, large] = CREDIT_PACKS;
    const pricePerCreditSmall = small!.priceCents / small!.credits;
    const pricePerCreditMedium = medium!.priceCents / medium!.credits;
    const pricePerCreditLarge = large!.priceCents / large!.credits;

    expect(pricePerCreditMedium).toBeLessThan(pricePerCreditSmall);
    expect(pricePerCreditLarge).toBeLessThan(pricePerCreditMedium);
  });

  it("500 credit pack costs 500 cents ($5)", () => {
    const pack = CREDIT_PACKS.find((p) => p.credits === 500);
    expect(pack?.priceCents).toBe(500);
    expect(pack?.lookupKey).toBe("credits_500");
  });

  it("2500 credit pack costs 2000 cents ($20)", () => {
    const pack = CREDIT_PACKS.find((p) => p.credits === 2500);
    expect(pack?.priceCents).toBe(2000);
    expect(pack?.lookupKey).toBe("credits_2500");
  });

  it("7500 credit pack costs 5000 cents ($50)", () => {
    const pack = CREDIT_PACKS.find((p) => p.credits === 7500);
    expect(pack?.priceCents).toBe(5000);
    expect(pack?.lookupKey).toBe("credits_7500");
  });

  it("all lookup keys are unique", () => {
    const keys = CREDIT_PACKS.map((p) => p.lookupKey);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  it("all priceCents values are positive integers", () => {
    for (const pack of CREDIT_PACKS) {
      expect(pack.priceCents).toBeGreaterThan(0);
      expect(Number.isInteger(pack.priceCents)).toBe(true);
    }
  });
});

// ─── SERVICE_PRODUCTS ───────────────────────────────────────────────────────

describe("SERVICE_PRODUCTS", () => {
  it("is a plain object", () => {
    expect(typeof SERVICE_PRODUCTS).toBe("object");
    expect(SERVICE_PRODUCTS).not.toBeNull();
    expect(Array.isArray(SERVICE_PRODUCTS)).toBe(false);
  });

  it("contains the expected service keys", () => {
    const expectedKeys = [
      "app_builder",
      "workshop_seat",
      "workshop_team",
      "migration_blog",
      "migration_script",
      "migration_mcp",
    ];
    for (const key of expectedKeys) {
      expect(SERVICE_PRODUCTS).toHaveProperty(key);
    }
  });

  it("has exactly 6 entries", () => {
    expect(Object.keys(SERVICE_PRODUCTS)).toHaveLength(6);
  });

  it("each product has lookupKey, successPath, and label fields", () => {
    for (const [name, product] of Object.entries(SERVICE_PRODUCTS)) {
      expect(typeof product.lookupKey, `${name}.lookupKey`).toBe("string");
      expect(product.lookupKey.length, `${name}.lookupKey non-empty`).toBeGreaterThan(0);
      expect(typeof product.successPath, `${name}.successPath`).toBe("string");
      expect(product.successPath.startsWith("/"), `${name}.successPath starts with /`).toBe(true);
      expect(typeof product.label, `${name}.label`).toBe("string");
      expect(product.label.length, `${name}.label non-empty`).toBeGreaterThan(0);
    }
  });

  it("all lookup keys are unique across products", () => {
    const keys = Object.values(SERVICE_PRODUCTS).map((p) => p.lookupKey);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  it("migration products have lookup keys present in VALID_LOOKUP_KEYS", () => {
    expect(VALID_LOOKUP_KEYS.has(SERVICE_PRODUCTS.migration_blog!.lookupKey)).toBe(true);
    expect(VALID_LOOKUP_KEYS.has(SERVICE_PRODUCTS.migration_script!.lookupKey)).toBe(true);
    expect(VALID_LOOKUP_KEYS.has(SERVICE_PRODUCTS.migration_mcp!.lookupKey)).toBe(true);
  });

  it("migration_blog has correct lookup key and success path", () => {
    const product = SERVICE_PRODUCTS.migration_blog!;
    expect(product.lookupKey).toBe("migration_blog_42000");
    expect(product.successPath).toBe("/migrate?success=blog");
  });

  it("migration_script has correct lookup key and success path", () => {
    const product = SERVICE_PRODUCTS.migration_script!;
    expect(product.lookupKey).toBe("migration_script_100000");
    expect(product.successPath).toBe("/migrate?success=script");
  });

  it("migration_mcp has correct lookup key and success path", () => {
    const product = SERVICE_PRODUCTS.migration_mcp!;
    expect(product.lookupKey).toBe("migration_mcp_1000000");
    expect(product.successPath).toBe("/migrate?success=mcp");
  });

  it("app_builder has correct lookup key and a /build success path", () => {
    const product = SERVICE_PRODUCTS.app_builder!;
    expect(product.lookupKey).toBe("app_builder_1997");
    expect(product.successPath).toContain("/build");
  });

  it("workshop_seat and workshop_team both succeed at /workshop", () => {
    expect(SERVICE_PRODUCTS.workshop_seat!.successPath).toContain("/workshop");
    expect(SERVICE_PRODUCTS.workshop_team!.successPath).toContain("/workshop");
  });

  it("all success paths end with a query string indicating success", () => {
    for (const [name, product] of Object.entries(SERVICE_PRODUCTS)) {
      expect(
        product.successPath.includes("success"),
        `${name}.successPath contains 'success'`,
      ).toBe(true);
    }
  });

  it("lookup key prices embedded in migration key names match actual support route amounts", () => {
    // migration_blog_42000 → $420, migration_script_100000 → $1000, migration_mcp_1000000 → $10000
    const blogKeyPrice = parseInt(
      SERVICE_PRODUCTS.migration_blog!.lookupKey.split("_").pop() ?? "0",
      10,
    );
    const scriptKeyPrice = parseInt(
      SERVICE_PRODUCTS.migration_script!.lookupKey.split("_").pop() ?? "0",
      10,
    );
    const mcpKeyPrice = parseInt(
      SERVICE_PRODUCTS.migration_mcp!.lookupKey.split("_").pop() ?? "0",
      10,
    );

    expect(blogKeyPrice).toBe(42000);
    expect(scriptKeyPrice).toBe(100000);
    expect(mcpKeyPrice).toBe(1000000);
  });
});
