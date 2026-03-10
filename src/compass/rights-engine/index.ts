/**
 * COMPASS Rights Engine
 *
 * Public surface of the @compass/rights-engine package.
 *
 * Independence guarantee: this engine exposes every right, every appeal
 * pathway, and every legal resource that has been registered — without
 * filtering or suppression based on institutional partnerships.
 */

// Types
export type {
  Right,
  RightsDomain,
  AppealTemplate,
  AppealType,
  LegalResource,
  LegalResourceType,
  ContactInfo,
  RejectionAnalysis,
  SuccessLikelihood,
  ProcessStageRights,
} from "./types.js";

// Core logic
export { RightsDatabase } from "./core-logic/rights-lookup.js";
export { AppealEngine } from "./core-logic/appeal-engine.js";
export type { UserContext } from "./core-logic/appeal-engine.js";
export { ResourceFinder } from "./core-logic/legal-resources.js";
