"use client";

import { motion } from "framer-motion";
import { useInViewProgress } from "./useInViewProgress";

// ─── Types ──────────────────────────────────────────────────────────────────

type PhaseState = "hidden" | "guilt" | "acceptance";

type TimelineNode = {
  id: string;
  era: string;
  label: string;
  emoji: string;
  quote: string;
  guiltAt: number; // progress threshold to enter guilt phase
  acceptAt: number; // progress threshold to enter acceptance phase
  guiltColor: string;
  acceptColor: string;
};

// ─── Data ────────────────────────────────────────────────────────────────────

const NODES: TimelineNode[] = [
  {
    id: "gc",
    era: "1990s",
    label: "Garbage Collection",
    emoji: "🗑️",
    quote: "That's not real programming",
    guiltAt: 0.05,
    acceptAt: 0.15,
    guiltColor: "#f97316",
    acceptColor: "#22c55e",
  },
  {
    id: "orm",
    era: "2000s",
    label: "ORMs",
    emoji: "🗄️",
    quote: "That's dangerous",
    guiltAt: 0.22,
    acceptAt: 0.35,
    guiltColor: "#ef4444",
    acceptColor: "#22c55e",
  },
  {
    id: "cicd",
    era: "2010s",
    label: "CI / CD",
    emoji: "⚙️",
    quote: "What if something goes wrong?",
    guiltAt: 0.45,
    acceptAt: 0.58,
    guiltColor: "#f97316",
    acceptColor: "#22c55e",
  },
  {
    id: "ai",
    era: "2020s",
    label: "AI Codegen",
    emoji: "🤖",
    quote: "I didn't write the code",
    guiltAt: 0.65,
    acceptAt: 0.8,
    guiltColor: "#ef4444",
    acceptColor: "#06b6d4",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPhase(progress: number, node: TimelineNode): PhaseState {
  if (progress >= node.acceptAt) return "acceptance";
  if (progress >= node.guiltAt) return "guilt";
  return "hidden";
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

// ─── NodeDot ─────────────────────────────────────────────────────────────────

type NodeDotProps = {
  node: TimelineNode;
  phase: PhaseState;
  phaseProgress: number;
  isLast: boolean;
};

function NodeDot({ node, phase, phaseProgress, isLast }: NodeDotProps) {
  const isHidden = phase === "hidden";
  const isGuilt = phase === "guilt";
  const isAcceptance = phase === "acceptance";

  const dotColor = isAcceptance ? node.acceptColor : isGuilt ? node.guiltColor : "rgba(51,65,85,1)";

  const glowShadow =
    isAcceptance && isLast
      ? `0 0 24px ${node.acceptColor}, 0 0 48px ${node.acceptColor}60`
      : isAcceptance
        ? `0 0 14px ${node.acceptColor}90`
        : isGuilt
          ? `0 0 10px ${node.guiltColor}80`
          : "none";

  return (
    <div className="relative flex flex-col items-center gap-2">
      {/* Dot */}
      <motion.div
        initial={false}
        animate={{
          scale: isHidden ? 0.4 : isGuilt ? 1.1 : 1,
          opacity: isHidden ? 0.2 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="relative"
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 transition-colors duration-500"
          style={{
            background: isHidden
              ? "rgba(30,41,59,1)"
              : isGuilt
                ? `${node.guiltColor}22`
                : `${node.acceptColor}22`,
            borderColor: dotColor,
            boxShadow: glowShadow,
          }}
        >
          {node.emoji}
        </div>
        {/* Pulsing ring — guilt phase */}
        {isGuilt && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 pointer-events-none"
            style={{ borderColor: node.guiltColor }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        {/* Pulsing ring — AI acceptance (extra prominent) */}
        {isAcceptance && isLast && (
          <motion.div
            className="absolute inset-0 rounded-full border pointer-events-none"
            style={{ borderColor: node.acceptColor }}
            animate={{ scale: [1, 1.7, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </motion.div>

      {/* Phase badge */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: isHidden ? 0 : phaseProgress, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase px-2 py-0.5 rounded-sm border"
        style={{
          color: dotColor,
          borderColor: `${dotColor}40`,
          background: `${dotColor}12`,
        }}
      >
        {isGuilt ? "GUILT" : isAcceptance ? "ACCEPTED" : ""}
      </motion.div>
    </div>
  );
}

// ─── NodeLabel ────────────────────────────────────────────────────────────────

type NodeLabelProps = {
  node: TimelineNode;
  phase: PhaseState;
  phaseProgress: number;
};

function NodeLabel({ node, phase, phaseProgress }: NodeLabelProps) {
  const isHidden = phase === "hidden";
  const isAcceptance = phase === "acceptance";
  const color = isAcceptance ? node.acceptColor : phase === "guilt" ? node.guiltColor : "#64748b";

  return (
    <motion.div
      initial={false}
      animate={{ opacity: isHidden ? 0.2 : phaseProgress }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center text-center gap-1 px-1 max-w-[120px]"
    >
      {/* Era chip */}
      <span
        className="text-[9px] font-mono tracking-[0.18em] uppercase px-2 py-0.5 rounded-sm border"
        style={{
          color: `${color}bb`,
          borderColor: `${color}30`,
          background: `${color}10`,
        }}
      >
        {node.era}
      </span>
      {/* Label */}
      <span className="text-xs font-mono font-semibold text-slate-300 leading-tight">
        {node.label}
      </span>
      {/* Quote */}
      <motion.span
        initial={{ opacity: 0, y: 4 }}
        animate={{
          opacity: isHidden ? 0 : phaseProgress * 0.85,
          y: isHidden ? 4 : 0,
        }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-[10px] font-mono italic leading-snug"
        style={{ color: color + "99" }}
      >
        &ldquo;{node.quote}&rdquo;
      </motion.span>
    </motion.div>
  );
}

// ─── ConnectorLine ────────────────────────────────────────────────────────────

type ConnectorLineProps = {
  fromAccepted: boolean;
  progress: number; // 0→1 draw progress for this segment
};

function ConnectorLine({ fromAccepted, progress }: ConnectorLineProps) {
  return (
    <div className="flex-1 flex items-center h-12 px-1">
      <div
        className="relative h-px w-full overflow-hidden"
        style={{ background: "rgba(51,65,85,0.6)" }}
      >
        <motion.div
          className="absolute inset-y-0 left-0 h-full"
          initial={{ width: "0%" }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            background: fromAccepted
              ? "linear-gradient(90deg, #22c55e, #06b6d4)"
              : "linear-gradient(90deg, #f97316, #ef4444)",
          }}
        />
      </div>
    </div>
  );
}

// ─── ParadigmGuiltTimeline ───────────────────────────────────────────────────

export function ParadigmGuiltTimeline() {
  const { ref, progress } = useInViewProgress();

  return (
    <div
      ref={ref}
      className="bg-slate-900/40 border border-slate-800/80 rounded-[2.5rem] p-10 md:p-16 my-20 backdrop-blur-md relative overflow-hidden group"
    >
      {/* Ambient glow layers */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-orange-500/6 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-500/8 blur-3xl pointer-events-none" />
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-950/0 to-cyan-950/0 group-hover:from-orange-950/10 group-hover:to-cyan-950/15 transition-all duration-700 pointer-events-none rounded-[2.5rem]" />

      {/* Header */}
      <div className="text-center mb-12 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-orange-950/50 border border-orange-800/50 text-orange-400 text-[10px] font-bold mb-4 tracking-[0.2em] font-mono shadow-[0_0_15px_rgba(251,146,60,0.12)]">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          PARADIGM SHIFT TIMELINE
        </div>
        <p className="text-sm font-light text-slate-300 max-w-lg mx-auto leading-relaxed">
          Every generation of programmers faced a tool that felt like cheating. Every generation was
          wrong.
        </p>
      </div>

      {/* ── Desktop layout: horizontal timeline ── */}
      <div className="hidden md:block relative z-10">
        {/* Connector row */}
        <div className="flex items-center justify-between mb-0">
          {NODES.map((node, i) => {
            const phase = getPhase(progress, node);
            const isLast = i === NODES.length - 1;
            const nextNode = NODES[i + 1];

            // Per-node phase progress (0→1 within its phase window)
            const phaseProgress =
              phase === "guilt"
                ? clamp((progress - node.guiltAt) / (node.acceptAt - node.guiltAt), 0, 1)
                : phase === "acceptance"
                  ? clamp((progress - node.acceptAt) / 0.12, 0, 1)
                  : 0;

            // Connector draw progress between this node and next
            const connectorProgress = nextNode
              ? clamp(
                  (progress - node.acceptAt) / Math.max(0.01, nextNode.guiltAt - node.acceptAt),
                  0,
                  1,
                )
              : 0;

            return (
              <div key={node.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-3">
                  <NodeDot
                    node={node}
                    phase={phase}
                    phaseProgress={phaseProgress}
                    isLast={isLast}
                  />
                  <NodeLabel node={node} phase={phase} phaseProgress={phaseProgress} />
                </div>
                {!isLast && (
                  <ConnectorLine
                    fromAccepted={phase === "acceptance"}
                    progress={connectorProgress}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Mobile layout: vertical timeline ── */}
      <div className="md:hidden relative z-10 flex flex-col gap-0">
        {NODES.map((node, i) => {
          const phase = getPhase(progress, node);
          const isLast = i === NODES.length - 1;
          const nextNode = NODES[i + 1];

          const phaseProgress =
            phase === "guilt"
              ? clamp((progress - node.guiltAt) / (node.acceptAt - node.guiltAt), 0, 1)
              : phase === "acceptance"
                ? clamp((progress - node.acceptAt) / 0.12, 0, 1)
                : 0;

          const connectorProgress = nextNode
            ? clamp(
                (progress - node.acceptAt) / Math.max(0.01, nextNode.guiltAt - node.acceptAt),
                0,
                1,
              )
            : 0;

          const color =
            phase === "acceptance"
              ? node.acceptColor
              : phase === "guilt"
                ? node.guiltColor
                : "#64748b";

          return (
            <div key={node.id} className="flex flex-col items-start">
              <div className="flex items-center gap-5">
                {/* Dot column */}
                <div className="flex flex-col items-center">
                  <NodeDot
                    node={node}
                    phase={phase}
                    phaseProgress={phaseProgress}
                    isLast={isLast}
                  />
                </div>
                {/* Text column */}
                <div className="flex flex-col gap-1 py-2">
                  <span
                    className="text-[9px] font-mono tracking-[0.18em] uppercase"
                    style={{ color: `${color}99` }}
                  >
                    {node.era}
                  </span>
                  <span className="text-sm font-mono font-semibold text-slate-200">
                    {node.label}
                  </span>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: phase === "hidden" ? 0 : phaseProgress * 0.8,
                    }}
                    className="text-[11px] font-mono italic"
                    style={{ color: `${color}88` }}
                  >
                    &ldquo;{node.quote}&rdquo;
                  </motion.span>
                </div>
              </div>
              {/* Vertical connector */}
              {!isLast && (
                <div className="ml-6 w-px relative overflow-hidden" style={{ height: 36 }}>
                  <div className="absolute inset-0 bg-slate-700/60" />
                  <motion.div
                    className="absolute top-0 left-0 right-0"
                    initial={{ height: "0%" }}
                    animate={{ height: `${connectorProgress * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    style={{
                      background:
                        phase === "acceptance"
                          ? "linear-gradient(180deg, #22c55e, #06b6d4)"
                          : "linear-gradient(180deg, #f97316, #ef4444)",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress summary bar */}
      <div className="relative z-10 mt-10">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest whitespace-nowrap">
            Guilt resolved
          </span>
          <div className="flex-1 h-px bg-slate-800 relative overflow-hidden rounded-full">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: "linear-gradient(90deg, #f97316, #22c55e, #06b6d4)",
              }}
              initial={{ width: "0%" }}
              animate={{
                width: `${clamp((progress - 0.05) / 0.85, 0, 1) * 100}%`,
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest whitespace-nowrap">
            {Math.round(clamp((progress - 0.05) / 0.85, 0, 1) * 100)}%
          </span>
        </div>
      </div>

      {/* Caption */}
      <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase text-center mt-6 relative z-10">
        {progress < 0.1
          ? "Scroll to witness the guilt"
          : progress < 0.5
            ? "Each paradigm felt like cheating at first"
            : progress < 0.8
              ? "Acceptance always followed"
              : "AI codegen is just the latest iteration"}
      </p>
    </div>
  );
}
