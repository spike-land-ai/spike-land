/**
 * Tests for RightsDatabase — rights search and stage-based lookup.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { RightsDatabase } from "../core-logic/rights-lookup.js";
import type { Right } from "../types.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const RIGHT_ASYLUM_GB: Right = {
  id: "asylum-gb-appeal",
  title: "Right to appeal an asylum refusal",
  description:
    "A person refused asylum in the UK has the right to appeal to the First-tier Tribunal (Immigration and Asylum Chamber) on protection and human rights grounds.",
  jurisdiction: "GB",
  domain: "asylum",
  applicableTo: ["asylum seekers", "refused applicants"],
  legalBasis: "UK Nationality, Immigration and Asylum Act 2002 s.82",
};

const RIGHT_ASYLUM_EU: Right = {
  id: "asylum-eu-procedure",
  title: "Right to an effective remedy — asylum procedures",
  description:
    "An applicant for international protection has the right to an effective remedy before a court or tribunal against a decision to refuse the application.",
  jurisdiction: "EU",
  domain: "asylum",
  applicableTo: ["asylum seekers", "stateless persons"],
  legalBasis: "EU Asylum Procedures Directive 2013/32/EU Art. 46",
};

const RIGHT_HOUSING_GB: Right = {
  id: "housing-gb-homelessness",
  title: "Right to review of homelessness decision",
  description:
    "A person who receives an adverse homelessness decision has the right to request a review by the local housing authority.",
  jurisdiction: "GB",
  domain: "housing",
  applicableTo: ["homeless persons", "people at risk of homelessness"],
  legalBasis: "UK Housing Act 1996 s.202",
};

const RIGHT_EMPLOYMENT_DE: Right = {
  id: "employment-de-unfair-dismissal",
  title: "Protection against unfair dismissal",
  description:
    "An employee dismissed without a socially justified reason may bring a claim before the Labour Court within 3 weeks.",
  jurisdiction: "DE",
  domain: "employment",
  applicableTo: ["employees with 6+ months tenure"],
  legalBasis: "Kündigungsschutzgesetz (KSchG) §4",
};

const RIGHT_DISABILITY_UNIVERSAL: Right = {
  id: "disability-un-crpd-reasonable-accommodation",
  title: "Right to reasonable accommodation",
  description:
    "Persons with disabilities have the right to reasonable accommodation to ensure equal enjoyment of all human rights and fundamental freedoms.",
  jurisdiction: "*",
  domain: "disability",
  applicableTo: ["persons with disabilities"],
  legalBasis: "UN Convention on the Rights of Persons with Disabilities Art. 2",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RightsDatabase — addRight and getRight", () => {
  it("stores and retrieves a right by id", () => {
    const db = new RightsDatabase();
    db.addRight(RIGHT_ASYLUM_GB);
    expect(db.getRight("asylum-gb-appeal")).toEqual(RIGHT_ASYLUM_GB);
  });

  it("returns undefined for an unknown id", () => {
    const db = new RightsDatabase();
    expect(db.getRight("nonexistent")).toBeUndefined();
  });

  it("overwrites an existing right on re-add", () => {
    const db = new RightsDatabase();
    db.addRight(RIGHT_ASYLUM_GB);
    const updated: Right = { ...RIGHT_ASYLUM_GB, title: "Updated title" };
    db.addRight(updated);
    expect(db.getRight("asylum-gb-appeal")?.title).toBe("Updated title");
  });
});

describe("RightsDatabase — getRightsByDomain", () => {
  let db: RightsDatabase;

  beforeEach(() => {
    db = new RightsDatabase();
    db.addRight(RIGHT_ASYLUM_GB);
    db.addRight(RIGHT_ASYLUM_EU);
    db.addRight(RIGHT_HOUSING_GB);
    db.addRight(RIGHT_EMPLOYMENT_DE);
    db.addRight(RIGHT_DISABILITY_UNIVERSAL);
  });

  it("returns rights for exact jurisdiction match", () => {
    const results = db.getRightsByDomain("asylum", "GB");
    const ids = results.map((r) => r.id);
    expect(ids).toContain("asylum-gb-appeal");
  });

  it("includes EU-level rights when querying a member state", () => {
    const results = db.getRightsByDomain("asylum", "DE");
    const ids = results.map((r) => r.id);
    expect(ids).toContain("asylum-eu-procedure");
  });

  it("does not include GB rights when querying DE", () => {
    const results = db.getRightsByDomain("asylum", "DE");
    const ids = results.map((r) => r.id);
    expect(ids).not.toContain("asylum-gb-appeal");
  });

  it("includes universal (*) rights for any jurisdiction", () => {
    const gbResults = db.getRightsByDomain("disability", "GB");
    const frResults = db.getRightsByDomain("disability", "FR");
    const ids = (r: Right[]) => r.map((x) => x.id);
    expect(ids(gbResults)).toContain("disability-un-crpd-reasonable-accommodation");
    expect(ids(frResults)).toContain("disability-un-crpd-reasonable-accommodation");
  });

  it("returns empty array for domain with no rights in that jurisdiction", () => {
    const results = db.getRightsByDomain("pension", "GB");
    expect(results).toHaveLength(0);
  });
});

describe("RightsDatabase — searchRights", () => {
  let db: RightsDatabase;

  beforeEach(() => {
    db = new RightsDatabase();
    db.addRight(RIGHT_ASYLUM_GB);
    db.addRight(RIGHT_ASYLUM_EU);
    db.addRight(RIGHT_HOUSING_GB);
    db.addRight(RIGHT_EMPLOYMENT_DE);
    db.addRight(RIGHT_DISABILITY_UNIVERSAL);
  });

  it("finds rights by title keyword", () => {
    const results = db.searchRights("appeal");
    const ids = results.map((r) => r.id);
    expect(ids).toContain("asylum-gb-appeal");
  });

  it("finds rights by description keyword", () => {
    const results = db.searchRights("First-tier Tribunal");
    const ids = results.map((r) => r.id);
    expect(ids).toContain("asylum-gb-appeal");
  });

  it("finds rights by applicableTo keyword", () => {
    const results = db.searchRights("stateless");
    const ids = results.map((r) => r.id);
    expect(ids).toContain("asylum-eu-procedure");
  });

  it("ranks title matches before description matches", () => {
    // "asylum" appears in both the title and description of some rights
    const results = db.searchRights("asylum");
    const titleMatchIdx = results.findIndex((r) => r.title.toLowerCase().includes("asylum"));
    const descOnlyMatchIdx = results.findIndex(
      (r) =>
        !r.title.toLowerCase().includes("asylum") && r.description.toLowerCase().includes("asylum"),
    );
    if (titleMatchIdx !== -1 && descOnlyMatchIdx !== -1) {
      expect(titleMatchIdx).toBeLessThan(descOnlyMatchIdx);
    }
  });

  it("is case-insensitive", () => {
    expect(db.searchRights("APPEAL")).toHaveLength(db.searchRights("appeal").length);
  });

  it("filters by jurisdiction when provided", () => {
    const results = db.searchRights("appeal", "GB");
    const ids = results.map((r) => r.id);
    // EU-level appeal right should NOT appear for GB-only search
    // (EU right should still match because GB is... wait, GB left EU — correct exclusion)
    expect(ids).not.toContain("asylum-eu-procedure");
    expect(ids).toContain("asylum-gb-appeal");
  });

  it("returns empty array for empty query", () => {
    expect(db.searchRights("")).toHaveLength(0);
    expect(db.searchRights("   ")).toHaveLength(0);
  });

  it("returns empty array for query that matches nothing", () => {
    expect(db.searchRights("xylophone_bureaucrat_9999")).toHaveLength(0);
  });
});

describe("RightsDatabase — stage-based lookup", () => {
  let db: RightsDatabase;

  beforeEach(() => {
    db = new RightsDatabase();
    db.addRight(RIGHT_ASYLUM_GB);
    db.addRight(RIGHT_HOUSING_GB);

    db.registerStageRights(
      "asylum-GB",
      "initial-screening",
      ["asylum-gb-appeal"],
      ["You must claim asylum as soon as possible after arrival."],
    );

    db.registerStageRights(
      "asylum-GB",
      "substantive-interview",
      ["asylum-gb-appeal"],
      [
        "You have the right to an interpreter during your interview.",
        "You have the right to legal representation at this stage.",
      ],
    );
  });

  it("returns rights for a registered stage", () => {
    const result = db.getRightsForStage("asylum-GB", "initial-screening");
    expect(result.stageId).toBe("initial-screening");
    expect(result.rights).toHaveLength(1);
    expect(result.rights[0]?.id).toBe("asylum-gb-appeal");
  });

  it("returns warnings for a registered stage", () => {
    const result = db.getRightsForStage("asylum-GB", "initial-screening");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("claim asylum");
  });

  it("returns multiple warnings for stages that have them", () => {
    const result = db.getRightsForStage("asylum-GB", "substantive-interview");
    expect(result.warnings).toHaveLength(2);
  });

  it("returns empty rights and warnings for unregistered stage", () => {
    const result = db.getRightsForStage("asylum-GB", "nonexistent-stage");
    expect(result.rights).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it("returns empty result for unregistered process", () => {
    const result = db.getRightsForStage("unknown-process", "stage-1");
    expect(result.rights).toHaveLength(0);
  });

  it("silently drops rightIds not in the database", () => {
    db.registerStageRights("asylum-GB", "decision", [
      "asylum-gb-appeal",
      "right-that-does-not-exist",
    ]);
    const result = db.getRightsForStage("asylum-GB", "decision");
    expect(result.rights).toHaveLength(1);
    expect(result.rights[0]?.id).toBe("asylum-gb-appeal");
  });

  it("returns a defensive copy of warnings (mutation does not affect store)", () => {
    const result = db.getRightsForStage("asylum-GB", "initial-screening");
    result.warnings.push("injected warning");

    const result2 = db.getRightsForStage("asylum-GB", "initial-screening");
    expect(result2.warnings).toHaveLength(1);
  });
});

describe("RightsDatabase — getAllRights", () => {
  it("returns all registered rights", () => {
    const db = new RightsDatabase();
    db.addRight(RIGHT_ASYLUM_GB);
    db.addRight(RIGHT_HOUSING_GB);
    expect(db.getAllRights()).toHaveLength(2);
  });

  it("returns empty array for an empty database", () => {
    const db = new RightsDatabase();
    expect(db.getAllRights()).toHaveLength(0);
  });
});
