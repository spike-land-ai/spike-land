import React from "react";
import type { QuickChoice } from "../../types.ts";

interface QuickChoicesProps {
  choices: QuickChoice[];
  selected: string[];
  multiSelect?: boolean;
  onSelect: (ids: string[]) => void;
  disabled?: boolean;
  /** Legend/label for the group (screen readers) */
  legend?: string;
  rtl?: boolean;
}

/**
 * Button group for multiple-choice interview questions.
 *
 * - Single-select: tapping a new choice deselects the previous one.
 * - Multi-select: each button toggles independently; submit is via a
 *   "Confirm" button that appears once at least one choice is selected.
 * - Uses role="group" with a visually-hidden legend.
 * - All buttons meet the 44px minimum tap target.
 */
export function QuickChoices({
  choices,
  selected,
  multiSelect = false,
  onSelect,
  disabled = false,
  legend = "Choose an option",
  rtl = false,
}: QuickChoicesProps): React.ReactElement {
  function toggle(id: string): void {
    if (disabled) return;
    if (multiSelect) {
      const next = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
      onSelect(next);
    } else {
      // Single select — selecting the same item deselects it
      onSelect(selected[0] === id ? [] : [id]);
    }
  }

  function confirm(): void {
    // No-op: the parent acts on `selected` change; this just signals intent.
    // We emit the current selection one more time so the parent can treat
    // it as a "send" event if needed.
    onSelect(selected);
  }

  const groupStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    padding: "0.625rem 1rem 0.75rem",
    direction: rtl ? "rtl" : "ltr",
  };

  return (
    <div
      role="group"
      aria-label={legend}
      aria-disabled={disabled}
      style={{ borderTop: "1px solid #e5e7eb" }}
    >
      <div style={groupStyle}>
        {choices.map((choice) => {
          const isSelected = selected.includes(choice.id);
          return (
            <ChoiceButton
              key={choice.id}
              choice={choice}
              isSelected={isSelected}
              disabled={disabled}
              onToggle={toggle}
              multiSelect={multiSelect}
            />
          );
        })}
      </div>

      {multiSelect && selected.length > 0 && (
        <div style={{ padding: "0 1rem 0.75rem", textAlign: rtl ? "right" : "left" }}>
          <button
            type="button"
            onClick={confirm}
            disabled={disabled}
            style={{
              padding: "0.5rem 1.25rem",
              fontSize: "0.9375rem",
              fontWeight: 600,
              backgroundColor: "#1a56db",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.625rem",
              cursor: disabled ? "not-allowed" : "pointer",
              minHeight: "44px",
              transition: "background-color 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!disabled) e.currentTarget.style.backgroundColor = "#1e40af";
            }}
            onMouseLeave={(e) => {
              if (!disabled) e.currentTarget.style.backgroundColor = "#1a56db";
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(26,86,219,0.35)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Confirm ({selected.length} selected)
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internal: individual choice button
// ---------------------------------------------------------------------------

interface ChoiceButtonProps {
  choice: QuickChoice;
  isSelected: boolean;
  disabled: boolean;
  multiSelect: boolean;
  onToggle: (id: string) => void;
}

function ChoiceButton({
  choice,
  isSelected,
  disabled,
  multiSelect,
  onToggle,
}: ChoiceButtonProps): React.ReactElement {
  const buttonStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.375rem",
    padding: "0.5rem 0.875rem",
    minHeight: "44px",
    fontSize: "0.9375rem",
    fontWeight: isSelected ? 600 : 400,
    border: `1.5px solid ${isSelected ? "#1a56db" : "#d1d5db"}`,
    borderRadius: "9999px",
    backgroundColor: isSelected ? "#eff6ff" : "#ffffff",
    color: isSelected ? "#1a56db" : "#374151",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.15s",
    opacity: disabled ? 0.6 : 1,
    userSelect: "none",
    WebkitUserSelect: "none",
  };

  // aria role depends on select mode
  const role = multiSelect ? "checkbox" : "radio";

  return (
    <button
      type="button"
      role={role}
      aria-checked={isSelected}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={() => {
        onToggle(choice.id);
      }}
      style={buttonStyle}
      onMouseEnter={(e) => {
        if (!disabled && !isSelected) {
          e.currentTarget.style.borderColor = "#93c5fd";
          e.currentTarget.style.backgroundColor = "#f8faff";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !isSelected) {
          e.currentTarget.style.borderColor = "#d1d5db";
          e.currentTarget.style.backgroundColor = "#ffffff";
        }
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(26,86,219,0.25)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {choice.icon && (
        <span aria-hidden="true" style={{ fontSize: "1.125rem", lineHeight: 1 }}>
          {choice.icon}
        </span>
      )}
      {choice.label}
    </button>
  );
}
