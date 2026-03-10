/**
 * COMPASS Privacy Layer — Core Types
 *
 * This module defines the data structures used throughout the privacy layer.
 * All fields are typed strictly; no `any` is used anywhere in this package.
 *
 * SECURITY NOTE: These types represent data about real people in vulnerable
 * situations. Never log raw values of these types. Always use AuditEntry
 * to record access, and ConsentRecord to verify permission before reading.
 */

// ---------------------------------------------------------------------------
// Encryption
// ---------------------------------------------------------------------------

/**
 * The result of encrypting a plaintext value.
 *
 * - ciphertext: base64url-encoded encrypted bytes
 * - iv: base64url-encoded initialisation vector (unique per encryption call)
 * - algorithm: identifies the algorithm so decryption can validate it matches
 * - keyId: references which key was used; required for key-rotation workflows
 *
 * OWASP A02 – Cryptographic Failures: storing iv and keyId alongside
 * ciphertext is correct — they are not secret; the key itself must remain
 * outside this record.
 */
export interface EncryptedPayload {
  readonly ciphertext: string;
  readonly iv: string;
  readonly algorithm: string;
  readonly keyId: string;
}

// ---------------------------------------------------------------------------
// Consent
// ---------------------------------------------------------------------------

/**
 * A single consent decision made by a user for a specific data-use purpose.
 *
 * GDPR Art. 7 requires that consent be: freely given, specific, informed,
 * unambiguous, and withdrawable at any time. This record supports all five
 * requirements.
 *
 * - purpose: must be a specific, named use-case string (not a generic label)
 * - expiresAt: if absent, consent is indefinite but still revocable
 */
export interface ConsentRecord {
  readonly userId: string;
  readonly purpose: string;
  readonly granted: boolean;
  readonly timestamp: number; // Unix epoch ms — when this decision was made
  readonly expiresAt?: number; // Unix epoch ms — optional expiry
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

/**
 * Enumeration of every action type that must be recorded in the audit log.
 *
 * OWASP A09 – Security Logging and Monitoring Failures: every data access,
 * mutation, export, or consent change must produce an AuditEntry.
 *
 * GDPR Art. 30 requires records of processing activities; this enum covers
 * the lifecycle of a data subject's information.
 */
export enum AuditAction {
  CREATE = "CREATE",
  READ = "READ",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  EXPORT = "EXPORT",
  CONSENT_GRANTED = "CONSENT_GRANTED",
  CONSENT_REVOKED = "CONSENT_REVOKED",
  DELETION_REQUESTED = "DELETION_REQUESTED",
  DELETION_COMPLETED = "DELETION_COMPLETED",
}

/**
 * A single immutable audit record.
 *
 * - id: opaque identifier, never reused
 * - metadata: caller-supplied context (e.g. IP address hash, request-id).
 *   NEVER store raw PII in metadata; store hashes or opaque identifiers only.
 */
export interface AuditEntry {
  readonly id: string;
  readonly timestamp: number; // Unix epoch ms
  readonly action: AuditAction;
  readonly userId: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Data Categories
// ---------------------------------------------------------------------------

/**
 * Classification of the kind of data being stored or processed.
 *
 * Used by RetentionPolicy to apply different retention rules per category.
 * IMMIGRATION and LEGAL data carry the highest risk of harm if mishandled
 * and must have the most restrictive retention settings.
 */
export enum DataCategory {
  IDENTITY = "IDENTITY",
  FINANCIAL = "FINANCIAL",
  HEALTH = "HEALTH",
  LEGAL = "LEGAL",
  IMMIGRATION = "IMMIGRATION",
  EMPLOYMENT = "EMPLOYMENT",
  FAMILY = "FAMILY",
}

/**
 * Specifies how long data in a given category may be kept, and whether
 * the user must have given explicit consent before it can be stored at all.
 *
 * GDPR Art. 5(1)(e) – storage limitation: data must not be kept longer than
 * necessary. This record makes that obligation machine-enforceable.
 */
export interface RetentionPolicy {
  readonly category: DataCategory;
  /** Maximum number of days the data may be retained. */
  readonly maxRetentionDays: number;
  /**
   * When true, the system must verify an active ConsentRecord for this
   * category before storing or processing the data. This is required for
   * GDPR Art. 9 special-category data (health, immigration, legal).
   */
  readonly requiresExplicitConsent: boolean;
}

// ---------------------------------------------------------------------------
// Data Deletion
// ---------------------------------------------------------------------------

/** Lifecycle states of a deletion request (GDPR Art. 17 — right to erasure). */
export type DeletionStatus = "pending" | "processing" | "completed" | "verified";

/**
 * Tracks a user's right-to-erasure request end-to-end.
 *
 * - completedAt: set when all data stores confirm deletion
 * - status 'verified': an independent verification pass has confirmed that
 *   no data remains for this user in any registered data store
 */
export interface DeletionRequest {
  readonly id: string;
  readonly userId: string;
  readonly requestedAt: number; // Unix epoch ms
  readonly completedAt?: number; // Unix epoch ms
  readonly status: DeletionStatus;
}
