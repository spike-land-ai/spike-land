"use client";

import { motion } from "framer-motion";
import { useInViewProgress } from "./useInViewProgress";

// ─── Types ──────────────────────────────────────────────────────────────────

type CodeToken = {
  text: string;
  kind: "keyword" | "param" | "common" | "punct" | "type" | "dim";
};

type PatternDef = {
  label: string;
  sublabel: string;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  tokens: CodeToken[];
};

// ─── Token definitions ───────────────────────────────────────────────────────

const PATTERNS: PatternDef[] = [
  {
    label: "Workers",
    sublabel: "Cloudflare",
    accentColor: "#f97316",
    accentBg: "rgba(249,115,22,0.08)",
    accentBorder: "rgba(249,115,22,0.35)",
    tokens: [
      { text: "(", kind: "punct" },
      { text: "request", kind: "param" },
      { text: ", ", kind: "punct" },
      { text: "env", kind: "dim" },
      { text: ", ", kind: "punct" },
      { text: "ctx", kind: "param" },
      { text: ")", kind: "punct" },
      { text: " => ", kind: "punct" },
      { text: "Response", kind: "type" },
    ],
  },
  {
    label: "tRPC",
    sublabel: "Procedure",
    accentColor: "#8b5cf6",
    accentBg: "rgba(139,92,246,0.08)",
    accentBorder: "rgba(139,92,246,0.35)",
    tokens: [
      { text: "(", kind: "punct" },
      { text: "input", kind: "param" },
      { text: ", ", kind: "punct" },
      { text: "ctx", kind: "param" },
      { text: ")", kind: "punct" },
      { text: " => ", kind: "punct" },
      { text: "output", kind: "type" },
    ],
  },
  {
    label: "MCP Tool",
    sublabel: "Builder",
    accentColor: "#06b6d4",
    accentBg: "rgba(6,182,212,0.08)",
    accentBorder: "rgba(6,182,212,0.35)",
    tokens: [
      { text: "({", kind: "punct" },
      { text: " input", kind: "param" },
      { text: ", ", kind: "punct" },
      { text: "ctx", kind: "param" },
      { text: " })", kind: "punct" },
      { text: " => ", kind: "punct" },
      { text: "CallToolResult", kind: "type" },
    ],
  },
];

// Tokens where the text is part of the shared pattern
const COMMON_TEXTS = new Set(["input", "ctx", "output", "Response", "CallToolResult"]);
// We treat all "param" tokens plus type tokens as "common" in highlight phase
function isCommonToken(token: CodeToken): boolean {
  return (
    token.kind === "param" ||
    token.kind === "common" ||
    COMMON_TEXTS.has(token.text.trim().replace(/[,{}() ]/g, ""))
  );
}

// ─── Token rendering ─────────────────────────────────────────────────────────

