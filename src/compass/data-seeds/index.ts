/**
 * COMPASS Data Seeds — Public API
 *
 * Re-exports all types, seed data, and the SeedLoader for consumers.
 */

// Core types
export type {
  CountrySeed,
  JurisdictionData,
  ProgramData,
  ProcessData,
  StepData,
  InstitutionData,
  RightData,
  CriteriaData,
} from "./types.js";

// Seed data
export { germanySeed } from "./seeds/germany.js";
export { indiaSeed } from "./seeds/india.js";
export { unitedStatesSeed } from "./seeds/united-states.js";
export { kenyaSeed } from "./seeds/kenya.js";

// Seed loader
export { SeedLoader, seedLoader } from "./core-logic/seed-loader.js";
export type { ValidationResult } from "./core-logic/seed-loader.js";
