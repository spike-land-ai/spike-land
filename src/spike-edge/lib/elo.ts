/**
 * Generic ELO rating engine.
 * Adapted from @spike-land-ai/chess-engine/elo.ts — pure math, no domain deps.
 */

export function expectedScore(playerElo: number, opponentElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
}

export function getKFactor(elo: number, eventCount: number): number {
  if (elo > 2400) return 16;
  if (eventCount < 30) return 40;
  return 32;
}

/** Clamp ELO to [0, 3000]. */
export function applyEloDelta(currentElo: number, delta: number): number {
  return Math.max(0, Math.min(3000, currentElo + delta));
}

export interface EloMatchResult {
  winnerNewElo: number;
  loserNewElo: number;
  winnerChange: number;
  loserChange: number;
}

/**
 * Bug-vs-Bug ELO: the "winner" is the bug that just received a new report.
 * The "loser" is a random same-category competitor bug.
 */
export function calculateBugEloChange(
  winnerElo: number,
  loserElo: number,
  winnerEvents: number,
  loserEvents: number,
): EloMatchResult {
  const winnerExpected = expectedScore(winnerElo, loserElo);
  const loserExpected = expectedScore(loserElo, winnerElo);
  const wK = getKFactor(winnerElo, winnerEvents);
  const lK = getKFactor(loserElo, loserEvents);
  const winnerChange = Math.round(wK * (1.0 - winnerExpected));
  const loserChange = Math.round(lK * (0.0 - loserExpected));
  return {
    winnerNewElo: winnerElo + winnerChange,
    loserNewElo: Math.max(0, loserElo + loserChange),
    winnerChange,
    loserChange,
  };
}

/** Derive tier from ELO. */
export function eloToTier(elo: number): "free" | "pro" | "elite" {
  if (elo < 1000) return "free";
  if (elo < 1500) return "pro";
  return "elite";
}

/** Rate limit multiplier based on ELO (lower ELO = stricter limits). */
export function eloRateMultiplier(elo: number): number {
  if (elo < 500) return 4;
  if (elo < 800) return 2;
  return 1;
}
