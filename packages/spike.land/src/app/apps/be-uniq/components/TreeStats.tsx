"use client";

import { GitBranch, Layers, Leaf, Users } from "lucide-react";

interface TreeStatsProps {
  userCount: number;
  maxDepth: number;
  nodeCount: number;
  occupiedLeaves: number;
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 backdrop-blur-sm">
      <Icon className="w-4 h-4 text-fuchsia-400" />
      <span className="text-xs text-zinc-400">{label}</span>
      <span className="text-sm font-bold text-white tabular-nums">{value}</span>
    </div>
  );
}

export function TreeStats(
  { userCount, maxDepth, nodeCount, occupiedLeaves }: TreeStatsProps,
) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      <StatPill icon={Users} label="Players" value={userCount} />
      <StatPill icon={GitBranch} label="Depth" value={maxDepth} />
      <StatPill icon={Layers} label="Nodes" value={nodeCount} />
      <StatPill icon={Leaf} label="Taken" value={occupiedLeaves} />
    </div>
  );
}
