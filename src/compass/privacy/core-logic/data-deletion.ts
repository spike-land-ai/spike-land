/**
 * COMPASS Privacy Layer — Data Deletion Service
 *
 * Implements the GDPR Art. 17 "right to erasure" (right to be forgotten).
 *
 * SECURITY PRINCIPLES:
 *
 * 1. Completeness: deletion must cover EVERY data store that holds the user's
 *    data. The DataStore interface is the contract for each store to self-report
 *    completion. Unknown stores are a compliance gap.
 *
 * 2. Verification: a separate verifyDeletion() pass re-checks each store after
 *    the deletion completes. Status transitions to "verified" only when all
 *    stores return false from verify(). A status of "completed" is NOT
 *    sufficient for compliance — "verified" is.
 *
 * 3. Retention obligations: some data must be kept despite a deletion request
 *    (e.g. legal hold, regulatory reporting). getRetentionPolicy() defines the
 *    maximum age. isRetentionExpired() lets callers check whether retained data
 *    has exceeded its permitted window and must now be purged regardless of
 *    any other flag.
 *
 * 4. Audit trail exception: audit log entries are NOT deleted when a user
 *    requests erasure. GDPR Recital 65 permits retention of audit records
 *    for legal claims. AuditLog entries must be anonymised (not deleted)
 *    using a separate anonymisation process.
 *
 * 5. Idempotency: requestDeletion() is idempotent for a given userId within
 *    a pending/processing cycle. A new request can be filed after a previous
 *    one is verified.
 *
 * DEFAULT RETENTION POLICIES follow GDPR and UK GDPR guidance:
 * - IMMIGRATION: 1 year (sensitive, high harm if retained)
 * - HEALTH: 3 years (UK NHS retention guidance for non-clinical records)
 * - LEGAL: 7 years (statute of limitations for most civil claims)
 * - FINANCIAL: 7 years (HMRC requirement)
 * - IDENTITY: 2 years inactive
 * - EMPLOYMENT: 2 years
 * - FAMILY: 2 years
 */

import { DataCategory } from "../types.js";
import type { DeletionRequest, DeletionStatus, RetentionPolicy } from "../types.js";

// ---------------------------------------------------------------------------
// DataStore contract
// ---------------------------------------------------------------------------

/**
 * Every database, cache, object store, or third-party integration that holds
 * COMPASS user data must implement this interface.
 *
 * - delete(): permanently erase all data for the given userId. Must be
 *   idempotent (calling delete on an already-deleted user must not throw).
 * - verify(): return true if ANY data for the userId still exists, false if
 *   the store is clean. Used by verifyDeletion() to confirm erasure.
 */
export interface DataStore {
  /** Human-readable name for logging and audit. */
  readonly name: string;
  delete(userId: string): Promise<void>;
  verify(userId: string): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// Default retention policies
// ---------------------------------------------------------------------------

const DEFAULT_RETENTION_POLICIES: ReadonlyMap<DataCategory, RetentionPolicy> = new Map([
  [
    DataCategory.IMMIGRATION,
    {
      category: DataCategory.IMMIGRATION,
      maxRetentionDays: 365,
      requiresExplicitConsent: true,
    },
  ],
  [
    DataCategory.HEALTH,
    {
      category: DataCategory.HEALTH,
      maxRetentionDays: 3 * 365,
      requiresExplicitConsent: true,
    },
  ],
  [
    DataCategory.LEGAL,
    {
      category: DataCategory.LEGAL,
      maxRetentionDays: 7 * 365,
      requiresExplicitConsent: true,
    },
  ],
  [
    DataCategory.FINANCIAL,
    {
      category: DataCategory.FINANCIAL,
      maxRetentionDays: 7 * 365,
      requiresExplicitConsent: false, // Required for tax/regulatory purposes
    },
  ],
  [
    DataCategory.IDENTITY,
    {
      category: DataCategory.IDENTITY,
      maxRetentionDays: 2 * 365,
      requiresExplicitConsent: false,
    },
  ],
  [
    DataCategory.EMPLOYMENT,
    {
      category: DataCategory.EMPLOYMENT,
      maxRetentionDays: 2 * 365,
      requiresExplicitConsent: false,
    },
  ],
  [
    DataCategory.FAMILY,
    {
      category: DataCategory.FAMILY,
      maxRetentionDays: 2 * 365,
      requiresExplicitConsent: false,
    },
  ],
]);

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// ID generation (mirrors audit-log.ts)
// ---------------------------------------------------------------------------

function generateId(): string {
  const c = (globalThis as Record<string, unknown>)["crypto"] as
    | { randomUUID?: () => string }
    | undefined;
  if (typeof c?.randomUUID === "function") {
    return c.randomUUID();
  }
  const rand = Math.random().toString(16).slice(2).padEnd(12, "0");
  return `${Date.now().toString(16)}-${rand}`;
}

// ---------------------------------------------------------------------------
// DeletionService
// ---------------------------------------------------------------------------

export class DeletionService {
  /**
   * In-memory request store.
   * Key: request id. In production, back this with a durable store with
   * row-level locking to prevent concurrent processing of the same request.
   */
  private readonly requests = new Map<string, DeletionRequest>();

  /**
   * Custom retention policies. Merged over the defaults so callers can
   * override individual categories without replacing the full set.
   */
  private readonly retentionPolicies: Map<DataCategory, RetentionPolicy>;

  constructor(customPolicies: Partial<Record<DataCategory, RetentionPolicy>> = {}) {
    this.retentionPolicies = new Map(DEFAULT_RETENTION_POLICIES);
    for (const [category, policy] of Object.entries(customPolicies) as Array<
      [DataCategory, RetentionPolicy]
    >) {
      this.retentionPolicies.set(category, policy);
    }
  }

