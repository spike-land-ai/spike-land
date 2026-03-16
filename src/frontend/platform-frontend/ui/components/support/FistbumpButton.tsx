import { useCallback, useEffect, useRef, useState } from "react";
import { trackAnalyticsEvent } from "../../hooks/useAnalytics";
import { apiUrl } from "../../../core-logic/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FistbumpButtonProps {
  slug: string;
  className?: string;
}

interface FistbumpResponse {
  count: number;
  alreadyBumped?: boolean;
}

interface EngagementResponse {
  fistBumps: number;
  supporters: number;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function getClientId(): string {
  const key = "spike_client_id";
  try {
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function getBumpedKey(slug: string): string {
  return `spike_bumped_${slug}`;
}

// ─── FistbumpButton ───────────────────────────────────────────────────────────

export function FistbumpButton({ slug, className }: FistbumpButtonProps) {
  const [bumped, setBumped] = useState(false);
  const [count, setCount] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore persisted bump state and fetch live count
  useEffect(() => {
    try {
      if (localStorage.getItem(getBumpedKey(slug))) {
        setBumped(true);
      }
    } catch {
      // localStorage unavailable — ignore
    }

    fetch(apiUrl(`/support/engagement/${encodeURIComponent(slug)}`), { credentials: "include" })
      .then((r) => (r.ok ? (r.json() as Promise<EngagementResponse>) : null))
      .then((data) => {
        if (data) setCount(data.fistBumps);
      })
      .catch(() => {});
  }, [slug]);

  // Cleanup animation timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  const handleBump = useCallback(async () => {
    if (bumped) return;

    // Optimistic update
    setCount((prev) => prev + 1);
    setAnimating(true);
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setAnimating(false), 650);

    trackAnalyticsEvent("support_fistbump", { slug });

    try {
      const res = await fetch(apiUrl("/support/fistbump"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, clientId: getClientId() }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("fistbump failed");
      const data = (await res.json()) as FistbumpResponse;

      // Reconcile with server count
      setCount(data.count);
      setBumped(true);

      try {
        localStorage.setItem(getBumpedKey(slug), "1");
      } catch {
        // best-effort
      }
    } catch {
      // Revert optimistic update on network failure
      setCount((prev) => Math.max(0, prev - 1));
    }
  }, [bumped, slug]);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => {
          void handleBump();
        }}
        disabled={bumped}
        aria-label={bumped ? "Already fist-bumped — thank you!" : "Fist bump this post"}
        aria-pressed={bumped}
        className={[
          "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-xl",
          "transition-all duration-300 select-none",
          bumped
            ? "border-primary/20 bg-primary/10 text-primary cursor-default"
            : "border-border bg-muted hover:border-primary/40 hover:bg-primary/10 hover:scale-110 active:scale-95 cursor-pointer",
          animating ? "scale-125 rotate-[20deg]" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Ripple ring on bump */}
        {animating && (
          <span
            className="absolute inset-0 rounded-2xl animate-ping bg-primary/20"
            aria-hidden="true"
          />
        )}

        {/* Fist emoji — transitions between ready and bumped states */}
        <span
          aria-hidden="true"
          className={`transition-transform duration-300 ${animating ? "scale-125" : "scale-100"}`}
        >
          {bumped ? "✊" : "🤜"}
        </span>
      </button>

      {count > 0 && (
        <p
          aria-live="polite"
          aria-atomic="true"
          className="mt-1.5 text-center text-[11px] font-semibold tabular-nums text-muted-foreground/70"
        >
          {count.toLocaleString()} {count === 1 ? "bump" : "bumps"}
        </p>
      )}
    </div>
  );
}
