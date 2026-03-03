"use client";

import { motion } from "framer-motion";
import { useInViewProgress } from "./useInViewProgress";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LayerDef {
  emoji: string;
  name: string;
  description: string;
  color: string;
  borderColor: string;
  bgColor: string;
  glowColor: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LAYERS: LayerDef[] = [
  {
    emoji: "🎭",
    name: "Identity",
    description: "Persona, role, and behavioural defaults stable across all sessions.",
    color: "#a855f7",
    borderColor: "rgba(168,85,247,0.35)",
    bgColor: "rgba(168,85,247,0.07)",
    glowColor: "rgba(168,85,247,0.25)",
  },
  {
    emoji: "📚",
    name: "Knowledge",
    description: "Domain expertise, facts, and long-term learned patterns.",
    color: "#3b82f6",
    borderColor: "rgba(59,130,246,0.35)",
    bgColor: "rgba(59,130,246,0.07)",
    glowColor: "rgba(59,130,246,0.25)",
  },
  {
    emoji: "💡",
    name: "Examples",
    description: "Few-shot demonstrations that shape tone and output format.",
    color: "#22c55e",
    borderColor: "rgba(34,197,94,0.35)",
    bgColor: "rgba(34,197,94,0.07)",
    glowColor: "rgba(34,197,94,0.25)",
  },
  {
    emoji: "🚧",
    name: "Constraints",
    description: "Safety rules, output format rules, and session guardrails.",
    color: "#f59e0b",
    borderColor: "rgba(245,158,11,0.35)",
    bgColor: "rgba(245,158,11,0.07)",
    glowColor: "rgba(245,158,11,0.25)",
  },
  {
    emoji: "🔧",
    name: "Tools",
    description: "Available function calls, MCP servers, APIs, and capabilities.",
    color: "#06b6d4",
    borderColor: "rgba(6,182,212,0.35)",
    bgColor: "rgba(6,182,212,0.07)",
    glowColor: "rgba(6,182,212,0.25)",
  },
];

/** Progress threshold at which each layer becomes visible (0–1). */
const LAYER_THRESHOLDS: number[] = [0.1, 0.28, 0.46, 0.64, 0.82];

/** The KV cache boundary appears between layers 2 (index 2) and 3 (index 3), at ~60% progress. */
const KV_CACHE_THRESHOLD = 0.6;

/** Quality meter reaches 100% only after all 5 layers are visible. */
const QUALITY_FULL_THRESHOLD = 0.95;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

/** Maps a value from [inMin, inMax] to [0, 1] and clamps. */
function remapToUnit(v: number, inMin: number, inMax: number): number {
  return clamp((v - inMin) / (inMax - inMin), 0, 1);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface LayerRowProps {
  layer: LayerDef;
  index: number;
  isVisible: boolean;
  layerProgress: number;
}

function LayerRow({ layer, index, isVisible, layerProgress }: LayerRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -48 }}
      animate={{
        opacity: isVisible ? 1 : 0,
        x: isVisible ? 0 : -48,
      }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 28,
        delay: 0,
      }}
      style={{
        background: layer.bgColor,
        border: `1px solid ${layer.borderColor}`,
        borderRadius: 10,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        boxShadow: isVisible ? `0 4px 20px ${layer.glowColor}` : "none",
        transition: "box-shadow 0.4s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle inner-glow sweep on entry */}
      {isVisible && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(135deg, ${layer.color}09 0%, transparent 60%)`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Emoji icon */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 9,
          background: `${layer.color}14`,
          border: `1px solid ${layer.borderColor}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          flexShrink: 0,
          boxShadow: isVisible ? `0 0 12px ${layer.glowColor}` : "none",
          transition: "box-shadow 0.4s",
        }}
        role="img"
        aria-label={layer.name}
      >
        {layer.emoji}
      </div>

      {/* Text content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              color: layer.color,
              fontSize: 13,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontFamily: "ui-monospace, monospace",
            }}
          >
            {layer.name}
          </span>
          <span
            style={{
              padding: "1px 6px",
              background: `${layer.color}10`,
              border: `1px solid ${layer.borderColor}`,
              color: layer.color,
              fontSize: 8,
              fontFamily: "ui-monospace, monospace",
              fontWeight: "bold",
              borderRadius: 4,
              letterSpacing: "0.12em",
              opacity: 0.85,
            }}
          >
            L{index + 1}
          </span>
        </div>
        <div
          style={{
            color: "rgba(148,163,184,0.75)",
            fontSize: 11,
            fontFamily: "ui-monospace, monospace",
            marginTop: 3,
            lineHeight: 1.5,
          }}
        >
          {layer.description}
        </div>
      </div>

      {/* Progress fill on right edge */}
      <div
        style={{
          width: 3,
          height: "70%",
          borderRadius: 2,
          background: `linear-gradient(180deg, ${layer.color}, ${layer.color}44)`,
          opacity: layerProgress,
          flexShrink: 0,
          boxShadow: `0 0 8px ${layer.color}`,
        }}
      />
    </motion.div>
  );
}

