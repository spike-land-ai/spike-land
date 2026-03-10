/**
 * COMPASS Rights Engine — core type definitions.
 *
 * Design principle: this engine is INDEPENDENT. Rights information must never
 * be suppressed, filtered, or softened due to government or institutional
 * partnerships. Every type here reflects what a person ACTUALLY has a right to
 * know, not what any third-party would prefer them to know.
 */

// ---------------------------------------------------------------------------
// Domain taxonomy
// ---------------------------------------------------------------------------

export type RightsDomain =
  | "healthcare"
  | "housing"
  | "asylum"
  | "employment"
  | "education"
  | "pension"
  | "disability";

export type AppealType = "formal" | "informal" | "complaint" | "ombudsman";

export type SuccessLikelihood = "low" | "medium" | "high";

export type LegalResourceType = "ngo" | "legal_aid" | "ombudsman" | "hotline" | "website";

// ---------------------------------------------------------------------------
// Core entities
// ---------------------------------------------------------------------------

/**
 * A specific, enforceable right that a person holds within a jurisdiction and
 * domain. Rights are facts — they exist independently of whether a bureaucratic
 * actor acknowledges them.
 */
export interface Right {
  /** Stable, unique identifier (e.g. "eu-gdpr-access-request"). */
  id: string;
  /** Short human-readable title (≤80 chars). */
  title: string;
  /** Full plain-language description. May include practical implications. */
  description: string;
  /**
   * ISO 3166-1 alpha-2 country code, or a supranational region code such as
   * "EU", "ECHR", or "UN".  Use "*" for universally applicable rights
   * (e.g. UN human rights treaties with near-universal ratification).
   */
  jurisdiction: string;
  /** Thematic domain this right falls under. */
  domain: RightsDomain;
  /**
   * Plain-language descriptions of who this right applies to.
   * Examples: ["asylum seekers", "recognised refugees", "stateless persons"]
   */
  applicableTo: string[];
  /**
   * Authoritative legal source(s) — treaty article, domestic statute,
   * constitutional provision, or case law citation.
   * Examples: ["ECHR Art. 6", "UK Immigration Act 2014 s.82"]
   */
  legalBasis: string;
}

/**
 * A reusable template for a specific type of appeal or complaint.
 * Templates must be jurisdiction-aware and legally accurate.
 */
export interface AppealTemplate {
  /** Stable, unique identifier. */
  id: string;
  /** The right this template asserts or defends. */
  rightId: string;
  /** The procedural mechanism this template invokes. */
  type: AppealType;
  /**
   * The body of the appeal letter/complaint.
   * Supports mustache-style placeholders: {{APPLICANT_NAME}}, {{DECISION_DATE}},
   * {{REFERENCE_NUMBER}}, {{DECISION_BODY}}, {{GROUNDS}}, {{DEADLINE}},
   * {{LEGAL_BASIS}}, {{REQUESTED_REMEDY}}.
   */
  template: string;
  /**
   * Deadline in calendar days from the original decision date.
   * Absence means no statutory deadline (best-efforts still applies).
   */
  deadline?: number;
  /** Step-by-step filing instructions in plain language. */
  instructions: string;
}

/**
 * A legal or advocacy resource a person can contact for help.
 */
export interface LegalResource {
  id: string;
  name: string;
  type: LegalResourceType;
  /**
   * ISO 3166-1 alpha-2 or supranational region code.
   * Use "*" for global resources.
   */
  jurisdiction: string;
  contactInfo: ContactInfo;
  /** Whether the service is free of charge for the target population. */
  freeOfCharge: boolean;
  /** ISO 639-1 language codes for languages supported. */
  languages: string[];
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  /**
   * Operating hours in plain language, e.g. "Mon–Fri 09:00–17:00 GMT".
   * Omit if 24/7 or unknown.
   */
  hours?: string;
}

// ---------------------------------------------------------------------------
// Analysis and process-stage types
// ---------------------------------------------------------------------------

/**
 * The result of analysing a rejection decision to determine whether, how, and
 * with what likelihood it can be challenged.
 *
 * The engine must always produce this analysis faithfully. A low
 * successLikelihood must never be used to discourage a person from pursuing
 * their rights — it is informational only.
 */
export interface RejectionAnalysis {
  /** Verbatim excerpt or summary of the original decision text. */
  originalDecision: string;
  /** Whether the decision is, on its face, legally challengeable. */
  isChallengeable: boolean;
  /**
   * Identified legal or procedural grounds for challenge.
   * Each ground is a concise plain-language statement, e.g.:
   *   "Decision was issued without giving prior notice as required by Art. 41 CFR"
   */
  grounds: string[];
  /**
   * Primary recommended next action in plain language.
   * Must always be provided — even "seek legal advice" is a valid action.
   */
  recommendedAction: string;
  /**
   * Date by which the recommended action must be taken, if time-limited.
   * Absence means no statutory deadline has been identified (act promptly anyway).
   */
  deadline?: Date;
  /** Indicative likelihood of success if the challenge is pursued. */
  successLikelihood: SuccessLikelihood;
}

/**
 * The set of rights relevant to a person at a specific stage of a bureaucratic
 * process, together with any urgent warnings the person should be aware of.
 */
export interface ProcessStageRights {
  /**
   * Identifier matching the process graph stage (from @compass/knowledge-engine).
   */
  stageId: string;
  /** Rights that are active and relevant at this stage. */
  rights: Right[];
  /**
   * Urgent warnings — time-sensitive information the person must know
   * regardless of whether they explicitly asked.
   * Examples: "You have 14 days from today to appeal this decision."
   */
  warnings: string[];
}
