"use client";

import { motion } from "framer-motion";
import { useInViewProgress } from "./useInViewProgress";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BarSegment {
  label: string;
  color: string;
  glowColor: string;
  pct2023: number;
  pct2026: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SEGMENTS: BarSegment[] = [
  {
    label: "Context & Setup",
    color: "#06b6d4",
    glowColor: "rgba(6,182,212,0.4)",
    pct2023: 20,
    pct2026: 80,
  },
  {
    label: "Iteration & Correction",
    color: "#f59e0b",
    glowColor: "rgba(245,158,11,0.4)",
    pct2023: 80,
    pct2026: 20,
  },
];

// 2026 "Execution" replaces "Iteration & Correction"
const LABEL_2026 = ["Context & Setup", "Execution"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Maps raw progress (0–1) to a morph factor (0–1) in the 0.3–0.7 band. */
function morphFactor(progress: number): number {
  return Math.max(0, Math.min(1, (progress - 0.3) / 0.4));
}

/** Eases morph factor with a smooth cubic so the transition looks intentional. */
function ease(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface YearLabelProps {
  year: string;
  opacity: number;
  color: string;
}

function YearLabel({ year, opacity, color }: YearLabelProps) {
  return (
    <div
      className="text-center font-mono font-bold text-2xl tracking-wider transition-all duration-300"
      style={{ color, opacity }}
    >
      {year}
    </div>
  );
}

interface AnimatedPctProps {
  value: number;
  color: string;
}

function AnimatedPct({ value, color }: AnimatedPctProps) {
  return (
    <span className="text-[11px] font-mono font-bold tabular-nums" style={{ color }}>
      {Math.round(value)}%
    </span>
  );
}

interface BarChartProps {
  morph: number;
  progress: number;
}

function BarChart({ morph, progress }: BarChartProps) {
  const easedMorph = ease(morph);

  // Bar height grows in as the block enters view
  const barReveal = Math.min(1, progress * 3);

  return (
    <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
      {SEGMENTS.map((seg, i) => {
        const fromPct = seg.pct2023;
        const toPct = seg.pct2026;
        const currentPct = lerp(fromPct, toPct, easedMorph);
        const displayLabel = morph > 0.5 ? (LABEL_2026[i] ?? seg.label) : seg.label;

        // Second segment switches colour from amber → green in 2026
        const currentColor =
          i === 1 ? (morph > 0.5 ? `rgba(34,197,94,${0.4 + morph * 0.6})` : seg.color) : seg.color;

        return (
          <div key={seg.label} className="flex flex-col gap-1.5">
            {/* Label row */}
            <div className="flex items-center justify-between gap-2 min-h-[1.25rem]">
              <span
                className="text-[11px] font-mono tracking-wide transition-colors duration-500 truncate"
                style={{
                  color: i === 1 && morph > 0.5 ? "#22c55e" : "rgba(148,163,184,0.9)",
                }}
              >
                {displayLabel}
              </span>
              <AnimatedPct value={currentPct} color={currentColor} />
            </div>

            {/* Bar track */}
            <div
              className="relative w-full rounded-full overflow-hidden"
              style={{
                height: 22,
                background: "rgba(15,23,42,0.8)",
                border: "1px solid rgba(51,65,85,0.6)",
              }}
            >
              {/* Filled portion */}
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${currentPct * barReveal}%`,
                  background:
                    i === 1 && morph > 0.5
                      ? `linear-gradient(90deg, #16a34a, #22c55e)`
                      : i === 0
                        ? `linear-gradient(90deg, #0891b2, #06b6d4)`
                        : `linear-gradient(90deg, #d97706, #f59e0b)`,
                  boxShadow:
                    i === 1 && morph > 0.5
                      ? "0 0 12px rgba(34,197,94,0.5)"
                      : `0 0 12px ${seg.glowColor}`,
                  transition: "width 0.05s linear, background 0.6s ease, box-shadow 0.6s ease",
                }}
              />

              {/* Shimmer overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 60%, rgba(255,255,255,0.04) 80%, transparent 100%)",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface CookingIconProps {
  visible: boolean;
}

/** A minimal SVG chef-hat icon — no external icon lib required. */
function ChefHatIcon({ visible }: CookingIconProps) {
  return (
    <motion.div
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 8 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center gap-1 mt-1"
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#06b6d4"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {/* brim */}
        <path d="M4 18h16" />
        <path d="M6 18v-2" />
        <path d="M18 18v-2" />
        {/* dome */}
        <path d="M12 4a4 4 0 0 1 4 4c0 1.2-.5 2.3-1.3 3H9.3A4 4 0 0 1 8 8a4 4 0 0 1 4-4z" />
        {/* top of hat */}
        <path d="M8 11v5h8v-5" />
      </svg>
      <span
        className="text-[9px] font-mono tracking-widest uppercase"
        style={{ color: "rgba(6,182,212,0.7)" }}
      >
        mise en place
      </span>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function EffortInversionDemo() {
  const { ref, progress } = useInViewProgress();
  const morph = morphFactor(progress);
  const easedMorph = ease(morph);

  // Year label states
  const year2023Opacity = 1 - easedMorph;
  const year2026Opacity = easedMorph;

  // Phase description
  const phaseLabel =
    progress < 0.3 ? "BEFORE · 2023" : progress > 0.7 ? "AFTER · 2026" : "MORPHING…";

  const phaseColor =
    progress < 0.3
      ? "rgba(245,158,11,0.8)"
      : progress > 0.7
        ? "rgba(34,197,94,0.8)"
        : "rgba(148,163,184,0.6)";

  return (
    <div
      ref={ref}
      className="bg-slate-900/40 border border-slate-800/80 rounded-[2.5rem] p-10 md:p-16 my-20 backdrop-blur-md relative overflow-hidden group"
    >
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-cyan-500/5 blur-3xl pointer-events-none transition-opacity duration-500 group-hover:opacity-150" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-amber-500/5 blur-3xl pointer-events-none transition-opacity duration-500 group-hover:opacity-150" />

      {/* Hover gradient overlay */}
      <div className="absolute inset-0 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.04),transparent_60%)]" />

      {/* Header badge */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-cyan-950/50 border border-cyan-800/60 text-cyan-400 text-[10px] font-bold font-mono tracking-[0.2em] shadow-[0_0_15px_rgba(34,211,238,0.1)]">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          EFFORT DISTRIBUTION
        </div>
      </div>

      {/* Title */}
      <h3 className="text-center text-slate-200 font-semibold text-lg mb-2 leading-snug">
        The Prompt Effort Inversion
      </h3>
      <p className="text-center text-slate-500 text-xs font-mono mb-10 leading-relaxed max-w-sm mx-auto">
        Where you spend effort determines output quality — not how hard you push at execution.
      </p>

      {/* Year labels */}
      <div className="relative flex items-end justify-center gap-4 mb-3 h-10">
        <div className="absolute inset-0 flex items-end justify-center gap-4">
          <YearLabel year="2023" opacity={year2023Opacity} color="#f59e0b" />
          <div
            className="text-slate-700 font-mono text-2xl font-light mb-px"
            style={{ opacity: 0.3 + easedMorph * 0.4 }}
          >
            →
          </div>
          <YearLabel year="2026" opacity={year2026Opacity} color="#22c55e" />
        </div>
      </div>

      {/* Bar chart */}
      <BarChart morph={morph} progress={progress} />

      {/* Chef hat — appears when 2026 state is active */}
      <div className="flex justify-center mt-6">
        <ChefHatIcon visible={progress > 0.7} />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 mt-8">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
            style={{
              background: "linear-gradient(90deg,#0891b2,#06b6d4)",
              boxShadow: "0 0 6px rgba(6,182,212,0.5)",
            }}
          />
          <span className="text-[10px] font-mono text-slate-400">Context &amp; Setup</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
            style={{
              background:
                progress > 0.7
                  ? "linear-gradient(90deg,#16a34a,#22c55e)"
                  : "linear-gradient(90deg,#d97706,#f59e0b)",
              boxShadow:
                progress > 0.7 ? "0 0 6px rgba(34,197,94,0.5)" : "0 0 6px rgba(245,158,11,0.5)",
              transition: "background 0.6s ease, box-shadow 0.6s ease",
            }}
          />
          <span
            className="text-[10px] font-mono transition-colors duration-500"
            style={{
              color: progress > 0.7 ? "#22c55e" : "rgba(148,163,184,0.8)",
            }}
          >
            {progress > 0.5 ? "Execution" : "Iteration & Correction"}
          </span>
        </div>
      </div>

      {/* Phase status bar */}
      <div className="flex justify-center mt-6">
        <div
          className="flex items-center gap-2 px-3 py-1 rounded-full border font-mono text-[10px] tracking-widest transition-all duration-500"
          style={{
            borderColor: phaseColor,
            color: phaseColor,
            background: `${phaseColor.replace("0.8", "0.06")}`,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: phaseColor,
              boxShadow: `0 0 6px ${phaseColor}`,
            }}
          />
          {phaseLabel}
        </div>
      </div>

      {/* Caption */}
      <p className="text-center text-[10px] font-mono text-slate-600 tracking-widest uppercase mt-8">
        Scroll-driven · Morphing bar chart · Zero-shot prompt architecture
      </p>
    </div>
  );
}
