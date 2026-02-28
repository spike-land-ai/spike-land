"use client";

import { Loader2, ThumbsDown, ThumbsUp } from "lucide-react";

interface QuestionCardProps {
  question: string;
  questionNumber: number;
  answers: Array<{ question: string; answer: boolean; }>;
  onYes: () => void;
  onNo: () => void;
  isLoading: boolean;
}

export function QuestionCard({
  question,
  questionNumber,
  answers,
  onYes,
  onNo,
  isLoading,
}: QuestionCardProps) {
  return (
    <div className="flex flex-col items-center max-w-lg mx-auto gap-8 w-full">
      {/* Progress dots */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {answers.map((a, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              a.answer
                ? "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                : "bg-zinc-600 ring-1 ring-zinc-500"
            }`}
            title={`${a.question} → ${a.answer ? "Yes" : "No"}`}
          />
        ))}
        <div className="w-3 h-3 rounded-full bg-fuchsia-400 animate-pulse shadow-sm shadow-fuchsia-400/50" />
      </div>

      {/* Question counter */}
      <div className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
        Question {questionNumber}
      </div>

      {/* Question card */}
      <div className="relative w-full">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 blur-xl" />
        <div className="relative rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-8 shadow-2xl">
          {isLoading
            ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-fuchsia-400 animate-spin" />
              </div>
            )
            : (
              <h2 className="text-2xl font-bold text-white text-center leading-relaxed">
                {question}
              </h2>
            )}
        </div>
      </div>

      {/* Yes / No buttons */}
      <div className="flex gap-4 w-full">
        <button
          onClick={onYes}
          disabled={isLoading}
          className="group flex-1 h-16 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all duration-200 flex items-center justify-center gap-3 text-emerald-400 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
        >
          <ThumbsUp className="w-5 h-5 group-hover:animate-bounce" />
          YES
        </button>
        <button
          onClick={onNo}
          disabled={isLoading}
          className="group flex-1 h-16 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/40 transition-all duration-200 flex items-center justify-center gap-3 text-rose-400 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
        >
          <ThumbsDown className="w-5 h-5 group-hover:animate-bounce" />
          NO
        </button>
      </div>
    </div>
  );
}
