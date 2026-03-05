import { describe, expect, it } from "vitest";
import {
  applyEloDelta,
  calculateBugEloChange,
  eloRateMultiplier,
  eloToTier,
  expectedScore,
  getKFactor,
} from "../../../src/spike-edge/lib/elo.js";

describe("expectedScore", () => {
  it("returns 0.5 for equal ELOs", () => {
    expect(expectedScore(1000, 1000)).toBeCloseTo(0.5);
  });

  it("returns >0.5 when player has higher ELO", () => {
    expect(expectedScore(1200, 1000)).toBeGreaterThan(0.5);
  });

  it("returns <0.5 when player has lower ELO", () => {
    expect(expectedScore(800, 1000)).toBeLessThan(0.5);
  });

  it("approaches 1 when player ELO is much higher", () => {
    expect(expectedScore(3000, 100)).toBeGreaterThan(0.99);
  });

  it("approaches 0 when player ELO is much lower", () => {
    expect(expectedScore(100, 3000)).toBeLessThan(0.01);
  });
});

describe("getKFactor", () => {
  it("returns 16 for ELO >2400", () => {
    expect(getKFactor(2401, 50)).toBe(16);
    expect(getKFactor(3000, 100)).toBe(16);
  });

  it("returns 40 for eventCount <30 (and ELO <=2400)", () => {
    expect(getKFactor(1200, 0)).toBe(40);
    expect(getKFactor(1200, 29)).toBe(40);
  });

  it("returns 32 for eventCount >=30 (and ELO <=2400)", () => {
    expect(getKFactor(1200, 30)).toBe(32);
    expect(getKFactor(2400, 100)).toBe(32);
  });
});

describe("applyEloDelta", () => {
  it("adds delta to ELO", () => {
    expect(applyEloDelta(1000, 50)).toBe(1050);
  });

  it("clamps to minimum 0", () => {
    expect(applyEloDelta(10, -100)).toBe(0);
  });

  it("clamps to maximum 3000", () => {
    expect(applyEloDelta(2990, 100)).toBe(3000);
  });

  it("returns current ELO when delta is 0", () => {
    expect(applyEloDelta(1500, 0)).toBe(1500);
  });
});

describe("calculateBugEloChange", () => {
  it("winner gains ELO and loser loses ELO for equal opponents", () => {
    const result = calculateBugEloChange(1000, 1000, 10, 10);
    expect(result.winnerChange).toBeGreaterThan(0);
    expect(result.loserChange).toBeLessThan(0);
    expect(result.winnerNewElo).toBe(1000 + result.winnerChange);
    expect(result.loserNewElo).toBe(Math.max(0, 1000 + result.loserChange));
  });

  it("winner with higher ELO gains less, loser with lower ELO loses less", () => {
    const highVsLow = calculateBugEloChange(1800, 1000, 10, 10);
    const equalElo = calculateBugEloChange(1000, 1000, 10, 10);
    // High ELO winner is already expected to win — gains less
    expect(highVsLow.winnerChange).toBeLessThan(equalElo.winnerChange);
  });

  it("loserNewElo is never negative", () => {
    const result = calculateBugEloChange(3000, 50, 100, 5);
    expect(result.loserNewElo).toBeGreaterThanOrEqual(0);
  });

  it("uses K=40 for low event counts", () => {
    const result = calculateBugEloChange(1000, 1000, 5, 5);
    // K=40, equal ELOs → change = round(40 * 0.5) = 20
    expect(result.winnerChange).toBe(20);
  });

  it("uses K=32 for high event counts", () => {
    const result = calculateBugEloChange(1000, 1000, 30, 30);
    // K=32, equal ELOs → change = round(32 * 0.5) = 16
    expect(result.winnerChange).toBe(16);
  });

  it("uses K=16 for very high ELO", () => {
    const result = calculateBugEloChange(2500, 2500, 50, 50);
    // K=16, equal ELOs → change = round(16 * 0.5) = 8
    expect(result.winnerChange).toBe(8);
  });
});

describe("eloToTier", () => {
  it("returns free for ELO <1000", () => {
    expect(eloToTier(0)).toBe("free");
    expect(eloToTier(999)).toBe("free");
  });

  it("returns pro for ELO in [1000, 1499]", () => {
    expect(eloToTier(1000)).toBe("pro");
    expect(eloToTier(1499)).toBe("pro");
  });

  it("returns business for ELO >=1500", () => {
    expect(eloToTier(1500)).toBe("business");
    expect(eloToTier(3000)).toBe("business");
  });
});

describe("eloRateMultiplier", () => {
  it("returns 4 for ELO <500", () => {
    expect(eloRateMultiplier(0)).toBe(4);
    expect(eloRateMultiplier(499)).toBe(4);
  });

  it("returns 2 for ELO in [500, 799]", () => {
    expect(eloRateMultiplier(500)).toBe(2);
    expect(eloRateMultiplier(799)).toBe(2);
  });

  it("returns 1 for ELO >=800", () => {
    expect(eloRateMultiplier(800)).toBe(1);
    expect(eloRateMultiplier(3000)).toBe(1);
  });
});