  // --------------------------------------------------------------------------
  // Deletion lifecycle
  // --------------------------------------------------------------------------

  /**
   * Register a new deletion request for a user.
   *
   * If a pending or processing request already exists for this user, returns
   * the existing request rather than creating a duplicate. This prevents
   * parallel processing races.
   *
   * @returns A DeletionRequest with status "pending".
   */
  requestDeletion(userId: string): DeletionRequest {
    // Idempotency: return existing active request if one exists.
    for (const existing of this.requests.values()) {
      if (
        existing.userId === userId &&
        (existing.status === "pending" || existing.status === "processing")
      ) {
        return existing;
      }
    }

    const request: DeletionRequest = {
      id: generateId(),
      userId,
      requestedAt: Date.now(),
      status: "pending",
    };
    this.requests.set(request.id, request);
    return request;
  }

  /**
   * Execute deletion across all provided data stores for the request.
   *
   * Status transitions:
   *   pending → processing → completed
   *
   * Errors from individual stores are collected and re-thrown as an aggregate
   * error after all stores have been attempted, so a failure in one store
   * does not silently skip the remaining stores.
   *
   * @throws Error if the request is not found or is not in "pending" status.
   * @throws AggregateError if one or more data stores fail to delete.
   */
  async processDeletion(requestId: string, dataStores: DataStore[]): Promise<void> {
    const request = this.requests.get(requestId);
    if (request === undefined) {
      throw new Error(`Deletion request "${requestId}" not found.`);
    }
    if (request.status !== "pending") {
      throw new Error(
        `Deletion request "${requestId}" is in status "${request.status}". ` +
          `Only "pending" requests can be processed.`,
      );
    }

    // Transition to processing.
    this.setStatus(requestId, "processing");

    const errors: Error[] = [];

    // Attempt deletion in all stores. Do not short-circuit on failure.
    for (const store of dataStores) {
      try {
        await store.delete(request.userId);
      } catch (err) {
        errors.push(
          new Error(
            `Store "${store.name}" failed to delete user "${request.userId}": ` + String(err),
          ),
        );
      }
    }

    if (errors.length > 0) {
      // Do NOT transition to "completed" — leave in "processing" so a retry
      // can be scheduled. The caller must investigate before retrying.
      throw new AggregateError(
        errors,
        `${errors.length} data store(s) failed during deletion of request "${requestId}".`,
      );
    }

    // All stores succeeded.
    this.setStatus(requestId, "completed", Date.now());
  }

  /**
   * Verify that deletion has been completed across all provided data stores.
   *
   * Each store's verify() method is called. If ALL stores return false (no
   * remaining data), the request status advances to "verified" and this
   * method returns true.
   *
   * Returns false (without throwing) if any store still holds data, allowing
   * the caller to retry or alert.
   *
   * @throws Error if the request is not found or is not "completed".
   */
  async verifyDeletion(requestId: string, dataStores: DataStore[]): Promise<boolean> {
    const request = this.requests.get(requestId);
    if (request === undefined) {
      throw new Error(`Deletion request "${requestId}" not found.`);
    }
    if (request.status !== "completed") {
      throw new Error(
        `Deletion request "${requestId}" must be in "completed" status before verification. ` +
          `Current status: "${request.status}".`,
      );
    }

    const verifyResults = await Promise.all(
      dataStores.map((store) => store.verify(request.userId)),
    );

    // verify() returns true if data still exists; we want ALL to return false.
    const allClean = verifyResults.every((dataStillExists) => !dataStillExists);

    if (allClean) {
      this.setStatus(requestId, "verified");
    }

    return allClean;
  }

  // --------------------------------------------------------------------------
  // Retention policies
  // --------------------------------------------------------------------------

  /**
   * Return the retention policy for a given data category.
   * Always returns a policy — falls back to the most restrictive defaults.
   */
  getRetentionPolicy(category: DataCategory): RetentionPolicy {
    const policy = this.retentionPolicies.get(category);
    if (policy === undefined) {
      // Defensive fallback: treat unknown categories as requiring explicit
      // consent and apply a conservative 1-year window.
      return {
        category,
        maxRetentionDays: 365,
        requiresExplicitConsent: true,
      };
    }
    return policy;
  }

  /**
   * Returns true if data created at createdAt has exceeded the maximum
   * retention window for its category and must be deleted.
   *
   * @param category   The DataCategory of the record.
   * @param createdAt  Unix epoch ms when the record was created/last updated.
   */
  isRetentionExpired(category: DataCategory, createdAt: number): boolean {
    const policy = this.getRetentionPolicy(category);
    const maxAgeMs = policy.maxRetentionDays * MS_PER_DAY;
    return Date.now() - createdAt > maxAgeMs;
  }

  // --------------------------------------------------------------------------
  // Retrieval
  // --------------------------------------------------------------------------

  /** Retrieve a deletion request by id. Returns undefined if not found. */
  getRequest(requestId: string): DeletionRequest | undefined {
    return this.requests.get(requestId);
  }

  /** Retrieve all deletion requests for a user, newest first. */
  getRequestsByUser(userId: string): DeletionRequest[] {
    return Array.from(this.requests.values())
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.requestedAt - a.requestedAt);
  }

  // --------------------------------------------------------------------------
  // Internal helpers
  // --------------------------------------------------------------------------

  private setStatus(requestId: string, status: DeletionStatus, completedAt?: number): void {
    const existing = this.requests.get(requestId);
    if (existing === undefined) return;
    const updated: DeletionRequest = {
      ...existing,
      status,
      ...(completedAt !== undefined ? { completedAt } : {}),
    };
    this.requests.set(requestId, updated);
  }
}
