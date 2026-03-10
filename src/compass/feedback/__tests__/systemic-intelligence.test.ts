import { describe, it, expect, beforeEach } from "vitest";
import { OutcomeTracker } from "../core-logic/outcome-tracker.js";
import { SystemicIntelligence } from "../core-logic/systemic-intelligence.js";
import type { NavigationOutcome } from "../types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let seq = 0;

function makeOutcome(overrides: Partial<NavigationOutcome> = {}): NavigationOutcome {
  seq++;
  return {
    id: `o-${seq}`,
    processId: "benefits-claim",
    jurisdiction: "GB",
    programId: "universal-credit",
    result: "approved",
    duration: 60_000, // 1 minute
    stepsCompleted: 6,
    totalSteps: 6,
    confusionPoints: [],
    timestamp: 1_700_000_000_000 + seq * 1000,
    ...overrides,
  };
}

const BASE_PERIOD = { start: 0, end: Number.MAX_SAFE_INTEGER };

// Seed a tracker with N approved + M denied outcomes in jurisdiction "GB".
function seedTracker(approved: number, denied: number, abandoned = 0): OutcomeTracker {
  const t = new OutcomeTracker();
  for (let i = 0; i < approved; i++) t.record(makeOutcome({ result: "approved" }));
  for (let i = 0; i < denied; i++) t.record(makeOutcome({ result: "denied" }));
  for (let i = 0; i < abandoned; i++) t.record(makeOutcome({ result: "abandoned" }));
  return t;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SystemicIntelligence", () => {
  beforeEach(() => {
    seq = 0;
  });

  describe("generateReport", () => {
    it("returns a SystemicReport with the correct jurisdiction", () => {
      const tracker = seedTracker(20, 5);
      const si = new SystemicIntelligence(tracker);
      const report = si.generateReport("GB", BASE_PERIOD);
      expect(report.jurisdiction).toBe("GB");
    });

    it("reflects the supplied period", () => {
      const tracker = seedTracker(15, 5);
      const si = new SystemicIntelligence(tracker);
      const period = { start: 100, end: 200 };
      const report = si.generateReport("GB", period);
      expect(report.period).toEqual(period);
    });

    it("approvalRate is in [0, 1]", () => {
      const tracker = seedTracker(15, 5);
      const si = new SystemicIntelligence(tracker);
      const report = si.generateReport("GB", BASE_PERIOD);
      expect(report.approvalRate).toBeGreaterThanOrEqual(0);
      expect(report.approvalRate).toBeLessThanOrEqual(1);
    });

    it("avgProcessingTime is non-negative", () => {
      const tracker = seedTracker(12, 3);
      const si = new SystemicIntelligence(tracker);
      const report = si.generateReport("GB", BASE_PERIOD);
      expect(report.avgProcessingTime).toBeGreaterThanOrEqual(0);
    });

    it("includes at most 5 top confusion points", () => {
      const tracker = new OutcomeTracker();
      for (let i = 0; i < 20; i++) {
        tracker.record(
          makeOutcome({
            confusionPoints: ["s1", "s2", "s3", "s4", "s5", "s6", "s7"],
          }),
        );
      }
      const si = new SystemicIntelligence(tracker);
      const report = si.generateReport("GB", BASE_PERIOD);
      expect(report.topConfusionPoints.length).toBeLessThanOrEqual(5);
    });

    it("includes at least one recommendation", () => {
      const tracker = seedTracker(15, 5);
      const si = new SystemicIntelligence(tracker);
      const report = si.generateReport("GB", BASE_PERIOD);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it("generates a low-approval recommendation when approval rate is below 50%", () => {
      // 4 approved out of 20 = 20% approval — well below threshold.
      const tracker = seedTracker(4, 16);
      const si = new SystemicIntelligence(tracker);
      const report = si.generateReport("GB", BASE_PERIOD);
      const hasApprovalRec = report.recommendations.some((r) =>
        r.toLowerCase().includes("approval rate"),
      );
      expect(hasApprovalRec).toBe(true);
    });

    it("returns empty bottlenecks and confusion points for an empty dataset", () => {
      const si = new SystemicIntelligence(new OutcomeTracker());
      const report = si.generateReport("GB", BASE_PERIOD);
      expect(report.bottlenecks).toHaveLength(0);
      expect(report.topConfusionPoints).toHaveLength(0);
    });
  });

  describe("identifyBottlenecks", () => {
    it("returns an empty array when there are fewer than 5 outcomes per process", () => {
      const tracker = seedTracker(3, 1);
      const si = new SystemicIntelligence(tracker);
      expect(si.identifyBottlenecks("GB")).toHaveLength(0);
    });

    it("identifies steps with high drop-off rates", () => {
      const tracker = new OutcomeTracker();
      // 10 sessions: 5 complete all 4 steps, 5 abandon at step 1
      for (let i = 0; i < 5; i++) {
        tracker.record(
          makeOutcome({
            processId: "proc-A",
            result: "approved",
            stepsCompleted: 4,
            totalSteps: 4,
            duration: 4 * 24 * 60 * 60 * 1000, // 4 days — triggers avgWaitDays
          }),
        );
      }
      for (let i = 0; i < 5; i++) {
        tracker.record(
          makeOutcome({
            processId: "proc-A",
            result: "abandoned",
            stepsCompleted: 0,
            totalSteps: 4,
            duration: 0,
          }),
        );
      }
      const si = new SystemicIntelligence(tracker);
      const bottlenecks = si.identifyBottlenecks("GB");
      expect(bottlenecks.length).toBeGreaterThan(0);
    });

    it("bottleneck dropoffRate is between 0 and 1", () => {
      const tracker = new OutcomeTracker();
      for (let i = 0; i < 10; i++) {
        tracker.record(
          makeOutcome({
            stepsCompleted: i % 2 === 0 ? 6 : 3,
            totalSteps: 6,
            duration: 8 * 24 * 60 * 60 * 1000,
          }),
        );
      }
      const si = new SystemicIntelligence(tracker);
      const bottlenecks = si.identifyBottlenecks("GB");
      for (const b of bottlenecks) {
        expect(b.dropoffRate).toBeGreaterThanOrEqual(0);
        expect(b.dropoffRate).toBeLessThanOrEqual(1);
      }
    });
  });

  describe("detectPatterns", () => {
    it("returns empty array when fewer than 5 outcomes exist", () => {
      const tracker = seedTracker(2, 1);
      const si = new SystemicIntelligence(tracker);
      expect(si.detectPatterns("GB")).toHaveLength(0);
    });

    it("detects elevated abandonment pattern when >20% sessions abandoned", () => {
      const tracker = seedTracker(6, 1, 3); // 3/10 = 30% abandoned
      const si = new SystemicIntelligence(tracker);
      const patterns = si.detectPatterns("GB");
      const hasAbandonment = patterns.some((p) => p.pattern.toLowerCase().includes("abandon"));
      expect(hasAbandonment).toBe(true);
    });

    it("detects low-approval pattern when approval rate < 50%", () => {
      const tracker = seedTracker(3, 17); // 15% approval
      const si = new SystemicIntelligence(tracker);
      const patterns = si.detectPatterns("GB");
      const hasLowApproval = patterns.some((p) =>
        p.pattern.toLowerCase().includes("approval rate"),
      );
      expect(hasLowApproval).toBe(true);
    });

    it("each pattern has confidence between 0 and 1", () => {
      const tracker = seedTracker(5, 15, 5);
      const si = new SystemicIntelligence(tracker);
      const patterns = si.detectPatterns("GB");
      for (const p of patterns) {
        expect(p.confidence).toBeGreaterThanOrEqual(0);
        expect(p.confidence).toBeLessThanOrEqual(1);
      }
    });

    it("scopes results to the specified programId", () => {
      const tracker = new OutcomeTracker();
      // 10 outcomes for prog-alpha with 50% abandonment
      for (let i = 0; i < 5; i++)
        tracker.record(makeOutcome({ programId: "prog-alpha", result: "approved" }));
      for (let i = 0; i < 5; i++)
        tracker.record(makeOutcome({ programId: "prog-alpha", result: "abandoned" }));
      // 10 clean outcomes for prog-beta
      for (let i = 0; i < 10; i++)
        tracker.record(makeOutcome({ programId: "prog-beta", result: "approved" }));

      const si = new SystemicIntelligence(tracker);

      const alphaPatterns = si.detectPatterns("GB", "prog-alpha");
      const betaPatterns = si.detectPatterns("GB", "prog-beta");

      // prog-alpha should flag abandonment, prog-beta should not
      const alphaAbandonment = alphaPatterns.some((p) =>
        p.pattern.toLowerCase().includes("abandon"),
      );
      const betaAbandonment = betaPatterns.some((p) => p.pattern.toLowerCase().includes("abandon"));

      expect(alphaAbandonment).toBe(true);
      expect(betaAbandonment).toBe(false);
    });
  });

  describe("comparePeriods", () => {
    it("returns one entry per tracked metric", () => {
      const tracker = seedTracker(20, 5);
      const si = new SystemicIntelligence(tracker);
      const comparisons = si.comparePeriods("GB", BASE_PERIOD, BASE_PERIOD);
      expect(comparisons.length).toBeGreaterThan(0);
      expect(comparisons.every((c) => "metric" in c && "change" in c && "direction" in c)).toBe(
        true,
      );
    });

    it("direction is one of improved | declined | stable", () => {
      const tracker = seedTracker(20, 5);
      const si = new SystemicIntelligence(tracker);
      const comparisons = si.comparePeriods("GB", BASE_PERIOD, BASE_PERIOD);
      const validDirections = new Set(["improved", "declined", "stable"]);
      for (const c of comparisons) {
        expect(validDirections.has(c.direction)).toBe(true);
      }
    });

    it("marks metrics as stable when the same period is compared to itself", () => {
      const tracker = seedTracker(20, 5);
      const si = new SystemicIntelligence(tracker);
      const comparisons = si.comparePeriods("GB", BASE_PERIOD, BASE_PERIOD);
      const nonStable = comparisons.filter((c) => c.direction !== "stable");
      // All comparisons against the same period should be stable
      expect(nonStable).toHaveLength(0);
    });

    it("detects improvement when approval rate increases across periods", () => {
      const tracker = new OutcomeTracker();
      const period1 = { start: 0, end: 999 };
      const period2 = { start: 1000, end: 1_999 };

      // Period 1: 2/10 approved
      for (let i = 0; i < 2; i++)
        tracker.record(makeOutcome({ result: "approved", timestamp: 500 }));
      for (let i = 0; i < 8; i++) tracker.record(makeOutcome({ result: "denied", timestamp: 600 }));

      // Period 2: 9/10 approved
      for (let i = 0; i < 9; i++)
        tracker.record(makeOutcome({ result: "approved", timestamp: 1500 }));
      for (let i = 0; i < 1; i++)
        tracker.record(makeOutcome({ result: "denied", timestamp: 1600 }));

      const si = new SystemicIntelligence(tracker);
      const comparisons = si.comparePeriods("GB", period1, period2);
      const approvalComp = comparisons.find((c) => c.metric === "approvalRate");
      expect(approvalComp?.direction).toBe("improved");
    });
  });
});
