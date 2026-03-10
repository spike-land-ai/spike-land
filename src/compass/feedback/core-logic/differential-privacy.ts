/**
 * DifferentialPrivacy — (ε, δ)-DP noise mechanisms for aggregate metrics.
 *
 * Two mechanisms are implemented:
 *
 *   Laplace mechanism  — calibrated to (ε, 0)-DP.
 *     Noise scale b = sensitivity / epsilon.
 *     Use for count/sum queries where pure DP is acceptable.
 *
 *   Gaussian mechanism — calibrated to (ε, δ)-DP.
 *     Noise scale σ = sqrt(2 * ln(1.25/δ)) * sensitivity / epsilon.
 *     Use when a small failure probability δ is acceptable in exchange for
 *     lighter-tailed noise (better utility on large cohorts).
 *
 * Privacy budget tracking:
 *   Each call to addLaplaceNoise or addGaussianNoise consumes ε from the
 *   budget. isEpsilonBudgetExceeded reports when the composed budget crosses
 *   a configurable multiple of the per-query ε.
 *
 * References:
 *   Dwork & Roth (2014), "The Algorithmic Foundations of Differential Privacy"
 *   https://www.cis.upenn.edu/~aaroth/Papers/privacybook.pdf
 */

import type { AggregateMetric, DPConfig } from "../types.js";

/**
 * Minimum cohort size below which we refuse to privatize and surface a metric.
 * This acts as a k-anonymity floor on top of DP noise.
 */
const MIN_COHORT_SIZE = 10;

export class DifferentialPrivacy {
  readonly #config: DPConfig;
  #queryCount = 0;

  constructor(config: DPConfig) {
    if (config.epsilon <= 0) {
      throw new RangeError(`epsilon must be > 0, got ${config.epsilon}`);
    }
    if (config.delta < 0 || config.delta >= 1) {
      throw new RangeError(`delta must be in [0, 1), got ${config.delta}`);
    }
    if (config.sensitivity <= 0) {
      throw new RangeError(`sensitivity must be > 0, got ${config.sensitivity}`);
    }
    this.#config = { ...config };
  }

  // ---------------------------------------------------------------------------
  // Core noise mechanisms
  // ---------------------------------------------------------------------------

  /**
   * Add Laplace noise calibrated to (ε, 0)-DP.
   * b = sensitivity / epsilon
   *
   * Uses the inverse-CDF method so we need only a Uniform(0,1) sample:
   *   X ~ Lap(b)  ⟺  X = -b * sign(U - 0.5) * ln(1 - 2|U - 0.5|)
   */
  addLaplaceNoise(value: number): number {
    this.#queryCount++;
    const b = this.#config.sensitivity / this.#config.epsilon;
    const u = Math.random() - 0.5;
    const noise = -b * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
    return value + noise;
  }

  /**
   * Add Gaussian noise calibrated to (ε, δ)-DP.
   * σ = sqrt(2 * ln(1.25/δ)) * sensitivity / epsilon
   *
   * Uses the Box-Muller transform to produce N(0, σ²) samples from two
   * independent Uniform(0,1) draws.
   */
  addGaussianNoise(value: number): number {
    this.#queryCount++;
    const { epsilon, delta, sensitivity } = this.#config;
    const sigma = Math.sqrt(2 * Math.log(1.25 / delta)) * (sensitivity / epsilon);
    const noise = this.#boxMuller(sigma);
    return value + noise;
  }

  // ---------------------------------------------------------------------------
  // Batch privatization
  // ---------------------------------------------------------------------------

  /**
   * Apply Laplace noise to every metric in the array.
   *
   * Metrics with a sample size below MIN_COHORT_SIZE are suppressed (removed
   * from the output) to prevent differencing attacks on small populations.
   *
   * Each returned metric has noiseAdded set to true.
   */
  privatize(metrics: AggregateMetric[]): AggregateMetric[] {
    const result: AggregateMetric[] = [];

    for (const metric of metrics) {
      if (metric.sampleSize < MIN_COHORT_SIZE) {
        // Suppress rather than release: cohort too small.
        continue;
      }

      result.push({
        ...metric,
        value: this.addLaplaceNoise(metric.value),
        noiseAdded: true,
      });
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // Budget accounting (sequential composition)
  // ---------------------------------------------------------------------------

  /**
   * Check whether the accumulated per-query ε expenditure has exceeded the
   * configured budget.
   *
   * Under sequential composition, k queries each consuming ε gives a composed
   * privacy loss of k * ε. We flag when that crosses the budget multiplier
   * supplied as `queryCount` (treated as the allowed number of queries before
   * the budget is considered exhausted).
   *
   * @param maxQueries  Maximum number of ε-consuming queries allowed before
   *                    the budget is considered spent.
   */
  isEpsilonBudgetExceeded(maxQueries: number): boolean {
    return this.#queryCount > maxQueries;
  }

  /** Total number of noise-adding calls made since construction. */
  get queryCount(): number {
    return this.#queryCount;
  }

  /** Read-only view of the configuration. */
  get config(): Readonly<DPConfig> {
    return this.#config;
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Box-Muller transform — returns one N(0, sigma²) sample.
   * Discards the second variate to keep the API simple (no state leakage).
   */
  #boxMuller(sigma: number): number {
    // Guard against Math.random() returning exactly 0 (log(0) = -Infinity).
    let u1 = 0;
    while (u1 === 0) u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * sigma;
  }
}
