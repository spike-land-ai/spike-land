import React from "react";
import type { ChatMessage } from "../../types.ts";

interface ChatBubbleProps {
  message: ChatMessage;
  /** Whether the UI is rendered in RTL mode */
  rtl?: boolean;
}

const FONT_SIZE = "0.9375rem"; // ~15px — comfortable on low-res screens

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const styles = {
  wrapper: (isUser: boolean, rtl: boolean): React.CSSProperties => ({
    display: "flex",
    flexDirection: "column",
    alignItems: isUser ? (rtl ? "flex-start" : "flex-end") : rtl ? "flex-end" : "flex-start",
    marginBottom: "0.75rem",
    maxWidth: "100%",
  }),

  bubble: (isUser: boolean): React.CSSProperties => ({
    maxWidth: "80%",
    padding: "0.625rem 0.875rem",
    borderRadius: isUser ? "1.25rem 1.25rem 0.25rem 1.25rem" : "1.25rem 1.25rem 1.25rem 0.25rem",
    backgroundColor: isUser ? "#1a56db" : "#f3f4f6",
    color: isUser ? "#ffffff" : "#111827",
    fontSize: FONT_SIZE,
    lineHeight: "1.5",
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
    // Minimum tap target: 44px height is enforced by padding + line-height
  }),

  timestamp: (isUser: boolean): React.CSSProperties => ({
    marginTop: "0.25rem",
    fontSize: "0.75rem",
    color: "#6b7280",
    textAlign: isUser ? "right" : "left",
  }),
} as const;

/**
 * Renders a single chat message bubble.
 *
 * - User messages are right-aligned (left in RTL).
 * - Assistant messages are left-aligned (right in RTL).
 * - System messages are centered and muted — used for status notices.
 */
export function ChatBubble({ message, rtl = false }: ChatBubbleProps): React.ReactElement {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          textAlign: "center",
          fontSize: "0.8125rem",
          color: "#6b7280",
          padding: "0.375rem 0.75rem",
          margin: "0.5rem auto",
          maxWidth: "90%",
          fontStyle: "italic",
        }}
      >
        {message.content}
      </div>
    );
  }

  const senderLabel = isUser ? "You" : "COMPASS";

  return (
    <div style={styles.wrapper(isUser, rtl)} dir={rtl ? "rtl" : "ltr"}>
      {/* Screen-reader-only sender label */}
      <span
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
        }}
      >
        {senderLabel}:
      </span>

      <div
        role="article"
        aria-label={`${senderLabel}: ${message.content}`}
        style={styles.bubble(isUser)}
      >
        {message.content}
      </div>

      <time
        dateTime={new Date(message.timestamp).toISOString()}
        style={styles.timestamp(isUser)}
        aria-hidden="true"
      >
        {formatTime(message.timestamp)}
      </time>
    </div>
  );
}
