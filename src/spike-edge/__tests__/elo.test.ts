import { describe, expect, it } from "vitest";
import {
  applyEloDelta,
  calculateBugEloChange,
  eloRateMultiplier,
  eloToTier,
  expectedScore,
  getKFactor,
} from "../lib/elo.js";

describe("expectedScore", () => {
  it("returns 0.5 for equal ratings", () => {
    expect(expectedScore(1200, 1200)).toBeCloseTo(0.5);
  });

  it("returns higher score for higher-rated player", () => {
    const score = expectedScore(1600, 1200);
    expect(score).toBeGreaterThan(0.5);
    expect(score).toBeCloseTo(0.909, 2);
  });

  it("returns lower score for lower-rated player", () => {
    const score = expectedScore(1200, 1600);
    expect(score).toBeLessThan(0.5);
    expect(score).toBeCloseTo(0.091, 2);
  });

  it("scores for two players sum to 1", () => {
    const a = expectedScore(1400, 1200);
    const b = expectedScore(1200, 1400);
    expect(a + b).toBeCloseTo(1.0);
  });
});

describe("getKFactor", () => {
  it("returns 40 for new users (<30 events)", () => {
    expect(getKFactor(1200, 5)).toBe(40);
    expect(getKFactor(1200, 29)).toBe(40);
  });

  it("returns 32 for standard users", () => {
    expect(getKFactor(1200, 30)).toBe(32);
    expect(getKFactor(2400, 100)).toBe(32);
  });

  it("returns 16 for elite users (>2400)", () => {
    expect(getKFactor(2401, 100)).toBe(16);
    expect(getKFactor(3000, 500)).toBe(16);
  });
});

describe("applyEloDelta", () => {
  it("adds positive delta", () => {
    expect(applyEloDelta(1200, 25)).toBe(1225);
  });

  it("subtracts negative delta", () => {
    expect(applyEloDelta(1200, -50)).toBe(1150);
  });

  it("clamps to 0 minimum", () => {
    expect(applyEloDelta(10, -50)).toBe(0);
  });

  it("clamps to 3000 maximum", () => {
    expect(applyEloDelta(2990, 50)).toBe(3000);
  });
});

describe("calculateBugEloChange", () => {
  it("winner gains ELO, loser loses ELO for equal ratings", () => {
    const result = calculateBugEloChange(1200, 1200, 30, 30);
    expect(result.winnerChange).toBeGreaterThan(0);
    expect(result.loserChange).toBeLessThan(0);
    expect(result.winnerNewElo).toBe(1200 + result.winnerChange);
    expect(result.loserNewElo).toBe(1200 + result.loserChange);
  });

  it("changes are symmetric for equal ratings", () => {
    const result = calculateBugEloChange(1200, 1200, 30, 30);
    expect(result.winnerChange).toBe(-result.loserChange);
  });

  it("upset win gives larger change", () => {
    const upset = calculateBugEloChange(800, 1600, 30, 30);
    const expected = calculateBugEloChange(1600, 800, 30, 30);
    expect(upset.winnerChange).toBeGreaterThan(expected.winnerChange);
  });

  it("loser ELO never goes below 0", () => {
    const result = calculateBugEloChange(1200, 10, 30, 30);
    expect(result.loserNewElo).toBeGreaterThanOrEqual(0);
  });

  it("uses higher K-factor for new bugs", () => {
    const newBug = calculateBugEloChange(1200, 1200, 5, 30);
    const oldBug = calculateBugEloChange(1200, 1200, 30, 30);
    expect(newBug.winnerChange).toBeGreaterThan(oldBug.winnerChange);
  });
});

describe("eloToTier", () => {
  it("returns free for ELO < 1000", () => {
    expect(eloToTier(0)).toBe("free");
    expect(eloToTier(999)).toBe("free");
  });

  it("returns pro for ELO 1000-1499", () => {
    expect(eloToTier(1000)).toBe("pro");
    expect(eloToTier(1499)).toBe("pro");
  });

  it("returns elite for ELO >= 1500", () => {
    expect(eloToTier(1500)).toBe("elite");
    expect(eloToTier(3000)).toBe("elite");
  });
});

describe("eloRateMultiplier", () => {
  it("returns 4x for very low ELO", () => {
    expect(eloRateMultiplier(0)).toBe(4);
    expect(eloRateMultiplier(499)).toBe(4);
  });

  it("returns 2x for low ELO", () => {
    expect(eloRateMultiplier(500)).toBe(2);
    expect(eloRateMultiplier(799)).toBe(2);
  });

  it("returns 1x for normal ELO", () => {
    expect(eloRateMultiplier(800)).toBe(1);
    expect(eloRateMultiplier(1200)).toBe(1);
    expect(eloRateMultiplier(3000)).toBe(1);
  });
});
