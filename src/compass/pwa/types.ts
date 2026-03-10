/**
 * COMPASS PWA — Core type definitions
 *
 * Designed for bureaucratic navigation: offline-first, multilingual, accessible.
 */

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  /** Unix timestamp (ms) */
  timestamp: number;
  /** Optional extra data — e.g. quick-choice options, source citations */
  metadata?: ChatMessageMetadata;
}

export interface ChatMessageMetadata {
  /** Multiple-choice options presented alongside this message */
  quickChoices?: QuickChoice[];
  /** Whether the user can select multiple quick-choice items */
  multiSelect?: boolean;
  /** IDs of quick choices the user selected */
  selectedChoices?: string[];
  /** URL or identifier of a knowledge-base source */
  sourceRef?: string;
  /** Process step this message belongs to */
  stepRef?: string;
}

export interface QuickChoice {
  id: string;
  label: string;
  /** Optional icon/emoji for visual scanning */
  icon?: string;
}

// ---------------------------------------------------------------------------
// Application state
// ---------------------------------------------------------------------------

export type ProcessPhase =
  | "idle"
  | "intake"
  | "eligibility"
  | "guidance"
  | "document"
  | "review"
  | "complete";

export interface AppState {
  sessionId?: string;
  locale: string;
  /** ISO 3166-1 alpha-2 or subdivision code, e.g. "US-CA" */
  jurisdiction?: string;
  currentPhase: ProcessPhase;
  messages: ChatMessage[];
  isOnline: boolean;
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Navigation progress
// ---------------------------------------------------------------------------

export interface NavigationProgress {
  processName: string;
  currentStep: number;
  totalSteps: number;
  /** 0–100 */
  percentage: number;
  nextAction: string;
}

// ---------------------------------------------------------------------------
// Theme / accessibility
// ---------------------------------------------------------------------------

export type ThemeMode = "light" | "dark" | "system";
export type FontSize = "small" | "medium" | "large" | "xlarge";

export interface Theme {
  mode: ThemeMode;
  fontSize: FontSize;
  highContrast: boolean;
}

// ---------------------------------------------------------------------------
// Locale record (for the locale selector)
// ---------------------------------------------------------------------------

export interface LocaleOption {
  /** BCP 47 language tag */
  code: string;
  /** Native name of the language, e.g. "Español" */
  nativeName: string;
  /** Whether this language is RTL */
  rtl: boolean;
}
