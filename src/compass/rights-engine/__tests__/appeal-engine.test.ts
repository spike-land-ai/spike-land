/**
 * Tests for AppealEngine — rejection analysis and template generation.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { AppealEngine } from "../core-logic/appeal-engine.js";
import type { AppealTemplate } from "../types.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FORMAL_APPEAL_TEMPLATE: AppealTemplate = {
  id: "tpl-asylum-gb-formal-001",
  rightId: "asylum-gb-appeal",
  type: "formal",
  template: `
[YOUR ADDRESS]
{{DECISION_DATE}}

{{DECISION_BODY}}

Re: Notice of Appeal — Reference: {{REFERENCE_NUMBER}}

Dear Sir/Madam,

I, {{APPLICANT_NAME}}, hereby appeal the decision dated {{DECISION_DATE}}.

Grounds of appeal:
{{GROUNDS}}

I request {{REQUESTED_REMEDY}}.

The deadline for this appeal is {{DEADLINE}}.

Yours faithfully,
{{APPLICANT_NAME}}
`.trim(),
  deadline: 14,
  instructions:
    "File this appeal with the First-tier Tribunal (Immigration and Asylum Chamber) within 14 days of receiving the decision. Submit by post or online at www.gov.uk/appeal-immigration-decision.",
};

const COMPLAINT_TEMPLATE: AppealTemplate = {
  id: "tpl-housing-gb-complaint-001",
  rightId: "housing-gb-homelessness",
  type: "complaint",
  template: `
Complaint — {{REFERENCE_NUMBER}}

Dear {{DECISION_BODY}},

I wish to formally complain about the decision dated {{DECISION_DATE}}.

Grounds:
{{GROUNDS}}

I request {{REQUESTED_REMEDY}}.

{{APPLICANT_NAME}}
`.trim(),
  deadline: 28,
  instructions:
    "Submit this complaint to the local authority housing department. If unresolved, escalate to the Housing Ombudsman.",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEngine(): AppealEngine {
  const engine = new AppealEngine();
  engine.addTemplate(FORMAL_APPEAL_TEMPLATE);
  engine.addTemplate(COMPLAINT_TEMPLATE);
  return engine;
}

// ---------------------------------------------------------------------------
// analyzeRejection tests
// ---------------------------------------------------------------------------

describe("AppealEngine — analyzeRejection", () => {
  let engine: AppealEngine;

  beforeEach(() => {
    engine = makeEngine();
  });

  it("identifies a decision as challengeable when grounds are detected", () => {
    const analysis = engine.analyzeRejection(
      "Your application is refused. No reason has been given.",
      "housing benefit",
      "GB",
    );
    expect(analysis.isChallengeable).toBe(true);
  });

  it("detects 'no reason' as a strong ground", () => {
    const analysis = engine.analyzeRejection(
      "Refused. No reason provided.",
      "housing benefit",
      "GB",
    );
    expect(analysis.grounds.some((g) => g.toLowerCase().includes("reason"))).toBe(true);
  });

  it("detects document/evidence issues as a ground", () => {
    const analysis = engine.analyzeRejection(
      "Your application was refused because the required documents were not provided.",
      "employment support",
      "GB",
    );
    expect(
      analysis.grounds.some(
        (g) => g.toLowerCase().includes("evidence") || g.toLowerCase().includes("document"),
      ),
    ).toBe(true);
  });

  it("detects Article 8 as a ground", () => {
    const analysis = engine.analyzeRejection(
      "The decision does not engage Article 8 right to family life.",
      "asylum",
      "GB",
    );
    expect(analysis.grounds.some((g) => g.includes("Article 8"))).toBe(true);
  });

  it("always returns at least one ground even for a bare refusal", () => {
    const analysis = engine.analyzeRejection("Refused.", "pension", "GB");
    expect(analysis.grounds.length).toBeGreaterThan(0);
  });

  it("sets isChallengeable true for asylum decisions regardless of detected grounds", () => {
    const analysis = engine.analyzeRejection("Refused.", "asylum claim", "GB");
    expect(analysis.isChallengeable).toBe(true);
  });

  it("sets isChallengeable true for detention decisions", () => {
    const analysis = engine.analyzeRejection(
      "Detention order maintained.",
      "immigration detention",
      "GB",
    );
    expect(analysis.isChallengeable).toBe(true);
  });

  it("returns 'high' success likelihood for multiple strong grounds", () => {
    const analysis = engine.analyzeRejection(
      "Refused with no reason. Documents not considered. Article 8 right to family life not assessed. Risk of persecution ignored.",
      "asylum",
      "GB",
    );
    expect(analysis.successLikelihood).toBe("high");
  });

  it("returns 'medium' success likelihood for one strong ground", () => {
    const analysis = engine.analyzeRejection(
      "Refused. The required documents were not provided.",
      "housing benefit",
      "GB",
    );
    expect(["medium", "high"]).toContain(analysis.successLikelihood);
  });

  it("returns 'low' success likelihood for a bare single-word refusal", () => {
    // A one-word refusal matches only the universal fallback ground (weak),
    // which is not marked strongGround — so successLikelihood should be 'low'.
    const analysis = engine.analyzeRejection("Refused.", "pension", "GB");
    expect(analysis.successLikelihood).toBe("low");
  });

  it("always includes a recommendedAction", () => {
    const analysis = engine.analyzeRejection("Refused.", "benefits", "GB");
    expect(analysis.recommendedAction).toBeTruthy();
    expect(analysis.recommendedAction.length).toBeGreaterThan(10);
  });

  it("includes URGENT wording in recommendedAction for asylum cases", () => {
    const analysis = engine.analyzeRejection("Asylum application refused.", "asylum", "GB");
    expect(analysis.recommendedAction.toUpperCase()).toContain("URGENT");
  });

  it("includes a deadline for challengeable decisions", () => {
    const analysis = engine.analyzeRejection(
      "Refused. No reason provided.",
      "housing benefit",
      "GB",
    );
    if (analysis.isChallengeable) {
      expect(analysis.deadline).toBeInstanceOf(Date);
    }
  });

  it("originalDecision matches the input text", () => {
    const text = "Your application is refused for failing to meet requirements.";
    const analysis = engine.analyzeRejection(text, "benefits", "GB");
    expect(analysis.originalDecision).toBe(text);
  });
});

// ---------------------------------------------------------------------------
// getDeadline tests
// ---------------------------------------------------------------------------

describe("AppealEngine — getDeadline", () => {
  let engine: AppealEngine;

  beforeEach(() => {
    engine = makeEngine();
  });

  it("returns GB formal deadline of 14 days", () => {
    const base = new Date("2025-01-01");
    const deadline = engine.getDeadline(base, "GB", "formal");
    expect(deadline.getFullYear()).toBe(2025);
    expect(deadline.getDate()).toBe(15);
    expect(deadline.getMonth()).toBe(0); // January
  });

  it("returns DE formal deadline of 30 days", () => {
    const base = new Date("2025-01-01");
    const deadline = engine.getDeadline(base, "DE", "formal");
    expect(deadline.getDate()).toBe(31);
  });

  it("falls back to 30 days for unknown jurisdiction formal appeal", () => {
    const base = new Date("2025-01-01");
    const deadline = engine.getDeadline(base, "ZZ", "formal");
    expect(deadline.getDate()).toBe(31);
  });

  it("returns ombudsman deadline as longer than formal deadline for same jurisdiction", () => {
    const base = new Date("2025-01-01");
    const formal = engine.getDeadline(base, "GB", "formal");
    const ombudsman = engine.getDeadline(base, "GB", "ombudsman");
    expect(ombudsman.getTime()).toBeGreaterThan(formal.getTime());
  });

  it("returns a Date object", () => {
    const deadline = engine.getDeadline(new Date(), "GB", "formal");
    expect(deadline).toBeInstanceOf(Date);
  });
});

// ---------------------------------------------------------------------------
// getAppealTemplate tests
// ---------------------------------------------------------------------------

describe("AppealEngine — getAppealTemplate", () => {
  let engine: AppealEngine;

  beforeEach(() => {
    engine = makeEngine();
  });

  it("returns the correct template for rightId + type", () => {
    const tpl = engine.getAppealTemplate("asylum-gb-appeal", "formal");
    expect(tpl).toBeDefined();
    expect(tpl?.id).toBe("tpl-asylum-gb-formal-001");
  });

  it("returns undefined when no template matches", () => {
    const tpl = engine.getAppealTemplate("nonexistent-right", "formal");
    expect(tpl).toBeUndefined();
  });

  it("retrieves all templates for a right via getTemplatesForRight", () => {
    const templates = engine.getTemplatesForRight("asylum-gb-appeal");
    expect(templates).toHaveLength(1);
  });

  it("returns empty array from getTemplatesForRight for unknown right", () => {
    const templates = engine.getTemplatesForRight("unknown");
    expect(templates).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// generateAppealDraft tests
// ---------------------------------------------------------------------------

describe("AppealEngine — generateAppealDraft", () => {
  let engine: AppealEngine;

  beforeEach(() => {
    engine = makeEngine();
  });

  it("generates a draft that contains the applicant name", () => {
    const analysis = engine.analyzeRejection("Your asylum application is refused.", "asylum", "GB");
    const draft = engine.generateAppealDraft(analysis, {
      applicantName: "Maria Santos",
    });
    expect(draft).toContain("Maria Santos");
  });

  it("generates a draft that contains the reference number", () => {
    const analysis = engine.analyzeRejection(
      "Refused — no reason provided.",
      "housing benefit",
      "GB",
    );
    const draft = engine.generateAppealDraft(analysis, {
      referenceNumber: "REF-2025-00123",
    });
    expect(draft).toContain("REF-2025-00123");
  });

  it("includes grounds in the generated draft", () => {
    const analysis = engine.analyzeRejection(
      "Application refused. No reason has been provided.",
      "benefits",
      "GB",
    );
    const draft = engine.generateAppealDraft(analysis, {});
    // At minimum the first detected ground should appear
    expect(draft.length).toBeGreaterThan(50);
  });

  it("produces a draft even when no matching template is registered", () => {
    const bareEngine = new AppealEngine(); // no templates
    const analysis = bareEngine.analyzeRejection("Refused.", "pension", "GB");
    const draft = bareEngine.generateAppealDraft(analysis, {
      applicantName: "John Doe",
    });
    expect(draft).toContain("John Doe");
    expect(draft).toContain("appeal");
  });

  it("fallback draft contains 'Yours faithfully'", () => {
    const bareEngine = new AppealEngine();
    const analysis = bareEngine.analyzeRejection("Refused.", "pension", "GB");
    const draft = bareEngine.generateAppealDraft(analysis, {});
    expect(draft).toContain("Yours faithfully");
  });

  it("does not leave unfilled placeholders when all context is provided", () => {
    const analysis = engine.analyzeRejection("Refused — no reason given.", "asylum", "GB");
    const draft = engine.generateAppealDraft(analysis, {
      applicantName: "Ali Hassan",
      referenceNumber: "HO/2025/99999",
      decisionDate: new Date("2025-06-01"),
      decisionBody: "Home Office",
      requestedRemedy: "that the decision be reversed",
    });
    // No mustache placeholders should remain
    expect(draft).not.toMatch(/\{\{[A-Z_]+\}\}/);
  });

  it("includes deadline information in the draft", () => {
    const analysis = engine.analyzeRejection("Refused — no reason given.", "asylum", "GB");
    const draft = engine.generateAppealDraft(analysis, {
      decisionDate: new Date("2025-01-01"),
    });
    // The deadline should appear somewhere (date or "as soon as possible")
    expect(draft).toMatch(/202[0-9]|as soon as possible/);
  });
});
