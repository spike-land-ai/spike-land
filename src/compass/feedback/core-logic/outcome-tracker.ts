/**
 * OutcomeTracker — in-memory store for anonymized NavigationOutcome records.
 *
 * Design principles:
 * - Append-only: outcomes are never mutated after recording.
 * - No personal data: the tracker operates only on process/program-level keys.
 * - All aggregation helpers return computed values, never raw outcome arrays
 *   that could be used for individual re-identification.
 */

import type { ConfusionPoint, NavigationOutcome } from "../types.js";

export interface OutcomeFilters {
  jurisdiction?: string;
  programId?: string;
  dateRange?: { start: number; end: number };
}

export class OutcomeTracker {
  readonly #outcomes: NavigationOutcome[] = [];

  /**
   * Record an anonymized navigation outcome.
   * The caller is responsible for ensuring the outcome contains no PII before
   * passing it here.
   */
  record(outcome: NavigationOutcome): void {
    this.#outcomes.push(outcome);
  }

  /**
   * Retrieve outcomes matching the supplied filters.
   * Returns a shallow copy so callers cannot mutate the internal store.
   */
  getOutcomes(filters: OutcomeFilters = {}): NavigationOutcome[] {
    return this.#outcomes.filter((o) => {
      if (filters.jurisdiction !== undefined && o.jurisdiction !== filters.jurisdiction) {
        return false;
      }
      if (filters.programId !== undefined && o.programId !== filters.programId) {
        return false;
      }
      if (filters.dateRange !== undefined) {
        if (o.timestamp < filters.dateRange.start || o.timestamp > filters.dateRange.end) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Compute the approval rate (fraction of "approved" results) for a given
   * programme and jurisdiction combination.
   *
   * Returns 0 when there are no matching outcomes to avoid division by zero.
   */
  getApprovalRate(programId: string, jurisdiction: string): number {
    const relevant = this.getOutcomes({ programId, jurisdiction });
    if (relevant.length === 0) return 0;

    const approved = relevant.filter((o) => o.result === "approved").length;
    return approved / relevant.length;
  }

  /**
   * Compute the mean session duration (ms) for all outcomes of a programme.
   * Returns 0 when no matching outcomes exist.
   */
  getAvgDuration(programId: string): number {
    const relevant = this.getOutcomes({ programId });
    if (relevant.length === 0) return 0;

    const total = relevant.reduce((sum, o) => sum + o.duration, 0);
    return total / relevant.length;
  }

  /**
   * Aggregate confusion signals across all sessions for a given process.
   * Results are sorted descending by frequency.
   *
   * Step descriptions are synthesised as "Step <stepId>" when no richer
   * description is available — a real implementation would join against the
   * process definition catalogue.
   */
  getConfusionPoints(processId: string): ConfusionPoint[] {
    const relevant = this.#outcomes.filter((o) => o.processId === processId);

    const frequencyMap = new Map<string, number>();
    for (const outcome of relevant) {
      for (const stepId of outcome.confusionPoints) {
        frequencyMap.set(stepId, (frequencyMap.get(stepId) ?? 0) + 1);
      }
    }

    const points: ConfusionPoint[] = [];
    for (const [stepId, frequency] of frequencyMap) {
      points.push({
        processId,
        stepId,
        frequency,
        description: `Step ${stepId} — confusion signal reported in ${frequency} session(s)`,
      });
    }

    return points.sort((a, b) => b.frequency - a.frequency);
  }

  /** Total number of recorded outcomes (for DP cohort-size gating). */
  get size(): number {
    return this.#outcomes.length;
  }
}
