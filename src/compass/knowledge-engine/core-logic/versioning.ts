/**
 * COMPASS Knowledge Engine — Version Tracking & Confidence Decay
 *
 * Confidence decays using a half-life model: after `HALF_LIFE_DAYS` the score
 * is half of the verified value.  This mirrors radioactive decay and gives a
 * smooth, predictable degradation curve rather than a hard cutoff.
 *
 *   confidence(t) = baseScore × 2^(−t / halfLifeDays)
 *
 * where t = days since lastVerified.
 *
 * The base score at verification time is always 1.0 unless the verifier
 * provides an explicit override (e.g. 0.8 for partial confidence).
 */

import type { ConfidenceScore, EntityType, ISODateTime, StaleEntityRecord } from "../types.ts";

// ── Constants ───────────────────────────────────────────────────────────────

/** Days after which confidence halves.  Chosen to match ~quarterly review cadence. */
export const HALF_LIFE_DAYS = 90;

/** Minimum confidence score before we treat an entity as effectively unknown. */
export const CONFIDENCE_FLOOR = 0.05;

// ── Internal record ──────────────────────────────────────────────────────────

interface VerificationRecord {
  readonly entityId: string;
  readonly entityType: EntityType;
  readonly verifiedAt: ISODateTime;
  readonly verifiedBy: string;
  /** Score at time of verification; normally 1.0. */
  readonly baseScore: ConfidenceScore;
  /** Optional free-text note from the verifier. */
  readonly notes: string | null;
}

// ── VersionTracker ───────────────────────────────────────────────────────────

export class VersionTracker {
  /**
   * Stores the most recent verification record per entity.
   * We only care about the latest; historical audit trail belongs in a DB.
   */
  private readonly records = new Map<string, VerificationRecord>();

  /**
   * Overrideable clock, injected for deterministic testing.
   * Returns the current UTC timestamp as an ISODateTime string.
   */
  private readonly now: () => ISODateTime;

  constructor(now?: () => ISODateTime) {
    this.now = now ?? (() => new Date().toISOString());
  }

  // ── Write ──────────────────────────────────────────────────────────────────

  /**
   * Records that an entity has been verified now.
   * Resets the confidence decay clock.
   *
   * @param entityId    Unique id of the entity being verified.
   * @param entityType  Discriminant for stale-entity reporting.
   * @param verifierId  Identifier of the person or system performing the check.
   * @param baseScore   Verification confidence; defaults to 1.0 (fully verified).
   * @param notes       Optional note from the verifier.
   */
  markVerified(
    entityId: string,
    entityType: EntityType,
    verifierId: string,
    baseScore: ConfidenceScore = 1.0,
    notes: string | null = null,
  ): void {
    if (baseScore < 0 || baseScore > 1) {
      throw new RangeError(`baseScore must be in [0, 1]; received ${baseScore}`);
    }

    const record: VerificationRecord = {
      entityId,
      entityType,
      verifiedAt: this.now(),
      verifiedBy: verifierId,
      baseScore,
      notes,
    };
    this.records.set(entityId, record);
  }

  // ── Read ───────────────────────────────────────────────────────────────────

  /**
   * Computes the current decayed confidence score for an entity.
   *
   * Returns 0 if the entity has never been verified.
   * Returns at least CONFIDENCE_FLOOR as long as any record exists.
   */
  getConfidence(entityId: string): ConfidenceScore {
    const record = this.records.get(entityId);
    if (record === undefined) return 0;

    const elapsedDays = this.daysSince(record.verifiedAt);
    const decayed = record.baseScore * Math.pow(2, -elapsedDays / HALF_LIFE_DAYS);
    return Math.max(CONFIDENCE_FLOOR, decayed);
  }

  /**
   * Returns the raw verification record, if any.
   * Useful for displaying "last verified by X on Y" in the UI.
   */
  getRecord(entityId: string): Readonly<VerificationRecord> | undefined {
    return this.records.get(entityId);
  }

  /**
   * Returns all entities whose confidence has decayed below the threshold
   * implied by `thresholdDays` (i.e. entities not verified within that window).
   *
   * Results are sorted by days-since-verification descending (most stale first).
   */
  getStaleEntities(thresholdDays: number): readonly StaleEntityRecord[] {
    if (thresholdDays < 0) throw new RangeError("thresholdDays must be >= 0");

    const stale: StaleEntityRecord[] = [];

    for (const record of this.records.values()) {
      const days = this.daysSince(record.verifiedAt);
      if (days >= thresholdDays) {
        stale.push({
          entityId: record.entityId,
          entityType: record.entityType,
          lastVerified: record.verifiedAt,
          daysSinceVerification: Math.floor(days),
          currentConfidence: this.getConfidence(record.entityId),
        });
      }
    }

    stale.sort((a, b) => b.daysSinceVerification - a.daysSinceVerification);
    return stale;
  }

  /**
   * Returns all entities that have never been verified (no record at all).
   * These have an implicit confidence of 0.
   *
   * @param allEntityIds  Complete set of entity ids that should be tracked.
   */
  getUnverifiedEntities(allEntityIds: readonly string[]): readonly string[] {
    return allEntityIds.filter((id) => !this.records.has(id));
  }

  /**
   * Returns whether an entity's confidence is above the given threshold.
   * Convenience wrapper for eligibility checks.
   */
  isTrusted(entityId: string, minimumConfidence: ConfidenceScore = 0.5): boolean {
    return this.getConfidence(entityId) >= minimumConfidence;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private daysSince(isoTimestamp: ISODateTime): number {
    const thenMs = new Date(isoTimestamp).getTime();
    const nowMs = new Date(this.now()).getTime();
    const diffMs = nowMs - thenMs;
    return diffMs / (1000 * 60 * 60 * 24);
  }
}
