import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { Link } from "../lazy-imports/link";

/* ── Chat transcript data ── */
const CHAT: { role: "u" | "a"; text: string; signal?: boolean }[] = [
  { role: "u", text: "I need a dashboard for real-time analytics", signal: true },
  { role: "a", text: "What kind of analytics? Page views, conversions, or custom events?" },
  { role: "u", text: "All three. Updates every 5 seconds, no page refresh", signal: true },
  { role: "a", text: "Should I use WebSockets or SSE for the real-time updates?" },
  {
    role: "u",
    text: "WebSockets. Must work on mobile — CEO checks it every morning",
    signal: true,
  },
  { role: "a", text: "Makes sense. What about authentication?" },
  { role: "u", text: "Google OAuth. Data scoped per organization", signal: true },
  { role: "a", text: "I'll set up multi-tenant isolation. Chart library preference?" },
  {
    role: "u",
    text: "Recharts, keep it clean. Dark mode required — whole team uses it",
    signal: true,
  },
  { role: "a", text: "Adding a date range picker. Any data retention period?" },
  { role: "u", text: "90 days rolling. No experimental APIs — ships next week", signal: true },
];

/* ── Extracted PRD fields ── */
const PRD: { key: string; label: string; value: string; sources: number[] }[] = [
  {
    key: "task",
    label: "Task",
    value: "Real-time analytics dashboard. WebSocket push, 5-second interval.",
    sources: [0, 2],
  },
  {
    key: "constraints",
    label: "Constraints",
    value: "Mobile-first · Dark mode · Stable APIs only · Production-grade",
    sources: [4, 8, 10],
  },
  {
    key: "acceptance",
    label: "Acceptance",
    value: "Google OAuth · Multi-tenant data isolation · 90-day rolling window",
    sources: [6, 10],
  },
  {
    key: "context",
    label: "Context",
    value: "CEO is a daily mobile user · Team-wide dark mode · Recharts preferred",
    sources: [4, 8],
  },
  {
    key: "priority",
    label: "Priority",
    value: "P0 — production deployment next week",
    sources: [10],
  },
];

/* ── Extraction schedule: which PRD field unlocks at which scan step ── */
const SCHEDULE: { scanUpTo: number; unlockField: number }[] = [
  { scanUpTo: 2, unlockField: 0 },
  { scanUpTo: 5, unlockField: -1 },
  { scanUpTo: 7, unlockField: 1 },
  { scanUpTo: 8, unlockField: 2 },
  { scanUpTo: 9, unlockField: 3 },
  { scanUpTo: 10, unlockField: 4 },
];

const STEP_DURATION = 900;

