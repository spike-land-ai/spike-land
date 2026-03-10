import React from "react";
import type { NavigationProgress } from "../../types.ts";

interface ProgressBarProps {
  progress: NavigationProgress;
  /** If true, render a compact single-line variant */
  compact?: boolean;
}

/**
 * Visual step-by-step progress indicator for bureaucratic process navigation.
 *
 * Accessibility:
 * - Uses role="progressbar" with aria-valuenow / aria-valuemin / aria-valuemax.
 * - Labels describe both the process name and the next action.
 * - High-contrast-safe: progress fill is a solid color, no gradient.
 */
export function ProgressBar({ progress, compact = false }: ProgressBarProps): React.ReactElement {
  const { processName, currentStep, totalSteps, percentage, nextAction } = progress;
  // Clamp percentage to [0, 100] defensively
  const clampedPct = Math.min(100, Math.max(0, percentage));

  const containerStyle: React.CSSProperties = {
    padding: compact ? "0.5rem 1rem" : "0.75rem 1rem 0.875rem",
    backgroundColor: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: compact ? "0.375rem" : "0.5rem",
    gap: "0.5rem",
  };

  const processNameStyle: React.CSSProperties = {
    fontSize: compact ? "0.8125rem" : "0.875rem",
    fontWeight: 600,
    color: "#374151",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
  };

  const stepCountStyle: React.CSSProperties = {
    fontSize: compact ? "0.75rem" : "0.8125rem",
    color: "#6b7280",
    flexShrink: 0,
    fontVariantNumeric: "tabular-nums",
  };

  const trackStyle: React.CSSProperties = {
    height: compact ? "6px" : "8px",
    borderRadius: "9999px",
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
  };

  const fillStyle: React.CSSProperties = {
    height: "100%",
    width: `${clampedPct}%`,
    backgroundColor: "#1a56db",
    borderRadius: "9999px",
    transition: "width 0.4s ease",
  };

  const nextActionStyle: React.CSSProperties = {
    marginTop: compact ? "0.375rem" : "0.5rem",
    fontSize: "0.8125rem",
    color: "#374151",
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
  };

  const ariaLabel = `${processName}: step ${currentStep} of ${totalSteps}, ${clampedPct}% complete. Next: ${nextAction}`;

  return (
    <div style={containerStyle} aria-label="Process progress">
      <div style={headerStyle}>
        <span style={processNameStyle} title={processName}>
          {processName}
        </span>
        <span style={stepCountStyle} aria-hidden="true">
          {currentStep} / {totalSteps}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={clampedPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel}
        style={trackStyle}
      >
        <div style={fillStyle} />
      </div>

      {!compact && (
        <p style={nextActionStyle}>
          {/* Arrow icon */}
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1a56db"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          <span>
            <strong style={{ fontWeight: 600, color: "#1a56db" }}>Next: </strong>
            {nextAction}
          </span>
        </p>
      )}
    </div>
  );
}
