/**
 * COMPASS Knowledge Engine — Domain Types
 *
 * Five-layer graph:
 *   Jurisdiction → Program → Process → Institution → Outcome
 *
 * Every entity carries versioning metadata so confidence decays over time
 * and stale records can be surfaced before they cause harm.
 */

// ── Primitives ─────────────────────────────────────────────────────────────

/** ISO 3166-1 alpha-2 two-letter country code, e.g. "DE", "BR", "NG". */
export type CountryCode = string;

/** ISO 639-1 two-letter language code, e.g. "en", "fr", "ar". */
export type LanguageCode = string;

/** RFC 3339 / ISO 8601 date-time string stored as UTC. */
export type ISODateTime = string;

/** 0–1 floating-point confidence score; 1.0 = fully verified, 0 = unknown. */
export type ConfidenceScore = number;

// ── Versioning metadata (mixed into every entity) ───────────────────────────

export interface VersionedEntity {
  /** Monotonically increasing integer; bump on every substantive edit. */
  readonly version: number;
  /** When the data was last confirmed correct by a human or authoritative source. */
  readonly lastVerified: ISODateTime;
  /**
   * Decayed confidence score at the moment of last calculation.
   * Recomputed on demand by the versioning module; stored here for caching.
   */
  readonly confidenceScore: ConfidenceScore;
  /** Identifier of the person or system that last verified this entity. */
  readonly verifiedBy: string | null;
  /** Freeform notes from the verifier. */
  readonly verifierNotes: string | null;
}

// ── Layer 1: Jurisdiction ───────────────────────────────────────────────────

export type JurisdictionLevel = "country" | "state" | "province" | "municipality" | "supranational";

export interface Jurisdiction extends VersionedEntity {
  readonly id: string;
  readonly name: string;
  /** Two-letter ISO country code for national jurisdictions; null for supranational. */
  readonly countryCode: CountryCode | null;
  readonly level: JurisdictionLevel;
  /** Parent jurisdiction id, e.g. a state's parent is a country. */
  readonly parentId: string | null;
  /** BCP-47 tags for official languages spoken in this jurisdiction. */
  readonly officialLanguages: readonly LanguageCode[];
  /** Canonical timezone string, e.g. "America/Sao_Paulo". */
  readonly timezone: string | null;
}

// ── Layer 2: Program ────────────────────────────────────────────────────────

export type ProgramCategory =
  | "immigration"
  | "social_benefits"
  | "business_registration"
  | "healthcare"
  | "education"
  | "taxation"
  | "housing"
  | "legal_aid"
  | "employment"
  | "identity_documents"
  | "other";

export type ProgramStatus = "active" | "suspended" | "sunset" | "proposed";

export interface Program extends VersionedEntity {
  readonly id: string;
  readonly jurisdictionId: string;
  readonly name: string;
  /** Short machine-readable slug, unique within jurisdiction. */
  readonly slug: string;
  readonly category: ProgramCategory;
  readonly status: ProgramStatus;
  readonly description: string;
  /** Official government URL for program information. */
  readonly officialUrl: string | null;
  /** When the program became (or will become) active. */
  readonly effectiveDate: ISODateTime | null;
  /** When the program ends; null means ongoing. */
  readonly expiryDate: ISODateTime | null;
  /** Ids of programs that must be completed before this one. */
  readonly prerequisiteIds: readonly string[];
  /** Tags for free-text search and faceting. */
  readonly tags: readonly string[];
}

// ── Layer 3: Process ────────────────────────────────────────────────────────

export type ProcessChannel = "in_person" | "online" | "mail" | "phone" | "agent_assisted";

export interface Process extends VersionedEntity {
  readonly id: string;
  readonly programId: string;
  readonly name: string;
  readonly description: string;
  readonly channels: readonly ProcessChannel[];
  /**
   * Estimated total duration in calendar days from first step to outcome.
   * null if the government does not publish an SLA.
   */
  readonly estimatedDurationDays: number | null;
  /**
   * Total government fee in the smallest currency unit (cents/pence/etc.).
   * null if free or unknown.
   */
  readonly feeMinorUnit: number | null;
  readonly feeCurrencyCode: string | null;
  /** Ordered list of step ids that constitute this process. */
  readonly stepIds: readonly string[];
}

// ── Layer 3a: Step (constituent part of a Process) ──────────────────────────

export type StepType =
  | "form_submission"
  | "document_upload"
  | "biometric_appointment"
  | "interview"
  | "payment"
  | "waiting_period"
  | "review"
  | "decision"
  | "appeal";

