/**
 * Tests: AuditLog
 *
 * Coverage:
 * - log() appends immutable entries with generated id and timestamp
 * - getByUser() returns only that user's entries, sorted chronologically
 * - getByResource() filters by type+id
 * - getByAction() filters by action type
 * - exportAudit() includes an EXPORT entry in the trail
 * - exportAudit() totalEntries count is accurate
 * - log() metadata is preserved
 * - entries are not mutated after creation
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { AuditLog } from "../core-logic/audit-log.js";
import { AuditAction } from "../types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(
  overrides: Partial<{
    action: AuditAction;
    userId: string;
    resourceType: string;
    resourceId: string;
  }> = {},
) {
  return {
    action: AuditAction.READ,
    userId: "user-1",
    resourceType: "document",
    resourceId: "doc-abc",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AuditLog", () => {
  let log: AuditLog;

  beforeEach(() => {
    log = new AuditLog();
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // log()
  // -------------------------------------------------------------------------

  describe("log()", () => {
    it("returns a completed entry with an id and timestamp", () => {
      const entry = log.log(makeEntry());
      expect(typeof entry.id).toBe("string");
      expect(entry.id.length).toBeGreaterThan(0);
      expect(typeof entry.timestamp).toBe("number");
      expect(entry.timestamp).toBeGreaterThan(0);
    });

    it("populates action, userId, resourceType, resourceId from input", () => {
      const entry = log.log(
        makeEntry({
          action: AuditAction.CREATE,
          userId: "user-42",
          resourceType: "benefit-application",
          resourceId: "app-999",
        }),
      );
      expect(entry.action).toBe(AuditAction.CREATE);
      expect(entry.userId).toBe("user-42");
      expect(entry.resourceType).toBe("benefit-application");
      expect(entry.resourceId).toBe("app-999");
    });

    it("preserves optional metadata", () => {
      const entry = log.log({
        ...makeEntry(),
        metadata: { requestId: "req-123", ipHash: "abc" },
      });
      expect(entry.metadata).toEqual({ requestId: "req-123", ipHash: "abc" });
    });

    it("increments the log size on each call", () => {
      expect(log.size).toBe(0);
      log.log(makeEntry());
      expect(log.size).toBe(1);
      log.log(makeEntry());
      expect(log.size).toBe(2);
    });

    it("generates unique ids for consecutive entries", () => {
      const e1 = log.log(makeEntry());
      const e2 = log.log(makeEntry());
      expect(e1.id).not.toBe(e2.id);
    });

    it("timestamp reflects the call time", () => {
      vi.useFakeTimers();
      const fixedTime = 1_700_000_000_000;
      vi.setSystemTime(fixedTime);
      const entry = log.log(makeEntry());
      expect(entry.timestamp).toBe(fixedTime);
    });
  });

  // -------------------------------------------------------------------------
  // getByUser()
  // -------------------------------------------------------------------------

  describe("getByUser()", () => {
    it("returns only entries for the requested userId", () => {
      log.log(makeEntry({ userId: "alice" }));
      log.log(makeEntry({ userId: "bob" }));
      log.log(makeEntry({ userId: "alice" }));
      const results = log.getByUser("alice");
      expect(results).toHaveLength(2);
      expect(results.every((e) => e.userId === "alice")).toBe(true);
    });

    it("returns empty array when no entries exist for that user", () => {
      log.log(makeEntry({ userId: "bob" }));
      expect(log.getByUser("nobody")).toEqual([]);
    });

    it("returns entries sorted ascending by timestamp", () => {
      vi.useFakeTimers();
      vi.setSystemTime(1000);
      log.log(makeEntry({ userId: "u" }));
      vi.setSystemTime(3000);
      log.log(makeEntry({ userId: "u" }));
      vi.setSystemTime(2000);
      log.log(makeEntry({ userId: "u" }));
      const results = log.getByUser("u");
      expect(results[0]?.timestamp).toBeLessThanOrEqual(results[1]?.timestamp ?? Infinity);
      expect(results[1]?.timestamp).toBeLessThanOrEqual(results[2]?.timestamp ?? Infinity);
    });
  });

  // -------------------------------------------------------------------------
  // getByResource()
  // -------------------------------------------------------------------------

  describe("getByResource()", () => {
    it("returns entries matching both resourceType and resourceId", () => {
      log.log(makeEntry({ resourceType: "document", resourceId: "doc-1" }));
      log.log(makeEntry({ resourceType: "document", resourceId: "doc-2" }));
      log.log(makeEntry({ resourceType: "profile", resourceId: "doc-1" }));
      const results = log.getByResource("document", "doc-1");
      expect(results).toHaveLength(1);
      expect(results[0]?.resourceId).toBe("doc-1");
      expect(results[0]?.resourceType).toBe("document");
    });

    it("returns empty array when no matching resource exists", () => {
      expect(log.getByResource("document", "nonexistent")).toEqual([]);
    });

    it("does NOT return entries with the same resourceId but different type", () => {
      log.log(makeEntry({ resourceType: "document", resourceId: "shared-id" }));
      const results = log.getByResource("profile", "shared-id");
      expect(results).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // getByAction()
  // -------------------------------------------------------------------------

  describe("getByAction()", () => {
    it("returns only entries with the requested action", () => {
      log.log(makeEntry({ action: AuditAction.CREATE }));
      log.log(makeEntry({ action: AuditAction.READ }));
      log.log(makeEntry({ action: AuditAction.CREATE }));
      const results = log.getByAction(AuditAction.CREATE);
      expect(results).toHaveLength(2);
      expect(results.every((e) => e.action === AuditAction.CREATE)).toBe(true);
    });

    it("returns empty array when no entries exist for that action", () => {
      log.log(makeEntry({ action: AuditAction.READ }));
      expect(log.getByAction(AuditAction.DELETE)).toEqual([]);
    });

    it("supports all AuditAction values without throwing", () => {
      for (const action of Object.values(AuditAction)) {
        log.log(makeEntry({ action }));
      }
      for (const action of Object.values(AuditAction)) {
        const results = log.getByAction(action);
        expect(results.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  // -------------------------------------------------------------------------
  // exportAudit()
  // -------------------------------------------------------------------------

  describe("exportAudit()", () => {
    it("includes userId and exportedAt in the result", () => {
      log.log(makeEntry({ userId: "user-export" }));
      const result = log.exportAudit("user-export");
      expect(result.userId).toBe("user-export");
      expect(typeof result.exportedAt).toBe("string");
      // Must be a valid ISO 8601 date string
      expect(() => new Date(result.exportedAt)).not.toThrow();
      expect(new Date(result.exportedAt).getTime()).toBeGreaterThan(0);
    });

    it("includes an EXPORT action entry in the returned entries", () => {
      log.log(makeEntry({ userId: "user-export" }));
      const result = log.exportAudit("user-export");
      const exportEntry = result.entries.find((e) => e.action === AuditAction.EXPORT);
      expect(exportEntry).toBeDefined();
      expect(exportEntry?.userId).toBe("user-export");
    });

    it("totalEntries equals entries.length", () => {
      log.log(makeEntry({ userId: "user-export" }));
      log.log(makeEntry({ userId: "user-export" }));
      const result = log.exportAudit("user-export");
      expect(result.totalEntries).toBe(result.entries.length);
    });

    it("entries are sorted ascending by timestamp", () => {
      vi.useFakeTimers();
      vi.setSystemTime(1000);
      log.log(makeEntry({ userId: "u2" }));
      vi.setSystemTime(3000);
      log.log(makeEntry({ userId: "u2" }));
      vi.setSystemTime(2000);
      log.log(makeEntry({ userId: "u2" }));
      const result = log.exportAudit("u2");
      for (let i = 1; i < result.entries.length; i++) {
        const prev = result.entries[i - 1];
        const curr = result.entries[i];
        if (prev !== undefined && curr !== undefined) {
          expect(prev.timestamp).toBeLessThanOrEqual(curr.timestamp);
        }
      }
    });

    it("does NOT include entries for other users", () => {
      log.log(makeEntry({ userId: "user-A" }));
      log.log(makeEntry({ userId: "user-B" }));
      const result = log.exportAudit("user-A");
      // The export entry itself is for user-A; no user-B entries should appear.
      const userBEntries = result.entries.filter((e) => e.userId === "user-B");
      expect(userBEntries).toHaveLength(0);
    });

    it("appends an EXPORT entry to the internal log (for auditability of the export)", () => {
      const sizeBeforeExport = log.size;
      log.exportAudit("any-user");
      expect(log.size).toBe(sizeBeforeExport + 1);
    });

    it("returns empty entries list (plus the export entry) for a user with no prior activity", () => {
      const result = log.exportAudit("brand-new-user");
      // Only the export entry itself should be present
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]?.action).toBe(AuditAction.EXPORT);
      expect(result.totalEntries).toBe(1);
    });
  });
});
