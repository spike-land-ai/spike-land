/**
 * COMPASS Knowledge Engine — Versioning & Confidence Decay Tests
 *
 * The clock is injected via the VersionTracker constructor so every test
 * runs deterministically without real time passing.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { VersionTracker, HALF_LIFE_DAYS, CONFIDENCE_FLOOR } from "../core-logic/versioning.ts";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns an ISO string for a date offset by `days` from the epoch anchor. */
function daysAgo(days: number): string {
  const date = new Date("2025-06-01T00:00:00.000Z");
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

const NOW = "2025-06-01T00:00:00.000Z";

function makeTracker(): VersionTracker {
  return new VersionTracker(() => NOW);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("VersionTracker", () => {
  let tracker: VersionTracker;

  beforeEach(() => {
    tracker = makeTracker();
  });

  // ── markVerified ──────────────────────────────────────────────────────────

  describe("markVerified", () => {
    it("stores a verification record for the entity", () => {
      tracker.markVerified("ent-1", "program", "reviewer-alice");
      const record = tracker.getRecord("ent-1");
      expect(record).toBeDefined();
      expect(record?.verifiedBy).toBe("reviewer-alice");
      expect(record?.entityType).toBe("program");
    });

    it("throws when baseScore is below 0", () => {
      expect(() => tracker.markVerified("ent-1", "program", "alice", -0.1)).toThrow(RangeError);
    });

    it("throws when baseScore is above 1", () => {
      expect(() => tracker.markVerified("ent-1", "program", "alice", 1.01)).toThrow(RangeError);
    });

    it("accepts a baseScore of exactly 0", () => {
      expect(() => tracker.markVerified("ent-1", "program", "alice", 0)).not.toThrow();
    });

    it("accepts a baseScore of exactly 1", () => {
      expect(() => tracker.markVerified("ent-1", "program", "alice", 1)).not.toThrow();
    });

    it("stores the verifiedAt timestamp from the injected clock", () => {
      tracker.markVerified("ent-1", "jurisdiction", "alice");
      expect(tracker.getRecord("ent-1")?.verifiedAt).toBe(NOW);
    });

    it("overwrites a previous record when called again", () => {
      // Use two different tracker instances to simulate two different "nows"
      const t1 = new VersionTracker(() => "2025-01-01T00:00:00.000Z");
      t1.markVerified("ent-1", "program", "alice");
      expect(t1.getRecord("ent-1")?.verifiedAt).toBe("2025-01-01T00:00:00.000Z");

      // Simulate a later re-verification via a new tracker with a newer clock
      const t2 = new VersionTracker(() => "2025-06-01T00:00:00.000Z");
      // Re-use the tracker by marking again (same instance scenario)
      t1.markVerified("ent-1", "program", "bob");
      // The record should now belong to bob (same instance, different call)
      expect(t1.getRecord("ent-1")?.verifiedBy).toBe("bob");

      // The t2 tracker is a fresh one
      t2.markVerified("ent-1", "program", "carol");
      expect(t2.getRecord("ent-1")?.verifiedBy).toBe("carol");
    });
  });

  // ── getConfidence — freshly verified ─────────────────────────────────────

  describe("getConfidence — freshly verified", () => {
    it("returns 1.0 immediately after verification with default baseScore", () => {
      tracker.markVerified("ent-1", "program", "alice");
      const confidence = tracker.getConfidence("ent-1");
      // Exactly 0 days elapsed; 2^0 = 1; 1.0 × 1.0 = 1.0
      expect(confidence).toBeCloseTo(1.0, 10);
    });

    it("returns 0 for an entity that has never been verified", () => {
      expect(tracker.getConfidence("unknown-entity")).toBe(0);
    });

    it("respects a custom baseScore at verification time", () => {
      tracker.markVerified("ent-partial", "program", "alice", 0.6);
      expect(tracker.getConfidence("ent-partial")).toBeCloseTo(0.6, 10);
    });
  });

  // ── getConfidence — decay over time ──────────────────────────────────────

  describe("getConfidence — decay over time", () => {
    it("returns ~0.5 after exactly one half-life", () => {
      const pastTracker = new VersionTracker(() => NOW);
      // Verified HALF_LIFE_DAYS ago
      pastTracker.markVerified("ent-old", "program", "alice");

      // Now read from a tracker whose "now" is HALF_LIFE_DAYS later
      const futureTracker = new VersionTracker(() => {
        const d = new Date(NOW);
        d.setDate(d.getDate() + HALF_LIFE_DAYS);
        return d.toISOString();
      });
      // Transfer the record by marking with the old timestamp
      futureTracker.markVerified("ent-old", "program", "alice");
      // Re-stamp as HALF_LIFE_DAYS ago so we can measure decay
      const halfLifeAgo = daysAgo(HALF_LIFE_DAYS);

      // Build a tracker frozen at NOW, pre-populated with an old verification
      const _frozenNow = new VersionTracker(() => NOW);
      // Verify with a custom internal record by exploiting the clock
      const staleTracker = new VersionTracker(() => halfLifeAgo);
      staleTracker.markVerified("ent-old", "program", "alice");

      // Now create a tracker whose now == NOW and re-read the record via the
      // public API — but VersionTracker recalculates at read time, so we
      // need to use the stale tracker with the correct "now" injected.
      // We accomplish this by building a tracker whose now = NOW but the
      // record was set with verifiedAt = halfLifeAgo.
      const _tHalfLife = new VersionTracker(() => NOW);
      // Hack: inject a past verification by re-calling markVerified with
      // a clock frozen in the past, then read from a clock at NOW.
      // Since the tracker stores verifiedAt from _its_ clock, we must
      // build the scenario differently:

      // VersionTracker with clock = past
      const tPast = new VersionTracker(() => halfLifeAgo);
      tPast.markVerified("ent-decay", "process", "alice");

      // Read confidence from a tracker with clock = NOW
      // We can't directly; instead test using a single tracker that
      // is fully controlled.
      // Better approach: a single tracker whose "now" advances.
      let currentTime = halfLifeAgo;
      const advancing = new VersionTracker(() => currentTime);
      advancing.markVerified("ent-decay", "process", "alice");

      // Advance clock to NOW (= halfLifeAgo + HALF_LIFE_DAYS)
      currentTime = NOW;
      const confidence = advancing.getConfidence("ent-decay");
      expect(confidence).toBeCloseTo(0.5, 2);
    });

    it("returns ~0.25 after two half-lives", () => {
      let currentTime = daysAgo(HALF_LIFE_DAYS * 2);
      const tracker2 = new VersionTracker(() => currentTime);
      tracker2.markVerified("ent-old", "process", "alice");

      currentTime = NOW;
      expect(tracker2.getConfidence("ent-old")).toBeCloseTo(0.25, 2);
    });

    it("does not drop below CONFIDENCE_FLOOR for very old entities", () => {
      let currentTime = daysAgo(HALF_LIFE_DAYS * 100);
      const t = new VersionTracker(() => currentTime);
      t.markVerified("ancient", "outcome", "alice");
      currentTime = NOW;
      expect(t.getConfidence("ancient")).toBeGreaterThanOrEqual(CONFIDENCE_FLOOR);
    });

    it("confidence strictly decreases as time passes", () => {
      let currentTime = daysAgo(30);
      const t = new VersionTracker(() => currentTime);
      t.markVerified("ent", "document", "alice");

      const readings: number[] = [];
      for (const daysFromNow of [0, 30, 60, 90]) {
        const d = new Date(NOW);
        d.setDate(d.getDate() + daysFromNow);
        currentTime = d.toISOString();
        readings.push(t.getConfidence("ent"));
      }

      for (let i = 1; i < readings.length; i++) {
        expect(readings[i]).toBeLessThan(readings[i - 1] ?? Infinity);
      }
    });
  });

  // ── getStaleEntities ──────────────────────────────────────────────────────

  describe("getStaleEntities", () => {
    it("returns entities not verified within the threshold", () => {
      let currentTime = daysAgo(200);
      const t = new VersionTracker(() => currentTime);
      t.markVerified("ent-old", "program", "alice");

      currentTime = daysAgo(10);
      t.markVerified("ent-new", "jurisdiction", "bob");

      currentTime = NOW;
      const stale = t.getStaleEntities(90);
      expect(stale.map((s) => s.entityId)).toContain("ent-old");
      expect(stale.map((s) => s.entityId)).not.toContain("ent-new");
    });

    it("returns entities sorted by daysSinceVerification descending", () => {
      let currentTime = daysAgo(300);
      const t = new VersionTracker(() => currentTime);
      t.markVerified("oldest", "process", "alice");

      currentTime = daysAgo(150);
      t.markVerified("middle", "outcome", "alice");

      currentTime = NOW;
      const stale = t.getStaleEntities(100);
      const ids = stale.map((s) => s.entityId);
      expect(ids[0]).toBe("oldest");
      expect(ids[1]).toBe("middle");
    });

    it("returns empty array when no entities are stale", () => {
      tracker.markVerified("fresh", "institution", "alice");
      const stale = tracker.getStaleEntities(90);
      expect(stale).toHaveLength(0);
    });

    it("throws when thresholdDays is negative", () => {
      expect(() => tracker.getStaleEntities(-1)).toThrow(RangeError);
    });

    it("includes daysSinceVerification and currentConfidence in results", () => {
      let currentTime = daysAgo(180);
      const t = new VersionTracker(() => currentTime);
      t.markVerified("ent-1", "deadline", "alice");
      currentTime = NOW;

      const stale = t.getStaleEntities(90);
      expect(stale).toHaveLength(1);
      const record = stale[0];
      expect(record?.daysSinceVerification).toBeGreaterThanOrEqual(179);
      expect(record?.currentConfidence).toBeGreaterThan(0);
      expect(record?.currentConfidence).toBeLessThan(1);
    });
  });

  // ── getUnverifiedEntities ─────────────────────────────────────────────────

  describe("getUnverifiedEntities", () => {
    it("returns ids that have no verification record", () => {
      tracker.markVerified("known", "program", "alice");
      const unverified = tracker.getUnverifiedEntities(["known", "unknown-1", "unknown-2"]);
      expect(unverified).toEqual(["unknown-1", "unknown-2"]);
    });

    it("returns all ids if none are verified", () => {
      const unverified = tracker.getUnverifiedEntities(["a", "b"]);
      expect(unverified).toEqual(["a", "b"]);
    });

    it("returns empty array if all are verified", () => {
      tracker.markVerified("a", "process", "alice");
      tracker.markVerified("b", "step", "alice");
      expect(tracker.getUnverifiedEntities(["a", "b"])).toHaveLength(0);
    });
  });

  // ── isTrusted ─────────────────────────────────────────────────────────────

  describe("isTrusted", () => {
    it("returns true for a freshly verified entity with default threshold", () => {
      tracker.markVerified("ent", "program", "alice");
      expect(tracker.isTrusted("ent")).toBe(true);
    });

    it("returns false for an unverified entity", () => {
      expect(tracker.isTrusted("ghost")).toBe(false);
    });

    it("returns false when confidence is below the custom threshold", () => {
      let currentTime = daysAgo(HALF_LIFE_DAYS * 3); // 3 half-lives → ~0.125
      const t = new VersionTracker(() => currentTime);
      t.markVerified("ent", "outcome", "alice");
      currentTime = NOW;
      expect(t.isTrusted("ent", 0.5)).toBe(false);
    });

    it("returns true when confidence is above the custom threshold", () => {
      tracker.markVerified("ent", "jurisdiction", "alice");
      expect(tracker.isTrusted("ent", 0.9)).toBe(true);
    });
  });
});