export interface Step extends VersionedEntity {
  readonly id: string;
  readonly processId: string;
  readonly ordinal: number;
  readonly name: string;
  readonly description: string;
  readonly type: StepType;
  /** Institution responsible for processing this step. */
  readonly institutionId: string;
  /** List of document ids required before this step can start. */
  readonly requiredDocumentIds: readonly string[];
  /** Estimated business days to complete this specific step. */
  readonly estimatedBusinessDays: number | null;
  /** Whether the applicant can do this step without an agent or lawyer. */
  readonly selfServiceEligible: boolean;
  /** URL for online completion if available. */
  readonly onlinePortalUrl: string | null;
}

// ── Layer 4: Institution ────────────────────────────────────────────────────

export type InstitutionType =
  | "ministry"
  | "agency"
  | "court"
  | "municipality_office"
  | "embassy"
  | "consulate"
  | "accredited_entity"
  | "bank"
  | "other";

export interface Institution extends VersionedEntity {
  readonly id: string;
  readonly jurisdictionId: string;
  readonly name: string;
  readonly type: InstitutionType;
  readonly officialUrl: string | null;
  readonly contactEmail: string | null;
  readonly contactPhone: string | null;
  /** Physical address; null for online-only entities. */
  readonly physicalAddress: string | null;
  /** Hours of operation as a human-readable string; null if unknown. */
  readonly operatingHours: string | null;
}

// ── Layer 5: Outcome ────────────────────────────────────────────────────────

export type OutcomeType =
  | "permit"
  | "license"
  | "certificate"
  | "benefit_payment"
  | "residency_status"
  | "citizenship"
  | "registration"
  | "appeal_right"
  | "rejection"
  | "other";

export interface Outcome extends VersionedEntity {
  readonly id: string;
  readonly processId: string;
  readonly name: string;
  readonly type: OutcomeType;
  readonly description: string;
  /** Validity period in calendar days; null if permanent or unknown. */
  readonly validityDays: number | null;
  /** Whether the outcome is renewable and how long before expiry to start. */
  readonly renewable: boolean;
  readonly renewalLeadTimeDays: number | null;
  /** Ids of subsequent programs the holder becomes eligible for. */
  readonly unlocksProgramIds: readonly string[];
}

// ── Supporting types ────────────────────────────────────────────────────────

export type DocumentFormat = "pdf" | "jpg" | "png" | "original" | "notarized" | "apostilled";

export interface Document extends VersionedEntity {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly acceptedFormats: readonly DocumentFormat[];
  /** Whether an official translation is required and in which language. */
  readonly translationRequired: boolean;
  readonly translationLanguage: LanguageCode | null;
  /** Expiry of the document itself in calendar days from issue date. */
  readonly expiryDays: number | null;
  /** Issuing institution id if known. */
  readonly issuingInstitutionId: string | null;
}

export type DeadlineRecurrence = "once" | "annual" | "quarterly" | "monthly" | "rolling";

export interface Deadline extends VersionedEntity {
  readonly id: string;
  readonly programId: string;
  readonly name: string;
  readonly description: string;
  readonly recurrence: DeadlineRecurrence;
  /**
   * For "once" deadlines: the exact ISO date-time.
   * For recurring deadlines: a cron-style expression or human-readable rule.
   */
  readonly dateExpression: string;
  /** Penalty or consequence of missing the deadline. */
  readonly consequence: string | null;
}

// ── Change detection (used by RegulatoryMonitor) ────────────────────────────

export type ChangeType = "content_changed" | "url_changed" | "page_removed" | "new_content";

export interface ChangeDetection {
  readonly sourceUrl: string;
  readonly jurisdictionId: string;
  readonly detectedAt: ISODateTime;
  readonly changeType: ChangeType;
  /** Short summary of what appeared to change. */
  readonly summary: string;
  /** Ids of programs that may be affected. */
  readonly affectedProgramIds: readonly string[];
}

// ── Graph-level aggregate types ─────────────────────────────────────────────

/** All entities that can be stored and versioned in the graph. */
export type KnowledgeEntity =
  | Jurisdiction
  | Program
  | Process
  | Step
  | Institution
  | Outcome
  | Document
  | Deadline;

export type EntityType =
  | "jurisdiction"
  | "program"
  | "process"
  | "step"
  | "institution"
  | "outcome"
  | "document"
  | "deadline";

/** Lightweight record returned by getStaleEntities(). */
export interface StaleEntityRecord {
  readonly entityId: string;
  readonly entityType: EntityType;
  readonly lastVerified: ISODateTime;
  readonly daysSinceVerification: number;
  readonly currentConfidence: ConfidenceScore;
}

/** Result of a program search query. */
export interface ProgramSearchResult {
  readonly program: Program;
  /** Relevance score; higher is more relevant. */
  readonly score: number;
}