export function PrdFilterDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scanIndex, setScanIndex] = useState(-1); // -1 = idle, 0-10 = current scan line
  const [unlockedFields, setUnlockedFields] = useState<Set<number>>(new Set());
  const [complete, setComplete] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hasAutoPlayed = useRef(false);

  const clearAllTimeouts = useCallback(() => {
    for (const t of timeoutsRef.current) clearTimeout(t);
    timeoutsRef.current = [];
  }, []);

  const runSequence = useCallback(() => {
    clearAllTimeouts();
    setScanIndex(-1);
    setUnlockedFields(new Set());
    setComplete(false);

    let delay = 600;

    for (const step of SCHEDULE) {
      // Scan through messages up to scanUpTo
      const scanTarget = step.scanUpTo;
      const fieldToUnlock = step.unlockField;

      timeoutsRef.current.push(
        setTimeout(() => {
          setScanIndex(scanTarget);
          if (fieldToUnlock >= 0) {
            setUnlockedFields((prev) => new Set([...prev, fieldToUnlock]));
          }
        }, delay),
      );
      delay += STEP_DURATION;
    }

    // Complete
    timeoutsRef.current.push(
      setTimeout(() => {
        setScanIndex(CHAT.length);
        setComplete(true);
      }, delay + 400),
    );
  }, [clearAllTimeouts]);

  // Auto-play on scroll into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !hasAutoPlayed.current) {
          hasAutoPlayed.current = true;
          runSequence();
        }
      },
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [runSequence]);

  useEffect(() => {
    return clearAllTimeouts;
  }, [clearAllTimeouts]);

  const handleReplay = () => {
    runSequence();
  };

  // Derived state
  const isScanning = scanIndex >= 0;
  const scanProgress = scanIndex >= 0 ? Math.min(scanIndex / (CHAT.length - 1), 1) : 0;

  return (
    <section
      ref={containerRef}
      aria-labelledby="prd-filter-heading"
      className="rubik-container-wide px-4 py-16 sm:py-24"
    >
      {/* Section header */}
      <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary"
        >
          The PRD Filter
        </motion.p>
        <motion.h2
          id="prd-filter-heading"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl font-bold tracking-[-0.04em] text-foreground sm:text-5xl"
        >
          Your old chats are already PRDs.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          They&apos;re just trapped in transcript form. Watch 11&nbsp;messages become
          5&nbsp;executable lines.
        </motion.p>
      </div>

      {/* Demo panels */}
      <div className="relative mx-auto max-w-6xl">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6">
          {/* ── LEFT: Chat transcript ── */}
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl">
            {/* Terminal header */}
            <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="size-2.5 rounded-full bg-red-400/70" />
                <span className="size-2.5 rounded-full bg-amber-400/70" />
                <span className="size-2.5 rounded-full bg-green-400/70" />
              </div>
              <span className="ml-2 font-mono text-[11px] tracking-wide text-muted-foreground/70">
                transcript.log — {CHAT.length} messages
              </span>
              {complete && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="ml-auto font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-amber-500"
                >
                  processed
                </motion.span>
              )}
            </div>

            {/* Messages */}
            <div className="relative max-h-[420px] overflow-y-auto p-3 sm:p-4">
              {/* Scan beam */}
              {isScanning && !complete && (
                <motion.div
                  className="pointer-events-none absolute inset-x-0 z-10 h-[3px]"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, var(--primary) 20%, var(--primary) 80%, transparent 100%)",
                    boxShadow: "0 0 20px var(--primary-glow), 0 0 60px var(--primary-glow)",
                  }}
                  animate={{
                    top: `${12 + scanProgress * 88}%`,
                  }}
                  transition={{ type: "spring", stiffness: 60, damping: 18 }}
                />
              )}

              <div className="space-y-1.5">
                {CHAT.map((msg, i) => {
                  const isScanned = scanIndex >= i;
                  const isActive = scanIndex === i;
                  const isNoise = isScanned && !msg.signal && !isActive;
                  const isExtracted = isScanned && msg.signal && !isActive;

                  return (
                    <motion.div
                      key={i}
                      layout
                      className="relative rounded-lg px-3 py-2 transition-all duration-500"
                      style={{
                        opacity: isNoise
                          ? 0.25
                          : isExtracted
                            ? 0.55
                            : isActive
                              ? 1
                              : isScanning
                                ? 0.7
                                : 0.85,
                        textDecoration: isNoise ? "line-through" : "none",
                        textDecorationColor: "var(--muted-foreground)",
                      }}
                      animate={{
                        backgroundColor: isActive ? "var(--primary-glow)" : "transparent",
                        borderColor: isActive ? "var(--primary)" : "transparent",
                        scale: isActive ? 1.01 : 1,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Left accent for signal messages when extracted */}
                      {isExtracted && (
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-primary/60"
                        />
                      )}

                      <div className="flex gap-2.5">
                        <span
                          className={`mt-0.5 shrink-0 font-mono text-[10px] font-bold uppercase tracking-wider ${
                            msg.role === "u"
                              ? isActive
                                ? "text-primary"
                                : "text-foreground/60"
                              : "text-muted-foreground/40"
                          }`}
                        >
                          {msg.role === "u" ? "you" : " ai"}
                        </span>
                        <span
                          className={`text-[13px] leading-relaxed transition-colors duration-300 ${
                            isActive
                              ? "font-medium text-foreground"
                              : isNoise
                                ? "text-muted-foreground/50"
                                : "text-foreground/80"
                          }`}
                        >
                          {msg.text}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Extracted PRD ── */}
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl">
            {/* Doc header */}
            <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="size-2.5 rounded-full bg-red-400/70" />
                <span className="size-2.5 rounded-full bg-amber-400/70" />
                <span className="size-2.5 rounded-full bg-green-400/70" />
              </div>
              <span className="ml-2 font-mono text-[11px] tracking-wide text-muted-foreground/70">
                requirement.prd — extracted
              </span>
              {complete && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  onClick={handleReplay}
                  className="ml-auto flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Replay extraction"
                >
                  <RotateCcw className="size-3" />
                  Replay
                </motion.button>
              )}
            </div>

            {/* PRD fields */}
            <div className="p-4 sm:p-5">
              <div className="space-y-3">
                {PRD.map((field, i) => {
                  const isUnlocked = unlockedFields.has(i);
                  return (
                    <div key={field.key} className="relative">
                      <AnimatePresence mode="wait">
                        {isUnlocked ? (
                          <motion.div
                            initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            transition={{
                              duration: 0.5,
                              type: "spring",
                              stiffness: 100,
                              damping: 16,
                            }}
                            className="group relative overflow-hidden rounded-xl border border-border/40 bg-muted/30 p-3.5"
                          >
                            {/* Shimmer sweep on entry */}
                            <motion.div
                              initial={{ x: "-100%" }}
                              animate={{ x: "200%" }}
                              transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
                              className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
                            />

                            <div className="flex items-start gap-3">
                              {/* Checkmark */}
                              <motion.div
                                initial={{ scale: 0, rotate: -90 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                  delay: 0.3,
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 15,
                                }}
                                className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary"
                              >
                                <svg
                                  className="size-3 text-primary-foreground"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={3}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </motion.div>

                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                                  {field.label}
                                </p>
                                <p className="mt-1 text-[13px] font-medium leading-relaxed text-foreground">
                                  {field.value}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="rounded-xl border border-dashed border-border/30 bg-muted/10 p-3.5"
                          >
                            <div className="flex items-center gap-3">
                              <div className="size-5 shrink-0 rounded-full border-2 border-border/30" />
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/40">
                                  {field.label}
                                </p>
                                <div className="mt-1.5 h-3 w-32 rounded bg-muted/30 sm:w-48" />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Compression result */}
              <AnimatePresence>
                {complete && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6, type: "spring", stiffness: 80 }}
                    className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center"
                  >
                    <div className="flex items-center justify-center gap-3 text-sm">
                      <span className="font-mono text-muted-foreground line-through decoration-2">
                        11 messages
                      </span>
                      <motion.span
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.9, duration: 0.3 }}
                        className="text-primary"
                      >
                        →
                      </motion.span>
                      <motion.span
                        initial={{ opacity: 0, scale: 1.2 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.1, type: "spring", stiffness: 200 }}
                        className="font-mono font-bold text-primary"
                      >
                        5 executable fields
                      </motion.span>
                    </div>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.5 }}
                      className="mt-2 text-xs font-medium text-muted-foreground"
                    >
                      The requirement was always there. The noise wasn&apos;t.
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <AnimatePresence>
          {complete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.6 }}
              className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
            >
              <Link
                href="/blog/the-prd-filter-old-chats-are-already-prds"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
              >
                Read the full essay
                <svg
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md glow-primary"
              >
                Try it in Spike Chat
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
