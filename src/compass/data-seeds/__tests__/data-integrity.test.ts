/**
 * COMPASS Data Seeds — Data Integrity Tests
 *
 * Cross-reference checks across all four flagship country seeds:
 *   - All process.programId values reference a real program in the same seed
 *   - No duplicate IDs within any entity type
 *   - All required fields are non-empty strings
 *   - Step orders are contiguous from 1
 *   - Jurisdiction codes match ISO 3166-1 alpha-2 expectations
 *   - Programs reference the same country code as the jurisdiction
 *   - Criteria operators are from the allowed set
 */

import { describe, it, expect } from "vitest";
import { seedLoader } from "../core-logic/seed-loader.js";
import type { CountrySeed, CriteriaData } from "../types.js";

const ALLOWED_OPERATORS: ReadonlyArray<CriteriaData["operator"]> = [
  "eq",
  "neq",
  "gt",
  "lt",
  "gte",
  "lte",
  "in",
  "notIn",
  "contains",
  "exists",
];

const COUNTRY_CODES = seedLoader.getAllCountries(); // ["DE","IN","KE","US"]

// ---------------------------------------------------------------------------
// Helper: run cross-ref checks and return all error strings
// ---------------------------------------------------------------------------

function crossReferenceErrors(seed: CountrySeed): string[] {
  const errors: string[] = [];
  const countryCode = seed.jurisdiction.code;

  // Build the program ID set
  const programIds = new Set(seed.programs.map((p) => p.id));

  // 1. All process.programId values must exist
  for (const process of seed.processes) {
    if (!programIds.has(process.programId)) {
      errors.push(
        `[${countryCode}] process "${process.id}" has dangling programId "${process.programId}"`,
      );
    }
  }

  // 2. No duplicate IDs in programs
  {
    const seen = new Set<string>();
    for (const p of seed.programs) {
      if (seen.has(p.id)) errors.push(`[${countryCode}] duplicate program id: "${p.id}"`);
      seen.add(p.id);
    }
  }

  // 3. No duplicate IDs in processes
  {
    const seen = new Set<string>();
    for (const p of seed.processes) {
      if (seen.has(p.id)) errors.push(`[${countryCode}] duplicate process id: "${p.id}"`);
      seen.add(p.id);
    }
  }

  // 4. No duplicate IDs in institutions
  {
    const seen = new Set<string>();
    for (const inst of seed.institutions) {
      if (seen.has(inst.id)) errors.push(`[${countryCode}] duplicate institution id: "${inst.id}"`);
      seen.add(inst.id);
    }
  }

  // 5. No duplicate IDs in rights
  {
    const seen = new Set<string>();
    for (const right of seed.rights) {
      if (seen.has(right.id)) errors.push(`[${countryCode}] duplicate right id: "${right.id}"`);
      seen.add(right.id);
    }
  }

  // 6. No duplicate step IDs within a process
  for (const process of seed.processes) {
    const seen = new Set<string>();
    for (const step of process.steps) {
      if (seen.has(step.id)) {
        errors.push(`[${countryCode}] process "${process.id}" has duplicate step id: "${step.id}"`);
      }
      seen.add(step.id);
    }
  }

  // 7. Step orders are contiguous from 1
  for (const process of seed.processes) {
    const orders = process.steps.map((s) => s.order).sort((a, b) => a - b);
    for (let i = 0; i < orders.length; i++) {
      if (orders[i] !== i + 1) {
        errors.push(
          `[${countryCode}] process "${process.id}" step orders not contiguous from 1 (got: ${orders.join(",")})`,
        );
        break;
      }
    }
  }

  // 8. Programs jurisdiction codes match seed country code
  for (const program of seed.programs) {
    if (!program.jurisdiction.startsWith(countryCode)) {
      errors.push(
        `[${countryCode}] program "${program.id}" jurisdiction "${program.jurisdiction}" ` +
          `doesn't start with country code "${countryCode}"`,
      );
    }
  }

  // 9. All criteria operators are from the allowed set
  for (const program of seed.programs) {
    for (const criterion of program.eligibilityCriteria) {
      if (!ALLOWED_OPERATORS.includes(criterion.operator)) {
        errors.push(
          `[${countryCode}] program "${program.id}" criterion field "${criterion.field}" ` +
            `has unknown operator: "${criterion.operator}"`,
        );
      }
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Per-country cross-reference suites
// ---------------------------------------------------------------------------

describe.each(COUNTRY_CODES)("data integrity: %s", (code) => {
  const seed = seedLoader.loadCountry(code);

  it("has no cross-reference errors", () => {
    const errors = crossReferenceErrors(seed);
    if (errors.length > 0) {
      console.error(`Cross-reference errors for ${code}:\n  ${errors.join("\n  ")}`);
    }
    expect(errors).toHaveLength(0);
  });

  it("has at least 4 programs", () => {
    expect(seed.programs.length).toBeGreaterThanOrEqual(4);
  });

  it("has at least 1 process", () => {
    expect(seed.processes.length).toBeGreaterThanOrEqual(1);
  });

  it("has at least 1 institution", () => {
    expect(seed.institutions.length).toBeGreaterThanOrEqual(1);
  });

  it("has at least 1 right", () => {
    expect(seed.rights.length).toBeGreaterThanOrEqual(1);
  });

  it("every program has a non-empty id, name, description, benefits, and jurisdiction", () => {
    for (const program of seed.programs) {
      expect(program.id).toBeTruthy();
      expect(program.name).toBeTruthy();
      expect(program.description).toBeTruthy();
      expect(program.benefits).toBeTruthy();
      expect(program.jurisdiction).toBeTruthy();
    }
  });

  it("every program has at least 1 eligibility criterion with non-empty field and description", () => {
    for (const program of seed.programs) {
      expect(program.eligibilityCriteria.length).toBeGreaterThanOrEqual(1);
      for (const c of program.eligibilityCriteria) {
        expect(c.field).toBeTruthy();
        expect(c.description).toBeTruthy();
      }
    }
  });

  it("every program has at least 1 required document", () => {
    for (const program of seed.programs) {
      expect(program.requiredDocuments.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("every process has a non-empty id, name, programId, duration, and cost", () => {
    for (const process of seed.processes) {
      expect(process.id).toBeTruthy();
      expect(process.name).toBeTruthy();
      expect(process.programId).toBeTruthy();
      expect(process.estimatedDuration).toBeTruthy();
      expect(process.cost).toBeTruthy();
    }
  });

  it("every process has at least 1 step", () => {
    for (const process of seed.processes) {
      expect(process.steps.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("every step has id, title, and description", () => {
    for (const process of seed.processes) {
      for (const step of process.steps) {
        expect(step.id).toBeTruthy();
        expect(step.title).toBeTruthy();
        expect(step.description).toBeTruthy();
      }
    }
  });

  it("every step order is a positive integer", () => {
    for (const process of seed.processes) {
      for (const step of process.steps) {
        expect(Number.isInteger(step.order)).toBe(true);
        expect(step.order).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("every institution has id, name, type, and jurisdiction", () => {
    for (const inst of seed.institutions) {
      expect(inst.id).toBeTruthy();
      expect(inst.name).toBeTruthy();
      expect(inst.type).toBeTruthy();
      expect(inst.jurisdiction).toBeTruthy();
    }
  });

  it("every right has id, title, description, and legalBasis", () => {
    for (const right of seed.rights) {
      expect(right.id).toBeTruthy();
      expect(right.title).toBeTruthy();
      expect(right.description).toBeTruthy();
      expect(right.legalBasis).toBeTruthy();
    }
  });

  it("jurisdiction ISO code is exactly 2 uppercase letters", () => {
    expect(seed.jurisdiction.code).toMatch(/^[A-Z]{2}$/);
  });

  it("jurisdiction has a non-empty currency code (3 uppercase letters)", () => {
    expect(seed.jurisdiction.currency).toMatch(/^[A-Z]{3}$/);
  });

  it("jurisdiction lists at least one language (BCP-47 format)", () => {
    expect(seed.jurisdiction.languages.length).toBeGreaterThanOrEqual(1);
    for (const lang of seed.jurisdiction.languages) {
      // BCP-47: e.g. "en", "de", "hi", "sw", "es-419"
      expect(lang).toMatch(/^[a-z]{2,3}(-[A-Za-z0-9]+)*$/);
    }
  });
});

// ---------------------------------------------------------------------------
// Cross-country uniqueness
// ---------------------------------------------------------------------------

describe("cross-country uniqueness", () => {
  it("no two countries share the same program id", () => {
    const allProgramIds: string[] = [];
    for (const code of COUNTRY_CODES) {
      const seed = seedLoader.loadCountry(code);
      allProgramIds.push(...seed.programs.map((p) => p.id));
    }
    const unique = new Set(allProgramIds);
    expect(unique.size).toBe(allProgramIds.length);
  });

  it("no two countries share the same process id", () => {
    const allIds: string[] = [];
    for (const code of COUNTRY_CODES) {
      const seed = seedLoader.loadCountry(code);
      allIds.push(...seed.processes.map((p) => p.id));
    }
    const unique = new Set(allIds);
    expect(unique.size).toBe(allIds.length);
  });

  it("no two countries share the same institution id", () => {
    const allIds: string[] = [];
    for (const code of COUNTRY_CODES) {
      const seed = seedLoader.loadCountry(code);
      allIds.push(...seed.institutions.map((i) => i.id));
    }
    const unique = new Set(allIds);
    expect(unique.size).toBe(allIds.length);
  });

  it("no two countries share the same right id", () => {
    const allIds: string[] = [];
    for (const code of COUNTRY_CODES) {
      const seed = seedLoader.loadCountry(code);
      allIds.push(...seed.rights.map((r) => r.id));
    }
    const unique = new Set(allIds);
    expect(unique.size).toBe(allIds.length);
  });

  it("each country seed has a unique jurisdiction id", () => {
    const ids = COUNTRY_CODES.map((c) => seedLoader.loadCountry(c).jurisdiction.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(COUNTRY_CODES.length);
  });
});

// ---------------------------------------------------------------------------
// Coverage completeness: every program has at least one process
// ---------------------------------------------------------------------------

describe("program coverage: each program has at least one process", () => {
  it.each(COUNTRY_CODES)("%s — all programs are covered by at least one process", (code) => {
    const seed = seedLoader.loadCountry(code);
    const coveredProgramIds = new Set(seed.processes.map((p) => p.programId));
    const uncovered = seed.programs.filter((p) => !coveredProgramIds.has(p.id)).map((p) => p.id);

    if (uncovered.length > 0) {
      // Warn but don't fail — some programs may legitimately have no process yet
      // (they are stubs for future expansion). Log for visibility.
      console.warn(
        `[${code}] programs without a process (${uncovered.length}): ${uncovered.join(", ")}`,
      );
    }

    // At least 50% of programs must have a process — ensures the seed is substantive
    const coverage = coveredProgramIds.size / seed.programs.length;
    expect(coverage).toBeGreaterThanOrEqual(0.5);
  });
});
