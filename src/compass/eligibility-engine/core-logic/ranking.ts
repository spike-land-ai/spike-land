/**
 * COMPASS Eligibility Engine — Impact Ranking
 *
 * Ranks a list of MatchResults by a composite impact score that weighs:
 *
 *   1. Benefit value   — higher estimated annual value is more impactful
 *   2. Ease of apply   — fewer application steps scores higher
 *   3. Deadline urgency — programs with imminent deadlines are surfaced first
 *
 * All scoring is normalised to [0, 1] per dimension, then combined using
 * configurable weights that sum to 1.0. The result is deterministic for any
 * fixed input — no random tiebreaking.
 *
 * Only eligible matches (matchResult.eligible === true) are ranked by this
 * function. Ineligible matches are excluded from the output unless
 * `options.includeIneligible` is set.
 */

import type { MatchResult, Program, RankedMatch } from "../types.js";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface RankingWeights {
  /** Weight applied to the normalised benefit-value dimension (0–1) */
  readonly benefitValue: number;
  /** Weight applied to the normalised ease-of-application dimension (0–1) */
  readonly applicationEase: number;
  /** Weight applied to the normalised deadline-urgency dimension (0–1) */
  readonly deadlineUrgency: number;
}

export interface RankingOptions {
  readonly weights?: RankingWeights;
  /** When true, ineligible matches are included (with lower scores) */
  readonly includeIneligible?: boolean;
  /**
   * Treat deadlines within this many days as urgent (default: 30).
   * Programs with daysUntilDeadline <= urgencyThresholdDays get max urgency.
   */
  readonly urgencyThresholdDays?: number;
}

const DEFAULT_WEIGHTS: RankingWeights = {
  benefitValue: 0.5,
  applicationEase: 0.2,
  deadlineUrgency: 0.3,
};

const DEFAULT_URGENCY_THRESHOLD_DAYS = 30;

// ---------------------------------------------------------------------------
// Normalisation helpers
// ---------------------------------------------------------------------------

/**
 * Given a list of values, return the min and max (both 0 when list is empty).
 */
function minMax(values: number[]): { min: number; max: number } {
  if (values.length === 0) return { min: 0, max: 0 };
  let min = values[0]!;
  let max = values[0]!;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { min, max };
}

/**
 * Min-max normalise a single value to [0, 1].
 * Returns `defaultWhenFlat` when min === max (avoids division by zero).
 */
function normalise(value: number, min: number, max: number, defaultWhenFlat = 0.5): number {
  if (max === min) return defaultWhenFlat;
  return (value - min) / (max - min);
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/**
 * Compute total estimated annual benefit value for a program (sum of all
 * monetary benefit estimates). Programs with no monetary estimates return 0.
 */
function totalBenefitCents(program: Program): number {
  return program.benefits.reduce((sum, b) => sum + (b.estimatedAnnualValueCents ?? 0), 0);
}

/**
 * Map daysUntilDeadline to a "urgency" score in [0, 1].
 * - No deadline (undefined) → 0 (no urgency, always available)
 * - daysUntilDeadline <= 0  → 1.0 (deadline today or past — show prominently)
 * - daysUntilDeadline > threshold → scaled from 0 up to just below threshold
 */
function deadlineUrgencyScore(program: Program, urgencyThresholdDays: number): number {
  if (program.daysUntilDeadline === undefined) return 0;
  const days = program.daysUntilDeadline;
  if (days <= 0) return 1;
  // Linear scale: closer deadline → higher urgency, capped at 1.0
  return Math.max(0, Math.min(1, 1 - days / urgencyThresholdDays));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Rank a set of MatchResults by composite impact score.
 *
 * @param matches   MatchResult[] from RulesEngine.findEligiblePrograms()
 * @param programs  The full program catalogue (used to retrieve metadata)
 * @param options   Optional scoring weights and inclusion flags
 * @returns Sorted RankedMatch[] — highest impact first
 */
export function rankByImpact(
  matches: readonly MatchResult[],
  programs: readonly Program[],
  options: RankingOptions = {},
): RankedMatch[] {
  const weights = validateWeights(options.weights ?? DEFAULT_WEIGHTS);
  const urgencyThreshold = options.urgencyThresholdDays ?? DEFAULT_URGENCY_THRESHOLD_DAYS;
  const includeIneligible = options.includeIneligible ?? false;

  // Build a fast lookup map from programId → Program
  const programById = new Map<string, Program>(programs.map((p) => [p.id, p]));

  // Filter matches
  const candidates = matches.filter((m) => {
    if (!m.eligible && !includeIneligible) return false;
    return programById.has(m.programId);
  });

  if (candidates.length === 0) return [];

  // Gather raw dimension values so we can normalise across the candidate set
  const benefitValues = candidates.map((m) => {
    const p = programById.get(m.programId)!;
    return totalBenefitCents(p);
  });

  // For application ease: invert step count so fewer steps = higher ease score
  // Programs without a step count get the median step count of the set.
  const stepCounts = candidates.map((m) => {
    const p = programById.get(m.programId)!;
    return p.applicationStepCount ?? undefined;
  });
  const knownSteps = stepCounts.filter((s): s is number => s !== undefined);
  const medianSteps =
    knownSteps.length > 0
      ? knownSteps.slice().sort((a, b) => a - b)[Math.floor(knownSteps.length / 2)]!
      : 5; // sensible default when no step data at all
  const effectiveSteps = stepCounts.map((s) => s ?? medianSteps);

  const urgencyValues = candidates.map((m) => {
    const p = programById.get(m.programId)!;
    return deadlineUrgencyScore(p, urgencyThreshold);
  });

  // Normalise each dimension
  const benefitRange = minMax(benefitValues);
  const stepRange = minMax(effectiveSteps);
  const urgencyRange = minMax(urgencyValues);

  const ranked: RankedMatch[] = candidates.map((match, idx) => {
    const normBenefit = normalise(benefitValues[idx]!, benefitRange.min, benefitRange.max);

    // Ease is INVERSE of step count: fewer steps → higher ease normalised score
    const rawSteps = effectiveSteps[idx]!;
    const normEaseRaw = normalise(rawSteps, stepRange.min, stepRange.max);
    // Flip so that the program with the fewest steps scores 1.0
    const normEase = 1 - normEaseRaw;

    const normUrgency = normalise(urgencyValues[idx]!, urgencyRange.min, urgencyRange.max);

    const impactScore =
      weights.benefitValue * normBenefit +
      weights.applicationEase * normEase +
      weights.deadlineUrgency * normUrgency;

    const program = programById.get(match.programId)!;
    return { matchResult: match, program, impactScore };
  });

  // Sort descending by impactScore. Stable: equal scores keep insertion order.
  return ranked.slice().sort((a, b) => {
    if (b.impactScore !== a.impactScore) return b.impactScore - a.impactScore;
    return 0;
  });
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateWeights(w: RankingWeights): RankingWeights {
  const sum = w.benefitValue + w.applicationEase + w.deadlineUrgency;
  const epsilon = 0.0001;
  if (Math.abs(sum - 1.0) > epsilon) {
    throw new RangeError(
      `RankingWeights must sum to 1.0, got: ${sum.toFixed(4)} ` +
        `(benefitValue=${w.benefitValue}, applicationEase=${w.applicationEase}, deadlineUrgency=${w.deadlineUrgency})`,
    );
  }
  for (const [k, v] of Object.entries(w) as [keyof RankingWeights, number][]) {
    if (v < 0 || v > 1) {
      throw new RangeError(`RankingWeights.${k} must be in [0, 1], got: ${v}`);
    }
  }
  return w;
}
