import React, { useEffect, useState } from "react";

interface OfflineBannerProps {
  isOnline: boolean;
  /** Override the offline message for i18n */
  offlineMessage?: string;
  /** Override the back-online message for i18n */
  onlineMessage?: string;
}

/**
 * Banner displayed when the device loses connectivity.
 *
 * - Reassures the user that core guidance features still work offline.
 * - When connectivity is restored a brief "Back online" confirmation is shown,
 *   then the banner disappears automatically.
 * - Uses role="alert" so screen readers announce it immediately.
 * - Animates in/out with a CSS slide-down for minimal distraction.
 */
export function OfflineBanner({
  isOnline,
  offlineMessage = "You're offline — guidance and your conversation history are still available.",
  onlineMessage = "You're back online.",
}: OfflineBannerProps): React.ReactElement | null {
  // Track previous online state to trigger "back online" flash
  const [justReconnected, setJustReconnected] = useState(false);
  const [visible, setVisible] = useState(!isOnline);

  useEffect(() => {
    if (isOnline && visible) {
      setJustReconnected(true);
      // Show "back online" for 2.5 s then hide
      const timer = setTimeout(() => {
        setJustReconnected(false);
        setVisible(false);
      }, 2500);
      return () => {
        clearTimeout(timer);
      };
    }

    if (!isOnline) {
      setVisible(true);
      setJustReconnected(false);
    }

    return undefined;
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps — intentional

  if (!visible) return null;

  const isWarning = !isOnline;
  const backgroundColor = isWarning ? "#fef3c7" : "#d1fae5";
  const borderColor = isWarning ? "#fbbf24" : "#34d399";
  const textColor = isWarning ? "#92400e" : "#065f46";
  const iconPath = isWarning
    ? // Cloud-off icon
      "M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25M8 16h.01M12 16h.01M16 16h.01"
    : // Check-circle icon
      "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3";

  return (
    <>
      <style>{`
        @keyframes compass-slide-down {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "0.625rem",
          padding: "0.625rem 1rem",
          backgroundColor,
          borderBottom: `2px solid ${borderColor}`,
          animation: "compass-slide-down 0.25s ease-out",
        }}
      >
        {/* Icon */}
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke={textColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0, marginTop: "1px" }}
        >
          <path d={iconPath} />
        </svg>

        <p
          style={{
            margin: 0,
            fontSize: "0.875rem",
            lineHeight: "1.5",
            color: textColor,
          }}
        >
          {justReconnected ? onlineMessage : offlineMessage}
        </p>
      </div>
    </>
  );
}
