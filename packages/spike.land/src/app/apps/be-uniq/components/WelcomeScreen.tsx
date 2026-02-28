"use client";

import { Fingerprint, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TreeStats } from "./TreeStats";

interface WelcomeScreenProps {
  treeStats: {
    userCount: number;
    maxDepth: number;
    nodeCount: number;
    occupiedLeaves: number;
  } | null;
  onStart: () => void;
  isLoading: boolean;
}

export function WelcomeScreen(
  { treeStats, onStart, isLoading }: WelcomeScreenProps,
) {
  return (
    <div className="flex flex-col items-center text-center max-w-lg mx-auto gap-8">
      {/* Animated logo */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 blur-2xl opacity-40 animate-pulse" />
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-fuchsia-500/30">
          <Fingerprint className="w-12 h-12 text-white" />
        </div>
      </div>

      {/* Title */}
      <div className="space-y-3">
        <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-fuchsia-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
          beUniq
        </h1>
        <p className="text-lg text-zinc-400 max-w-sm leading-relaxed">
          Answer yes/no questions until your combination is
          <span className="text-fuchsia-300 font-semibold">
            one nobody else has chosen
          </span>.
        </p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-4 w-full">
        {[
          { step: "1", label: "Answer", desc: "Yes or No" },
          { step: "2", label: "Navigate", desc: "The tree" },
          { step: "3", label: "Be Unique", desc: "First ever!" },
        ].map(item => (
          <div
            key={item.step}
            className="rounded-xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white mx-auto mb-2">
              {item.step}
            </div>
            <div className="text-sm font-semibold text-white">{item.label}</div>
            <div className="text-xs text-zinc-500">{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Community stats */}
      {treeStats && treeStats.userCount > 0 && (
        <TreeStats
          userCount={treeStats.userCount}
          maxDepth={treeStats.maxDepth}
          nodeCount={treeStats.nodeCount}
          occupiedLeaves={treeStats.occupiedLeaves}
        />
      )}

      {/* CTA */}
      <Button
        size="lg"
        onClick={onStart}
        disabled={isLoading}
        className="h-14 px-10 rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold text-lg shadow-xl shadow-fuchsia-500/25 transition-all hover:shadow-fuchsia-500/40 hover:scale-105 active:scale-95 gap-3"
      >
        {isLoading
          ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )
          : <Play className="w-5 h-5" />}
        {isLoading ? "Loading..." : "Start Playing"}
      </Button>
    </div>
  );
}
