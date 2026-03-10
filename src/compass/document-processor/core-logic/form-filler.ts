/**
 * Form Filler
 *
 * Manages loading a FormTemplate, prefilling it from a user profile, validating
 * individual fields, and tracking overall completion state.
 *
 * COMPASS principle: this module NEVER fabricates required document content.
 * It only maps known user profile data onto form fields and flags what is still
 * missing.
 */

import type { FilledForm, FormField, FormTemplate, ValidationResult } from "../types.js";

// ---------------------------------------------------------------------------
// User profile shape — the data COMPASS holds about a user
// ---------------------------------------------------------------------------

/**
 * A flat bag of well-known profile keys.  Only the keys defined here are used
 * for prefill; all other profile data is ignored.
 */
export interface UserProfile {
  readonly givenName?: string;
  readonly familyName?: string;
  readonly dateOfBirth?: string; // ISO 8601 date, e.g. "1990-04-15"
  readonly email?: string;
  readonly phone?: string;
  readonly addressLine1?: string;
  readonly addressLine2?: string;
  readonly city?: string;
  readonly stateOrProvince?: string;
  readonly postalCode?: string;
  readonly country?: string;
  readonly nationalIdNumber?: string;
  readonly passportNumber?: string;
}

// ---------------------------------------------------------------------------
// FormFiller class
// ---------------------------------------------------------------------------

export class FormFiller {
  private template: FormTemplate | null = null;
  private values: Map<string, unknown> = new Map();

  // -------------------------------------------------------------------------
  // Template management
  // -------------------------------------------------------------------------

  /**
   * Load a form template.  Clears any previously stored values so the filler
   * always operates on a single template at a time.
   */
  loadTemplate(template: FormTemplate): void {
    this.template = template;
    this.values = new Map();
  }

  // -------------------------------------------------------------------------
  // Prefill
  // -------------------------------------------------------------------------

  /**
   * Attempt to map well-known profile fields onto the loaded template's fields.
   *
   * Matching is heuristic: it checks whether a field's `id` or `label`
   * contains a known profile-key synonym.  Only fields that have a non-empty
   * match are written; required fields with no match remain blank so the caller
   * can clearly see what still needs human input.
   *
   * @throws if no template has been loaded yet.
   */
  prefillFromProfile(userProfile: UserProfile): FilledForm {
    this.requireTemplate();

    for (const field of this.template!.fields) {
      const value = this.resolveProfileValue(field, userProfile);
      if (value !== undefined) {
        this.values.set(field.id, value);
      }
    }

    return this.buildFilledForm();
  }

  // -------------------------------------------------------------------------
  // Field operations
  // -------------------------------------------------------------------------

  /**
   * Set a single field value and return its validation result.
   * The value is stored even when validation fails so the UI can show the
   * error inline rather than discarding user input.
   */
  setField(fieldId: string, value: unknown): ValidationResult {
    this.requireTemplate();
    const field = this.findField(fieldId);
    if (!field) {
      return { valid: false, errorMessage: `Unknown field "${fieldId}".` };
    }
    this.values.set(fieldId, value);
    return this.validateField(fieldId, value);
  }

  /**
   * Validate a value against a field's rules without storing it.
   *
   * Returns `{valid: true}` immediately when the field is optional and the
   * value is empty so callers do not need to special-case optional fields.
   */
  validateField(fieldId: string, value: unknown): ValidationResult {
    this.requireTemplate();
    const field = this.findField(fieldId);
    if (!field) {
      return { valid: false, errorMessage: `Unknown field "${fieldId}".` };
    }

    const isEmpty = value === undefined || value === null || value === "";

    if (isEmpty) {
      if (field.required) {
        return {
          valid: false,
          errorMessage: `"${field.label}" is required.`,
        };
      }
      return { valid: true };
    }

    return validateAgainstRules(field, value);
  }

