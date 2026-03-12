/**
 * COMPASS Data Seeds — SeedLoader Tests
 *
 * Verifies that all four flagship country seeds can be loaded and pass
 * full referential-integrity validation.
 */

import { describe, it, expect } from "vitest";
import { SeedLoader, seedLoader } from "../core-logic/seed-loader.js";
import { germanySeed } from "../seeds/germany.js";
import { indiaSeed } from "../seeds/india.js";
import { unitedStatesSeed } from "../seeds/united-states.js";
import { kenyaSeed } from "../seeds/kenya.js";

// ---------------------------------------------------------------------------
// SeedLoader: basic API
// ---------------------------------------------------------------------------

describe("SeedLoader.getAllCountries", () => {
  it("returns the four flagship country codes in alphabetical order", () => {
    const codes = seedLoader.getAllCountries();
    expect(codes).toEqual(["DE", "IN", "KE", "US"]);
  });
});

describe("SeedLoader.loadCountry", () => {
  it("loads Germany by 'DE'", () => {
    const seed = seedLoader.loadCountry("DE");
    expect(seed.jurisdiction.code).toBe("DE");
    expect(seed.jurisdiction.name).toMatch(/Germany/i);
  });

  it("loads India by 'IN'", () => {
    const seed = seedLoader.loadCountry("IN");
    expect(seed.jurisdiction.code).toBe("IN");
    expect(seed.jurisdiction.currency).toBe("INR");
  });

  it("loads the United States by 'US'", () => {
    const seed = seedLoader.loadCountry("US");
    expect(seed.jurisdiction.code).toBe("US");
    expect(seed.jurisdiction.currency).toBe("USD");
  });

  it("loads Kenya by 'KE'", () => {
    const seed = seedLoader.loadCountry("KE");
    expect(seed.jurisdiction.code).toBe("KE");
    expect(seed.jurisdiction.currency).toBe("KES");
  });

  it("is case-insensitive ('de' → Germany)", () => {
    const seed = seedLoader.loadCountry("de");
    expect(seed.jurisdiction.code).toBe("DE");
  });

  it("throws for an unregistered country code", () => {
    expect(() => seedLoader.loadCountry("ZZ")).toThrow(/No seed registered/);
  });

  it("throws and includes available codes in the error message", () => {
    expect(() => seedLoader.loadCountry("XX")).toThrow(/DE.*IN.*KE.*US/s);
  });
});

describe("SeedLoader.getProgramCount", () => {
  it("Germany has at least 4 programs", () => {
    expect(seedLoader.getProgramCount("DE")).toBeGreaterThanOrEqual(4);
  });

  it("India has at least 4 programs", () => {
    expect(seedLoader.getProgramCount("IN")).toBeGreaterThanOrEqual(4);
  });

  it("United States has at least 5 programs", () => {
    expect(seedLoader.getProgramCount("US")).toBeGreaterThanOrEqual(5);
  });

  it("Kenya has at least 4 programs", () => {
    expect(seedLoader.getProgramCount("KE")).toBeGreaterThanOrEqual(4);
  });

  it("throws for unregistered code", () => {
    expect(() => seedLoader.getProgramCount("XX")).toThrow();
  });
});

// ---------------------------------------------------------------------------
// SeedLoader.validateSeed — all four countries pass validation
// ---------------------------------------------------------------------------

describe("SeedLoader.validateSeed", () => {
  it("Germany seed passes validation", () => {
    const result = seedLoader.validateSeed(germanySeed);
    if (!result.valid) {
      // Print errors for easier debugging
      console.error("Germany validation errors:", result.errors);
    }
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("India seed passes validation", () => {
    const result = seedLoader.validateSeed(indiaSeed);
    if (!result.valid) {
      console.error("India validation errors:", result.errors);
    }
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("United States seed passes validation", () => {
    const result = seedLoader.validateSeed(unitedStatesSeed);
    if (!result.valid) {
      console.error("US validation errors:", result.errors);
    }
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("Kenya seed passes validation", () => {
    const result = seedLoader.validateSeed(kenyaSeed);
    if (!result.valid) {
      console.error("Kenya validation errors:", result.errors);
    }
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("detects a broken programId reference in a modified seed", () => {
    const brokenSeed = {
      ...germanySeed,
      processes: [
        {
          ...germanySeed.processes[0],
          programId: "non-existent-program-id",
        },
        ...germanySeed.processes.slice(1),
      ],
    };
    const result = seedLoader.validateSeed(brokenSeed);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("non-existent-program-id"))).toBe(true);
  });

  it("detects a duplicate program id in a modified seed", () => {
    const firstProgram = germanySeed.programs[0];
    if (!firstProgram) throw new Error("test setup: Germany has no programs");

    const brokenSeed = {
      ...germanySeed,
      programs: [...germanySeed.programs, firstProgram],
    };
    const result = seedLoader.validateSeed(brokenSeed);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("duplicate program id"))).toBe(true);
  });

  it("detects a step with a non-contiguous order in a modified seed", () => {
    const firstProcess = germanySeed.processes[0];
    if (!firstProcess) throw new Error("test setup: Germany has no processes");
    const firstStep = firstProcess.steps[0];
    if (!firstStep) throw new Error("test setup: Germany first process has no steps");

    const brokenSeed = {
      ...germanySeed,
      processes: [
        {
          ...firstProcess,
          steps: [
            { ...firstStep, order: 5 }, // broken: starts at 5 not 1
            ...firstProcess.steps.slice(1),
          ],
        },
        ...germanySeed.processes.slice(1),
      ],
    };
    const result = seedLoader.validateSeed(brokenSeed);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("contiguous"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// SeedLoader instances are independent
// ---------------------------------------------------------------------------

describe("SeedLoader class instantiation", () => {
  it("a new SeedLoader instance returns the same seeds as the singleton", () => {
    const loader = new SeedLoader();
    expect(loader.loadCountry("KE").jurisdiction.id).toBe(
      seedLoader.loadCountry("KE").jurisdiction.id,
    );
  });
});
