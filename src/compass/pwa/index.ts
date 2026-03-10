/**
 * COMPASS PWA — public surface
 *
 * Re-exports all components, hooks, types, and constants so consumers
 * (e.g. the platform-frontend shell or Storybook) can import from a single
 * entry point: `@compass/pwa`.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type {
  AppState,
  ChatMessage,
  ChatMessageMetadata,
  FontSize,
  LocaleOption,
  MessageRole,
  NavigationProgress,
  ProcessPhase,
  QuickChoice,
  Theme,
  ThemeMode,
} from "./types.ts";

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------
export { ChatBubble } from "./ui/components/ChatBubble.tsx";
export { ChatInput } from "./ui/components/ChatInput.tsx";
export { DEFAULT_LOCALES, LocaleSelector } from "./ui/components/LocaleSelector.tsx";
export { OfflineBanner } from "./ui/components/OfflineBanner.tsx";
export { ProgressBar } from "./ui/components/ProgressBar.tsx";
export { QuickChoices } from "./ui/components/QuickChoices.tsx";

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
export { useChat } from "./ui/hooks/useChat.ts";
export { useLocale } from "./ui/hooks/useLocale.ts";
export { useOnlineStatus } from "./ui/hooks/useOnlineStatus.ts";

// ---------------------------------------------------------------------------
// App (root component)
// ---------------------------------------------------------------------------
export { App } from "./ui/App.tsx";
