"use client";

import { ArrowLeft, Check, RefreshCw, Tag, TreePine, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileInsightProps {
  profile: { tags: string[]; leafNodeId: string; answerCount: number; } | null;
  onPlayAgain: () => void;
  onBackToWelcome: () => void;
  isLoading: boolean;
}

export function ProfileInsight({
  profile,
  onPlayAgain,
  onBackToWelcome,
  isLoading,
}: ProfileInsightProps) {
  return (
    <div className="flex flex-col items-center max-w-lg mx-auto gap-6 w-full">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 blur-2xl opacity-30" />
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-purple-500/30">
          <User className="w-10 h-10 text-white" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
          Already Profiled
        </h1>
        <p className="text-zinc-400 text-sm max-w-sm">
          You&apos;ve already found your unique spot in the tree! Here&apos;s your profile — or
          reset and try a new path.
        </p>
      </div>

      {/* Profile card */}
      {profile && (
        <div className="w-full rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
            <TreePine className="w-4 h-4 text-purple-400" />
            <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
              Your Profile
            </span>
          </div>

          <div className="p-5 space-y-4">
            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <div className="text-2xl font-black text-fuchsia-400">
                  {profile.answerCount}
                </div>
                <div className="text-xs text-zinc-500">Questions Answered</div>
              </div>
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <div className="text-2xl font-black text-purple-400">
                  {profile.tags.length}
                </div>
                <div className="text-xs text-zinc-500">Profile Tags</div>
              </div>
            </div>

            {/* Tags */}
            {profile.tags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span className="text-xs text-zinc-500 font-medium">
                    Derived Tags
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.tags.map(tag => (
                    <span
                      key={tag}
                      className="rounded-full px-3 py-1 text-xs font-medium bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Leaf ID */}
            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <Check className="w-3 h-3" />
              <span>Leaf: {profile.leafNodeId}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 w-full pt-2">
        <Button
          variant="outline"
          onClick={onBackToWelcome}
          className="flex-1 h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Home
        </Button>
        <Button
          onClick={onPlayAgain}
          disabled={isLoading}
          className="flex-1 h-12 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold gap-2 shadow-lg shadow-fuchsia-500/20"
        >
          {isLoading
            ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )
            : <RefreshCw className="w-4 h-4" />}
          Reset & Play Again
        </Button>
      </div>
    </div>
  );
}
