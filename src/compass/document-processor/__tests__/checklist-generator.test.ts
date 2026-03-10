import { describe, expect, it } from "vitest";
import {
  generateChecklist,
  getPrerequisites,
  validateCompleteness,
} from "../core-logic/checklist-generator.js";
import type { ProcessStep } from "../types.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const passportRenewalSteps: ProcessStep[] = [
  {
    requiredDocuments: ["Current US Passport", "DS-82 Application Form", "Passport Photo"],
  },
  {
    requiredDocuments: ["Application Fee Payment"],
    optionalDocuments: ["Expedite Fee Payment"],
  },
];

// ---------------------------------------------------------------------------
// generateChecklist
// ---------------------------------------------------------------------------

describe("generateChecklist", () => {
  it("marks documents the user already has as obtained", () => {
    const checklist = generateChecklist("US-passport-renewal", passportRenewalSteps, [
      "Current US Passport",
      "Passport Photo",
    ]);

    const passport = checklist.items.find((i) => i.documentName === "Current US Passport");
    const photo = checklist.items.find((i) => i.documentName === "Passport Photo");
    const form = checklist.items.find((i) => i.documentName === "DS-82 Application Form");

    expect(passport?.obtained).toBe(true);
    expect(photo?.obtained).toBe(true);
    expect(form?.obtained).toBe(false);
  });

  it("uses case-insensitive matching for user documents", () => {
    const checklist = generateChecklist("US-passport-renewal", passportRenewalSteps, [
      "current us passport",
    ]);
    const passport = checklist.items.find((i) => i.documentName === "Current US Passport");
    expect(passport?.obtained).toBe(true);
  });

  it("includes optional documents with required=false", () => {
    const checklist = generateChecklist("US-passport-renewal", passportRenewalSteps, []);
    const expedite = checklist.items.find((i) => i.documentName === "Expedite Fee Payment");
    expect(expedite).toBeDefined();
    expect(expedite?.required).toBe(false);
  });

  it("does not duplicate a document that appears in multiple steps", () => {
    const stepsWithDup: ProcessStep[] = [
      { requiredDocuments: ["Proof of Identity"] },
      { requiredDocuments: ["Proof of Identity", "Birth Certificate"] },
    ];
    const checklist = generateChecklist("test", stepsWithDup, []);
    const idDocs = checklist.items.filter((i) => i.documentName === "Proof of Identity");
    expect(idDocs).toHaveLength(1);
  });

  it("stores the processId on the returned checklist", () => {
    const checklist = generateChecklist("MY-PROCESS-001", passportRenewalSteps, []);
    expect(checklist.processId).toBe("MY-PROCESS-001");
  });

  it("returns an empty items array for empty steps", () => {
    const checklist = generateChecklist("empty", [], []);
    expect(checklist.items).toHaveLength(0);
  });

  it("attaches howToObtain guidance to every item", () => {
    const checklist = generateChecklist("US-passport-renewal", passportRenewalSteps, []);
    for (const item of checklist.items) {
      expect(typeof item.howToObtain).toBe("string");
      expect(item.howToObtain!.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// getPrerequisites
// ---------------------------------------------------------------------------

describe("getPrerequisites", () => {
  it("returns prerequisites for a known program", () => {
    const prereqs = getPrerequisites("us-passport-renewal");
    expect(prereqs.length).toBeGreaterThan(0);
    for (const p of prereqs) {
      expect(p.name).toBeTruthy();
      expect(p.issuingAuthority).toBeTruthy();
      expect(p.estimatedTime).toBeTruthy();
      expect(p.instructions).toBeTruthy();
    }
  });

  it("is case-insensitive for the program name", () => {
    const lower = getPrerequisites("us-passport-renewal");
    const upper = getPrerequisites("US-PASSPORT-RENEWAL");
    expect(lower).toEqual(upper);
  });

  it("returns an empty array for an unknown program", () => {
    const prereqs = getPrerequisites("completely-unknown-process-xyz");
    expect(prereqs).toEqual([]);
  });

  it("returns prerequisites for uk-driving-licence-renewal", () => {
    const prereqs = getPrerequisites("uk-driving-licence-renewal");
    expect(prereqs.length).toBeGreaterThan(0);
  });

  it("returns prerequisites for canada-pr-renewal", () => {
    const prereqs = getPrerequisites("canada-pr-renewal");
    expect(prereqs.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// validateCompleteness
// ---------------------------------------------------------------------------

describe("validateCompleteness", () => {
  it("reports complete when all required items are obtained", () => {
    const checklist = generateChecklist("US-passport-renewal", passportRenewalSteps, [
      "Current US Passport",
      "DS-82 Application Form",
      "Passport Photo",
      "Application Fee Payment",
    ]);
    const result = validateCompleteness(checklist);
    expect(result.complete).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it("lists missing required items when incomplete", () => {
    const checklist = generateChecklist("US-passport-renewal", passportRenewalSteps, [
      "Current US Passport",
    ]);
    const result = validateCompleteness(checklist);
    expect(result.complete).toBe(false);
    expect(result.missing).toContain("DS-82 Application Form");
    expect(result.missing).toContain("Passport Photo");
    expect(result.missing).toContain("Application Fee Payment");
  });

  it("does not include optional items in missing list", () => {
    const checklist = generateChecklist("US-passport-renewal", passportRenewalSteps, [
      "Current US Passport",
      "DS-82 Application Form",
      "Passport Photo",
      "Application Fee Payment",
    ]);
    const result = validateCompleteness(checklist);
    expect(result.missing).not.toContain("Expedite Fee Payment");
  });

  it("returns complete for a checklist with no items", () => {
    const result = validateCompleteness({ processId: "empty", items: [] });
    expect(result.complete).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it("allows manual mutation of obtained and re-validates", () => {
    const checklist = generateChecklist("US-passport-renewal", passportRenewalSteps, []);

    // Manually mark all required items as obtained.
    for (const item of checklist.items) {
      if (item.required) item.obtained = true;
    }

    const result = validateCompleteness(checklist);
    expect(result.complete).toBe(true);
  });
});
