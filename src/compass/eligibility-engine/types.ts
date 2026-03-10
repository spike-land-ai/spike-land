/**
 * COMPASS Eligibility Engine — Core Type Definitions
 *
 * All types are immutable-first. No optional chaining required for required
 * fields. customFields is the extension point for jurisdiction-specific data
 * that does not fit the standard profile schema.
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export enum Operator {
  /** Strict equality */
  eq = "eq",
  /** Strict inequality */
  neq = "neq",
  /** Greater than (numeric) */
  gt = "gt",
  /** Less than (numeric) */
  lt = "lt",
  /** Greater than or equal (numeric) */
  gte = "gte",
  /** Less than or equal (numeric) */
  lte = "lte",
  /** Value is contained within the rule array */
  in = "in",
  /** Value is NOT contained within the rule array */
  notIn = "notIn",
  /** Array/string field contains the rule value */
  contains = "contains",
  /** Field is present and non-null (value is ignored) */
  exists = "exists",
}

export enum EmploymentStatus {
  employed = "employed",
  selfEmployed = "selfEmployed",
  unemployed = "unemployed",
  student = "student",
  retired = "retired",
  disabled = "disabled",
  notInLaborForce = "notInLaborForce",
}

export enum CitizenshipStatus {
  citizen = "citizen",
  permanentResident = "permanentResident",
  refugee = "refugee",
  asylumSeeker = "asylumSeeker",
  temporaryVisa = "temporaryVisa",
  undocumented = "undocumented",
  other = "other",
}

// ---------------------------------------------------------------------------
// Core domain types
// ---------------------------------------------------------------------------

/**
 * Location is represented as ISO 3166 codes for deterministic matching.
 * countryCode: ISO 3166-1 alpha-2 (e.g. "US")
 * regionCode:  ISO 3166-2 subdivision code without country prefix (e.g. "CA")
 * postalCode:  Optional — used for hyper-local program eligibility
 */
export interface Location {
  readonly countryCode: string;
  readonly regionCode?: string;
  readonly postalCode?: string;
}

/**
 * A disability entry. The code uses a free-form string to stay jurisdiction
 * agnostic; callers should normalise to a consistent vocabulary (e.g. ICD-10).
 */
export interface Disability {
  readonly code: string;
  readonly description: string;
  /** Whether the disability is formally certified by a recognised authority */
  readonly certified: boolean;
}

// ---------------------------------------------------------------------------
// User profile
// ---------------------------------------------------------------------------

export interface UserProfile {
  /** Age in whole years */
  readonly age: number;
  /** Annual gross income in the local currency (integer cents avoids floats) */
  readonly incomeAnnualCents: number;
  readonly location: Location;
  readonly familySize: number;
  readonly disabilities: readonly Disability[];
  readonly employmentStatus: EmploymentStatus;
  readonly citizenshipStatus: CitizenshipStatus;
  /** BCP-47 language tags, e.g. ["en", "es-419"] */
  readonly languages: readonly string[];
  /**
   * Extension map for jurisdiction-specific fields not covered by the standard
   * schema. Keys are namespaced by convention: "us.snap.householdType".
   * Values must be JSON-serialisable primitives or arrays of primitives.
   */
  readonly customFields: ReadonlyMap<string, CustomFieldValue>;
}

export type CustomFieldValue =
  | string
  | number
  | boolean
  | readonly string[]
  | readonly number[]
  | readonly boolean[];

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

/**
 * A single eligibility rule.
 *
 * `field` targets a top-level UserProfile key or a dot-path into customFields:
 *   - "age"                     → profile.age
 *   - "location.countryCode"    → profile.location.countryCode
 *   - "custom:us.snap.type"     → profile.customFields.get("us.snap.type")
 *   - "disabilities"            → profile.disabilities (array)
 *
 * `value` is ignored when operator is `exists`.
 */
export interface EligibilityRule {
  readonly field: string;
  readonly operator: Operator;
  readonly value?: RuleValue;
  /** Human-readable label displayed in explanations */
  readonly label?: string;
}

export type RuleValue = string | number | boolean | readonly string[] | readonly number[];

// ---------------------------------------------------------------------------
// Programs
// ---------------------------------------------------------------------------

export interface Benefit {
  readonly type: "monetary" | "service" | "voucher" | "inkind" | "other";
  /** Description of the benefit */
  readonly description: string;
  /**
   * Estimated annual value in cents (for ranking by impact).
   * Omit when the benefit is non-monetary and hard to quantify.
   */
  readonly estimatedAnnualValueCents?: number;
}

export interface Program {
  readonly id: string;
  readonly name: string;
  /** ISO 3166-1 alpha-2 country, optionally with "-" + region, e.g. "US-CA" */
  readonly jurisdiction: string;
  /** ALL rules must be satisfied for a profile to be eligible */
  readonly rules: readonly EligibilityRule[];
  readonly benefits: readonly Benefit[];
  readonly requiredDocuments: readonly string[];
  /**
   * Number of days until the next application deadline.
   * Absent = rolling / no fixed deadline.
   */
  readonly daysUntilDeadline?: number;
  /**
   * Estimated number of steps required to apply (used for ranking by ease).
   * Lower is easier.
   */
  readonly applicationStepCount?: number;
}

// ---------------------------------------------------------------------------
// Match results
// ---------------------------------------------------------------------------

export interface MatchResult {
  readonly programId: string;
  readonly eligible: boolean;
  /**
   * Score between 0 and 1. For eligible programs it is always 1.0.
   * For ineligible programs it reflects the proportion of rules satisfied,
   * which is useful for "almost qualifies" UX features.
   */
  readonly matchScore: number;
  /** Rules the profile failed to satisfy */
  readonly missingCriteria: readonly EligibilityRule[];
  /** Human-readable steps the user should take to become eligible */
  readonly requiredActions: readonly string[];
}

export interface RankedMatch {
  readonly matchResult: MatchResult;
  readonly program: Program;
  /**
   * Composite impact score used for ordering. Higher is more impactful.
   * Accounts for benefit value, ease of application, and deadline urgency.
   */
  readonly impactScore: number;
}