function TokenSpan({
  token,
  highlightPhase,
  mergePhase,
}: {
  token: CodeToken;
  highlightPhase: number; // 0-1
  mergePhase: number; // 0-1
}) {
  const common = isCommonToken(token);

  // During highlight phase: common tokens turn cyan, dim tokens fade to slate-600
  // During merge phase: everything converges toward golden
  const goldenColor = "#f59e0b";
  const cyanColor = "#22d3ee";
  const dimColor = "rgba(100,116,139,0.45)";

  let color: string;
  let opacity = 1;

  if (mergePhase > 0) {
    // In merge phase, interpolate all tokens toward golden
    const r1 = parseInt(cyanColor.slice(1, 3), 16);
    const g1 = parseInt(cyanColor.slice(3, 5), 16);
    const b1 = parseInt(cyanColor.slice(5, 7), 16);
    const r2 = parseInt(goldenColor.slice(1, 3), 16);
    const g2 = parseInt(goldenColor.slice(3, 5), 16);
    const b2 = parseInt(goldenColor.slice(5, 7), 16);
    const rr = Math.round(r1 + (r2 - r1) * mergePhase);
    const gg = Math.round(g1 + (g2 - g1) * mergePhase);
    const bb = Math.round(b1 + (b2 - b1) * mergePhase);
    color = `rgb(${rr},${gg},${bb})`;
    opacity = common ? 1 : Math.max(0.3, 1 - mergePhase * 0.7);
  } else if (highlightPhase > 0) {
    if (common) {
      color = cyanColor;
    } else if (token.kind === "dim") {
      const alpha = Math.max(0.15, 1 - highlightPhase * 0.85);
      color = `rgba(100,116,139,${alpha})`;
      opacity = 1 - highlightPhase * 0.5;
    } else {
      // punct
      color = `rgba(148,163,184,${Math.max(0.25, 1 - highlightPhase * 0.6)})`;
    }
  } else {
    // Phase 0: flat colors
    const colorMap: Record<CodeToken["kind"], string> = {
      keyword: "#60a5fa",
      param: "#a5b4fc",
      common: "#22d3ee",
      punct: "rgba(148,163,184,0.75)",
      type: "#86efac",
      dim: dimColor,
    };
    color = colorMap[token.kind];
  }

  return (
    <span
      style={{
        color,
        opacity,
        transition: "color 0.5s ease, opacity 0.5s ease",
        fontFamily: "JetBrains Mono, ui-monospace, monospace",
        fontSize: "clamp(11px, 2vw, 14px)",
        whiteSpace: "pre",
      }}
    >
      {token.text}
    </span>
  );
}

// ─── Individual pattern card ─────────────────────────────────────────────────

function PatternCard({
  pattern,
  index,
  highlightPhase,
  mergePhase,
}: {
  pattern: PatternDef;
  index: number;
  highlightPhase: number;
  mergePhase: number;
}) {
  // Stagger card entrance
  const entryDelay = index * 0.12;
  const cardProgress = Math.max(0, Math.min(1, 1 - entryDelay > 0 ? 1 : 0));
  void cardProgress;

  // During merge: cards compress toward center
  const xTargets = [-1, 0, 1];
  const mergeX = (xTargets[index] ?? 0) * mergePhase * -40;
  const mergeScale = 1 - mergePhase * (index === 1 ? 0 : 0.08);
  const mergeOpacity = index === 1 ? 1 : Math.max(0, 1 - mergePhase * 0.85);

  const borderColor =
    mergePhase > 0.5
      ? `rgba(245,158,11,${0.2 + mergePhase * 0.5})`
      : highlightPhase > 0
        ? `rgba(34,211,238,${0.15 + highlightPhase * 0.25})`
        : pattern.accentBorder;

  const bgColor =
    mergePhase > 0.5 ? `rgba(245,158,11,${0.03 + mergePhase * 0.07})` : pattern.accentBg;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: mergeOpacity,
        x: mergeX,
        scale: mergeScale,
        y: 0,
      }}
      transition={{
        delay: entryDelay * 0.5,
        duration: 0.5,
        ease: "easeOut",
        x: { duration: 0.4 },
        scale: { duration: 0.4 },
        opacity: { duration: 0.3 },
      }}
      className="flex-1 min-w-0 relative"
      style={{ zIndex: index === 1 ? 2 : 1 }}
    >
      <div
        className="rounded-xl p-4 md:p-5 h-full flex flex-col gap-3 backdrop-blur-sm"
        style={{
          background: bgColor,
          border: `1px solid ${borderColor}`,
          transition: "background 0.5s ease, border-color 0.5s ease",
          boxShadow:
            mergePhase > 0.3
              ? `0 0 24px rgba(245,158,11,${mergePhase * 0.15})`
              : highlightPhase > 0
                ? `0 0 16px rgba(34,211,238,${highlightPhase * 0.08})`
                : "none",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p
              className="text-[11px] font-bold font-mono uppercase tracking-widest"
              style={{
                color:
                  mergePhase > 0.3
                    ? `rgba(245,158,11,${0.5 + mergePhase * 0.5})`
                    : pattern.accentColor,
                transition: "color 0.4s ease",
              }}
            >
              {pattern.label}
            </p>
            <p className="text-[9px] font-mono text-slate-600 uppercase tracking-wider mt-0.5">
              {pattern.sublabel}
            </p>
          </div>
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background:
                mergePhase > 0.3 ? "#f59e0b" : highlightPhase > 0 ? "#22d3ee" : pattern.accentColor,
              boxShadow:
                highlightPhase > 0 || mergePhase > 0
                  ? `0 0 8px ${mergePhase > 0.3 ? "#f59e0b" : "#22d3ee"}`
                  : "none",
              transition: "background 0.4s ease, box-shadow 0.4s ease",
            }}
          />
        </div>

        {/* Code */}
        <div
          className="rounded-lg px-3 py-2.5 flex flex-wrap items-center gap-0"
          style={{
            background: "rgba(2,6,23,0.6)",
            border: "1px solid rgba(30,41,59,0.8)",
          }}
        >
          {pattern.tokens.map((token, ti) => (
            <TokenSpan
              key={ti}
              token={token}
              highlightPhase={highlightPhase}
              mergePhase={mergePhase}
            />
          ))}
        </div>

        {/* Common legend */}
        {highlightPhase > 0.4 && mergePhase < 0.3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: Math.min(1, (highlightPhase - 0.4) / 0.3) }}
            className="flex flex-wrap gap-1.5"
          >
            {["input", "ctx", "output"].map((kw) => {
              const present =
                kw === "ctx"
                  ? true
                  : kw === "input"
                    ? pattern.tokens.some(
                        (t) => t.text.includes("input") || t.text.includes("request"),
                      )
                    : true;
              return present ? (
                <span
                  key={kw}
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                  style={{
                    background: "rgba(34,211,238,0.1)",
                    border: "1px solid rgba(34,211,238,0.25)",
                    color: "#22d3ee",
                  }}
                >
                  {kw}
                </span>
              ) : null;
            })}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Merged golden card ──────────────────────────────────────────────────────