  /**
   * Return a plain-language help string for a given field.
   * Falls back to the field's own `helpText` when available, otherwise
   * generates a generic description from the field metadata.
   */
  getFieldHelp(fieldId: string): string {
    this.requireTemplate();
    const field = this.findField(fieldId);
    if (!field) {
      return `No help available for field "${fieldId}".`;
    }
    if (field.helpText) {
      return field.helpText;
    }
    return generateGenericHelp(field);
  }

  // -------------------------------------------------------------------------
  // Completion status
  // -------------------------------------------------------------------------

  /**
   * Compute how complete the form currently is.
   *
   * @returns An object with:
   *   - `percentage` — 0–100 integer based on required fields answered.
   *   - `missingFields` — IDs of required fields that are still blank.
   *   - `filledForm` — Current FilledForm snapshot.
   */
  getCompletionStatus(form?: FilledForm): {
    percentage: number;
    missingFields: string[];
    filledForm: FilledForm;
  } {
    this.requireTemplate();

    // If a FilledForm snapshot was passed in, use its values; otherwise use
    // the internal mutable map.
    const source: ReadonlyMap<string, unknown> = form ? form.values : this.values;

    const requiredFields = this.template!.fields.filter((f) => f.required);
    const missingFields = requiredFields
      .filter((f) => {
        const v = source.get(f.id);
        return v === undefined || v === null || v === "";
      })
      .map((f) => f.id);

    const answered = requiredFields.length - missingFields.length;
    const percentage =
      requiredFields.length === 0 ? 100 : Math.round((answered / requiredFields.length) * 100);

    const filledForm: FilledForm = {
      templateId: this.template!.id,
      values: source,
      completionPercentage: percentage,
      missingFields,
    };

    return { percentage, missingFields, filledForm };
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private requireTemplate(): void {
    if (!this.template) {
      throw new Error("No template loaded. Call loadTemplate() before using FormFiller.");
    }
  }

  private findField(fieldId: string): FormField | undefined {
    return this.template!.fields.find((f) => f.id === fieldId);
  }

  private buildFilledForm(): FilledForm {
    const { percentage, missingFields } = this.getCompletionStatus();
    return {
      templateId: this.template!.id,
      values: new Map(this.values),
      completionPercentage: percentage,
      missingFields,
    };
  }

  /**
   * Heuristic profile-to-field resolution.
   *
   * The combined needle is `"${field.id} ${field.label}".toLowerCase()`.
   * Each synonym group maps to a profile value; the first match wins.
   */
  private resolveProfileValue(field: FormField, profile: UserProfile): unknown {
    const needle = `${field.id} ${field.label}`.toLowerCase();

    const matchers: Array<{ keywords: string[]; value: unknown }> = [
      {
        keywords: ["givenname", "given_name", "first name", "firstname", "given"],
        value: profile.givenName,
      },
      {
        keywords: ["familyname", "family_name", "last name", "lastname", "surname"],
        value: profile.familyName,
      },
      {
        keywords: ["dob", "date of birth", "dateofbirth", "birth_date", "birthdate"],
        value: profile.dateOfBirth,
      },
      {
        keywords: ["email", "e-mail", "emailaddress"],
        value: profile.email,
      },
      {
        keywords: ["phone", "telephone", "mobile", "cell"],
        value: profile.phone,
      },
      {
        keywords: ["address1", "addressline1", "street address", "address line 1"],
        value: profile.addressLine1,
      },
      {
        keywords: ["address2", "addressline2", "address line 2", "apt", "suite"],
        value: profile.addressLine2,
      },
      {
        keywords: ["city", "town", "municipality"],
        value: profile.city,
      },
      {
        keywords: ["state", "province", "region", "county"],
        value: profile.stateOrProvince,
      },
      {
        keywords: ["postalcode", "postal_code", "zip", "postcode"],
        value: profile.postalCode,
      },
      {
        keywords: ["country", "nation"],
        value: profile.country,
      },
      {
        keywords: ["nationalid", "national_id", "national id", "ssn", "sin", "nino"],
        value: profile.nationalIdNumber,
      },
      {
        keywords: ["passport", "passportnumber", "passport_number"],
        value: profile.passportNumber,
      },
    ];

    for (const { keywords, value } of matchers) {
      if (value !== undefined && value !== "" && keywords.some((kw) => needle.includes(kw))) {
        return value;
      }
    }

    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Standalone validation helper (also exported for direct use)
// ---------------------------------------------------------------------------

/**
 * Validate `value` against the rules declared on `field`.
 * Does NOT check for required-ness; that is the caller's responsibility.
 */
export function validateAgainstRules(field: FormField, value: unknown): ValidationResult {
  // Type-level coercions
  if (field.type === "number") {
    const num = Number(value);
    if (Number.isNaN(num)) {
      return {
        valid: false,
        errorMessage: `"${field.label}" must be a number.`,
      };
    }
    if (field.validation?.min !== undefined && num < field.validation.min) {
      return {
        valid: false,
        errorMessage:
          field.validation.message || `"${field.label}" must be at least ${field.validation.min}.`,
      };
    }
    if (field.validation?.max !== undefined && num > field.validation.max) {
      return {
        valid: false,
        errorMessage:
          field.validation.message || `"${field.label}" must be at most ${field.validation.max}.`,
      };
    }
    return { valid: true };
  }

  if (field.type === "date") {
    const d = new Date(String(value));
    if (isNaN(d.getTime())) {
      return {
        valid: false,
        errorMessage: `"${field.label}" must be a valid date.`,
      };
    }
    return { valid: true };
  }

  if (field.type === "select") {
    const options = field.options ?? [];
    if (!options.includes(String(value))) {
      return {
        valid: false,
        errorMessage: `"${field.label}" must be one of: ${options.join(", ")}.`,
      };
    }
    return { valid: true };
  }

  if (field.type === "text" || field.type === "signature") {
    const str = String(value);
    if (field.validation?.min !== undefined && str.length < field.validation.min) {
      return {
        valid: false,
        errorMessage:
          field.validation.message ||
          `"${field.label}" must be at least ${field.validation.min} characters.`,
      };
    }
    if (field.validation?.max !== undefined && str.length > field.validation.max) {
      return {
        valid: false,
        errorMessage:
          field.validation.message ||
          `"${field.label}" must be at most ${field.validation.max} characters.`,
      };
    }
    if (field.validation?.pattern) {
      const re = new RegExp(field.validation.pattern);
      if (!re.test(str)) {
        return {
          valid: false,
          errorMessage:
            field.validation.message || `"${field.label}" does not match the required format.`,
        };
      }
    }
    return { valid: true };
  }

  // checkbox — any truthy/falsy is valid
  return { valid: true };
}

// ---------------------------------------------------------------------------
// Generic help text generator
// ---------------------------------------------------------------------------

function generateGenericHelp(field: FormField): string {
  const typeDescriptions: Record<string, string> = {
    text: "Enter text",
    date: "Enter a date in YYYY-MM-DD format",
    number: "Enter a numeric value",
    checkbox: "Check this box if the statement applies to you",
    select: `Choose one of the available options`,
    signature: "Type your full legal name as a signature",
  };

  const base = typeDescriptions[field.type] ?? "Complete this field";
  const requiredNote = field.required ? " (required)" : " (optional)";

  const rangeNote = field.validation
    ? (() => {
        if (field.type === "number" || field.type === "text") {
          const parts: string[] = [];
          if (field.validation.min !== undefined) parts.push(`minimum ${field.validation.min}`);
          if (field.validation.max !== undefined) parts.push(`maximum ${field.validation.max}`);
          return parts.length ? `. Allowed range: ${parts.join(", ")}` : "";
        }
        return "";
      })()
    : "";

  const optionsNote =
    field.type === "select" && field.options?.length
      ? `. Options: ${field.options.join(", ")}`
      : "";

  return `${base}${requiredNote} for "${field.label}"${rangeNote}${optionsNote}.`;
}
