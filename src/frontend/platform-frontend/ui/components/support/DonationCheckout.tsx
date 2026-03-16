import { useCallback, useEffect, useRef, useState } from "react";
import { trackAnalyticsEvent } from "../../hooks/useAnalytics";
import { apiUrl } from "../../../core-logic/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DonationCheckoutProps {
  slug: string;
  initialAmount?: number;
  onClose: () => void;
}

type RecurringMode = "one-time" | "monthly";

interface DonateResponse {
  url?: string;
  error?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRESETS = [3, 5, 10] as const;
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 1000;

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

// ─── DonationCheckout ─────────────────────────────────────────────────────────

export function DonationCheckout({ slug, initialAmount, onClose }: DonationCheckoutProps) {
  const [selectedPreset, setSelectedPreset] = useState<number | "custom">(
    initialAmount && PRESETS.includes(initialAmount as (typeof PRESETS)[number])
      ? initialAmount
      : (PRESETS[1] as number),
  );
  const [customAmount, setCustomAmount] = useState(
    initialAmount && !PRESETS.includes(initialAmount as (typeof PRESETS)[number])
      ? String(initialAmount)
      : "",
  );
  const [mode, setMode] = useState<RecurringMode>("one-time");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const customInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Check if returning from Stripe with ?supported=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("supported")) {
      setSuccess(true);
    }
  }, []);

  // Trap focus inside modal
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable[0]?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const effectiveAmount = useCallback((): number | null => {
    if (selectedPreset === "custom") {
      const n = parseFloat(customAmount);
      if (!Number.isFinite(n) || n < MIN_AMOUNT || n > MAX_AMOUNT) return null;
      return n;
    }
    return selectedPreset;
  }, [selectedPreset, customAmount]);

  const handleSubmit = useCallback(async () => {
    const amount = effectiveAmount();
    if (amount === null) {
      setError(`Please enter an amount between £${MIN_AMOUNT} and £${MAX_AMOUNT}.`);
      return;
    }
    setError(null);
    setLoading(true);

    trackAnalyticsEvent("support_donate_click", { slug, amount, mode });

    try {
      const res = await fetch(apiUrl("/support/donate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, amount, mode, clientId: getClientId() }),
        credentials: "include",
      });
      const data = (await res.json()) as DonateResponse;

      if (data.url) {
        // Validate URL before redirecting
        const target = new URL(data.url, window.location.origin);
        const trusted = ["spike.land", "checkout.stripe.com"];
        const safe =
          target.origin === window.location.origin ||
          trusted.some((d) => target.hostname === d || target.hostname.endsWith(`.${d}`));
        if (safe) {
          window.location.href = data.url;
        } else {
          setError("Unexpected redirect destination. Please try again.");
          setLoading(false);
        }
      } else {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Could not reach the server. Please try again.");
      setLoading(false);
    }
  }, [slug, mode, effectiveAmount]);

  if (success) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Donation successful"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" aria-hidden="true" />
        <div
          ref={dialogRef}
          className="relative z-10 w-full max-w-sm rounded-3xl border border-border bg-card p-8 text-center shadow-2xl"
        >
          <div className="mb-4 text-5xl" aria-hidden="true">
            🙏
          </div>
          <h2 className="text-xl font-black tracking-tight text-foreground">Thank you!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your support keeps spike.land running and independent.
          </p>
          <button
            onClick={onClose}
            className="mt-6 w-full rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="donation-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" aria-hidden="true" />

      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary/70">
              Support spike.land
            </p>
            <h2
              id="donation-modal-title"
              className="mt-0.5 text-lg font-black tracking-tight text-foreground"
            >
              Choose an amount
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close donation dialog"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* One-time / Monthly toggle */}
        <div
          role="group"
          aria-label="Donation frequency"
          className="mb-5 flex rounded-2xl border border-border bg-muted/50 p-1 gap-1"
        >
          {(["one-time", "monthly"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all duration-200 ${
                mode === m
                  ? "bg-card border border-border text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "one-time" ? "One-time" : "Monthly"}
            </button>
          ))}
        </div>

        {/* Amount presets */}
        <div role="group" aria-label="Preset amounts" className="mb-3 grid grid-cols-3 gap-2">
          {PRESETS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setSelectedPreset(amount)}
              aria-pressed={selectedPreset === amount}
              className={`rounded-2xl border py-3 text-sm font-bold tabular-nums transition-all duration-200 active:scale-95 ${
                selectedPreset === amount
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              £{amount}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <button
          type="button"
          onClick={() => {
            setSelectedPreset("custom");
            setTimeout(() => customInputRef.current?.focus(), 50);
          }}
          aria-pressed={selectedPreset === "custom"}
          className={`mb-2 w-full rounded-2xl border py-3 text-sm font-bold transition-all duration-200 ${
            selectedPreset === "custom"
              ? "border-primary bg-primary/5 text-primary"
              : "border-border bg-muted/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
          }`}
        >
          Custom amount
        </button>

        {selectedPreset === "custom" && (
          <div className="mb-4">
            <label htmlFor="custom-amount" className="sr-only">
              Custom amount in GBP
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                £
              </span>
              <input
                ref={customInputRef}
                id="custom-amount"
                type="number"
                min={MIN_AMOUNT}
                max={MAX_AMOUNT}
                step="0.01"
                placeholder="Enter amount"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setError(null);
                }}
                className="w-full rounded-2xl border border-border bg-background py-3 pl-8 pr-4 text-sm font-bold text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground/60">
              Min £{MIN_AMOUNT} · Max £{MAX_AMOUNT}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <p
            role="alert"
            className="mb-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive"
          >
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={() => {
            void handleSubmit();
          }}
          disabled={loading || effectiveAmount() === null}
          className="w-full rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {loading
            ? "Redirecting to Stripe…"
            : `Donate ${
                selectedPreset === "custom"
                  ? customAmount
                    ? `£${customAmount}`
                    : ""
                  : `£${selectedPreset}`
              }${mode === "monthly" ? "/mo" : ""}`}
        </button>

        <p className="mt-3 text-center text-[10px] text-muted-foreground/50">
          Secured by Stripe. Your card details never touch our servers.
        </p>
      </div>
    </div>
  );
}
