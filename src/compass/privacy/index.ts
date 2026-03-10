/**
 * COMPASS Privacy Layer — Public API
 *
 * Re-exports all public types, classes, and errors from the privacy package.
 *
 * USAGE:
 *
 *   import {
 *     EncryptionService,
 *     ConsentManager, ConsentRequiredError,
 *     AuditLog,
 *     DeletionService,
 *   } from "@compass/privacy";
 *
 *   import type {
 *     EncryptedPayload, ConsentRecord, AuditEntry, AuditAction,
 *     DataCategory, RetentionPolicy, DeletionRequest,
 *   } from "@compass/privacy";
 *
 * SECURITY NOTE: This package handles data about real people in extremely
 * vulnerable situations. All consumers must:
 *
 * 1. Check ConsentManager.requireConsent() before reading user data.
 * 2. Log every data access via AuditLog.log().
 * 3. Never store encryption keys in the same location as ciphertext.
 * 4. Honour DeletionRequest within the GDPR Art. 17 timeframe (1 month).
 */

// Types
export type {
  EncryptedPayload,
  ConsentRecord,
  AuditEntry,
  RetentionPolicy,
  DeletionRequest,
  DeletionStatus,
} from "./types.js";
export { AuditAction, DataCategory } from "./types.js";

// Encryption
export { EncryptionService } from "./core-logic/encryption.js";

// Consent
export { ConsentManager, ConsentRequiredError } from "./core-logic/consent-manager.js";

// Audit
export { AuditLog } from "./core-logic/audit-log.js";

// Deletion
export { DeletionService } from "./core-logic/data-deletion.js";
export type { DataStore } from "./core-logic/data-deletion.js";
