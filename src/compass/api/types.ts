// ---------------------------------------------------------------------------
// Core response envelope
// ---------------------------------------------------------------------------

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T = unknown> extends APIResponse<T[]> {
  page: number;
  pageSize: number;
  total: number;
}

// ---------------------------------------------------------------------------
// Request bodies
// ---------------------------------------------------------------------------

/**
 * Body for POST /sessions — creates a new COMPASS session.
 */
export interface SessionCreateRequest {
  /** IETF BCP-47 locale tag (e.g. "en", "fr-CA"). */
  locale: string;
  /** ISO 3166-1 alpha-2 or alpha-3 jurisdiction code (e.g. "CA", "US-CA"). */
  jurisdiction?: string;
}

/**
 * Body for POST /eligibility/check — evaluates eligibility against programs.
 */
export interface EligibilityRequest {
  /** Arbitrary key/value profile data (income, family size, citizenship, etc.) */
  profile: Record<string, unknown>;
  /** Jurisdiction to scope the eligibility check. */
  jurisdiction: string;
}

/**
 * Body for POST /navigation/start or POST /navigation/message.
 */
export interface NavigationRequest {
  sessionId: string;
  programId: string;
  currentStep?: string;
}

/**
 * Body for POST /navigation/message — sends a user message to the navigator.
 */
export interface MessageRequest {
  sessionId: string;
  content: string;
}

/**
 * Query parameters for GET /search/* endpoints.
 * All fields are optional; missing fields are ignored by the search engine.
 */
export interface SearchRequest {
  query: string;
  jurisdiction?: string;
  domain?: string;
  page?: number;
}

// ---------------------------------------------------------------------------
// Domain entity types (used by route responses)
// ---------------------------------------------------------------------------

export interface Session {
  id: string;
  locale: string;
  jurisdiction?: string;
  createdAt: string;
  updatedAt: string;
  status: "active" | "ended";
}

export interface EligibilityResult {
  eligible: boolean;
  programs: EligibleProgram[];
  reasons: string[];
}

export interface EligibleProgram {
  id: string;
  name: string;
  description: string;
  jurisdiction: string;
  eligibilityScore: number;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  jurisdiction: string;
  domain: string;
  requirements: string[];
  documents: string[];
}

export interface NavigationStatus {
  sessionId: string;
  programId: string;
  currentStep: string;
  completedSteps: string[];
  totalSteps: number;
  percentComplete: number;
}

export interface ChecklistItem {
  id: string;
  document: string;
  required: boolean;
  obtained: boolean;
  notes?: string;
}

export interface NavigationChecklist {
  sessionId: string;
  items: ChecklistItem[];
}

export interface NavigationMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Rights {
  jurisdiction: string;
  domain: string;
  rights: RightItem[];
}

export interface RightItem {
  id: string;
  title: string;
  description: string;
  legalBasis?: string;
  applicableWhen?: string;
}

export interface RejectionAnalysis {
  rejected: boolean;
  reasons: string[];
  appealable: boolean;
  appealDeadlineDays?: number;
  recommendedActions: string[];
}

export interface LegalResource {
  id: string;
  title: string;
  url: string;
  type: "guide" | "form" | "organization" | "hotline";
  jurisdiction: string;
  languages: string[];
}

export interface SearchResult<T = unknown> {
  item: T;
  score: number;
  highlights: string[];
}

// ---------------------------------------------------------------------------
// Hono context variable types
// ---------------------------------------------------------------------------

export interface ContextVariables {
  userId: string;
  locale: string;
  requestId: string;
}
