"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Bot,
  CheckCircle2,
  Clock,
  Coins,
  Cpu,
  FolderOpen,
  Send,
  StopCircle,
} from "lucide-react";
import type { AgentStatus, SwarmAgent } from "./types";

interface AgentCardProps {
  agent: SwarmAgent;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onStop: (id: string) => void;
  onSendMessage: (id: string) => void;
}

const STATUS_CONFIG: Record<
  AgentStatus,
  { label: string; dotClass: string; badgeClass: string; }
> = {
  active: {
    label: "Active",
    dotClass: "bg-emerald-500 animate-pulse",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  idle: {
    label: "Idle",
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  stopped: {
    label: "Stopped",
    dotClass: "bg-zinc-600",
    badgeClass: "bg-zinc-800 text-zinc-500 border-zinc-700",
  },
};

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return "Never";
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatTokens(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

export function AgentCard(
  { agent, isSelected, onSelect, onStop, onSendMessage }: AgentCardProps,
) {
  const statusConfig = STATUS_CONFIG[agent.status];
  const trustRate = agent.trustSuccessful + agent.trustFailed > 0
    ? Math.round(
      (agent.trustSuccessful / (agent.trustSuccessful + agent.trustFailed))
        * 100,
    )
    : 100;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={() => onSelect(agent.id)}
      onKeyDown={e => e.key === "Enter" && onSelect(agent.id)}
      className={`rounded-xl border p-4 cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
        isSelected
          ? "border-violet-500/50 bg-violet-950/20 shadow-lg shadow-violet-500/10"
          : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-800/30"
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-lg bg-violet-900/50 flex items-center justify-center">
              <Bot className="w-4 h-4 text-violet-400" />
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${statusConfig.dotClass}`}
              aria-label={`Status: ${statusConfig.label}`}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-200 truncate">
              {agent.displayName}
            </p>
            <p className="text-[10px] text-zinc-500 font-mono truncate">
              {agent.id.slice(0, 16)}…
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 ${statusConfig.badgeClass}`}
        >
          {statusConfig.label}
        </Badge>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="flex flex-col items-center p-1.5 rounded-lg bg-zinc-800/50">
          <CheckCircle2 className="w-3 h-3 text-emerald-400 mb-0.5" />
          <span className="text-sm font-bold text-zinc-200">
            {agent.totalTasksCompleted}
          </span>
          <span className="text-[9px] text-zinc-600">Tasks</span>
        </div>
        <div className="flex flex-col items-center p-1.5 rounded-lg bg-zinc-800/50">
          <Coins className="w-3 h-3 text-amber-400 mb-0.5" />
          <span className="text-sm font-bold text-zinc-200">
            {formatTokens(agent.totalTokensUsed)}
          </span>
          <span className="text-[9px] text-zinc-600">Tokens</span>
        </div>
        <div className="flex flex-col items-center p-1.5 rounded-lg bg-zinc-800/50">
          <Send className="w-3 h-3 text-blue-400 mb-0.5" />
          <span className="text-sm font-bold text-zinc-200">
            {agent.messageCount}
          </span>
          <span className="text-[9px] text-zinc-600">Msgs</span>
        </div>
      </div>

      {/* Trust score */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-zinc-500 flex items-center gap-1">
            <Cpu className="w-3 h-3" /> Trust
          </span>
          <span className="text-[10px] font-bold text-zinc-400">
            {agent.trustLevel}
          </span>
        </div>
        <Progress value={trustRate} className="h-1" />
      </div>

      {/* Project path */}
      {agent.projectPath && (
        <div className="flex items-center gap-1.5 mb-3 text-[10px] text-zinc-600 truncate">
          <FolderOpen className="w-3 h-3 shrink-0" />
          <span className="truncate font-mono">{agent.projectPath}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-600 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatRelativeTime(agent.lastSeenAt)}
        </span>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10"
            onClick={e => {
              e.stopPropagation();
              onSendMessage(agent.id);
            }}
            aria-label="Send message"
          >
            <Send className="w-3 h-3" />
          </Button>
          {agent.status !== "stopped" && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
              onClick={e => {
                e.stopPropagation();
                onStop(agent.id);
              }}
              aria-label="Stop agent"
            >
              <StopCircle className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
