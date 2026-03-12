import { describe, expect, it } from "vitest";
import { FormFiller, validateAgainstRules } from "../core-logic/form-filler.js";
import type { UserProfile } from "../core-logic/form-filler.js";
import type { FormField, FormTemplate } from "../types.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const sampleTemplate: FormTemplate = {
  id: "ds-82",
  name: "DS-82 Passport Renewal Application",
  jurisdiction: "US",
  instructions:
    "Complete all required fields in black ink.  Do not sign until directed " +
    "by the acceptance agent.",
  fields: [
    {
      id: "givenName",
      label: "Given Name (First & Middle)",
      type: "text",
      required: true,
      validation: { min: 1, max: 100, message: "Name must be 1–100 characters." },
    },
    {
      id: "familyName",
      label: "Family Name (Last)",
      type: "text",
      required: true,
      validation: { min: 1, max: 100, message: "Surname must be 1–100 characters." },
    },
    {
      id: "dateOfBirth",
      label: "Date of Birth",
      type: "date",
      required: true,
    },
    {
      id: "passportNumber",
      label: "Most Recent Passport Number",
      type: "text",
      required: true,
      validation: {
        pattern: "^[A-Z][0-9]{8}$",
        message: "Passport number must be a letter followed by 8 digits.",
      },
    },
    {
      id: "sex",
      label: "Sex",
      type: "select",
      required: true,
      options: ["M", "F", "X"],
    },
    {
      id: "hasTravelPlans",
      label: "Do you have imminent travel plans?",
      type: "checkbox",
      required: false,
      helpText: "Check this if you need the passport within 5 weeks.",
    },
    {
      id: "applicantSignature",
      label: "Applicant Signature",
      type: "signature",
      required: true,
      validation: { min: 2, message: "Signature must be at least 2 characters." },
    },
    {
      id: "tripDuration",
      label: "Trip Duration (days)",
      type: "number",
      required: false,
      validation: { min: 1, max: 365, message: "Must be between 1 and 365 days." },
    },
  ],
};

const fullProfile: UserProfile = {
  givenName: "Maria",
  familyName: "Garcia",
  dateOfBirth: "1985-07-22",
  passportNumber: "A12345678",
  email: "maria@example.com",
  phone: "+1-555-000-0000",
  country: "US",
};

// ---------------------------------------------------------------------------
// Constructor / loadTemplate guard
// ---------------------------------------------------------------------------

describe("FormFiller — template guard", () => {
  it("throws when operations are called before loadTemplate", () => {
    const filler = new FormFiller();
    expect(() => filler.prefillFromProfile(fullProfile)).toThrow(/No template loaded/);
    expect(() => filler.validateField("givenName", "x")).toThrow(/No template loaded/);
    expect(() => filler.getFieldHelp("givenName")).toThrow(/No template loaded/);
    expect(() => filler.getCompletionStatus()).toThrow(/No template loaded/);
  });
});

// ---------------------------------------------------------------------------
// prefillFromProfile
// ---------------------------------------------------------------------------

