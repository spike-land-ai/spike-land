/**
 * COMPASS Knowledge Engine — Graph Store Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { KnowledgeGraph } from "../core-logic/graph.ts";
import type { Institution, Jurisdiction, Outcome, Process, Program, Step } from "../types.ts";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const BASE_VERSIONING = {
  version: 1,
  lastVerified: "2025-01-01T00:00:00Z",
  confidenceScore: 1.0,
  verifiedBy: "test-user",
  verifierNotes: null,
} as const;

function makeJurisdiction(overrides: Partial<Jurisdiction> = {}): Jurisdiction {
  return {
    id: "jur-de",
    name: "Germany",
    countryCode: "DE",
    level: "country",
    parentId: null,
    officialLanguages: ["de"],
    timezone: "Europe/Berlin",
    ...BASE_VERSIONING,
    ...overrides,
  };
}

function makeProgram(overrides: Partial<Program> = {}): Program {
  return {
    id: "prog-visa-d",
    jurisdictionId: "jur-de",
    name: "Long Stay Visa Type D",
    slug: "visa-type-d",
    category: "immigration",
    status: "active",
    description: "Allows non-EU nationals to stay in Germany for more than 90 days.",
    officialUrl: "https://www.auswaertiges-amt.de/en/visa-d",
    effectiveDate: "2010-01-01T00:00:00Z",
    expiryDate: null,
    prerequisiteIds: [],
    tags: ["visa", "immigration", "non-eu", "long stay"],
    ...BASE_VERSIONING,
    ...overrides,
  };
}

function makeProcess(overrides: Partial<Process> = {}): Process {
  return {
    id: "proc-visa-d-apply",
    programId: "prog-visa-d",
    name: "Type D Visa Application",
    description: "Submit your visa application to the German embassy or consulate.",
    channels: ["in_person", "mail"],
    estimatedDurationDays: 90,
    feeMinorUnit: 7500,
    feeCurrencyCode: "EUR",
    stepIds: [],
    ...BASE_VERSIONING,
    ...overrides,
  };
}

function makeInstitution(overrides: Partial<Institution> = {}): Institution {
  return {
    id: "inst-german-embassy-london",
    jurisdictionId: "jur-de",
    name: "German Embassy London",
    type: "embassy",
    officialUrl: "https://london.diplo.de",
    contactEmail: "info@london.diplo.de",
    contactPhone: "+44 20 7824 1300",
    physicalAddress: "23 Belgrave Square, London SW1X 8PZ",
    operatingHours: "Mon–Fri 09:00–12:00",
    ...BASE_VERSIONING,
    ...overrides,
  };
}

function makeStep(overrides: Partial<Step> = {}): Step {
  return {
    id: "step-book-appt",
    processId: "proc-visa-d-apply",
    ordinal: 1,
    name: "Book an Appointment",
    description: "Reserve an appointment at the embassy visa section.",
    type: "biometric_appointment",
    institutionId: "inst-german-embassy-london",
    requiredDocumentIds: [],
    estimatedBusinessDays: 14,
    selfServiceEligible: true,
    onlinePortalUrl: "https://videx.diplo.de",
    ...BASE_VERSIONING,
    ...overrides,
  };
}

function makeOutcome(overrides: Partial<Outcome> = {}): Outcome {
  return {
    id: "outcome-visa-d",
    processId: "proc-visa-d-apply",
    name: "Type D National Visa",
    type: "permit",
    description: "National visa granting entry for long stays.",
    validityDays: 365,
    renewable: true,
    renewalLeadTimeDays: 30,
    unlocksProgramIds: [],
    ...BASE_VERSIONING,
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("KnowledgeGraph", () => {
  let graph: KnowledgeGraph;

  beforeEach(() => {
    graph = new KnowledgeGraph();
  });

  // ── Jurisdiction ─────────────────────────────────────────────────────────

  describe("jurisdictions", () => {
    it("adds and retrieves a jurisdiction by id", () => {
      const jur = makeJurisdiction();
      graph.addJurisdiction(jur);
      expect(graph.getJurisdiction("jur-de")).toStrictEqual(jur);
    });

    it("returns undefined for an unknown id", () => {
      expect(graph.getJurisdiction("does-not-exist")).toBeUndefined();
    });

    it("getAllJurisdictions returns all added jurisdictions", () => {
      const de = makeJurisdiction({ id: "jur-de", name: "Germany" });
      const fr = makeJurisdiction({ id: "jur-fr", name: "France", countryCode: "FR" });
      graph.addJurisdiction(de);
      graph.addJurisdiction(fr);
      const all = graph.getAllJurisdictions();
      expect(all).toHaveLength(2);
      expect(all.map((j) => j.id).sort()).toEqual(["jur-de", "jur-fr"]);
    });

    it("overwrites a jurisdiction when added again with the same id", () => {
      graph.addJurisdiction(makeJurisdiction({ name: "Germany Old" }));
      graph.addJurisdiction(makeJurisdiction({ name: "Germany Updated" }));
      expect(graph.getJurisdiction("jur-de")?.name).toBe("Germany Updated");
    });
  });

  // ── Program ──────────────────────────────────────────────────────────────

  describe("programs", () => {
    it("adds and retrieves a program by id", () => {
      graph.addJurisdiction(makeJurisdiction());
      const prog = makeProgram();
      graph.addProgram(prog);
      expect(graph.getProgram("prog-visa-d")).toStrictEqual(prog);
    });

    it("returns undefined for an unknown program id", () => {
      expect(graph.getProgram("no-such-program")).toBeUndefined();
    });
  });

  // ── getProgramsByJurisdiction ─────────────────────────────────────────────

  describe("getProgramsByJurisdiction", () => {
    it("returns programs for a jurisdiction", () => {
      graph.addJurisdiction(makeJurisdiction());
      const p1 = makeProgram({ id: "prog-a" });
      const p2 = makeProgram({ id: "prog-b" });
      graph.addProgram(p1);
      graph.addProgram(p2);

      const results = graph.getProgramsByJurisdiction("jur-de");
      expect(results).toHaveLength(2);
      expect(results.map((p) => p.id).sort()).toEqual(["prog-a", "prog-b"]);
    });

    it("returns an empty array for a jurisdiction with no programs", () => {
      graph.addJurisdiction(makeJurisdiction());
      expect(graph.getProgramsByJurisdiction("jur-de")).toHaveLength(0);
    });

    it("does not mix programs from different jurisdictions", () => {
      graph.addJurisdiction(makeJurisdiction({ id: "jur-de" }));
      graph.addJurisdiction(makeJurisdiction({ id: "jur-fr", countryCode: "FR" }));
      graph.addProgram(makeProgram({ id: "prog-de", jurisdictionId: "jur-de" }));
      graph.addProgram(makeProgram({ id: "prog-fr", jurisdictionId: "jur-fr" }));

      expect(graph.getProgramsByJurisdiction("jur-de").map((p) => p.id)).toEqual(["prog-de"]);
      expect(graph.getProgramsByJurisdiction("jur-fr").map((p) => p.id)).toEqual(["prog-fr"]);
    });
  });

  // ── Process ──────────────────────────────────────────────────────────────

  describe("processes", () => {
    it("adds and retrieves a process by id", () => {
      const proc = makeProcess();
      graph.addProcess(proc);
      expect(graph.getProcess("proc-visa-d-apply")).toStrictEqual(proc);
    });

    it("getProcessesForProgram returns linked processes", () => {
      const proc = makeProcess();
      graph.addProcess(proc);
      const results = graph.getProcessesForProgram("prog-visa-d");
      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe("proc-visa-d-apply");
    });

    it("getProcessesForProgram returns empty array for unknown program", () => {
      expect(graph.getProcessesForProgram("unknown")).toHaveLength(0);
    });

    it("multiple processes can belong to the same program", () => {
      graph.addProcess(makeProcess({ id: "proc-1", programId: "prog-visa-d" }));
      graph.addProcess(makeProcess({ id: "proc-2", programId: "prog-visa-d" }));
      expect(graph.getProcessesForProgram("prog-visa-d")).toHaveLength(2);
    });
  });

  // ── linkProgramToProcess ──────────────────────────────────────────────────

  describe("linkProgramToProcess", () => {
    it("creates a cross-program link for a shared process", () => {
      const programA = makeProgram({ id: "prog-a" });
      const programB = makeProgram({ id: "prog-b" });
      const proc = makeProcess({ id: "proc-shared", programId: "prog-a" });

      graph.addProgram(programA);
      graph.addProgram(programB);
      graph.addProcess(proc);
      graph.linkProgramToProcess({ programId: "prog-b", processId: "proc-shared" });

      expect(graph.getProcessesForProgram("prog-b").map((p) => p.id)).toContain("proc-shared");
    });

    it("throws when the program does not exist", () => {
      graph.addProcess(makeProcess());
      expect(() =>
        graph.linkProgramToProcess({ programId: "ghost", processId: "proc-visa-d-apply" }),
      ).toThrow(/program "ghost" not found/);
    });

    it("throws when the process does not exist", () => {
      graph.addProgram(makeProgram());
      expect(() =>
        graph.linkProgramToProcess({ programId: "prog-visa-d", processId: "ghost-proc" }),
      ).toThrow(/process "ghost-proc" not found/);
    });
  });

  // ── Steps ────────────────────────────────────────────────────────────────

  describe("steps", () => {
    it("adds and retrieves a step by id", () => {
      const step = makeStep();
      graph.addStep(step);
      expect(graph.getStep("step-book-appt")).toStrictEqual(step);
    });

    it("getStepsForProcess returns steps sorted by ordinal", () => {
      graph.addStep(makeStep({ id: "step-3", ordinal: 3 }));
      graph.addStep(makeStep({ id: "step-1", ordinal: 1 }));
      graph.addStep(makeStep({ id: "step-2", ordinal: 2 }));

      const steps = graph.getStepsForProcess("proc-visa-d-apply");
      expect(steps.map((s) => s.ordinal)).toEqual([1, 2, 3]);
    });

    it("getStepsForProcess returns empty for unknown process", () => {
      expect(graph.getStepsForProcess("no-proc")).toHaveLength(0);
    });
  });

  // ── Institution ──────────────────────────────────────────────────────────

  describe("institutions", () => {
    it("adds and retrieves an institution by id", () => {
      const inst = makeInstitution();
      graph.addInstitution(inst);
      expect(graph.getInstitution("inst-german-embassy-london")).toStrictEqual(inst);
    });
  });

  // ── Outcome ──────────────────────────────────────────────────────────────

  describe("outcomes", () => {
    it("adds and retrieves an outcome by id", () => {
      const outcome = makeOutcome();
      graph.addOutcome(outcome);
      expect(graph.getOutcome("outcome-visa-d")).toStrictEqual(outcome);
    });

    it("getOutcomesForProcess returns linked outcomes", () => {
      graph.addOutcome(makeOutcome());
      expect(graph.getOutcomesForProcess("proc-visa-d-apply")).toHaveLength(1);
    });
  });

  // ── searchPrograms ────────────────────────────────────────────────────────

  describe("searchPrograms", () => {
    beforeEach(() => {
      graph.addProgram(
        makeProgram({
          id: "prog-1",
          name: "Long Stay Visa Type D",
          slug: "visa-type-d",
          tags: ["visa", "immigration"],
          description: "Allows extended stays in Germany.",
        }),
      );
      graph.addProgram(
        makeProgram({
          id: "prog-2",
          name: "Spouse Reunification Visa",
          slug: "visa-spouse",
          tags: ["visa", "family"],
          description: "For spouses of German residents.",
        }),
      );
      graph.addProgram(
        makeProgram({
          id: "prog-3",
          name: "Business Registration",
          slug: "business-reg",
          tags: ["business", "self-employment"],
          description: "Register a business entity in Germany.",
        }),
      );
    });

    it("returns programs matching a single keyword in name", () => {
      const results = graph.searchPrograms("visa");
      expect(results.map((r) => r.program.id).sort()).toEqual(["prog-1", "prog-2"]);
    });

    it("returns programs matching tag keywords", () => {
      const results = graph.searchPrograms("family");
      expect(results).toHaveLength(1);
      expect(results[0]?.program.id).toBe("prog-2");
    });

    it("returns programs matching description keywords", () => {
      const results = graph.searchPrograms("register");
      expect(results).toHaveLength(1);
      expect(results[0]?.program.id).toBe("prog-3");
    });

    it("ranks exact-phrase name match higher than partial match", () => {
      const results = graph.searchPrograms("long stay visa type d");
      expect(results[0]?.program.id).toBe("prog-1");
    });

    it("returns empty array for an empty query", () => {
      expect(graph.searchPrograms("")).toHaveLength(0);
    });

    it("returns empty array when no programs match", () => {
      expect(graph.searchPrograms("xyzzy impossible term")).toHaveLength(0);
    });

    it("is case-insensitive", () => {
      const results = graph.searchPrograms("VISA");
      expect(results.length).toBeGreaterThan(0);
    });

    it("attaches a positive score to each result", () => {
      const results = graph.searchPrograms("visa");
      for (const result of results) {
        expect(result.score).toBeGreaterThan(0);
      }
    });
  });

  // ── stats ─────────────────────────────────────────────────────────────────

  describe("stats", () => {
    it("returns zero counts for a fresh graph", () => {
      const s = graph.stats();
      expect(s.jurisdictions).toBe(0);
      expect(s.programs).toBe(0);
      expect(s.processes).toBe(0);
    });

    it("reflects entities after they are added", () => {
      graph.addJurisdiction(makeJurisdiction());
      graph.addProgram(makeProgram());
      graph.addProcess(makeProcess());
      graph.addStep(makeStep());
      graph.addInstitution(makeInstitution());
      graph.addOutcome(makeOutcome());

      const s = graph.stats();
      expect(s.jurisdictions).toBe(1);
      expect(s.programs).toBe(1);
      expect(s.processes).toBe(1);
      expect(s.steps).toBe(1);
      expect(s.institutions).toBe(1);
      expect(s.outcomes).toBe(1);
    });
  });
});