function GoldenCard({ mergePhase }: { mergePhase: number }) {
  if (mergePhase < 0.5) return null;
  const opacity = Math.min(1, (mergePhase - 0.5) / 0.35);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity, scale: 1, y: 0 }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 10 }}
    >
      <div
        className="rounded-2xl px-6 py-5 flex flex-col items-center gap-3 backdrop-blur-md"
        style={{
          background: "rgba(245,158,11,0.07)",
          border: "1.5px solid rgba(245,158,11,0.5)",
          boxShadow:
            "0 0 40px rgba(245,158,11,0.15), 0 0 80px rgba(245,158,11,0.06), inset 0 1px 0 rgba(245,158,11,0.2)",
          minWidth: 220,
        }}
      >
        <p
          className="text-[10px] font-mono font-bold uppercase tracking-[0.2em]"
          style={{ color: "rgba(245,158,11,0.7)" }}
        >
          Universal Abstraction
        </p>
        <div
          className="font-mono text-base md:text-lg font-bold tracking-tight"
          style={{
            color: "#f59e0b",
            textShadow: "0 0 20px rgba(245,158,11,0.4)",
          }}
        >
          {"(input, ctx) => output"}
        </div>
        <div
          className="h-px w-24"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.4), transparent)",
          }}
        />
        <p
          className="text-[10px] font-mono text-center leading-relaxed"
          style={{ color: "rgba(245,158,11,0.6)", maxWidth: 220 }}
        >
          The minimal viable abstraction for a request handler
        </p>
      </div>
    </motion.div>
  );
}

// ─── Connector arrows ────────────────────────────────────────────────────────

