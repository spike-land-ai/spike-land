"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BrainCircuit,
  CheckCircle2,
  Coins,
  Megaphone,
  MessageSquare,
  PlusCircle,
  RefreshCw,
  Users,
  Zap,
} from "lucide-react";
import { AgentCard } from "./AgentCard";
import type { SwarmAgent } from "./types";

interface SwarmDashboardProps {
  agents: SwarmAgent[];
  isLoading: boolean;
  selectedAgentId: string | null;
  onSelectAgent: (id: string) => void;
  onStopAgent: (id: string) => void;
  onSendMessage: (id: string) => void;
  onRefresh: () => void;
  onSpawnAgent: () => void;
  onBroadcast: () => void;
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold text-zinc-100 leading-none">{value}</p>
        <p className="text-[10px] text-zinc-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function formatTokenTotal(agents: SwarmAgent[]): string {
  const total = agents.reduce((sum, a) => sum + a.totalTokensUsed, 0);
  if (total >= 1_000_000) return `${(total / 1_000_000).toFixed(1)}M`;
  if (total >= 1_000) return `${(total / 1_000).toFixed(1)}K`;
  return String(total);
}

export function SwarmDashboard({
  agents,
  isLoading,
  selectedAgentId,
  onSelectAgent,
  onStopAgent,
  onSendMessage,
  onRefresh,
  onSpawnAgent,
  onBroadcast,
}: SwarmDashboardProps) {
  const activeCount = agents.filter(a => a.status === "active").length;
  const totalTasks = agents.reduce((sum, a) => sum + a.totalTasksCompleted, 0);
  const totalMessages = agents.reduce((sum, a) => sum + a.messageCount, 0);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Summary stats */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-bold text-zinc-300">
              Swarm Overview
            </span>
            {activeCount > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              >
                <Zap className="w-2.5 h-2.5 mr-0.5" />
                {activeCount} live
              </Badge>
            )}
          </div>
          <div className="flex gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-zinc-500 hover:text-zinc-300"
              onClick={onRefresh}
              aria-label="Refresh agents"
              disabled={isLoading}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-zinc-500 hover:text-amber-400"
              onClick={onBroadcast}
              aria-label="Broadcast to all agents"
            >
              <Megaphone className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              className="h-7 gap-1.5 text-[11px] bg-violet-600 hover:bg-violet-500 text-white border-0"
              onClick={onSpawnAgent}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Spawn
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon={<Users className="w-4 h-4 text-violet-400" />}
            label="Total Agents"
            value={agents.length}
            accent="bg-violet-500/10"
          />
          <StatCard
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            label="Tasks Done"
            value={totalTasks}
            accent="bg-emerald-500/10"
          />
          <StatCard
            icon={<Coins className="w-4 h-4 text-amber-400" />}
            label="Tokens Used"
            value={formatTokenTotal(agents)}
            accent="bg-amber-500/10"
          />
          <StatCard
            icon={<MessageSquare className="w-4 h-4 text-blue-400" />}
            label="Messages"
            value={totalMessages}
            accent="bg-blue-500/10"
          />
        </div>
      </div>

      {/* Agent grid */}
      <div className="flex-1 overflow-y-auto">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
          Agents ({agents.length})
        </p>

        {isLoading && agents.length === 0
          ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="h-32 rounded-xl bg-zinc-800/30 animate-pulse"
                />
              ))}
            </div>
          )
          : agents.length === 0
          ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Users className="w-10 h-10 text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-600">No agents in the swarm</p>
              <p className="text-[10px] text-zinc-700 mt-1">
                Spawn an agent to get started
              </p>
            </div>
          )
          : (
            <div className="space-y-2 pb-2">
              {agents.map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  isSelected={selectedAgentId === agent.id}
                  onSelect={onSelectAgent}
                  onStop={onStopAgent}
                  onSendMessage={onSendMessage}
                />
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
