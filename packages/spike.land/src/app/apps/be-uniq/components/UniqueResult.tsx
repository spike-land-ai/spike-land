"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, RefreshCw, Sparkles, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UniqueResultProps {
  answers: Array<{ question: string; answer: boolean; tags: string[]; }>;
  profile: { tags: string[]; leafNodeId: string; answerCount: number; } | null;
  onPlayAgain: () => void;
  onBackToWelcome: () => void;
  isLoading: boolean;
}

/* ── CSS-only confetti ───────────────────────────────────────────────── */

function Confetti() {
  const [particles, setParticles] = useState<
    Array<
      { id: number; left: number; delay: number; color: string; size: number; }
    >
  >([]);

  useEffect(() => {
    const colors = [
      "bg-fuchsia-400",
      "bg-purple-400",
      "bg-indigo-400",
      "bg-pink-400",
      "bg-yellow-400",
      "bg-emerald-400",
      "bg-cyan-400",
    ];
    const items = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      size: Math.random() * 6 + 4,
    }));
    setParticles(items);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className={`absolute rounded-sm ${p.color} opacity-80`}
          style={{
            left: `${p.left}%`,
            top: "-10px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `confetti-fall ${2 + Math.random() * 2}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
      <style>
        {`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}
      </style>
    </div>
  );
}

export function UniqueResult({
  answers,
  profile,
  onPlayAgain,
  onBackToWelcome,
  isLoading,
}: UniqueResultProps) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {showConfetti && <Confetti />}

      <div className="flex flex-col items-center max-w-lg mx-auto gap-6 w-full">
        {/* Celebration header */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-fuchsia-500 to-yellow-400 blur-3xl opacity-30 animate-pulse" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-fuchsia-500/40">
            <Sparkles className="w-10 h-10 text-yellow-300" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-fuchsia-400 via-yellow-300 to-purple-400 bg-clip-text text-transparent">
            You&apos;re Unique!
          </h1>
          <p className="text-zinc-400 text-sm">
            Your combination of {answers.length} answer{answers.length !== 1 ? "s" : ""}{" "}
            is one nobody else has chosen.
          </p>
        </div>

        {/* Answer journey */}
        <div className="w-full rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
            <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
              Your Answer Path
            </span>
          </div>
          <div className="divide-y divide-white/5">
            {answers.map((a, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    a.answer
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-rose-500/20 text-rose-400"
                  }`}
                >
                  {a.answer
                    ? <Check className="w-3 h-3" />
                    : <X className="w-3 h-3" />}
                </div>
                <span className="text-sm text-zinc-300 flex-1">
                  {a.question}
                </span>
                <span
                  className={`text-xs font-bold ${a.answer ? "text-emerald-400" : "text-rose-400"}`}
                >
                  {a.answer ? "YES" : "NO"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Derived tags */}
        {profile && profile.tags.length > 0 && (
          <div className="w-full">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-fuchsia-400" />
              <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
                Your Profile Tags
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
            Play Again
          </Button>
        </div>
      </div>
    </>
  );
}
