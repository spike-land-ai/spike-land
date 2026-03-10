/**
 * COMPASS Data Seeds — Core Type Definitions
 *
 * These types model the seed data for flagship COMPASS countries.
 * All data structures are immutable-first (readonly arrays and properties).
 * Seeds are plain data objects — no runtime logic lives here.
 */

// ---------------------------------------------------------------------------
// Jurisdiction
// ---------------------------------------------------------------------------

/**
 * Top-level descriptor for a country or sub-national jurisdiction.
 * `code` follows ISO 3166-1 alpha-2 (e.g. "DE", "IN", "US", "KE").
 */
export interface JurisdictionData {
  readonly id: string;
  readonly name: string;
  /** ISO 3166-1 alpha-2 country code */
  readonly code: string;
  /** BCP-47 language tags in order of official precedence */
  readonly languages: readonly string[];
  /** ISO 4217 currency code */
  readonly currency: string;
  readonly governmentType: string;
}

// ---------------------------------------------------------------------------
// Eligibility criteria
// ---------------------------------------------------------------------------

/**
 * A single eligibility condition expressed as a field/operator/value triple.
 *
 * `field` follows the same dot-path convention as the eligibility-engine:
 *   - "age"                  → profile.age
 *   - "location.countryCode" → profile.location.countryCode
 *   - "custom:de.aufenthaltstitel" → profile.customFields.get(...)
 *
 * `operator` mirrors the Operator enum from @compass/eligibility-engine
 * (string union here to avoid cross-package import in seed data).
 */
export interface CriteriaData {
  readonly field: string;
  readonly operator:
    | "eq"
    | "neq"
    | "gt"
    | "lt"
    | "gte"
    | "lte"
    | "in"
    | "notIn"
    | "contains"
    | "exists";
  readonly value: unknown;
  /** Human-readable description shown to applicants */
  readonly description: string;
}

// ---------------------------------------------------------------------------
// Programs
// ---------------------------------------------------------------------------

export interface ProgramData {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** ISO 3166-1 alpha-2 country code (or "US-CA" style for sub-national) */
  readonly jurisdiction: string;
  /** High-level policy domain */
  readonly domain:
    | "refugee-integration"
    | "social-protection"
    | "health"
    | "housing"
    | "employment"
    | "agriculture"
    | "education"
    | "cash-transfer"
    | "nutrition"
    | "insurance";
  /** Plain-English summary of what the applicant receives */
  readonly benefits: string;
  readonly eligibilityCriteria: readonly CriteriaData[];
  /** Official document names required at application time */
  readonly requiredDocuments: readonly string[];
  /** Official government URL for online application */
  readonly applicationUrl?: string;
  /** ISO 8601 date string for fixed-cycle deadlines (omit for rolling) */
  readonly deadline?: string;
}

// ---------------------------------------------------------------------------
// Process steps
// ---------------------------------------------------------------------------

export interface StepData {
  readonly id: string;
  /** 1-based ordering within the parent process */
  readonly order: number;
  readonly title: string;
  readonly description: string;
  /** Office or location where this step takes place */
  readonly location?: string;
  /** Documents to bring or upload at this step */
  readonly documents?: readonly string[];
  /** Practical advice for applicants */
  readonly tips?: readonly string[];
  /** Common mistakes that cause delays or rejections */
  readonly commonPitfalls?: readonly string[];
}

// ---------------------------------------------------------------------------
// Processes
// ---------------------------------------------------------------------------

export interface ProcessData {
  readonly id: string;
  /** Foreign key — must match a ProgramData.id in the same CountrySeed */
  readonly programId: string;
  readonly name: string;
  readonly steps: readonly StepData[];
  /** E.g. "3-6 months", "2-4 weeks" */
  readonly estimatedDuration: string;
  /** E.g. "Free", "EUR 25 administrative fee" */
  readonly cost: string;
}

// ---------------------------------------------------------------------------
// Institutions
// ---------------------------------------------------------------------------

export interface InstitutionData {
  readonly id: string;
  readonly name: string;
  /** E.g. "federal-agency", "state-office", "ngo", "court", "municipality" */
  readonly type: string;
  /** ISO 3166-1 alpha-2 country code */
  readonly jurisdiction: string;
  readonly address?: string;
  readonly phone?: string;
  readonly website?: string;
  readonly hours?: string;
  /** Typical wait time for in-person services */
  readonly waitTime?: string;
}

// ---------------------------------------------------------------------------
// Rights
// ---------------------------------------------------------------------------

export interface RightData {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly domain:
    | "refugee-integration"
    | "social-protection"
    | "health"
    | "housing"
    | "employment"
    | "agriculture"
    | "education"
    | "cash-transfer"
    | "nutrition"
    | "insurance"
    | "legal";
  /** Statute, constitutional article, or international convention */
  readonly legalBasis: string;
  /** E.g. "30 days from written decision", "1 month" */
  readonly appealDeadline?: string;
}

// ---------------------------------------------------------------------------
// Country seed (top-level container)
// ---------------------------------------------------------------------------

export interface CountrySeed {
  readonly jurisdiction: JurisdictionData;
  readonly programs: readonly ProgramData[];
  readonly processes: readonly ProcessData[];
  readonly institutions: readonly InstitutionData[];
  readonly rights: readonly RightData[];
}
