export {
  MATH_ARENA_DOMAINS,
  ARENA_LEVELS,
  ARENA_ROUNDS,
  ARENA_SCORING,
  MATH_ARENA_FPS,
  MATH_ARENA_DURATIONS,
  MATH_ARENA_TOTAL_FRAMES,
  getRoundsByDomain,
  getRoundByNumber,
  getDomainForRound,
  getLevelForRound,
} from "./math-arena-constants";

export type { ArenaRound, MathDomainId } from "./math-arena-constants";

export {
  ARENA_JUDGES,
  ARENA_CHALLENGERS,
  ARENA_COMMENTATORS,
  ALL_ARENA_PERSONAS,
  getPersonaById,
  getPersonasByRole,
  getJudge,
  generateRoundCommentary,
} from "./math-arena-personas";

export type { ArenaPersona, ArenaRole, RoundOutcome, RoundCommentary } from "./math-arena-personas";
