import React, { useEffect, useRef } from "react";
import type { NavigationProgress, QuickChoice } from "../types.ts";
import { ChatBubble } from "./components/ChatBubble.tsx";
import { ChatInput } from "./components/ChatInput.tsx";
import { LocaleSelector, DEFAULT_LOCALES } from "./components/LocaleSelector.tsx";
import { OfflineBanner } from "./components/OfflineBanner.tsx";
import { ProgressBar } from "./components/ProgressBar.tsx";
import { QuickChoices } from "./components/QuickChoices.tsx";
import { useChat } from "./hooks/useChat.ts";
import { useLocale } from "./hooks/useLocale.ts";
import { useOnlineStatus } from "./hooks/useOnlineStatus.ts";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AppProps {
  /**
   * If provided, the assistant integration is wired up here.
   * Receives a ChatMessage and must return the assistant's text reply.
   */
  onSendMessage?: (message: import("../types.ts").ChatMessage) => Promise<string>;
  /** Optional current navigation progress to display */
  progress?: NavigationProgress;
}

// ---------------------------------------------------------------------------
// Inline styles — no external CSS framework, RTL-aware
// ---------------------------------------------------------------------------

const appShellStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100dvh", // dynamic viewport height — correct on mobile browsers
  maxWidth: "680px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  position: "relative",
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0.75rem 1rem",
  borderBottom: "1px solid #e5e7eb",
  backgroundColor: "#ffffff",
  zIndex: 10,
  flexShrink: 0,
};

const logoStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
};

const logoTextStyle: React.CSSProperties = {
  fontSize: "1.125rem",
  fontWeight: 700,
  color: "#111827",
  letterSpacing: "-0.01em",
};

const taglineStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  color: "#6b7280",
  marginTop: "1px",
};

const messagesAreaStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "1rem 1rem 0.5rem",
  // Smooth scrolling for message arrivals
  scrollBehavior: "smooth",
  WebkitOverflowScrolling: "touch",
};

const inputAreaStyle: React.CSSProperties = {
  flexShrink: 0,
};

const emptyStateStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  padding: "2rem 1.5rem",
  textAlign: "center",
  color: "#6b7280",
  gap: "0.75rem",
};

// ---------------------------------------------------------------------------
// Greeting shown before any messages
// ---------------------------------------------------------------------------

function EmptyState({ rtl }: { rtl: boolean }): React.ReactElement {
  return (
    <div style={emptyStateStyle} dir={rtl ? "rtl" : "ltr"} aria-label="Welcome to COMPASS">
      {/* Compass rose icon */}
      <svg
        aria-hidden="true"
        width="56"
        height="56"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#1a56db"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.7 }}
      >
        <circle cx="12" cy="12" r="10" />
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>

      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", margin: 0 }}>
        Welcome to COMPASS
      </h1>
      <p style={{ fontSize: "0.9375rem", maxWidth: "320px", lineHeight: "1.6", margin: 0 }}>
        I'm here to help you navigate government systems, benefits, and official processes — one
        step at a time. Ask me anything. Take your time.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------

export function App({ onSendMessage, progress }: AppProps): React.ReactElement {
  const { isOnline } = useOnlineStatus();
  const { locale, isRtl, setLocale } = useLocale(DEFAULT_LOCALES);
  const { messages, isLoading, sendMessage, sendQuickChoices } = useChat(
    onSendMessage != null ? { onSendMessage } : {},
  );

  // Refs for auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Determine if the last assistant message has quick choices
  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
  const pendingQuickChoices: QuickChoice[] | undefined = lastAssistantMsg?.metadata?.quickChoices;
  const isMultiSelect = lastAssistantMsg?.metadata?.multiSelect ?? false;
  const [selectedChoices, setSelectedChoices] = React.useState<string[]>([]);

  // Reset selected choices when quick choices change
  const lastMsgId = lastAssistantMsg?.id;
  useEffect(() => {
    setSelectedChoices([]);
  }, [lastMsgId]);

  async function handleQuickChoiceConfirm(ids: string[]): Promise<void> {
    if (!pendingQuickChoices) return;
    setSelectedChoices([]);
    await sendQuickChoices(pendingQuickChoices, ids);
  }

  const dir = isRtl ? "rtl" : "ltr";

  return (
    <div style={appShellStyle} dir={dir}>
      {/* Header */}
      <header style={{ ...headerStyle, flexDirection: isRtl ? "row-reverse" : "row" }}>
        <div style={{ ...logoStyle, flexDirection: isRtl ? "row-reverse" : "row" }}>
          <svg
            aria-hidden="true"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1a56db"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <div>
            <div style={logoTextStyle}>COMPASS</div>
            <div style={taglineStyle}>Free AI guidance</div>
          </div>
        </div>

        <LocaleSelector
          locales={DEFAULT_LOCALES}
          currentLocale={locale}
          onChange={setLocale}
          compact
        />
      </header>

      {/* Offline banner — announced to screen readers immediately */}
      <OfflineBanner isOnline={isOnline} />

      {/* Navigation progress (shown only during active process navigation) */}
      {progress != null && <ProgressBar progress={progress} />}

      {/* Messages area */}
      <main
        id="compass-messages"
        style={messagesAreaStyle}
        aria-label="Conversation"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 ? (
          <EmptyState rtl={isRtl} />
        ) : (
          messages.map((msg) => <ChatBubble key={msg.id} message={msg} rtl={isRtl} />)
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div
            aria-live="polite"
            aria-label="COMPASS is typing"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "0.625rem 0.875rem",
              marginBottom: "0.75rem",
              width: "fit-content",
              backgroundColor: "#f3f4f6",
              borderRadius: "1.25rem 1.25rem 1.25rem 0.25rem",
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                aria-hidden="true"
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: "#9ca3af",
                  display: "block",
                  animation: `compass-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
            <style>{`
              @keyframes compass-bounce {
                0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
                40%           { transform: scale(1);   opacity: 1; }
              }
            `}</style>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} aria-hidden="true" />
      </main>

      {/* Input area */}
      <footer style={inputAreaStyle}>
        {pendingQuickChoices && pendingQuickChoices.length > 0 ? (
          <QuickChoices
            choices={pendingQuickChoices}
            selected={selectedChoices}
            multiSelect={isMultiSelect}
            onSelect={(ids) => {
              setSelectedChoices(ids);
              if (!isMultiSelect && ids.length > 0) {
                void handleQuickChoiceConfirm(ids);
              }
            }}
            disabled={isLoading}
            rtl={isRtl}
          />
        ) : null}

        <ChatInput
          onSend={(text) => {
            void sendMessage(text);
          }}
          isLoading={isLoading}
          rtl={isRtl}
        />
      </footer>
    </div>
  );
}
