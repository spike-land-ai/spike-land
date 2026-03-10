/**
 * COMPASS Data Seeds — SeedLoader
 *
 * Provides a typed, validated interface for loading country seed data.
 * All four flagship countries are eagerly registered at module load time.
 * Validation checks referential integrity (process.programId must exist)
 * and structural completeness of all required fields.
 */

import type { CountrySeed } from "../types.js";
import { germanySeed } from "../seeds/germany.js";
import { indiaSeed } from "../seeds/india.js";
import { unitedStatesSeed } from "../seeds/united-states.js";
import { kenyaSeed } from "../seeds/kenya.js";

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/** ISO 3166-1 alpha-2 → CountrySeed */
const REGISTRY = new Map<string, CountrySeed>([
  ["DE", germanySeed],
  ["IN", indiaSeed],
  ["US", unitedStatesSeed],
  ["KE", kenyaSeed],
]);

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/** Collect all error strings from a seed into an array. */
function collectErrors(seed: CountrySeed): string[] {
  const errors: string[] = [];
  const { jurisdiction, programs, processes, institutions, rights } = seed;

  // --- jurisdiction ---
  if (!jurisdiction.id) errors.push("jurisdiction.id is empty");
  if (!jurisdiction.code) errors.push("jurisdiction.code is empty");
  if (!jurisdiction.name) errors.push("jurisdiction.name is empty");
  if (!jurisdiction.currency) errors.push("jurisdiction.currency is empty");
  if (jurisdiction.languages.length === 0) errors.push("jurisdiction.languages must not be empty");

  // --- programs ---
  const programIds = new Set<string>();
  for (const program of programs) {
    if (!program.id) {
      errors.push("a program has an empty id");
    } else if (programIds.has(program.id)) {
      errors.push(`duplicate program id: "${program.id}"`);
    } else {
      programIds.add(program.id);
    }
    if (!program.name) errors.push(`program "${program.id}" has an empty name`);
    if (!program.description) errors.push(`program "${program.id}" has an empty description`);
    if (!program.jurisdiction) errors.push(`program "${program.id}" has an empty jurisdiction`);
    if (!program.benefits) errors.push(`program "${program.id}" has an empty benefits field`);
    if (program.eligibilityCriteria.length === 0) {
      errors.push(`program "${program.id}" has no eligibility criteria`);
    }
    if (program.requiredDocuments.length === 0) {
      errors.push(`program "${program.id}" has no required documents`);
    }
  }

  // --- processes ---
  const processIds = new Set<string>();
  for (const process of processes) {
    if (!process.id) {
      errors.push("a process has an empty id");
    } else if (processIds.has(process.id)) {
      errors.push(`duplicate process id: "${process.id}"`);
    } else {
      processIds.add(process.id);
    }
    if (!process.name) errors.push(`process "${process.id}" has an empty name`);
    if (!process.programId) {
      errors.push(`process "${process.id}" has an empty programId`);
    } else if (!programIds.has(process.programId)) {
      errors.push(`process "${process.id}" references unknown programId: "${process.programId}"`);
    }
    if (!process.estimatedDuration) {
      errors.push(`process "${process.id}" has an empty estimatedDuration`);
    }
    if (!process.cost) errors.push(`process "${process.id}" has an empty cost`);
    if (process.steps.length === 0) {
      errors.push(`process "${process.id}" has no steps`);
    }

    // --- steps ---
    const stepIds = new Set<string>();
    for (const step of process.steps) {
      if (!step.id) {
        errors.push(`process "${process.id}" has a step with an empty id`);
      } else if (stepIds.has(step.id)) {
        errors.push(`process "${process.id}" has duplicate step id: "${step.id}"`);
      } else {
        stepIds.add(step.id);
      }
      if (!step.title)
        errors.push(`step "${step.id}" in process "${process.id}" has an empty title`);
      if (!step.description) {
        errors.push(`step "${step.id}" in process "${process.id}" has an empty description`);
      }
      if (step.order < 1) {
        errors.push(
          `step "${step.id}" in process "${process.id}" has invalid order: ${String(step.order)}`,
        );
      }
    }

    // Verify step ordering is contiguous from 1
    const orders = process.steps.map((s) => s.order).sort((a, b) => a - b);
    for (let i = 0; i < orders.length; i++) {
      if (orders[i] !== i + 1) {
        errors.push(
          `process "${process.id}" step orders are not contiguous from 1 (found: ${orders.join(",")})`,
        );
        break;
      }
    }
  }

  // --- institutions ---
  const instIds = new Set<string>();
  for (const inst of institutions) {
    if (!inst.id) {
      errors.push("an institution has an empty id");
    } else if (instIds.has(inst.id)) {
      errors.push(`duplicate institution id: "${inst.id}"`);
    } else {
      instIds.add(inst.id);
    }
    if (!inst.name) errors.push(`institution "${inst.id}" has an empty name`);
    if (!inst.type) errors.push(`institution "${inst.id}" has an empty type`);
    if (!inst.jurisdiction) errors.push(`institution "${inst.id}" has an empty jurisdiction`);
  }

  // --- rights ---
  const rightIds = new Set<string>();
  for (const right of rights) {
    if (!right.id) {
      errors.push("a right has an empty id");
    } else if (rightIds.has(right.id)) {
      errors.push(`duplicate right id: "${right.id}"`);
    } else {
      rightIds.add(right.id);
    }
    if (!right.title) errors.push(`right "${right.id}" has an empty title`);
    if (!right.description) errors.push(`right "${right.id}" has an empty description`);
    if (!right.legalBasis) errors.push(`right "${right.id}" has an empty legalBasis`);
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export class SeedLoader {
  /**
   * Load the country seed for the given ISO 3166-1 alpha-2 code.
   * Throws if the code is not registered.
   */
  loadCountry(code: string): CountrySeed {
    const seed = REGISTRY.get(code.toUpperCase());
    if (!seed) {
      throw new Error(
        `No seed registered for country code "${code}". ` +
          `Available codes: ${[...REGISTRY.keys()].sort().join(", ")}`,
      );
    }
    return seed;
  }

  /**
   * Return all registered ISO 3166-1 alpha-2 country codes.
   */
  getAllCountries(): string[] {
    return [...REGISTRY.keys()].sort();
  }

  /**
   * Return the number of programs registered for a given country code.
   * Throws if the code is not registered.
   */
  getProgramCount(code: string): number {
    const seed = this.loadCountry(code);
    return seed.programs.length;
  }

  /**
   * Validate a seed for structural correctness and referential integrity.
   * Checks:
   *   - All required string fields are non-empty
   *   - No duplicate IDs within each entity type
   *   - All process.programId values reference an existing program
   *   - Step orders are contiguous from 1
   */
  validateSeed(seed: CountrySeed): ValidationResult {
    const errors = collectErrors(seed);
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/** Shared singleton — consumers can import this instead of instantiating their own. */
export const seedLoader = new SeedLoader();
