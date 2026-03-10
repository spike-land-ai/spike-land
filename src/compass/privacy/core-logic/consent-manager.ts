/**
 * COMPASS Privacy Layer — Consent Manager
 *
 * Implements GDPR Art. 6 (lawful basis) and Art. 7 (conditions for consent).
 *
 * SECURITY PRINCIPLES:
 *
 * 1. Deny by default: hasConsent() returns false unless a valid, non-expired,
 *    non-revoked consent record exists. There is no "implicit" consent.
 *
 * 2. Specific purposes: consent is tracked per (userId, purpose) pair. A
 *    user consenting to "benefit-matching" does NOT consent to "data-export".
 *
 * 3. Temporal validity: consents may carry an expiresAt timestamp. Expired
 *    consents are treated identically to revoked consents — denied.
 *
 * 4. Immutable history: revokeConsent() adds a new record (granted: false)
 *    rather than mutating or deleting the original record. This preserves the
 *    audit trail required by GDPR Art. 7(1) ("must be able to demonstrate
 *    that the data subject has consented").
 *
 * 5. requireConsent(): forces callers to check consent before accessing data,
 *    creating a hard boundary at the service layer (not just the UI layer).
 *
 * NOTE: This implementation uses an in-memory store. In production, back it
 * with a durable store (D1, Postgres, etc.) and wrap every write with an
 * AuditLog entry. The interface is the same regardless of backing store.
 */

import type { ConsentRecord } from "../types.js";

/** Error thrown when a required consent is absent or has expired/been revoked. */
export class ConsentRequiredError extends Error {
  constructor(userId: string, purpose: string, reason: string) {
    super(
      `Consent required for user "${userId}" and purpose "${purpose}": ${reason}. ` +
        "Obtain explicit consent before accessing this data.",
    );
    this.name = "ConsentRequiredError";
  }
}

export class ConsentManager {
  /**
   * In-memory consent store.
   *
   * Key: `${userId}::${purpose}`
   * Value: the most-recent ConsentRecord for that (userId, purpose) pair.
   *
   * Only the latest record per pair is kept here for O(1) lookup.
   * Full history (for audit) must be maintained by the AuditLog, not here.
   */
  private readonly store = new Map<string, ConsentRecord>();

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  private static key(userId: string, purpose: string): string {
    // Delimiter is "::" — chosen to be unlikely in either field.
    return `${userId}::${purpose}`;
  }

  /**
   * Returns true if the consent record is past its expiry date.
   * A record without expiresAt never expires (but can still be revoked).
   */
  isExpired(consent: ConsentRecord): boolean {
    if (consent.expiresAt === undefined) return false;
    return Date.now() > consent.expiresAt;
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  /**
   * Record that a user has granted consent for a specific purpose.
   *
   * @param userId     Opaque user identifier — must match the userId used
   *                   everywhere else in the system.
   * @param purpose    Specific, named purpose string — e.g. "benefit-matching",
   *                   "document-storage", "third-party-referral".
   * @param expiresAt  Optional Unix epoch ms. Use for time-limited consents
   *                   (e.g. consent for a specific session or short-lived task).
   *
   * @returns The created ConsentRecord, which should be passed to AuditLog.
   */
  grantConsent(userId: string, purpose: string, expiresAt?: number): ConsentRecord {
    const record: ConsentRecord = {
      userId,
      purpose,
      granted: true,
      timestamp: Date.now(),
      ...(expiresAt !== undefined ? { expiresAt } : {}),
    };
    this.store.set(ConsentManager.key(userId, purpose), record);
    return record;
  }

  /**
   * Record that a user has revoked consent for a specific purpose.
   *
   * GDPR Art. 7(3): withdrawal of consent must be as easy as giving it.
   * This method must be called — and its AuditEntry persisted — before
   * any further processing of the affected data ceases.
   *
   * After calling this method, hasConsent(userId, purpose) returns false.
   *
   * @returns The revocation ConsentRecord (granted: false), for audit logging.
   */
  revokeConsent(userId: string, purpose: string): ConsentRecord {
    const record: ConsentRecord = {
      userId,
      purpose,
      granted: false,
      timestamp: Date.now(),
    };
    // Overwrite the existing record so lookups immediately reflect revocation.
    this.store.set(ConsentManager.key(userId, purpose), record);
    return record;
  }

  /**
   * Check whether a user currently has active (granted, non-expired) consent
   * for a purpose.
   *
   * Deny-by-default: returns false if no record exists, if the most recent
   * record has granted: false, or if the record has expired.
   */
  hasConsent(userId: string, purpose: string): boolean {
    const record = this.store.get(ConsentManager.key(userId, purpose));
    if (record === undefined) return false;
    if (!record.granted) return false;
    if (this.isExpired(record)) return false;
    return true;
  }

  /**
   * Return all consent records for a user (both granted and revoked).
   * Useful for building a consent dashboard or satisfying a GDPR Art. 15
   * data-access request.
   */
  getConsents(userId: string): ConsentRecord[] {
    const results: ConsentRecord[] = [];
    for (const record of this.store.values()) {
      if (record.userId === userId) {
        results.push(record);
      }
    }
    return results;
  }

  /**
   * Assert that active consent exists for (userId, purpose).
   *
   * Use this as a guard at the start of any method that reads or processes
   * sensitive data — do not rely solely on hasConsent() being called by the
   * caller, as it is easy to forget. requireConsent() throws so the failure
   * cannot be silently swallowed.
   *
   * @throws ConsentRequiredError if consent is absent, revoked, or expired.
   */
  requireConsent(userId: string, purpose: string): void {
    const record = this.store.get(ConsentManager.key(userId, purpose));

    if (record === undefined) {
      throw new ConsentRequiredError(userId, purpose, "no consent record found");
    }
    if (!record.granted) {
      throw new ConsentRequiredError(userId, purpose, "consent was revoked");
    }
    if (this.isExpired(record)) {
      throw new ConsentRequiredError(
        userId,
        purpose,
        `consent expired at ${new Date(record.expiresAt as number).toISOString()}`,
      );
    }
  }
}
