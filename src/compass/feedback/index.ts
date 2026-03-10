/**
 * @compass/feedback
 *
 * Differential-privacy feedback analytics for COMPASS systemic intelligence.
 * Provides anonymized outcome tracking, DP noise injection, and jurisdiction-
 * level reporting — with zero individual data exposure.
 */

// Types
export type {
  AggregateMetric,
  Bottleneck,
  ConfusionPoint,
  DPConfig,
  NavigationOutcome,
  OutcomeResult,
  SystemicReport,
} from "./types.js";

// Core logic
export { OutcomeTracker } from "./core-logic/outcome-tracker.js";
export type { OutcomeFilters } from "./core-logic/outcome-tracker.js";

export { DifferentialPrivacy } from "./core-logic/differential-privacy.js";

export { SystemicIntelligence } from "./core-logic/systemic-intelligence.js";