interface KvBoundaryProps {
  visible: boolean;
}

function KvCacheBoundary({ visible }: KvBoundaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0.6 }}
      animate={{ opacity: visible ? 1 : 0, scaleX: visible ? 1 : 0.6 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 4px",
      }}
    >
      <div
        style={{
          flex: 1,
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.5))",
          borderTop: "1px dashed rgba(6,182,212,0.35)",
        }}
      />
      <div
        style={{
          padding: "3px 10px",
          background: "rgba(6,182,212,0.06)",
          border: "1px solid rgba(6,182,212,0.25)",
          borderRadius: 4,
          color: "rgba(6,182,212,0.85)",
          fontSize: 9,
          fontFamily: "ui-monospace, monospace",
          fontWeight: "bold",
          letterSpacing: "0.13em",
          whiteSpace: "nowrap",
          boxShadow: "0 0 12px rgba(6,182,212,0.12)",
        }}
      >
        KV CACHE BOUNDARY · 10× COST REDUCTION
      </div>
      <div
        style={{
          flex: 1,
          height: 1,
          background: "linear-gradient(90deg, rgba(6,182,212,0.5), transparent)",
          borderTop: "1px dashed rgba(6,182,212,0.35)",
        }}
      />
    </motion.div>
  );
}

interface QualityMeterProps {
  qualityPct: number;
}

