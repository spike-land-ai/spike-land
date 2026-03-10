/**
 * COMPASS Eligibility Engine — Public API
 *
 * Re-exports everything a consumer needs. Import from:
 *   "@compass/eligibility-engine"                 — everything
 *   "@compass/eligibility-engine/types"           — types only (no runtime)
 *   "@compass/eligibility-engine/core-logic/..."  — individual modules
 */

// Types
export type {
  Benefit,
  CitizenshipStatus,
  CustomFieldValue,
  Disability,
  EligibilityRule,
  Location,
  MatchResult,
  Program,
  RankedMatch,
  RuleValue,
  UserProfile,
} from "./types.js";
export { EmploymentStatus, Operator } from "./types.js";

// Core logic
export { RulesEngine } from "./core-logic/rules-engine.js";
export { ProfileBuilder } from "./core-logic/profile-builder.js";
export { rankByImpact } from "./core-logic/ranking.js";
export type { RankingOptions, RankingWeights } from "./core-logic/ranking.js";
