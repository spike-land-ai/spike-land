import React, { useRef, useState } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** Label for the send button (for i18n) */
  sendLabel?: string;
  /** Label for the text area (for i18n / a11y) */
  inputLabel?: string;
  rtl?: boolean;
}

const MIN_HEIGHT = 44; // px — WCAG 2.5.8 minimum tap target
const MAX_HEIGHT = 160; // px — prevent textarea from growing too tall

/**
 * Chat text input with send button.
 *
 * - Auto-grows vertically up to MAX_HEIGHT.
 * - Enter sends (Shift+Enter adds newline).
 * - Fully keyboard-accessible with visible focus rings.
 * - "Take your time…" placeholder reinforces radically patient UX.
 */
export function ChatInput({
  onSend,
  isLoading = false,
  disabled = false,
  placeholder = "Take your time… type your question here",
  sendLabel = "Send",
  inputLabel = "Your message",
  rtl = false,
}: ChatInputProps): React.ReactElement {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isEffectivelyDisabled = disabled || isLoading;
  const canSend = value.trim().length > 0 && !isEffectivelyDisabled;

  function autoResize(): void {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>): void {
    setValue(e.target.value);
    autoResize();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit(): void {
    const trimmed = value.trim();
    if (!trimmed || isEffectivelyDisabled) return;
    onSend(trimmed);
    setValue("");
    // Reset height after clearing
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  const containerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-end",
    gap: "0.5rem",
    padding: "0.75rem 1rem",
    borderTop: "1px solid #e5e7eb",
    backgroundColor: "#ffffff",
    direction: rtl ? "rtl" : "ltr",
  };

  const textareaStyle: React.CSSProperties = {
    flex: 1,
    minHeight: `${MIN_HEIGHT}px`,
    maxHeight: `${MAX_HEIGHT}px`,
    padding: "0.625rem 0.75rem",
    fontSize: "1rem",
    lineHeight: "1.5",
    border: "1.5px solid #d1d5db",
    borderRadius: "0.75rem",
    resize: "none",
    outline: "none",
    fontFamily: "inherit",
    color: "#111827",
    backgroundColor: isEffectivelyDisabled ? "#f9fafb" : "#ffffff",
    cursor: isEffectivelyDisabled ? "not-allowed" : "text",
    // Focus ring handled via :focus-visible pseudo-class; we add a style tag workaround below
    transition: "border-color 0.15s",
    overflowY: "auto",
  };

  const buttonStyle: React.CSSProperties = {
    flexShrink: 0,
    height: `${MIN_HEIGHT}px`,
    width: `${MIN_HEIGHT}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    border: "none",
    backgroundColor: canSend ? "#1a56db" : "#d1d5db",
    color: canSend ? "#ffffff" : "#9ca3af",
    cursor: canSend ? "pointer" : "not-allowed",
    transition: "background-color 0.15s, transform 0.1s",
    outline: "none",
    // Will show focus ring via box-shadow when focused
  };

  return (
    <div style={containerStyle} role="region" aria-label="Message input">
      <label
        htmlFor="compass-chat-input"
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
        }}
      >
        {inputLabel}
      </label>

      <textarea
        id="compass-chat-input"
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isEffectivelyDisabled}
        aria-disabled={isEffectivelyDisabled}
        aria-label={inputLabel}
        aria-multiline="true"
        rows={1}
        style={textareaStyle}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#1a56db";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(26,86,219,0.25)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#d1d5db";
          e.currentTarget.style.boxShadow = "none";
        }}
      />

      <button
        type="button"
        onClick={submit}
        disabled={!canSend}
        aria-label={isLoading ? "Sending…" : sendLabel}
        aria-busy={isLoading}
        style={buttonStyle}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(26,86,219,0.35)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = "none";
        }}
        onMouseEnter={(e) => {
          if (canSend) e.currentTarget.style.backgroundColor = "#1e40af";
        }}
        onMouseLeave={(e) => {
          if (canSend) e.currentTarget.style.backgroundColor = "#1a56db";
        }}
      >
        {isLoading ? (
          /* Simple CSS spinner via border trick */
          <span
            aria-hidden="true"
            style={{
              display: "block",
              width: "18px",
              height: "18px",
              border: "2px solid rgba(255,255,255,0.4)",
              borderTopColor: "#ffffff",
              borderRadius: "50%",
              animation: "compass-spin 0.6s linear infinite",
            }}
          />
        ) : (
          /* Send arrow SVG — accessible via button aria-label */
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        )}
      </button>

      {/* Keyframe for spinner — injected once */}
      <style>{`
        @keyframes compass-spin {
          to { transform: rotate(360deg); }
        }
        #compass-chat-input:focus-visible {
          outline: none;
        }
      `}</style>
    </div>
  );
}
