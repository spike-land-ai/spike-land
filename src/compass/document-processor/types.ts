/**
 * COMPASS Document Processor — shared domain types.
 *
 * All types are read-only by default to prevent accidental mutation of
 * template or checklist data that originates from an authoritative source.
 */

// ---------------------------------------------------------------------------
// Form field primitives
// ---------------------------------------------------------------------------

export type FieldType = "text" | "date" | "number" | "checkbox" | "select" | "signature";

export interface FieldValidation {
  /** Regex pattern the value must satisfy. */
  readonly pattern?: string;
  /** Minimum value (numeric fields) or minimum character count (text). */
  readonly min?: number;
  /** Maximum value (numeric fields) or maximum character count (text). */
  readonly max?: number;
  /** Human-readable description of what a valid value looks like. */
  readonly message: string;
}

export interface FormField {
  readonly id: string;
  readonly label: string;
  readonly type: FieldType;
  readonly required: boolean;
  readonly validation?: FieldValidation;
  /** Plain-language guidance shown alongside the field. */
  readonly helpText?: string;
  /** Allowed values for `select` fields. */
  readonly options?: readonly string[];
}

// ---------------------------------------------------------------------------
// Form template — the authoritative definition of a fillable form
// ---------------------------------------------------------------------------

export interface FormTemplate {
  readonly id: string;
  readonly name: string;
  /** ISO 3166-1 alpha-2 country code, or a subdivision code such as "US-CA". */
  readonly jurisdiction: string;
  readonly fields: readonly FormField[];
  /** Official instructions text accompanying the form, verbatim. */
  readonly instructions: string;
}

// ---------------------------------------------------------------------------
// Filled-form snapshot — user's in-progress answers
// ---------------------------------------------------------------------------

export interface FilledForm {
  readonly templateId: string;
  /**
   * Keyed by FormField.id.  Values are loosely typed because each field type
   * carries a different runtime type (string, number, boolean, Date, …).
   */
  readonly values: ReadonlyMap<string, unknown>;
  /** 0–100 integer percentage. */
  readonly completionPercentage: number;
  /** Field IDs that are required but have no value yet. */
  readonly missingFields: readonly string[];
}

// ---------------------------------------------------------------------------
// Document checklist
// ---------------------------------------------------------------------------

export interface ChecklistItem {
  readonly documentName: string;
  readonly required: boolean;
  /** Whether the applicant has confirmed they have this document. */
  obtained: boolean;
  /** Other documents that can substitute this one. */
  readonly alternatives?: readonly string[];
  /** Step-by-step instructions for obtaining this document. */
  readonly howToObtain?: string;
}

export interface DocumentChecklist {
  /** Opaque identifier for the bureaucratic process (e.g. "US-passport-renewal"). */
  readonly processId: string;
  readonly items: ChecklistItem[];
}

// ---------------------------------------------------------------------------
// Prerequisite document — what must be gathered before starting
// ---------------------------------------------------------------------------

export interface PrerequisiteDocument {
  readonly name: string;
  readonly issuingAuthority: string;
  /** Human-readable estimate, e.g. "2–4 weeks". */
  readonly estimatedTime: string;
  /** e.g. "$30 USD" — omitted when free. */
  readonly cost?: string;
  /** Step-by-step plain-language instructions. */
  readonly instructions: string;
}

// ---------------------------------------------------------------------------
// Field validation result
// ---------------------------------------------------------------------------

export interface ValidationResult {
  readonly valid: boolean;
  /** Populated when valid is false. */
  readonly errorMessage?: string;
}

// ---------------------------------------------------------------------------
// Process step — minimal input type for the checklist generator
// ---------------------------------------------------------------------------

export interface ProcessStep {
  /** e.g. "Proof of identity", "Completed application form" */
  readonly requiredDocuments: readonly string[];
  /** Documents that are useful but not strictly mandatory. */
  readonly optionalDocuments?: readonly string[];
}
