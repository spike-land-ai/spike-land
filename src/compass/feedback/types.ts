/**
 * COMPASS Feedback & Analytics — Shared Types
 *
 * All identifiers are process/program level only. No personally identifying
 * information is stored or transmitted. Individual outcomes are aggregated and
 * noise-injected before any systemic reporting.
 */

/** Result of a single navigation session for a given process. */
export type OutcomeResult = "approved" | "denied" | "pending" | "abandoned" | "error";

/**
 * An anonymized record of one user's journey through a government process.
 * The `id` field is a random UUID generated client-side at session start —
 * it carries no linkage to user identity.
 */
export interface NavigationOutcome {
  /** Random UUID — no user linkage. */
  id: string;
  /** Identifier of the multi-step process (e.g. "housing-benefit-uk"). */
  processId: string;
  /** ISO 3166-1 alpha-2 jurisdiction code (e.g. "GB", "US-CA"). */
  jurisdiction: string;
  /** Specific programme within the process (optional). */
  programId: string;
  /** Terminal result of this navigation session. */
  result: OutcomeResult;
  /** Total wall-clock duration of the session in milliseconds. */
  duration: number;
  /** Number of steps the user completed before the session ended. */
  stepsCompleted: number;
  /** Total number of steps in the process at time of navigation. */
  totalSteps: number;
  /**
   * Step IDs where the user exhibited confusion signals (re-reads, back
   * navigation, help triggers, long dwell, etc.).
   */
  confusionPoints: string[];
  /** Unix timestamp (ms) when the session concluded. */
  timestamp: number;
}

/**
 * A noise-injected aggregate metric suitable for external reporting.
 * Never derived from fewer than the DP minimum cohort size.
 */
export interface AggregateMetric {
  metricName: string;
  jurisdiction: string;
  programId?: string;
  /** Privatized value after Laplace/Gaussian noise injection. */
  value: number;
  /** True sample count before DP noise — never published externally. */
  sampleSize: number;
  period: {
    start: number;
    end: number;
  };
  /** Whether differential-privacy noise has been applied to `value`. */
  noiseAdded: boolean;
}

/**
 * A step within a process that repeatedly confuses navigators.
 * Frequency is an aggregated count — never a reference to an individual.
 */
export interface ConfusionPoint {
  processId: string;
  stepId: string;
  /** Number of distinct sessions that flagged this step as confusing. */
  frequency: number;
  /** Human-readable description surfaced to systemic intelligence. */
  description: string;
}

/**
 * A step or transition that creates disproportionate delays or drop-offs.
 */
export interface Bottleneck {
  processId: string;
  stepId: string;
  /** Rolling average calendar days a session spends at this step. */
  avgWaitDays: number;
  /** Fraction of sessions that abandon at this step (0–1). */
  dropoffRate: number;
}

/**
 * Jurisdiction-level systemic report for a given calendar period.
 * All values are DP-privatized before leaving the analytics layer.
 */
export interface SystemicReport {
  jurisdiction: string;
  period: {
    start: number;
    end: number;
  };
  /** Fraction of completed sessions resulting in "approved" (0–1). */
  approvalRate: number;
  /** Mean end-to-end processing time across approved sessions (ms). */
  avgProcessingTime: number;
  topConfusionPoints: ConfusionPoint[];
  bottlenecks: Bottleneck[];
  /** Actionable recommendations derived from detected patterns. */
  recommendations: string[];
}

/**
 * Configuration for the (ε, δ)-differential-privacy noise mechanism.
 *
 * Recommended starting values:
 *   epsilon   = 1.0   (strong privacy; lower is stronger)
 *   delta     = 1e-5  (probability of ε-guarantee failure)
 *   sensitivity = 1.0 (L1 sensitivity of the query function)
 */
export interface DPConfig {
  /** Privacy budget parameter ε. Smaller = more private. */
  epsilon: number;
  /** Failure probability δ for Gaussian mechanism. */
  delta: number;
  /**
   * Global L1/L2 sensitivity of the aggregate queries being protected.
   * For count queries this is typically 1.
   */
  sensitivity: number;
}
