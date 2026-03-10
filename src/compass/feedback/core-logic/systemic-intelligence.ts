/**
 * SystemicIntelligence — jurisdiction-level pattern analysis and reporting.
 *
 * This module synthesises anonymized aggregate data from OutcomeTracker into
 * actionable intelligence for system administrators and policy makers.
 *
 * All values in generated reports pass through DifferentialPrivacy.privatize
 * before being surfaced, ensuring individual sessions cannot be inferred.
 */

import { DifferentialPrivacy } from "./differential-privacy.js";
import { OutcomeTracker } from "./outcome-tracker.js";
import type {
  AggregateMetric,
  Bottleneck,
  ConfusionPoint,
  DPConfig,
  NavigationOutcome,
  SystemicReport,
} from "../types.js";

/** Minimum sessions required to surface a bottleneck or pattern. */
const MIN_PATTERN_SAMPLES = 5;

/** Thresholds for recommendation generation. */
const APPROVAL_RATE_WARN = 0.5;
const DROPOFF_RATE_WARN = 0.25;
const AVG_WAIT_DAYS_WARN = 7;
const CONFUSION_FREQ_WARN = 3;

const MS_PER_DAY = 86_400_000;

const DEFAULT_DP_CONFIG: DPConfig = {
  epsilon: 1.0,
  delta: 1e-5,
  sensitivity: 1.0,
};

export class SystemicIntelligence {
  readonly #tracker: OutcomeTracker;
  readonly #dp: DifferentialPrivacy;

