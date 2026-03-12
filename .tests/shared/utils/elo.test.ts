import { describe, it, expect } from "vitest";
import {
  expectedScore,
  getKFactor,
  calculateEloChange,
} from "../../../src/core/shared-utils/core-logic/elo.js";

describe("expectedScore", () => {
  it("returns 0.5 for equal ratings", () => {
    expect(expectedScore(1200, 1200)).toBe(0.5);
  });

  it("returns > 0.5 when player is stronger", () => {
    const score = expectedScore(1600, 1200);
    expect(score).toBeGreaterThan(0.5);
    expect(score).toBeLessThan(1);
  });

  it("returns < 0.5 when player is weaker", () => {
    const score = expectedScore(1200, 1600);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(0.5);
  });

  it("two expected scores sum to 1.0", () => {
    const white = expectedScore(1500, 1300);
    const black = expectedScore(1300, 1500);
    expect(white + black).toBeCloseTo(1.0, 10);
  });

  it("applies the correct FIDE 400-point formula", () => {
    // Player 200 points above opponent: expected ≈ 0.76 (1 / (1 + 10^(-200/400)))
    const score = expectedScore(1400, 1200);
    expect(score).toBeCloseTo(0.7597, 3);
  });

  it("handles extreme rating differences approaching 0 and 1", () => {
    const dominant = expectedScore(3000, 100);
    const underdog = expectedScore(100, 3000);
    expect(dominant).toBeCloseTo(1, 5);
    expect(underdog).toBeCloseTo(0, 5);
  });
});

describe("getKFactor", () => {
  it("returns 40 for fewer than 30 games regardless of elo (below 2400)", () => {
    expect(getKFactor(1200, 0)).toBe(40);
    expect(getKFactor(2000, 29)).toBe(40);
    expect(getKFactor(1500, 10)).toBe(40);
  });

  it("returns 32 for established players below 2400", () => {
    expect(getKFactor(1200, 30)).toBe(32);
    expect(getKFactor(2399, 100)).toBe(32);
  });

  it("returns 16 for elite players (elo > 2400)", () => {
    expect(getKFactor(2401, 30)).toBe(16);
    expect(getKFactor(3000, 5)).toBe(16);
    expect(getKFactor(2800, 0)).toBe(16);
  });

  it("boundary at exactly 2400 uses established K=32", () => {
    expect(getKFactor(2400, 50)).toBe(32);
  });
});

describe("calculateEloChange", () => {
  it("white win increases white elo and decreases black elo for equal players", () => {
    const result = calculateEloChange(1200, 1200, "white");
    expect(result.whiteChange).toBeGreaterThan(0);
    expect(result.blackChange).toBeLessThan(0);
    expect(result.whiteNewElo).toBe(1200 + result.whiteChange);
    expect(result.blackNewElo).toBe(1200 + result.blackChange);
  });

  it("black win increases black elo and decreases white elo", () => {
    const result = calculateEloChange(1200, 1200, "black");
    expect(result.whiteChange).toBeLessThan(0);
    expect(result.blackChange).toBeGreaterThan(0);
  });

  it("draw produces small symmetric changes for equal players", () => {
    const result = calculateEloChange(1200, 1200, "draw");
    // Both expected scores are 0.5, actual is 0.5, so change = round(K * 0) = 0
    expect(result.whiteChange).toBe(0);
    expect(result.blackChange).toBe(0);
  });

  it("weaker player winning yields a large gain", () => {
    // Black is 400 points weaker, winning should yield big gain
    const result = calculateEloChange(1600, 1200, "black");
    expect(result.blackChange).toBeGreaterThan(result.whiteChange * -1 - 5);
    expect(result.blackChange).toBeGreaterThan(0);
  });

  it("stronger player winning yields a small gain", () => {
    // White is much stronger, winning is expected so gain is small
    const result = calculateEloChange(1800, 1200, "white");
    expect(result.whiteChange).toBeGreaterThan(0);
    // 1 or 2 points vs ~30 for upset
    expect(result.whiteChange).toBeLessThan(8);
  });

  it("uses K=40 for players with fewer than 30 games", () => {
    // For equal players, white win gives K * (1 - 0.5) = 40 * 0.5 = 20
    const result = calculateEloChange(1200, 1200, "white", 10, 10);
    expect(result.whiteChange).toBe(20);
    expect(result.blackChange).toBe(-20);
  });

  it("uses K=16 for elite players over 2400", () => {
    const result = calculateEloChange(2500, 2500, "white", 100, 100);
    // K=16, equal players, white wins: 16 * (1 - 0.5) = 8
    expect(result.whiteChange).toBe(8);
    expect(result.blackChange).toBe(-8);
  });

  it("returns integer changes (rounded)", () => {
    const result = calculateEloChange(1300, 1100, "draw");
    expect(Number.isInteger(result.whiteChange)).toBe(true);
    expect(Number.isInteger(result.blackChange)).toBe(true);
  });

  it("sum of changes is zero or close to zero for equal K factors", () => {
    // With equal K factors and complementary expected scores, changes are symmetric
    const result = calculateEloChange(1500, 1500, "white", 30, 30);
    // whiteChange + blackChange should be 0 (equal K, complementary expected scores)
    expect(Math.abs(result.whiteChange + result.blackChange)).toBeLessThanOrEqual(1);
  });
});
