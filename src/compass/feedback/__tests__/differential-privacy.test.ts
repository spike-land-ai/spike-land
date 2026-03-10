import { describe, it, expect, beforeEach, vi } from "vitest";
import { DifferentialPrivacy } from "../core-logic/differential-privacy.js";
import type { AggregateMetric, DPConfig } from "../types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: DPConfig = {
  epsilon: 1.0,
  delta: 1e-5,
  sensitivity: 1.0,
};

function makeMetric(overrides: Partial<AggregateMetric> = {}): AggregateMetric {
  return {
    metricName: "approvalRate",
    jurisdiction: "GB",
    value: 0.75,
    sampleSize: 100,
    period: { start: 1_700_000_000_000, end: 1_700_086_400_000 },
    noiseAdded: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DifferentialPrivacy", () => {
  let dp: DifferentialPrivacy;

  beforeEach(() => {
    dp = new DifferentialPrivacy(DEFAULT_CONFIG);
  });

  describe("constructor validation", () => {
    it("rejects epsilon <= 0", () => {
      expect(() => new DifferentialPrivacy({ ...DEFAULT_CONFIG, epsilon: 0 })).toThrow(RangeError);
      expect(() => new DifferentialPrivacy({ ...DEFAULT_CONFIG, epsilon: -1 })).toThrow(RangeError);
    });

    it("rejects delta < 0", () => {
      expect(() => new DifferentialPrivacy({ ...DEFAULT_CONFIG, delta: -0.1 })).toThrow(RangeError);
    });

    it("rejects delta >= 1", () => {
      expect(() => new DifferentialPrivacy({ ...DEFAULT_CONFIG, delta: 1 })).toThrow(RangeError);
    });

    it("rejects sensitivity <= 0", () => {
      expect(() => new DifferentialPrivacy({ ...DEFAULT_CONFIG, sensitivity: 0 })).toThrow(
        RangeError,
      );
    });

    it("accepts valid config", () => {
      expect(() => new DifferentialPrivacy(DEFAULT_CONFIG)).not.toThrow();
    });
  });

  describe("addLaplaceNoise", () => {
    it("returns a number", () => {
      expect(typeof dp.addLaplaceNoise(100)).toBe("number");
    });

    it("increments queryCount", () => {
      dp.addLaplaceNoise(1);
      dp.addLaplaceNoise(1);
      expect(dp.queryCount).toBe(2);
    });

    it("introduces non-zero noise over many samples", () => {
      // With overwhelming probability, at least one of 1000 calls will differ
      // from the original value.
      const original = 500;
      const noisy = Array.from({ length: 1000 }, () => dp.addLaplaceNoise(original));
      const allEqual = noisy.every((v) => v === original);
      expect(allEqual).toBe(false);
    });

    it("noise distribution is centred near zero on average (E[noise] ≈ 0)", () => {
      // Mean of Laplace(0, b) is 0. Over 10 000 samples the sample mean
      // should be within 3σ of 0. σ_mean = b/sqrt(n).
      const b = DEFAULT_CONFIG.sensitivity / DEFAULT_CONFIG.epsilon; // b = 1
      const n = 10_000;
      const original = 0;
      const samples = Array.from({ length: n }, () => dp.addLaplaceNoise(original));
      const mean = samples.reduce((s, v) => s + v, 0) / n;
      // 3-sigma bound: 3 * b / sqrt(n) = 3 / 100 = 0.03
      expect(Math.abs(mean)).toBeLessThan(((3 * b) / Math.sqrt(n)) * 10); // generous bound
    });

    it("uses configured scale (higher epsilon → less noise)", () => {
      const dpHigh = new DifferentialPrivacy({ ...DEFAULT_CONFIG, epsilon: 100 });
      const dpLow = new DifferentialPrivacy({ ...DEFAULT_CONFIG, epsilon: 0.01 });

      const n = 500;
      const absHighEps = Array.from({ length: n }, () => Math.abs(dpHigh.addLaplaceNoise(0)));
      const absLowEps = Array.from({ length: n }, () => Math.abs(dpLow.addLaplaceNoise(0)));

      const meanHigh = absHighEps.reduce((s, v) => s + v, 0) / n;
      const meanLow = absLowEps.reduce((s, v) => s + v, 0) / n;

      // Low epsilon should produce much larger noise on average
      expect(meanLow).toBeGreaterThan(meanHigh * 5);
    });
  });

  describe("addGaussianNoise", () => {
    it("returns a number", () => {
      expect(typeof dp.addGaussianNoise(50)).toBe("number");
    });

    it("increments queryCount", () => {
      dp.addGaussianNoise(1);
      expect(dp.queryCount).toBe(1);
    });

    it("introduces non-zero noise over many samples", () => {
      const original = 200;
      const noisy = Array.from({ length: 200 }, () => dp.addGaussianNoise(original));
      expect(noisy.every((v) => v === original)).toBe(false);
    });

    it("noise is roughly symmetric around zero", () => {
      const n = 2_000;
      const samples = Array.from({ length: n }, () => dp.addGaussianNoise(0));
      const positives = samples.filter((v) => v > 0).length;
      // Should be between 40% and 60% positive with high probability
      expect(positives).toBeGreaterThan(n * 0.4);
      expect(positives).toBeLessThan(n * 0.6);
    });
  });

  describe("privatize", () => {
    it("suppresses metrics with sampleSize < 10", () => {
      const small = makeMetric({ sampleSize: 9 });
      expect(dp.privatize([small])).toHaveLength(0);
    });

    it("passes through metrics with sampleSize >= 10", () => {
      const big = makeMetric({ sampleSize: 10 });
      expect(dp.privatize([big])).toHaveLength(1);
    });

    it("sets noiseAdded = true on all returned metrics", () => {
      const metrics = [
        makeMetric({ sampleSize: 50, metricName: "a" }),
        makeMetric({ sampleSize: 200, metricName: "b" }),
      ];
      const result = dp.privatize(metrics);
      expect(result.every((m) => m.noiseAdded)).toBe(true);
    });

    it("does not mutate the original metrics array", () => {
      const original = makeMetric({ sampleSize: 50, value: 0.8, noiseAdded: false });
      dp.privatize([original]);
      expect(original.noiseAdded).toBe(false);
      expect(original.value).toBe(0.8);
    });

    it("preserves non-value fields", () => {
      const m = makeMetric({ sampleSize: 20, jurisdiction: "FR", programId: "prog-x" });
      const [result] = dp.privatize([m]);
      expect(result?.jurisdiction).toBe("FR");
      expect(result?.programId).toBe("prog-x");
      expect(result?.sampleSize).toBe(20);
    });

    it("increments queryCount once per surviving metric", () => {
      const metrics = [
        makeMetric({ sampleSize: 9, metricName: "suppressed" }), // suppressed
        makeMetric({ sampleSize: 20, metricName: "kept-1" }),
        makeMetric({ sampleSize: 30, metricName: "kept-2" }),
      ];
      dp.privatize(metrics);
      expect(dp.queryCount).toBe(2);
    });
  });

  describe("isEpsilonBudgetExceeded", () => {
    it("returns false when queryCount is within budget", () => {
      dp.addLaplaceNoise(1);
      expect(dp.isEpsilonBudgetExceeded(10)).toBe(false);
    });

    it("returns true when queryCount exceeds the allowed maximum", () => {
      for (let i = 0; i < 6; i++) dp.addLaplaceNoise(1);
      expect(dp.isEpsilonBudgetExceeded(5)).toBe(true);
    });

    it("returns false at the boundary (queryCount === maxQueries)", () => {
      for (let i = 0; i < 5; i++) dp.addLaplaceNoise(1);
      expect(dp.isEpsilonBudgetExceeded(5)).toBe(false);
    });
  });

  describe("queryCount", () => {
    it("counts Laplace and Gaussian calls together", () => {
      dp.addLaplaceNoise(1);
      dp.addLaplaceNoise(1);
      dp.addGaussianNoise(1);
      expect(dp.queryCount).toBe(3);
    });
  });

  describe("config accessor", () => {
    it("returns the configuration supplied at construction", () => {
      expect(dp.config).toMatchObject(DEFAULT_CONFIG);
    });
  });
});