describe("FormFiller.prefillFromProfile", () => {
  it("maps known profile fields onto matching template fields", () => {
    const filler = new FormFiller();
    filler.loadTemplate(sampleTemplate);
    const form = filler.prefillFromProfile(fullProfile);

    expect(form.values.get("givenName")).toBe("Maria");
    expect(form.values.get("familyName")).toBe("Garcia");
    expect(form.values.get("dateOfBirth")).toBe("1985-07-22");
    expect(form.values.get("passportNumber")).toBe("A12345678");
  });

  it("returns the correct templateId", () => {
    const filler = new FormFiller();
    filler.loadTemplate(sampleTemplate);
    const form = filler.prefillFromProfile(fullProfile);
    expect(form.templateId).toBe("ds-82");
  });

  it("does not prefill fields with no profile match", () => {
    const filler = new FormFiller();
    filler.loadTemplate(sampleTemplate);
    const form = filler.prefillFromProfile(fullProfile);
    // "sex" and "hasTravelPlans" have no profile synonym
    expect(form.values.has("sex")).toBe(false);
    expect(form.values.has("hasTravelPlans")).toBe(false);
  });

  it("computes completionPercentage based on required fields only", () => {
    const filler = new FormFiller();
    filler.loadTemplate(sampleTemplate);
    const form = filler.prefillFromProfile(fullProfile);

    // Required fields: givenName, familyName, dateOfBirth, passportNumber,
    //                  sex, applicantSignature  (6 total)
    // Profile fills: givenName, familyName, dateOfBirth, passportNumber (4)
    // Missing: sex, applicantSignature (2)
    const requiredCount = sampleTemplate.fields.filter((f: FormField) => f.required).length;
    const filledCount = [...form.values.keys()].filter((id: string) =>
      sampleTemplate.fields.find((f: FormField) => f.id === id && f.required),
    ).length;

    const expected = Math.round((filledCount / requiredCount) * 100);
    expect(form.completionPercentage).toBe(expected);
  });

  it("lists unfilled required fields in missingFields", () => {
    const filler = new FormFiller();
    filler.loadTemplate(sampleTemplate);
    const form = filler.prefillFromProfile(fullProfile);
    expect(form.missingFields).toContain("sex");
    expect(form.missingFields).toContain("applicantSignature");
    expect(form.missingFields).not.toContain("givenName");
  });

  it("clears previous values when loadTemplate is called again", () => {
    const filler = new FormFiller();
    filler.loadTemplate(sampleTemplate);
    filler.prefillFromProfile(fullProfile);

    filler.loadTemplate(sampleTemplate); // reload same template
    const fresh = filler.prefillFromProfile({});
    // empty profile — nothing mapped
    expect(fresh.values.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// validateField
// ---------------------------------------------------------------------------

describe("FormFiller.validateField", () => {
  it("returns valid for a correct text value", () => {
    const filler = new FormFiller();
    filler.loadTemplate(sampleTemplate);
    const result = filler.validateField("givenName", "Maria");
    expect(result.valid).toBe(true);
  });

  it("returns invalid for an empty required text field", () => {
    const filler = new FormFiller();
    filler.loadTemplate(sampleTemplate);
    const result = filler.validateField("givenName", "");
    expect(result.valid).toBe(false);
    expect(result.errorMessage).toMatch(/required/i);
  });

  it("returns valid for an empty optional field", () => {
    const filler = new FormFiller();
    filler.loadTemplate(sampleTemplate);
    const result = filler.validateField("hasTravelPlans", "");
    expect(result.valid).toBe(true);
  });

  it("returns invalid when text value violates pattern", () => {
    const filler = new FormFiller();
    filler.loadTemplate(sampleTemplate);
    const result = filler.validateField("passportNumber", "BADFORMAT");
    expect(result.valid).toBe(false);
  });

  it("returns valid for a correctly formatted passport number", () => {
    const filler = new FormFiller();
    filler.loadTemplate(sampleTemplate);
    const result = filler.validateField("passportNumber", "A12345678");
    expect(result.valid).toBe(true);
  });

  it("returns invalid for a non-existent field id", () => {
    const filler = new FormFiller();
    filler.loadTemplate(sampleTemplate);
    const result = filler.validateField("nonExistent", "value");
    expect(result.valid).toBe(false);
    expect(result.errorMessage).toMatch(/Unknown field/i);
  });

  it("validates date fields", () => {
    const filler = new FormFiller();
    filler.loadTemplate(sampleTemplate);
    expect(filler.validateField("dateOfBirth", "1985-07-22").valid).toBe(true);
    expect(filler.validateField("dateOfBirth", "not-a-date").valid).toBe(false);
  });

  it("validates select fields against options", () => {
    const filler = new FormFiller();
    filler.loadTemplate(sampleTemplate);
    expect(filler.validateField("sex", "M").valid).toBe(true);
    expect(filler.validateField("sex", "Q").valid).toBe(false);
  });

  it("validates number range", () => {
    const filler = new FormFiller();
    filler.loadTemplate(sampleTemplate);
    expect(filler.validateField("tripDuration", 30).valid).toBe(true);
    expect(filler.validateField("tripDuration", 0).valid).toBe(false);
    expect(filler.validateField("tripDuration", 400).valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// setField
// ---------------------------------------------------------------------------

describe("FormFiller.setField", () => {
  it("stores the value and returns the validation result", () => {
    const filler = new FormFiller();
    filler.loadTemplate(sampleTemplate);
    const result = filler.setField("givenName", "Ana");
    expect(result.valid).toBe(true);

    const status = filler.getCompletionStatus();
    expect(status.filledForm.values.get("givenName")).toBe("Ana");
  });

  it("stores the value even when validation fails", () => {
    const filler = new FormFiller();
    filler.loadTemplate(sampleTemplate);
    filler.setField("passportNumber", "INVALID");
    const status = filler.getCompletionStatus();
    expect(status.filledForm.values.get("passportNumber")).toBe("INVALID");
  });
});

// ---------------------------------------------------------------------------
// getFieldHelp
// ---------------------------------------------------------------------------

describe("FormFiller.getFieldHelp", () => {
  it("returns helpText when the field has it", () => {
    const filler = new FormFiller();
    filler.loadTemplate(sampleTemplate);
    const help = filler.getFieldHelp("hasTravelPlans");
    expect(help).toContain("5 weeks");
  });

  it("returns a generated description when helpText is absent", () => {
    const filler = new FormFiller();
    filler.loadTemplate(sampleTemplate);
    const help = filler.getFieldHelp("givenName");
    expect(typeof help).toBe("string");
    expect(help.length).toBeGreaterThan(0);
  });

  it("returns a fallback message for unknown field ids", () => {
    const filler = new FormFiller();
    filler.loadTemplate(sampleTemplate);
    const help = filler.getFieldHelp("bogusField");
    expect(help).toMatch(/No help available/i);
  });
});

// ---------------------------------------------------------------------------
// getCompletionStatus
// ---------------------------------------------------------------------------

describe("FormFiller.getCompletionStatus", () => {
  it("returns 0% completion when no fields are filled", () => {
    const filler = new FormFiller();
    filler.loadTemplate(sampleTemplate);
    const { percentage, missingFields } = filler.getCompletionStatus();
    expect(percentage).toBe(0);
    const requiredIds = sampleTemplate.fields
      .filter((f: FormField) => f.required)
      .map((f: FormField) => f.id);
    for (const id of requiredIds) {
      expect(missingFields).toContain(id);
    }
  });

  it("returns 100% when all required fields are filled", () => {
    const filler = new FormFiller();
    filler.loadTemplate(sampleTemplate);
    filler.setField("givenName", "Maria");
    filler.setField("familyName", "Garcia");
    filler.setField("dateOfBirth", "1985-07-22");
    filler.setField("passportNumber", "A12345678");
    filler.setField("sex", "F");
    filler.setField("applicantSignature", "Maria Garcia");

    const { percentage, missingFields } = filler.getCompletionStatus();
    expect(percentage).toBe(100);
    expect(missingFields).toHaveLength(0);
  });

  it("excludes optional fields from the missing list", () => {
    const filler = new FormFiller();
    filler.loadTemplate(sampleTemplate);
    const { missingFields } = filler.getCompletionStatus();
    expect(missingFields).not.toContain("hasTravelPlans");
    expect(missingFields).not.toContain("tripDuration");
  });

  it("accepts an external FilledForm snapshot as input", () => {
    const filler = new FormFiller();
    filler.loadTemplate(sampleTemplate);
    const form = filler.prefillFromProfile(fullProfile);

    // Add signature to the snapshot externally
    const enriched = new Map(form.values);
    enriched.set("sex", "F");
    enriched.set("applicantSignature", "Maria Garcia");

    const { percentage } = filler.getCompletionStatus({
      ...form,
      values: enriched,
    });
    expect(percentage).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// validateAgainstRules (standalone export)
// ---------------------------------------------------------------------------

describe("validateAgainstRules", () => {
  it("validates a signature field by character count", () => {
    const sigField = sampleTemplate.fields.find((f: FormField) => f.id === "applicantSignature");
    expect(validateAgainstRules(sigField, "AB").valid).toBe(true);
    expect(validateAgainstRules(sigField, "A").valid).toBe(false);
  });

  it("accepts any checkbox value", () => {
    const cbField = sampleTemplate.fields.find((f: FormField) => f.id === "hasTravelPlans");
    expect(validateAgainstRules(cbField, true).valid).toBe(true);
    expect(validateAgainstRules(cbField, false).valid).toBe(true);
  });
});
