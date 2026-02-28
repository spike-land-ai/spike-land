"use client";

import { useEffect } from "react";

import { reportErrorBoundary } from "@/lib/errors/console-capture.client";

function isStaleDeploymentError(error: Error): boolean {
  if (typeof error.message !== "string") return false;
  return (
    error.message.includes("Failed to find Server Action")
    || error.message.includes("Loading chunk")
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string; };
  reset: () => void;
}) {
  useEffect(() => {
    if (isStaleDeploymentError(error)) {
      try {
        const key = "stale-deployment-reload";
        const last = sessionStorage.getItem(key);
        const now = Date.now();
        if (!last || now - parseInt(last, 10) > 10_000) {
          sessionStorage.setItem(key, String(now));
          window.location.reload();
          return;
        }
      } catch {
        // sessionStorage unavailable — fall through
      }
      return;
    }

    reportErrorBoundary(error);
  }, [error]);

  if (isStaleDeploymentError(error)) {
    return (
      <html lang="en">
        <body>
          <div
            style={{
              display: "flex",
              minHeight: "100vh",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            <div style={{ textAlign: "center", maxWidth: "400px" }}>
              <h2>Page Update Available</h2>
              <p style={{ color: "#666" }}>
                A newer version of this page is available. Please refresh to get the latest version.
              </p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: "8px 16px",
                  marginRight: "8px",
                  cursor: "pointer",
                }}
              >
                Refresh Page
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                style={{ padding: "8px 16px", cursor: "pointer" }}
              >
                Go home
              </button>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div>
            <h2>Something went wrong!</h2>
            <p>We encountered an unexpected error. Please try again.</p>
            <button onClick={reset}>Try again</button>
          </div>
        </div>
      </body>
    </html>
  );
}
