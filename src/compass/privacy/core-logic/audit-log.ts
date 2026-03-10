/**
 * COMPASS Privacy Layer — Audit Log
 *
 * Provides tamper-evident, immutable logging of every data access and
 * mutation across the COMPASS platform.
 *
 * SECURITY PRINCIPLES:
 *
 * 1. Immutability: entries are appended only. There is no update or delete
 *    method. In a persistent implementation, back this with an append-only
 *    table (e.g. a D1 table with no UPDATE/DELETE grants on the service role).
 *
 * 2. OWASP A09 (Security Logging and Monitoring Failures): every CREATE, READ,
 *    UPDATE, DELETE, EXPORT, and consent change MUST produce an entry. The
 *    audit log is the forensic record. Missing entries are a security failure.
 *
 * 3. No raw PII in metadata: the metadata field must contain opaque identifiers,
 *    hashes, or non-sensitive context only. Never log full documents, passwords,
 *    encryption keys, or un-masked financial data.
 *
 * 4. GDPR Art. 30 (Records of Processing Activities): exportAudit() produces
 *    the complete processing record for a data subject, as required by GDPR
 *    and necessary for responding to a Data Subject Access Request (DSAR).
 *
 * 5. ID generation: uses crypto.randomUUID() when available, falling back to
 *    a timestamp+random string. In production, use UUID v4 from a CSPRNG.
 */

import { AuditAction } from "../types.js";
import type { AuditEntry } from "../types.js";

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

function generateId(): string {
  const c = (globalThis as Record<string, unknown>)["crypto"] as
    | { randomUUID?: () => string }
    | undefined;
  if (typeof c?.randomUUID === "function") {
    return c.randomUUID();
  }
  // Fallback: timestamp + random hex. Not guaranteed unique under extreme
  // concurrency — prefer crypto.randomUUID() in all production runtimes.
  const rand = Math.random().toString(16).slice(2).padEnd(12, "0");
  return `${Date.now().toString(16)}-${rand}`;
}

// ---------------------------------------------------------------------------
// AuditLog
// ---------------------------------------------------------------------------

export class AuditLog {
  /**
   * In-memory append-only log.
   *
   * Production implementations should persist entries to a durable,
   * append-only store. Never allow entries to be mutated or deleted
   * (except under a court order with a corresponding meta-entry).
   */
  private readonly entries: AuditEntry[] = [];

  // --------------------------------------------------------------------------
  // Write
  // --------------------------------------------------------------------------

  /**
   * Append a new audit entry.
   *
   * The caller supplies everything except id and timestamp, which are
   * generated here to prevent tampering.
   *
   * @param entry  Partial entry — id and timestamp are set by the log itself.
   *
   * @returns The completed AuditEntry including generated id and timestamp.
   */
  log(entry: Omit<AuditEntry, "id" | "timestamp">): AuditEntry {
    const complete: AuditEntry = {
      ...entry,
      id: generateId(),
      timestamp: Date.now(),
    };
    this.entries.push(complete);
    return complete;
  }

  // --------------------------------------------------------------------------
  // Read — scoped queries
  // --------------------------------------------------------------------------

  /**
   * Retrieve all audit entries for a given user.
   *
   * Used for: GDPR Art. 15 data-subject access requests, investigating
   * anomalous access patterns for a specific user, and deletion verification.
   *
   * Returns entries in ascending chronological order.
   */
  getByUser(userId: string): AuditEntry[] {
    return this.entries
      .filter((e) => e.userId === userId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Retrieve all audit entries for a specific resource.
   *
   * @param resourceType  e.g. "document", "benefit-application", "profile"
   * @param resourceId    The resource's opaque identifier.
   *
   * Used for: investigating who has accessed or modified a particular record,
   * producing an access history for a specific document or application.
   */
  getByResource(resourceType: string, resourceId: string): AuditEntry[] {
    return this.entries
      .filter((e) => e.resourceType === resourceType && e.resourceId === resourceId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Retrieve all audit entries of a given action type.
   *
   * Used for: monitoring the rate of EXPORT operations (a spike may indicate
   * a data breach), reviewing all DELETION_REQUESTED events for compliance
   * reporting, and alerting on unexpected CREATE events.
   */
  getByAction(action: AuditAction): AuditEntry[] {
    return this.entries
      .filter((e) => e.action === action)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  // --------------------------------------------------------------------------
  // Export
  // --------------------------------------------------------------------------

  /**
   * Export the complete audit trail for a user.
   *
   * This is the response payload for a GDPR Art. 15 Data Subject Access
   * Request (DSAR) — the data subject has a right to know what processing
   * has been performed on their data, by whom, and when.
   *
   * The returned object includes:
   * - userId: the subject of the export
   * - exportedAt: ISO 8601 timestamp of the export itself
   * - totalEntries: count of entries for integrity verification
   * - entries: full chronological list of audit entries
   *
   * SECURITY NOTE: this method itself should trigger an AuditEntry with
   * action=EXPORT. Call log({ action: AuditAction.EXPORT, ... }) before
   * returning the result to the caller.
   */
  exportAudit(userId: string): {
    userId: string;
    exportedAt: string;
    totalEntries: number;
    entries: AuditEntry[];
  } {
    const userEntries = this.getByUser(userId);

    // Record the export itself so there is an audit trail of who requested it.
    // We do this before building the return value so the export entry is
    // included in totalEntries.
    const exportEntry = this.log({
      action: AuditAction.EXPORT,
      userId,
      resourceType: "audit-log",
      resourceId: userId,
      metadata: {
        reason: "GDPR Art. 15 Data Subject Access Request",
        entryCountAtExportTime: userEntries.length,
      },
    });

    const allEntries = [...userEntries, exportEntry].sort((a, b) => a.timestamp - b.timestamp);

    return {
      userId,
      exportedAt: new Date(exportEntry.timestamp).toISOString(),
      totalEntries: allEntries.length,
      entries: allEntries,
    };
  }

  // --------------------------------------------------------------------------
  // Internal helpers (for testing only)
  // --------------------------------------------------------------------------

  /** Returns total entry count. Exposed for test assertions only. */
  get size(): number {
    return this.entries.length;
  }
}
