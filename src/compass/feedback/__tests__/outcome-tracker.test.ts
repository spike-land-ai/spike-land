import { describe, it, expect, beforeEach } from "vitest";
import { OutcomeTracker } from "../core-logic/outcome-tracker.js";
import type { NavigationOutcome } from "../types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let idSeq = 0;

function makeOutcome(overrides: Partial<NavigationOutcome> = {}): NavigationOutcome {
  idSeq++;
  return {
    id: `outcome-${idSeq}`,
    processId: "housing-benefit",
    jurisdiction: "GB",
    programId: "housing-benefit-standard",
    result: "approved",
    duration: 120_000,
    stepsCompleted: 5,
    totalSteps: 5,
    confusionPoints: [],
    timestamp: 1_700_000_000_000,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("OutcomeTracker", () => {
  let tracker: OutcomeTracker;

  beforeEach(() => {
    tracker = new OutcomeTracker();
    idSeq = 0;
  });

  describe("record / size", () => {
    it("starts empty", () => {
      expect(tracker.size).toBe(0);
    });

    it("increments size after each record call", () => {
      tracker.record(makeOutcome());
      expect(tracker.size).toBe(1);
      tracker.record(makeOutcome());
      expect(tracker.size).toBe(2);
    });
  });

  describe("getOutcomes — filtering", () => {
    beforeEach(() => {
      tracker.record(makeOutcome({ jurisdiction: "GB", programId: "prog-a", timestamp: 1000 }));
      tracker.record(makeOutcome({ jurisdiction: "US", programId: "prog-a", timestamp: 2000 }));
      tracker.record(makeOutcome({ jurisdiction: "GB", programId: "prog-b", timestamp: 3000 }));
    });

    it("returns all outcomes when no filters supplied", () => {
      expect(tracker.getOutcomes()).toHaveLength(3);
    });

    it("filters by jurisdiction", () => {
      const gb = tracker.getOutcomes({ jurisdiction: "GB" });
      expect(gb).toHaveLength(2);
      expect(gb.every((o) => o.jurisdiction === "GB")).toBe(true);
    });

    it("filters by programId", () => {
      const progA = tracker.getOutcomes({ programId: "prog-a" });
      expect(progA).toHaveLength(2);
    });

    it("filters by dateRange (inclusive)", () => {
      const inRange = tracker.getOutcomes({ dateRange: { start: 1000, end: 2000 } });
      expect(inRange).toHaveLength(2);
    });

    it("combines jurisdiction and programId filters", () => {
      const result = tracker.getOutcomes({ jurisdiction: "GB", programId: "prog-a" });
      expect(result).toHaveLength(1);
    });

    it("returns empty array when no outcomes match", () => {
      expect(tracker.getOutcomes({ jurisdiction: "AU" })).toHaveLength(0);
    });

    it("returns a copy — mutations do not affect the store", () => {
      const copy = tracker.getOutcomes();
      copy.splice(0, copy.length);
      expect(tracker.size).toBe(3);
    });
  });

  describe("getApprovalRate", () => {
    it("returns 0 when no outcomes exist", () => {
      expect(tracker.getApprovalRate("prog-a", "GB")).toBe(0);
    });

    it("computes correct approval rate", () => {
      tracker.record(makeOutcome({ programId: "prog-a", jurisdiction: "GB", result: "approved" }));
      tracker.record(makeOutcome({ programId: "prog-a", jurisdiction: "GB", result: "approved" }));
      tracker.record(makeOutcome({ programId: "prog-a", jurisdiction: "GB", result: "denied" }));
      tracker.record(makeOutcome({ programId: "prog-a", jurisdiction: "GB", result: "abandoned" }));

      expect(tracker.getApprovalRate("prog-a", "GB")).toBeCloseTo(0.5, 5);
    });

    it("only counts outcomes matching both programId AND jurisdiction", () => {
      tracker.record(makeOutcome({ programId: "prog-a", jurisdiction: "GB", result: "approved" }));
      tracker.record(makeOutcome({ programId: "prog-a", jurisdiction: "US", result: "denied" }));

      // US outcome must not contaminate GB rate
      expect(tracker.getApprovalRate("prog-a", "GB")).toBe(1);
    });
  });

  describe("getAvgDuration", () => {
    it("returns 0 when no outcomes exist", () => {
      expect(tracker.getAvgDuration("prog-x")).toBe(0);
    });

    it("computes mean duration across all results for a programme", () => {
      tracker.record(makeOutcome({ programId: "prog-c", duration: 100_000 }));
      tracker.record(makeOutcome({ programId: "prog-c", duration: 200_000 }));
      tracker.record(makeOutcome({ programId: "prog-c", duration: 300_000 }));

      expect(tracker.getAvgDuration("prog-c")).toBe(200_000);
    });
  });

  describe("getConfusionPoints", () => {
    it("returns empty array when no outcomes recorded for process", () => {
      expect(tracker.getConfusionPoints("unknown-process")).toHaveLength(0);
    });

    it("aggregates confusion step frequencies", () => {
      tracker.record(makeOutcome({ processId: "proc-1", confusionPoints: ["step-2", "step-3"] }));
      tracker.record(makeOutcome({ processId: "proc-1", confusionPoints: ["step-2"] }));
      tracker.record(makeOutcome({ processId: "proc-1", confusionPoints: [] }));

      const points = tracker.getConfusionPoints("proc-1");
      expect(points).toHaveLength(2);

      const step2 = points.find((p) => p.stepId === "step-2");
      expect(step2?.frequency).toBe(2);

      const step3 = points.find((p) => p.stepId === "step-3");
      expect(step3?.frequency).toBe(1);
    });

    it("sorts confusion points descending by frequency", () => {
      tracker.record(makeOutcome({ processId: "proc-2", confusionPoints: ["a"] }));
      tracker.record(makeOutcome({ processId: "proc-2", confusionPoints: ["a", "b", "c"] }));
      tracker.record(makeOutcome({ processId: "proc-2", confusionPoints: ["a", "b"] }));

      const points = tracker.getConfusionPoints("proc-2");
      expect(points[0]?.stepId).toBe("a");
      expect(points[1]?.stepId).toBe("b");
      expect(points[2]?.stepId).toBe("c");
    });

    it("does not include confusion points from other processes", () => {
      tracker.record(makeOutcome({ processId: "proc-A", confusionPoints: ["step-1"] }));
      tracker.record(makeOutcome({ processId: "proc-B", confusionPoints: ["step-9"] }));

      const pointsA = tracker.getConfusionPoints("proc-A");
      expect(pointsA.every((p) => p.processId === "proc-A")).toBe(true);
      expect(pointsA.find((p) => p.stepId === "step-9")).toBeUndefined();
    });
  });
});