function ConvergeArrows({ highlightPhase }: { highlightPhase: number }) {
  const opacity = Math.min(1, highlightPhase * 2);
  return (
    <div
      className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none gap-16"
      style={{ opacity }}
    >
      {/* Left arrow → center */}
      <svg width="48" height="12" className="text-cyan-500" style={{ marginRight: -12 }}>
        <line
          x1="0"
          y1="6"
          x2="44"
          y2="6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        <polyline points="38,2 44,6 38,10" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
      {/* Right arrow → center */}
      <svg width="48" height="12" className="text-cyan-500" style={{ marginLeft: -12 }}>
        <line
          x1="48"
          y1="6"
          x2="4"
          y2="6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        <polyline points="10,2 4,6 10,10" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function ConvergenceDemo() {
  const { ref, progress } = useInViewProgress();

  // Phase breakpoints
  const highlightPhase = Math.max(0, Math.min(1, (progress - 0.3) / 0.4)); // 0.3-0.7 → 0-1
  const mergePhase = Math.max(0, Math.min(1, (progress - 0.7) / 0.3)); // 0.7-1.0 → 0-1

  return (
    <div
      ref={ref}
      className="bg-slate-900/40 border border-slate-800/80 rounded-[2.5rem] p-10 md:p-16 my-20 backdrop-blur-md relative overflow-hidden group"
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-cyan-500/5 blur-3xl pointer-events-none" />

      {/* Phase label */}
      <div className="flex justify-center mb-8">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border text-[10px] font-bold font-mono uppercase tracking-[0.2em]"
          style={{
            background:
              mergePhase > 0.3
                ? "rgba(245,158,11,0.08)"
                : highlightPhase > 0
                  ? "rgba(34,211,238,0.08)"
                  : "rgba(30,41,59,0.5)",
            borderColor:
              mergePhase > 0.3
                ? "rgba(245,158,11,0.3)"
                : highlightPhase > 0
                  ? "rgba(34,211,238,0.3)"
                  : "rgba(51,65,85,0.8)",
            color:
              mergePhase > 0.3
                ? "rgba(245,158,11,0.9)"
                : highlightPhase > 0
                  ? "#22d3ee"
                  : "rgba(100,116,139,0.8)",
            transition: "all 0.5s ease",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{
              background:
                mergePhase > 0.3
                  ? "#f59e0b"
                  : highlightPhase > 0
                    ? "#22d3ee"
                    : "rgba(100,116,139,0.5)",
            }}
          />
          {mergePhase > 0.3
            ? "Pattern identified"
            : highlightPhase > 0
              ? "Finding commonality"
              : "Three different APIs"}
        </div>
      </div>

      {/* Cards row */}
      <div className="relative">
        <div
          className="flex flex-col md:flex-row gap-4 md:gap-5"
          style={{
            opacity: mergePhase > 0.7 ? Math.max(0, 1 - (mergePhase - 0.7) / 0.3) : 1,
          }}
        >
          {PATTERNS.map((pattern, i) => (
            <PatternCard
              key={pattern.label}
              pattern={pattern}
              index={i}
              highlightPhase={highlightPhase}
              mergePhase={mergePhase}
            />
          ))}
        </div>

        {/* Convergence arrows (desktop) */}
        <ConvergeArrows highlightPhase={highlightPhase} />

        {/* Golden merged card */}
        <GoldenCard mergePhase={mergePhase} />
      </div>

      {/* Highlight legend */}
      {highlightPhase > 0.2 && mergePhase < 0.2 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: Math.min(1, (highlightPhase - 0.2) / 0.3), y: 0 }}
          className="mt-6 flex flex-wrap justify-center gap-4"
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-px" style={{ background: "#22d3ee" }} />
            <span className="text-[10px] font-mono" style={{ color: "#22d3ee" }}>
              shared pattern
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-px bg-slate-700" />
            <span className="text-[10px] font-mono text-slate-600">implementation detail</span>
          </div>
        </motion.div>
      )}

      {/* Caption */}
      <div className="flex flex-col items-center gap-3 mt-12">
        <div className="h-px w-32 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
        <p className="text-center text-[10px] font-mono text-slate-500 tracking-[0.2em] uppercase max-w-md leading-relaxed">
          Workers, tRPC, and MCP tools all collapse to the same request-handler shape
        </p>
      </div>
    </div>
  );
}
