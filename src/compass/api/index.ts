// ---------------------------------------------------------------------------
// Public API surface
// ---------------------------------------------------------------------------

// App factory + engine interfaces
export { createApp } from "./app.js";
export type { CompassEngines } from "./app.js";

// All shared types
export type {
  APIResponse,
  PaginatedResponse,
  SessionCreateRequest,
  EligibilityRequest,
  NavigationRequest,
  MessageRequest,
  SearchRequest,
  Session,
  EligibilityResult,
  EligibleProgram,
  Program,
  NavigationStatus,
  NavigationChecklist,
  ChecklistItem,
  NavigationMessage,
  Rights,
  RightItem,
  RejectionAnalysis,
  LegalResource,
  SearchResult,
  ContextVariables,
} from "./types.js";

// Engine interfaces (for implementing adapters)
export type { SessionEngine } from "./core-logic/routes/sessions.js";
export type { EligibilityEngine } from "./core-logic/routes/eligibility.js";
export type { NavigationEngine } from "./core-logic/routes/navigation.js";
export type { RightsEngine } from "./core-logic/routes/rights.js";
export type { SearchEngine } from "./core-logic/routes/search.js";

// Middleware (for external composition)
export { authMiddleware } from "./core-logic/middleware/auth.js";
export { RateLimiter } from "./core-logic/middleware/rate-limit.js";
export { localeMiddleware } from "./core-logic/middleware/locale.js";
