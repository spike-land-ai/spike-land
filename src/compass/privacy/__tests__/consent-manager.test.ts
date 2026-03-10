/**
 * Tests: ConsentManager
 *
 * Coverage:
 * - Grant consent (basic and with expiry)
 * - Revoke consent
 * - Expiry detection
 * - requireConsent() guard — success and all failure modes
 * - Deny-by-default (no record)
 * - getConsents() returns all records for a user
 * - GDPR principle: revoked consent is immediately treated as denied
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ConsentManager, ConsentRequiredError } from "../core-logic/consent-manager.js";

describe("ConsentManager", () => {
  let cm: ConsentManager;

  beforeEach(() => {
    cm = new ConsentManager();
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // grantConsent
  // -------------------------------------------------------------------------

  describe("grantConsent()", () => {
    it("returns a ConsentRecord with granted=true", () => {
      const record = cm.grantConsent("user-1", "benefit-matching");
      expect(record.userId).toBe("user-1");
      expect(record.purpose).toBe("benefit-matching");
      expect(record.granted).toBe(true);
      expect(typeof record.timestamp).toBe("number");
      expect(record.expiresAt).toBeUndefined();
    });

    it("stores the expiry when provided", () => {
      const future = Date.now() + 60_000;
      const record = cm.grantConsent("user-1", "benefit-matching", future);
      expect(record.expiresAt).toBe(future);
    });

    it("makes hasConsent() return true immediately", () => {
      cm.grantConsent("user-2", "document-storage");
      expect(cm.hasConsent("user-2", "document-storage")).toBe(true);
    });

    it("grants are independent per purpose", () => {
      cm.grantConsent("user-3", "benefit-matching");
      expect(cm.hasConsent("user-3", "benefit-matching")).toBe(true);
      expect(cm.hasConsent("user-3", "data-export")).toBe(false);
    });

    it("grants are independent per userId", () => {
      cm.grantConsent("user-A", "benefit-matching");
      expect(cm.hasConsent("user-A", "benefit-matching")).toBe(true);
      expect(cm.hasConsent("user-B", "benefit-matching")).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // revokeConsent
  // -------------------------------------------------------------------------

  describe("revokeConsent()", () => {
    it("returns a ConsentRecord with granted=false", () => {
      cm.grantConsent("user-1", "benefit-matching");
      const revocation = cm.revokeConsent("user-1", "benefit-matching");
      expect(revocation.granted).toBe(false);
      expect(revocation.userId).toBe("user-1");
      expect(revocation.purpose).toBe("benefit-matching");
    });

    it("makes hasConsent() return false immediately after revocation", () => {
      cm.grantConsent("user-1", "benefit-matching");
      expect(cm.hasConsent("user-1", "benefit-matching")).toBe(true);
      cm.revokeConsent("user-1", "benefit-matching");
      expect(cm.hasConsent("user-1", "benefit-matching")).toBe(false);
    });

    it("revoking a purpose that was never granted still returns false", () => {
      // revokeConsent should not throw even if no prior grant exists
      expect(() => cm.revokeConsent("user-1", "never-granted")).not.toThrow();
      expect(cm.hasConsent("user-1", "never-granted")).toBe(false);
    });

    it("does not affect consents for other purposes", () => {
      cm.grantConsent("user-1", "benefit-matching");
      cm.grantConsent("user-1", "document-storage");
      cm.revokeConsent("user-1", "benefit-matching");
      expect(cm.hasConsent("user-1", "benefit-matching")).toBe(false);
      expect(cm.hasConsent("user-1", "document-storage")).toBe(true);
    });

    it("a re-grant after revocation restores consent", () => {
      cm.grantConsent("user-1", "benefit-matching");
      cm.revokeConsent("user-1", "benefit-matching");
      cm.grantConsent("user-1", "benefit-matching");
      expect(cm.hasConsent("user-1", "benefit-matching")).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // isExpired / expiry semantics
  // -------------------------------------------------------------------------

  describe("isExpired()", () => {
    it("returns false for a record without expiresAt", () => {
      const record = cm.grantConsent("user-1", "benefit-matching");
      expect(cm.isExpired(record)).toBe(false);
    });

    it("returns false for a record with a future expiresAt", () => {
      const record = cm.grantConsent("user-1", "benefit-matching", Date.now() + 60_000);
      expect(cm.isExpired(record)).toBe(false);
    });

    it("returns true for a record with a past expiresAt", () => {
      const record = cm.grantConsent("user-1", "benefit-matching", Date.now() - 1);
      expect(cm.isExpired(record)).toBe(true);
    });
  });

  describe("hasConsent() with expiry", () => {
    it("returns false when the consent has expired", () => {
      vi.useFakeTimers();
      const now = Date.now();
      // Grant consent that expires in 100ms
      cm.grantConsent("user-1", "benefit-matching", now + 100);
      expect(cm.hasConsent("user-1", "benefit-matching")).toBe(true);
      // Advance time past expiry
      vi.setSystemTime(now + 200);
      expect(cm.hasConsent("user-1", "benefit-matching")).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // hasConsent — deny by default
  // -------------------------------------------------------------------------

  describe("hasConsent() — deny by default", () => {
    it("returns false when no record exists", () => {
      expect(cm.hasConsent("unknown-user", "any-purpose")).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // requireConsent
  // -------------------------------------------------------------------------

  describe("requireConsent()", () => {
    it("does not throw when active consent exists", () => {
      cm.grantConsent("user-1", "benefit-matching");
      expect(() => cm.requireConsent("user-1", "benefit-matching")).not.toThrow();
    });

    it("throws ConsentRequiredError when no record exists", () => {
      expect(() => cm.requireConsent("user-1", "benefit-matching")).toThrow(ConsentRequiredError);
    });

    it("throws when consent was revoked", () => {
      cm.grantConsent("user-1", "benefit-matching");
      cm.revokeConsent("user-1", "benefit-matching");
      expect(() => cm.requireConsent("user-1", "benefit-matching")).toThrow(ConsentRequiredError);
    });

    it("throws when consent has expired", () => {
      cm.grantConsent("user-1", "benefit-matching", Date.now() - 1);
      expect(() => cm.requireConsent("user-1", "benefit-matching")).toThrow(ConsentRequiredError);
    });

    it("error message contains userId and purpose", () => {
      try {
        cm.requireConsent("alice", "data-export");
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ConsentRequiredError);
        const msg = (err as ConsentRequiredError).message;
        expect(msg).toContain("alice");
        expect(msg).toContain("data-export");
      }
    });
  });

  // -------------------------------------------------------------------------
  // getConsents
  // -------------------------------------------------------------------------

  describe("getConsents()", () => {
    it("returns empty array for a user with no records", () => {
      expect(cm.getConsents("unknown")).toEqual([]);
    });

    it("returns all records for a user across multiple purposes", () => {
      cm.grantConsent("user-1", "benefit-matching");
      cm.grantConsent("user-1", "document-storage");
      cm.grantConsent("user-2", "benefit-matching"); // different user — excluded
      const records = cm.getConsents("user-1");
      expect(records).toHaveLength(2);
      expect(records.every((r) => r.userId === "user-1")).toBe(true);
    });

    it("includes revoked records (for audit completeness)", () => {
      cm.grantConsent("user-1", "benefit-matching");
      cm.revokeConsent("user-1", "benefit-matching");
      // The store holds the latest record per (user, purpose).
      // After revocation, the record has granted: false.
      const records = cm.getConsents("user-1");
      expect(records).toHaveLength(1);
      expect(records[0]?.granted).toBe(false);
    });
  });
});
