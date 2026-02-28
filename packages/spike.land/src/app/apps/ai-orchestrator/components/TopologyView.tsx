"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Bot,
  Network,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { AgentStatus, TopologyNode, TrustLevel } from "./types";

interface TopologyViewProps {
  nodes: TopologyNode[];
  selectedAgentId: string | null;
  onSelectAgent: (id: string) => void;
}

const STATUS_DOT: Record<AgentStatus, string> = {
  active: "bg-emerald-500 animate-pulse",
  idle: "bg-amber-500",
  stopped: "bg-zinc-600",
};

const TRUST_CONFIG: Record<TrustLevel, {
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
}> = {
  ADMIN: {
    icon: <ShieldCheck className="w-3 h-3" />,
    colorClass: "text-violet-400",
    bgClass: "bg-violet-500/10 border-violet-500/30",
  },
  TRUSTED: {
    icon: <Shield className="w-3 h-3" />,
    colorClass: "text-emerald-400",
    bgClass: "bg-emerald-500/10 border-emerald-500/30",
  },
  SANDBOX: {
    icon: <ShieldAlert className="w-3 h-3" />,
    colorClass: "text-amber-400",
    bgClass: "bg-amber-500/10 border-amber-500/30",
  },
};

interface TopologyNodeCardProps {
  node: TopologyNode;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function TopologyNodeCard(
  { node, isSelected, onSelect }: TopologyNodeCardProps,
) {
  const trustConfig = TRUST_CONFIG[node.trustLevel];
  const total = node.successCount + node.failCount;
  const successRate = total > 0
    ? Math.round((node.successCount / total) * 100)
    : 100;
  const isHealthy = successRate >= 80;

  return (
    <button
      type="button"
      onClick={() => onSelect(node.id)}
      className={`w-full text-left rounded-xl border p-3 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
        isSelected
          ? "border-violet-500/50 bg-violet-950/20"
          : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Avatar with status dot */}
        <div className="relative shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
            <Bot className="w-4 h-4 text-zinc-400" />
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-zinc-900 ${
              STATUS_DOT[node.status]
            }`}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-xs font-semibold text-zinc-200 truncate">
              {node.displayName}
            </p>
            <Badge
              variant="outline"
              className={`text-[9px] px-1 py-0 ml-1 shrink-0 ${trustConfig.bgClass} ${trustConfig.colorClass}`}
            >
              <span className="flex items-center gap-0.5">
                {trustConfig.icon}
                {node.trustLevel}
              </span>
            </Badge>
          </div>

          {/* Success rate bar */}
          <div className="mt-1.5 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-zinc-600">Success rate</span>
              <span
                className={`text-[9px] font-bold flex items-center gap-0.5 ${
                  isHealthy ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {isHealthy
                  ? <TrendingUp className="w-2.5 h-2.5" />
                  : <TrendingDown className="w-2.5 h-2.5" />}
                {successRate}%
              </span>
            </div>
            <Progress value={successRate} className="h-1" />
          </div>

          <div className="flex gap-3 mt-1.5 text-[9px] text-zinc-600">
            <span className="text-emerald-600">{node.successCount} ok</span>
            <span className="text-red-600">{node.failCount} fail</span>
          </div>
        </div>
      </div>
    </button>
  );
}

export function TopologyView(
  { nodes, selectedAgentId, onSelectAgent }: TopologyViewProps,
) {
  const activeCount = nodes.filter(n => n.status === "active").length;
  const idleCount = nodes.filter(n => n.status === "idle").length;
  const stoppedCount = nodes.filter(n => n.status === "stopped").length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-bold text-zinc-300">Topology</span>
        </div>
        <span className="text-[10px] text-zinc-600">{nodes.length} nodes</span>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        <div className="text-center p-1.5 rounded-lg bg-zinc-800/40">
          <span className="text-sm font-bold text-emerald-400">
            {activeCount}
          </span>
          <p className="text-[9px] text-zinc-600">Active</p>
        </div>
        <div className="text-center p-1.5 rounded-lg bg-zinc-800/40">
          <span className="text-sm font-bold text-amber-400">{idleCount}</span>
          <p className="text-[9px] text-zinc-600">Idle</p>
        </div>
        <div className="text-center p-1.5 rounded-lg bg-zinc-800/40">
          <span className="text-sm font-bold text-zinc-500">
            {stoppedCount}
          </span>
          <p className="text-[9px] text-zinc-600">Stopped</p>
        </div>
      </div>

      {/* Node list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {nodes.length === 0
          ? (
            <div className="py-8 text-center">
              <Network className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-600">No agents in swarm</p>
            </div>
          )
          : (
            nodes.map(node => (
              <TopologyNodeCard
                key={node.id}
                node={node}
                isSelected={selectedAgentId === node.id}
                onSelect={onSelectAgent}
              />
            ))
          )}
      </div>
    </div>
  );
}
