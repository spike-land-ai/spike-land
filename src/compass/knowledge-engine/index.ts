/**
 * COMPASS Knowledge Engine
 *
 * Public API surface.  Import from subpaths for smaller bundles:
 *
 *   import { KnowledgeGraph } from "@compass/knowledge-engine/graph"
 *   import { VersionTracker } from "@compass/knowledge-engine/versioning"
 *   import { RegulatoryMonitor } from "@compass/knowledge-engine/regulatory-monitor"
 */

// ── Core graph ─────────────────────────────────────────────────────────────
export { KnowledgeGraph } from "./core-logic/graph.ts";

// ── Versioning ─────────────────────────────────────────────────────────────
export {
  VersionTracker,
  HALF_LIFE_DAYS,
  CONFIDENCE_FLOOR,
} from "./core-logic/versioning.ts";

// ── Regulatory monitor ──────────────────────────────────────────────────────
export { RegulatoryMonitor } from "./core-logic/regulatory-monitor.ts";

// ── Domain types (re-exported for consumers) ────────────────────────────────
export type {
  // Primitives
  CountryCode,
  LanguageCode,
  ISODateTime,
  ConfidenceScore,
  // Versioning
  VersionedEntity,
  // Layer 1
  Jurisdiction,
  JurisdictionLevel,
  // Layer 2
  Program,
  ProgramCategory,
  ProgramStatus,
  // Layer 3
  Process,
  ProcessChannel,
  // Layer 3a
  Step,
  StepType,
  // Layer 4
  Institution,
  InstitutionType,
  // Layer 5
  Outcome,
  OutcomeType,
  // Supporting
  Document,
  DocumentFormat,
  Deadline,
  DeadlineRecurrence,
  // Change detection
  ChangeDetection,
  ChangeType,
  // Graph aggregates
  KnowledgeEntity,
  EntityType,
  StaleEntityRecord,
  ProgramSearchResult,
} from "./types.ts";
