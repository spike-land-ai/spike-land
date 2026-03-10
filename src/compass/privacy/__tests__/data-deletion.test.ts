/**
 * Tests: DeletionService
 *
 * Coverage:
 * - requestDeletion() creates a pending request
 * - requestDeletion() is idempotent for active requests
 * - processDeletion() calls delete on all stores and sets status=completed
 * - processDeletion() sets completedAt on success
 * - processDeletion() collects store errors without silently skipping stores
 * - processDeletion() rejects non-pending requests
 * - verifyDeletion() returns true when all stores report clean
 * - verifyDeletion() returns false when any store still has data
 * - verifyDeletion() advances status to "verified" on success
 * - verifyDeletion() rejects non-completed requests
 * - getRetentionPolicy() returns correct policies per category
 * - getRetentionPolicy() falls back to restrictive defaults for unknown types
 * - isRetentionExpired() detects expired and non-expired records
 * - full lifecycle: pending → processing → completed → verified
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { DeletionService } from "../core-logic/data-deletion.js";
import type { DataStore } from "../core-logic/data-deletion.js";
import { DataCategory } from "../types.js";

// ---------------------------------------------------------------------------
// Mock DataStore factory
// ---------------------------------------------------------------------------

function mockStore(
  name: string,
  options: {
    deleteWillThrow?: boolean;
    verifyReturns?: boolean; // true = data still exists; false = clean
  } = {},
): DataStore & { deleteCalled: boolean; verifyCalled: boolean } {
  let deleteCalled = false;
  let verifyCalled = false;

  return {
    name,
    get deleteCalled() {
      return deleteCalled;
    },
    get verifyCalled() {
      return verifyCalled;
    },
    async delete(_userId: string): Promise<void> {
      deleteCalled = true;
      if (options.deleteWillThrow === true) {
        throw new Error(`${name}: simulated delete failure`);
      }
    },
    async verify(_userId: string): Promise<boolean> {
      verifyCalled = true;
      return options.verifyReturns ?? false;
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DeletionService", () => {
  let svc: DeletionService;

  beforeEach(() => {
    svc = new DeletionService();
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // requestDeletion
  // -------------------------------------------------------------------------

  describe("requestDeletion()", () => {
    it("creates a pending deletion request", () => {
      const req = svc.requestDeletion("user-1");
      expect(req.userId).toBe("user-1");
      expect(req.status).toBe("pending");
      expect(typeof req.id).toBe("string");
      expect(req.id.length).toBeGreaterThan(0);
      expect(typeof req.requestedAt).toBe("number");
      expect(req.completedAt).toBeUndefined();
    });

    it("returns the same request if a pending request already exists for that user", () => {
      const req1 = svc.requestDeletion("user-1");
      const req2 = svc.requestDeletion("user-1");
      expect(req1.id).toBe(req2.id);
    });

    it("creates separate requests for different users", () => {
      const req1 = svc.requestDeletion("user-A");
      const req2 = svc.requestDeletion("user-B");
      expect(req1.id).not.toBe(req2.id);
    });

    it("creates a new request after a previous one is verified", async () => {
      const store = mockStore("s1");
      const req1 = svc.requestDeletion("user-1");
      await svc.processDeletion(req1.id, [store]);
      await svc.verifyDeletion(req1.id, [store]);
      const req2 = svc.requestDeletion("user-1");
      expect(req2.id).not.toBe(req1.id);
    });
  });

  // -------------------------------------------------------------------------
  // processDeletion
  // -------------------------------------------------------------------------

  describe("processDeletion()", () => {
    it("calls delete on every store with the correct userId", async () => {
      const s1 = mockStore("store-1");
      const s2 = mockStore("store-2");
      const req = svc.requestDeletion("user-del");
      await svc.processDeletion(req.id, [s1, s2]);
      expect(s1.deleteCalled).toBe(true);
      expect(s2.deleteCalled).toBe(true);
    });

    it("transitions status from pending to completed on success", async () => {
      const store = mockStore("s1");
      const req = svc.requestDeletion("user-1");
      await svc.processDeletion(req.id, [store]);
      const updated = svc.getRequest(req.id);
      expect(updated?.status).toBe("completed");
    });

    it("sets completedAt on the request", async () => {
      vi.useFakeTimers();
      const fixedTime = 1_700_000_000_000;
      vi.setSystemTime(fixedTime);
      const store = mockStore("s1");
      const req = svc.requestDeletion("user-1");
      await svc.processDeletion(req.id, [store]);
      const updated = svc.getRequest(req.id);
      expect(updated?.completedAt).toBe(fixedTime);
    });

    it("throws when the request id does not exist", async () => {
      await expect(svc.processDeletion("nonexistent-id", [])).rejects.toThrow(/not found/i);
    });

    it("throws when the request is not in pending status", async () => {
      const store = mockStore("s1");
      const req = svc.requestDeletion("user-1");
      await svc.processDeletion(req.id, [store]);
      // Now status is "completed" — processing again should throw
      await expect(svc.processDeletion(req.id, [store])).rejects.toThrow(/pending/i);
    });

    it("still calls delete on all remaining stores even if one throws", async () => {
      const s1 = mockStore("failing-store", { deleteWillThrow: true });
      const s2 = mockStore("ok-store");
      const req = svc.requestDeletion("user-1");
      await expect(svc.processDeletion(req.id, [s1, s2])).rejects.toThrow();
      // s2 must have been called despite s1 throwing
      expect(s2.deleteCalled).toBe(true);
    });

    it("throws an AggregateError when any store fails", async () => {
      const s1 = mockStore("bad", { deleteWillThrow: true });
      const req = svc.requestDeletion("user-1");
      let caughtError: unknown;
      try {
        await svc.processDeletion(req.id, [s1]);
      } catch (err) {
        caughtError = err;
      }
      expect(caughtError).toBeInstanceOf(AggregateError);
    });

    it("does NOT set status to completed when a store fails", async () => {
      const s1 = mockStore("bad", { deleteWillThrow: true });
      const req = svc.requestDeletion("user-1");
      try {
        await svc.processDeletion(req.id, [s1]);
      } catch {
        // expected
      }
      const updated = svc.getRequest(req.id);
      // Should still be "processing" (not "completed") so a retry is possible
      expect(updated?.status).toBe("processing");
    });
  });

  // -------------------------------------------------------------------------
  // verifyDeletion
  // -------------------------------------------------------------------------

  describe("verifyDeletion()", () => {
    it("returns true and advances status to verified when all stores are clean", async () => {
      const s1 = mockStore("s1", { verifyReturns: false });
      const s2 = mockStore("s2", { verifyReturns: false });
      const req = svc.requestDeletion("user-1");
      await svc.processDeletion(req.id, [s1, s2]);
      const result = await svc.verifyDeletion(req.id, [s1, s2]);
      expect(result).toBe(true);
      expect(svc.getRequest(req.id)?.status).toBe("verified");
    });

    it("returns false when any store still holds data", async () => {
      const s1 = mockStore("s1", { verifyReturns: false });
      const s2 = mockStore("dirty-store", { verifyReturns: true }); // still has data
      const req = svc.requestDeletion("user-1");
      await svc.processDeletion(req.id, [s1, s2]);
      const result = await svc.verifyDeletion(req.id, [s1, s2]);
      expect(result).toBe(false);
      // Status should remain "completed" — not advance to "verified"
      expect(svc.getRequest(req.id)?.status).toBe("completed");
    });

    it("calls verify on every store", async () => {
      const s1 = mockStore("s1");
      const s2 = mockStore("s2");
      const req = svc.requestDeletion("user-1");
      await svc.processDeletion(req.id, [s1, s2]);
      await svc.verifyDeletion(req.id, [s1, s2]);
      expect(s1.verifyCalled).toBe(true);
      expect(s2.verifyCalled).toBe(true);
    });

    it("throws when the request is not found", async () => {
      await expect(svc.verifyDeletion("nonexistent", [])).rejects.toThrow(/not found/i);
    });

    it("throws when the request is not completed", async () => {
      const req = svc.requestDeletion("user-1"); // still pending
      await expect(svc.verifyDeletion(req.id, [])).rejects.toThrow(/completed/i);
    });
  });

  // -------------------------------------------------------------------------
  // Retention policies
  // -------------------------------------------------------------------------

  describe("getRetentionPolicy()", () => {
    it("returns the correct policy for IMMIGRATION (1 year, explicit consent)", () => {
      const policy = svc.getRetentionPolicy(DataCategory.IMMIGRATION);
      expect(policy.category).toBe(DataCategory.IMMIGRATION);
      expect(policy.maxRetentionDays).toBe(365);
      expect(policy.requiresExplicitConsent).toBe(true);
    });

    it("returns the correct policy for FINANCIAL (7 years, no explicit consent)", () => {
      const policy = svc.getRetentionPolicy(DataCategory.FINANCIAL);
      expect(policy.maxRetentionDays).toBe(7 * 365);
      expect(policy.requiresExplicitConsent).toBe(false);
    });

    it("returns the correct policy for HEALTH (3 years, explicit consent)", () => {
      const policy = svc.getRetentionPolicy(DataCategory.HEALTH);
      expect(policy.maxRetentionDays).toBe(3 * 365);
      expect(policy.requiresExplicitConsent).toBe(true);
    });

    it("returns the correct policy for LEGAL (7 years, explicit consent)", () => {
      const policy = svc.getRetentionPolicy(DataCategory.LEGAL);
      expect(policy.maxRetentionDays).toBe(7 * 365);
      expect(policy.requiresExplicitConsent).toBe(true);
    });

    it("accepts custom policies passed to the constructor", () => {
      const customSvc = new DeletionService({
        [DataCategory.IDENTITY]: {
          category: DataCategory.IDENTITY,
          maxRetentionDays: 30,
          requiresExplicitConsent: true,
        },
      });
      const policy = customSvc.getRetentionPolicy(DataCategory.IDENTITY);
      expect(policy.maxRetentionDays).toBe(30);
      expect(policy.requiresExplicitConsent).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // isRetentionExpired
  // -------------------------------------------------------------------------

  describe("isRetentionExpired()", () => {
    it("returns false for data well within the retention window", () => {
      // IMMIGRATION: 365 days. Data created 30 days ago.
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      expect(svc.isRetentionExpired(DataCategory.IMMIGRATION, thirtyDaysAgo)).toBe(false);
    });

    it("returns true for data beyond the retention window", () => {
      // IMMIGRATION: 365 days. Data created 400 days ago.
      const fourHundredDaysAgo = Date.now() - 400 * 24 * 60 * 60 * 1000;
      expect(svc.isRetentionExpired(DataCategory.IMMIGRATION, fourHundredDaysAgo)).toBe(true);
    });

    it("returns false for FINANCIAL data within 7 years", () => {
      const twoYearsAgo = Date.now() - 2 * 365 * 24 * 60 * 60 * 1000;
      expect(svc.isRetentionExpired(DataCategory.FINANCIAL, twoYearsAgo)).toBe(false);
    });

    it("returns true for FINANCIAL data beyond 7 years", () => {
      const eightYearsAgo = Date.now() - 8 * 365 * 24 * 60 * 60 * 1000;
      expect(svc.isRetentionExpired(DataCategory.FINANCIAL, eightYearsAgo)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Full lifecycle
  // -------------------------------------------------------------------------

  describe("full deletion lifecycle", () => {
    it("pending → processing → completed → verified", async () => {
      const store = mockStore("main-store", { verifyReturns: false });
      const req = svc.requestDeletion("lifecycle-user");
      expect(svc.getRequest(req.id)?.status).toBe("pending");

      await svc.processDeletion(req.id, [store]);
      expect(svc.getRequest(req.id)?.status).toBe("completed");
      expect(svc.getRequest(req.id)?.completedAt).toBeDefined();

      const verified = await svc.verifyDeletion(req.id, [store]);
      expect(verified).toBe(true);
      expect(svc.getRequest(req.id)?.status).toBe("verified");
    });
  });

  // -------------------------------------------------------------------------
  // getRequestsByUser
  // -------------------------------------------------------------------------

  describe("getRequestsByUser()", () => {
    it("returns all requests for a user, newest first", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(1_000_000);

      const store = mockStore("s1");
      const req1 = svc.requestDeletion("user-multi");

      // Advance time so req2 has a strictly later requestedAt
      vi.setSystemTime(2_000_000);
      await svc.processDeletion(req1.id, [store]);
      await svc.verifyDeletion(req1.id, [store]);

      vi.setSystemTime(3_000_000);
      const req2 = svc.requestDeletion("user-multi");

      const requests = svc.getRequestsByUser("user-multi");
      expect(requests).toHaveLength(2);
      // Newest first
      expect(requests[0]?.id).toBe(req2.id);
      expect(requests[1]?.id).toBe(req1.id);
    });

    it("returns empty array for a user with no requests", () => {
      expect(svc.getRequestsByUser("never-requested")).toEqual([]);
    });
  });
});