function QualityMeter({ qualityPct }: QualityMeterProps) {
  const isFull = qualityPct >= 99;
  const barColor = isFull
    ? "linear-gradient(180deg, #22c55e, #16a34a)"
    : qualityPct > 60
      ? "linear-gradient(180deg, #06b6d4, #0891b2)"
      : "linear-gradient(180deg, #3b82f6, #2563eb)";

  const glowColor = isFull
    ? "rgba(34,197,94,0.5)"
    : qualityPct > 60
      ? "rgba(6,182,212,0.4)"
      : "rgba(59,130,246,0.35)";

  return (
    <div className="flex flex-col items-center gap-2 select-none" style={{ minWidth: 52 }}>
      {/* Label */}
      <span
        className="text-[9px] font-mono font-bold tracking-widest uppercase"
        style={{ color: "rgba(148,163,184,0.5)" }}
      >
        Quality
      </span>

      {/* Vertical track */}
      <div
        style={{
          width: 18,
          height: 160,
          borderRadius: 9,
          background: "rgba(15,23,42,0.8)",
          border: "1px solid rgba(51,65,85,0.5)",
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* Fill rises from bottom */}
        <motion.div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background: barColor,
            boxShadow: isFull ? `0 -6px 16px ${glowColor}` : "none",
            transition: "background 0.6s ease, box-shadow 0.6s ease",
          }}
          animate={{ height: `${qualityPct}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
        />

        {/* Tick marks */}
        {[25, 50, 75].map((tick) => (
          <div
            key={tick}
            style={{
              position: "absolute",
              bottom: `${tick}%`,
              left: 0,
              right: 0,
              height: 1,
              background: "rgba(51,65,85,0.5)",
              pointerEvents: "none",
            }}
          />
        ))}
      </div>

      {/* Percentage */}
      <span
        className="text-xs font-mono font-bold tabular-nums"
        style={{
          color: isFull ? "#22c55e" : qualityPct > 60 ? "#06b6d4" : "#3b82f6",
          textShadow: isFull ? "0 0 8px rgba(34,197,94,0.6)" : "none",
          transition: "color 0.4s ease",
        }}
      >
        {Math.round(qualityPct)}%
      </span>

      {/* Full indicator */}
      <motion.span
        animate={{ opacity: isFull ? 1 : 0, y: isFull ? 0 : 4 }}
        transition={{ duration: 0.4 }}
        className="text-[8px] font-mono font-bold tracking-widest"
        style={{ color: "#22c55e" }}
      >
        FULL
      </motion.span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ContextLayerBuilderDemo() {
  const { ref, progress } = useInViewProgress();

  // Determine which layers are visible based on scroll progress
  const visibleCount = LAYER_THRESHOLDS.filter((t) => progress >= t).length;

  // KV boundary appears between index 2 and 3 (after 3 layers, before 4th)
  const kvBoundaryVisible = progress >= KV_CACHE_THRESHOLD;

  // Quality meter (0–100)
  const qualityPct = clamp(
    remapToUnit(progress, LAYER_THRESHOLDS[0] ?? 0, QUALITY_FULL_THRESHOLD) * 100,
    0,
    100,
  );

  // Status line
  const statusText =
    visibleCount === 0
      ? "Scroll to build your context stack"
      : visibleCount < LAYERS.length
        ? `${visibleCount} / ${LAYERS.length} layers initialised…`
        : "Context stack complete — prompt is ready";

  const statusColor =
    visibleCount === 0
      ? "rgba(100,116,139,0.7)"
      : visibleCount < LAYERS.length
        ? "rgba(6,182,212,0.8)"
        : "#22c55e";

  return (
    <div
      ref={ref}
      className="bg-slate-900/40 border border-slate-800/80 rounded-[2.5rem] p-10 md:p-16 my-20 backdrop-blur-md relative overflow-hidden group"
    >
      {/* Ambient glows */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-cyan-500/5 blur-3xl pointer-events-none" />

      {/* Hover gradient overlay */}
      <div className="absolute inset-0 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-[radial-gradient(circle_at_30%_0%,rgba(168,85,247,0.04),transparent_55%)]" />

      {/* Header badge */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-purple-950/50 border border-purple-800/60 text-purple-400 text-[10px] font-bold font-mono tracking-[0.2em] shadow-[0_0_15px_rgba(168,85,247,0.1)]">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          CONTEXT STACK BUILDER
        </div>
      </div>

      {/* Title */}
      <h3 className="text-center text-slate-200 font-semibold text-lg mb-2 leading-snug">
        The 5-Layer Context Stack
      </h3>
      <p className="text-center text-slate-500 text-xs font-mono mb-10 leading-relaxed max-w-sm mx-auto">
        Every zero-shot prompt is a layered architecture. Stack all five layers to maximise response
        quality while minimising cost via KV cache reuse.
      </p>

      {/* Main layout: stack on left, quality meter on right */}
      <div className="flex gap-6 items-start justify-center">
        {/* Layer stack */}
        <div className="flex flex-col gap-2.5 w-full" style={{ maxWidth: 520 }}>
          {LAYERS.map((layer, index) => {
            const threshold = LAYER_THRESHOLDS[index] ?? 0;
            const nextThreshold = LAYER_THRESHOLDS[index + 1] ?? 1;
            const isVisible = progress >= threshold;
            const layerProgress = remapToUnit(progress, threshold, nextThreshold);

            // Insert KV boundary between index 2 and 3
            const insertBoundaryAfter = index === 2;

            return (
              <div key={layer.name}>
                <LayerRow
                  layer={layer}
                  index={index}
                  isVisible={isVisible}
                  layerProgress={layerProgress}
                />
                {insertBoundaryAfter && (
                  <div className="mt-2.5">
                    <KvCacheBoundary visible={kvBoundaryVisible} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quality meter — hidden on very small screens */}
        <div className="hidden sm:flex flex-col items-center pt-1 flex-shrink-0">
          <QualityMeter qualityPct={qualityPct} />
        </div>
      </div>

      {/* Mobile quality bar (horizontal, shown on very small screens) */}
      <div className="sm:hidden mt-6 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
            Context quality
          </span>
          <span
            className="text-xs font-mono font-bold tabular-nums"
            style={{
              color: qualityPct >= 99 ? "#22c55e" : "#06b6d4",
            }}
          >
            {Math.round(qualityPct)}%
          </span>
        </div>
        <div
          className="w-full rounded-full overflow-hidden"
          style={{
            height: 10,
            background: "rgba(15,23,42,0.8)",
            border: "1px solid rgba(51,65,85,0.5)",
          }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background:
                qualityPct >= 99
                  ? "linear-gradient(90deg, #16a34a, #22c55e)"
                  : "linear-gradient(90deg, #2563eb, #06b6d4)",
              boxShadow:
                qualityPct >= 99 ? "0 0 10px rgba(34,197,94,0.5)" : "0 0 10px rgba(6,182,212,0.4)",
            }}
            animate={{ width: `${qualityPct}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
          />
        </div>
      </div>

      {/* Status line */}
      <div className="flex justify-center mt-8">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border font-mono text-[10px] tracking-widest transition-all duration-500"
          style={{
            borderColor: statusColor,
            color: statusColor,
            background: statusColor.replace("0.8", "0.05").replace("0.7", "0.04"),
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              background: statusColor,
              boxShadow: `0 0 6px ${statusColor}`,
            }}
          />
          {statusText}
        </div>
      </div>

      {/* Caption */}
      <p className="text-center text-[10px] font-mono text-slate-600 tracking-widest uppercase mt-6">
        Scroll-driven · Sequential reveal · KV cache boundary · Quality meter
      </p>
    </div>
  );
}