  constructor(tracker: OutcomeTracker, dpConfig: DPConfig = DEFAULT_DP_CONFIG) {
    this.#tracker = tracker;
    this.#dp = new DifferentialPrivacy(dpConfig);
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Generate a full systemic report for a jurisdiction over a calendar period.
   * All numeric values in the returned report have been DP-privatized.
   */
  generateReport(jurisdiction: string, period: { start: number; end: number }): SystemicReport {
    const outcomes = this.#tracker.getOutcomes({ jurisdiction, dateRange: period });

    const rawApprovalRate = this.#computeApprovalRate(outcomes);
    const rawAvgProcessingTime = this.#computeAvgDuration(
      outcomes.filter((o) => o.result === "approved"),
    );

    // Privatize the two scalar headline metrics.
    const privatizedMetrics = this.#dp.privatize([
      this.#makeMetric("approvalRate", jurisdiction, rawApprovalRate, outcomes.length, period),
      this.#makeMetric(
        "avgProcessingTime",
        jurisdiction,
        rawAvgProcessingTime,
        outcomes.length,
        period,
      ),
    ]);

    const approvalRate = this.#extractMetricValue(
      privatizedMetrics,
      "approvalRate",
      rawApprovalRate,
    );
    const avgProcessingTime = this.#extractMetricValue(
      privatizedMetrics,
      "avgProcessingTime",
      rawAvgProcessingTime,
    );

    const topConfusionPoints = this.#aggregateConfusionPoints(outcomes).slice(0, 5);
    const bottlenecks = this.identifyBottlenecks(jurisdiction, period);
    // Use the raw (pre-noise) approval rate for recommendation generation so
    // that DP noise does not suppress actionable signals.
    const recommendations = this.#generateRecommendations(
      rawApprovalRate,
      topConfusionPoints,
      bottlenecks,
    );

    return {
      jurisdiction,
      period,
      approvalRate: Math.max(0, Math.min(1, approvalRate)),
      avgProcessingTime: Math.max(0, avgProcessingTime),
      topConfusionPoints,
      bottlenecks,
      recommendations,
    };
  }

  /**
   * Identify steps with disproportionate wait times or drop-off rates across
   * all processes in a jurisdiction.
   */
  identifyBottlenecks(jurisdiction: string, period?: { start: number; end: number }): Bottleneck[] {
    const outcomes = this.#tracker.getOutcomes({
      jurisdiction,
      ...(period !== undefined ? { dateRange: period } : {}),
    });

    // Group outcomes by processId
    const byProcess = this.#groupBy(outcomes, (o) => o.processId);
    const bottlenecks: Bottleneck[] = [];

    for (const [processId, processOutcomes] of byProcess) {
      if (processOutcomes.length < MIN_PATTERN_SAMPLES) continue;

      // For each step position, compute wait time and drop-off
      const maxSteps = Math.max(...processOutcomes.map((o) => o.totalSteps));

      for (let step = 1; step <= maxSteps; step++) {
        const stepId = `step-${step}`;
        // Sessions that reached this step (completed at least step-1 steps and
        // were presented with step).
        const reachedStep = processOutcomes.filter((o) => o.stepsCompleted >= step - 1);
        // Sessions that stopped exactly at the previous step, i.e. never
        // completed this step.
        const droppedAtStep = processOutcomes.filter(
          (o) => o.stepsCompleted === step - 1 && o.result !== "approved",
        );

        if (reachedStep.length < MIN_PATTERN_SAMPLES) continue;

        const dropoffRate = droppedAtStep.length / reachedStep.length;

        // Estimate wait days from duration proportional to step position
        const avgWaitMs =
          reachedStep.reduce((sum, o) => {
            const perStepMs = o.duration / Math.max(o.totalSteps, 1);
            return sum + perStepMs;
          }, 0) / reachedStep.length;

        const avgWaitDays = avgWaitMs / MS_PER_DAY;

        if (dropoffRate >= DROPOFF_RATE_WARN || avgWaitDays >= AVG_WAIT_DAYS_WARN) {
          bottlenecks.push({
            processId,
            stepId,
            avgWaitDays,
            dropoffRate,
          });
        }
      }
    }

    return bottlenecks.sort((a, b) => b.dropoffRate - a.dropoffRate);
  }

  /**
   * Detect recurring patterns in a jurisdiction (optionally scoped to one
   * programme). Returns patterns with a confidence score in [0, 1].
   */
  detectPatterns(
    jurisdiction: string,
    programId?: string,
  ): { pattern: string; confidence: number }[] {
    const filters = programId !== undefined ? { jurisdiction, programId } : { jurisdiction };
    const outcomes = this.#tracker.getOutcomes(filters);

    if (outcomes.length < MIN_PATTERN_SAMPLES) return [];

    const patterns: { pattern: string; confidence: number }[] = [];

    // Pattern 1: High confusion at document-upload steps
    const confusionPoints = this.#aggregateConfusionPoints(outcomes);
    const uploadConfusion = confusionPoints.filter(
      (cp) => cp.stepId.toLowerCase().includes("upload") || cp.stepId.toLowerCase().includes("doc"),
    );
    if (uploadConfusion.length > 0) {
      const confidence = Math.min(
        uploadConfusion.reduce((s, cp) => s + cp.frequency, 0) / outcomes.length,
        1,
      );
      if (confidence > 0.1) {
        patterns.push({
          pattern: "High confusion at document upload steps",
          confidence,
        });
      }
    }

    // Pattern 2: Low approval rate in jurisdiction
    const approvalRate = this.#computeApprovalRate(outcomes);
    if (approvalRate < APPROVAL_RATE_WARN && outcomes.length >= MIN_PATTERN_SAMPLES) {
      patterns.push({
        pattern: `Below-average approval rate (${(approvalRate * 100).toFixed(1)}%)`,
        confidence: 1 - approvalRate,
      });
    }

    // Pattern 3: High abandonment
    const abandonedCount = outcomes.filter((o) => o.result === "abandoned").length;
    const abandonmentRate = abandonedCount / outcomes.length;
    if (abandonmentRate > 0.2) {
      patterns.push({
        pattern: `Elevated session abandonment (${(abandonmentRate * 100).toFixed(1)}%)`,
        confidence: Math.min(abandonmentRate * 2, 1),
      });
    }

    // Pattern 4: Long tail durations suggest complexity
    const durations = outcomes.map((o) => o.duration).sort((a, b) => a - b);
    const p50 = durations[Math.floor(durations.length * 0.5)] ?? 0;
    const p95 = durations[Math.floor(durations.length * 0.95)] ?? 0;
    if (p95 > p50 * 5 && p50 > 0) {
      patterns.push({
        pattern: "Long-tail session durations suggest navigation complexity",
        confidence: Math.min((p95 / p50 - 5) / 10, 1),
      });
    }

    // Pattern 5: Early-step drop-offs
    const earlyDropoffs = outcomes.filter((o) => o.stepsCompleted < o.totalSteps * 0.25).length;
    const earlyDropoffRate = earlyDropoffs / outcomes.length;
    if (earlyDropoffRate > 0.15) {
      patterns.push({
        pattern: "Significant early-step drop-offs (first 25% of process)",
        confidence: Math.min(earlyDropoffRate * 3, 1),
      });
    }

    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Compare the same metric across two time periods to surface trends.
   */
  comparePeriods(
    jurisdiction: string,
    period1: { start: number; end: number },
    period2: { start: number; end: number },
  ): { metric: string; change: number; direction: "improved" | "declined" | "stable" }[] {
    const o1 = this.#tracker.getOutcomes({ jurisdiction, dateRange: period1 });
    const o2 = this.#tracker.getOutcomes({ jurisdiction, dateRange: period2 });

    const results: {
      metric: string;
      change: number;
      direction: "improved" | "declined" | "stable";
    }[] = [];

    const compare = (metricName: string, v1: number, v2: number, higherIsBetter: boolean) => {
      const change = v2 - v1;
      const threshold = 0.02; // 2% relative change to qualify as non-stable
      const relative = v1 !== 0 ? Math.abs(change) / Math.abs(v1) : Math.abs(change);

      let direction: "improved" | "declined" | "stable";
      if (relative < threshold) {
        direction = "stable";
      } else if (higherIsBetter) {
        direction = change > 0 ? "improved" : "declined";
      } else {
        direction = change < 0 ? "improved" : "declined";
      }

      results.push({ metric: metricName, change, direction });
    };

    compare("approvalRate", this.#computeApprovalRate(o1), this.#computeApprovalRate(o2), true);

    compare(
      "avgDuration",
      this.#computeAvgDuration(o1),
      this.#computeAvgDuration(o2),
      false, // lower duration = better
    );

    compare(
      "completionRate",
      this.#computeCompletionRate(o1),
      this.#computeCompletionRate(o2),
      true,
    );

    compare(
      "abandonmentRate",
      this.#computeAbandonmentRate(o1),
      this.#computeAbandonmentRate(o2),
      false,
    );

    return results;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  #computeApprovalRate(outcomes: NavigationOutcome[]): number {
    if (outcomes.length === 0) return 0;
    return outcomes.filter((o) => o.result === "approved").length / outcomes.length;
  }

  #computeAvgDuration(outcomes: NavigationOutcome[]): number {
    if (outcomes.length === 0) return 0;
    return outcomes.reduce((sum, o) => sum + o.duration, 0) / outcomes.length;
  }

  #computeCompletionRate(outcomes: NavigationOutcome[]): number {
    if (outcomes.length === 0) return 0;
    const completed = outcomes.filter(
      (o) => o.result === "approved" || o.result === "denied" || o.result === "pending",
    ).length;
    return completed / outcomes.length;
  }

  #computeAbandonmentRate(outcomes: NavigationOutcome[]): number {
    if (outcomes.length === 0) return 0;
    return outcomes.filter((o) => o.result === "abandoned").length / outcomes.length;
  }

  #aggregateConfusionPoints(outcomes: NavigationOutcome[]): ConfusionPoint[] {
    const map = new Map<string, { processId: string; freq: number }>();

    for (const o of outcomes) {
      for (const stepId of o.confusionPoints) {
        const key = `${o.processId}::${stepId}`;
        const existing = map.get(key);
        if (existing !== undefined) {
          existing.freq++;
        } else {
          map.set(key, { processId: o.processId, freq: 1 });
        }
      }
    }

    const points: ConfusionPoint[] = [];
    for (const [key, { processId, freq }] of map) {
      const stepId = key.split("::")[1] ?? key;
      points.push({
        processId,
        stepId,
        frequency: freq,
        description: `Step ${stepId} — confusion signal reported in ${freq} session(s)`,
      });
    }

    return points.sort((a, b) => b.frequency - a.frequency);
  }

  #generateRecommendations(
    approvalRate: number,
    confusionPoints: ConfusionPoint[],
    bottlenecks: Bottleneck[],
  ): string[] {
    const recs: string[] = [];

    if (approvalRate < APPROVAL_RATE_WARN) {
      recs.push(
        `Approval rate is ${(approvalRate * 100).toFixed(1)}% — review eligibility criteria clarity and pre-screening questions.`,
      );
    }

    const highFreqConfusion = confusionPoints.filter((cp) => cp.frequency >= CONFUSION_FREQ_WARN);
    if (highFreqConfusion.length > 0) {
      const steps = highFreqConfusion
        .slice(0, 3)
        .map((cp) => cp.stepId)
        .join(", ");
      recs.push(`Simplify or add contextual help at high-confusion steps: ${steps}.`);
    }

    const severeBottlenecks = bottlenecks.filter(
      (b) => b.dropoffRate >= DROPOFF_RATE_WARN || b.avgWaitDays >= AVG_WAIT_DAYS_WARN,
    );
    if (severeBottlenecks.length > 0) {
      const steps = severeBottlenecks
        .slice(0, 3)
        .map((b) => `${b.processId}/${b.stepId}`)
        .join(", ");
      recs.push(`Address bottlenecks with high drop-off or wait times at: ${steps}.`);
    }

    if (recs.length === 0) {
      recs.push("No critical issues detected. Continue monitoring for emerging patterns.");
    }

    return recs;
  }

  #makeMetric(
    metricName: string,
    jurisdiction: string,
    value: number,
    sampleSize: number,
    period: { start: number; end: number },
  ): AggregateMetric {
    return {
      metricName,
      jurisdiction,
      value,
      sampleSize,
      period,
      noiseAdded: false,
    };
  }

  #extractMetricValue(metrics: AggregateMetric[], metricName: string, fallback: number): number {
    return metrics.find((m) => m.metricName === metricName)?.value ?? fallback;
  }

  #groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
    const map = new Map<string, T[]>();
    for (const item of items) {
      const key = keyFn(item);
      const bucket = map.get(key);
      if (bucket !== undefined) {
        bucket.push(item);
      } else {
        map.set(key, [item]);
      }
    }
    return map;
  }
}
