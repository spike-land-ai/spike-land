"use client";

import type {
  StateNode as StateNodeType,
  StateType,
} from "@/lib/state-machine/types";
import { cn } from "@/lib/utils";

interface StateNodeProps {
  stateId: string;
  stateNode: StateNodeType;
  isActive: boolean;
  isSelected: boolean;
  isInitial: boolean;
  childCount?: number;
  onSelect: (id: string) => void;
}

const STATE_TYPE_CONFIG: Record<
  StateType,
  { label: string; borderClass: string; glowClass: string; badgeClass: string; }
> = {
  atomic: {
    label: "A",
    borderClass: "border-zinc-700/60",
    glowClass: "",
    badgeClass: "bg-zinc-800 text-zinc-400",
  },
  compound: {
    label: "C",
    borderClass: "border-indigo-600/40",
    glowClass: "shadow-indigo-900/20",
    badgeClass: "bg-indigo-900/30 text-indigo-400",
  },
  parallel: {
    label: "P",
    borderClass: "border-violet-600/40",
    glowClass: "shadow-violet-900/20",
    badgeClass: "bg-violet-900/30 text-violet-400",
  },
  final: {
    label: "F",
    borderClass: "border-emerald-600/40",
    glowClass: "shadow-emerald-900/20",
    badgeClass: "bg-emerald-900/30 text-emerald-400",
  },
  history: {
    label: "H",
    borderClass: "border-amber-600/40",
    glowClass: "shadow-amber-900/20",
    badgeClass: "bg-amber-900/30 text-amber-400",
  },
};

export function StateNode({
  stateId,
  stateNode,
  isActive,
  isSelected,
  isInitial,
  childCount = 0,
  onSelect,
}: StateNodeProps) {
  const config = STATE_TYPE_CONFIG[stateNode.type];

  return (
    <button
      onClick={() => onSelect(stateId)}
      className={cn(
        "group relative flex flex-col gap-1 w-full text-left px-4 py-3 rounded-xl border transition-all duration-200",
        "hover:scale-[1.01] active:scale-[0.99]",
        isSelected
          ? "bg-indigo-500/10 border-indigo-500/50 shadow-lg shadow-indigo-900/20"
          : isActive
          ? cn(
            "bg-emerald-500/10 border-emerald-500/40 shadow-md",
            config.glowClass,
          )
          : cn(
            "bg-zinc-900/40 hover:bg-zinc-900/70",
            config.borderClass,
            "hover:border-zinc-600",
          ),
      )}
      aria-pressed={isSelected}
      aria-label={`State: ${stateId} (${stateNode.type})`}
    >
      {/* Active pulse indicator */}
      {isActive && (
        <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
      )}

      <div className="flex items-center gap-2 pr-5">
        {/* Type badge */}
        <span
          className={cn(
            "inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-black shrink-0 border",
            config.badgeClass,
            isActive ? "border-emerald-500/30" : "border-transparent",
          )}
        >
          {config.label}
        </span>

        {/* State ID */}
        <span
          className={cn(
            "text-sm font-semibold truncate",
            isActive
              ? "text-emerald-300"
              : isSelected
              ? "text-indigo-200"
              : "text-zinc-200 group-hover:text-white",
          )}
        >
          {stateId}
        </span>

        {/* Initial marker */}
        {isInitial && (
          <span className="ml-auto shrink-0 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            INIT
          </span>
        )}
      </div>

      {/* Metadata row */}
      <div className="flex items-center gap-2 pl-7 text-[10px] text-zinc-500">
        <span className="capitalize">{stateNode.type}</span>
        {childCount > 0 && (
          <>
            <span className="text-zinc-700">·</span>
            <span>{childCount} children</span>
          </>
        )}
        {stateNode.entryActions.length > 0 && (
          <>
            <span className="text-zinc-700">·</span>
            <span>{stateNode.entryActions.length} entry</span>
          </>
        )}
        {stateNode.exitActions.length > 0 && (
          <>
            <span className="text-zinc-700">·</span>
            <span>{stateNode.exitActions.length} exit</span>
          </>
        )}
      </div>
    </button>
  );
}
