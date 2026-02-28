"use client";

import { Minus, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BrandVoiceItem {
  name: string;
  score: number;
  status: string;
}

interface BrandScoreCardProps {
  items: BrandVoiceItem[];
  onReview: (name: string) => void;
}

function ScoreTrend({ score }: { score: number; }) {
  if (score > 90) {
    return <TrendingUp className="w-3.5 h-3.5 text-green-400" />;
  }
  if (score > 75) {
    return <Minus className="w-3.5 h-3.5 text-orange-400" />;
  }
  return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
}

function ScoreBar({ score }: { score: number; }) {
  const colorClass = score > 90
    ? "bg-green-500"
    : score > 75
    ? "bg-orange-500"
    : "bg-red-500";
  return (
    <div className="w-24 h-1.5 bg-zinc-800 rounded-full mt-1 overflow-hidden">
      <div
        className={`h-full ${colorClass} transition-all duration-700`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

export function BrandScoreCard({ items, onReview }: BrandScoreCardProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-fuchsia-500" />
        Brand Voice Integrity
      </h2>
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-1">
        <div className="grid grid-cols-1 divide-y divide-zinc-800">
          {items.map(item => {
            const statusColor = item.score > 90
              ? "text-green-400"
              : item.score > 75
              ? "text-orange-400"
              : "text-red-400";
            return (
              <div
                key={item.name}
                className="flex items-center justify-between p-6 hover:bg-zinc-800/30 transition-colors first:rounded-t-[2.75rem] last:rounded-b-[2.75rem]"
              >
                <div className="space-y-1">
                  <span className="font-medium text-zinc-200 block">
                    {item.name}
                  </span>
                  <span className={`text-xs ${statusColor}`}>
                    {item.status}
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5">
                      <ScoreTrend score={item.score} />
                      <span className="text-lg font-bold text-white">
                        {item.score}%
                      </span>
                    </div>
                    <ScoreBar score={item.score} />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReview(item.name)}
                    className="bg-transparent border-zinc-700 hover:bg-zinc-800"
                  >
                    Review
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
