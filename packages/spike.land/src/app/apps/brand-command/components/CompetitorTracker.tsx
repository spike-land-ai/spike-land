"use client";

import { Activity, Loader2, RefreshCw, Tag, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompetitorEvent {
  name: string;
  event: string;
  time: string;
}

interface CompetitorTrackerProps {
  isLoading: boolean;
  trendLoading: boolean;
  competitorData: unknown;
  trendData: unknown;
  onFetchCompetitors: () => void;
  onFetchTrends: () => void;
}

function extractCompetitors(data: unknown): CompetitorEvent[] {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data
      .map(item => {
        if (typeof item === "object" && item !== null) {
          const d = item as Record<string, unknown>;
          return {
            name: typeof d.name === "string" ? d.name : "Unknown",
            event: typeof d.event === "string"
              ? d.event
              : "Activity detected",
            time: typeof d.time === "string" ? d.time : "recently",
          };
        }
        return null;
      })
      .filter((x): x is CompetitorEvent => x !== null);
  }
  return [];
}

function extractTopics(data: unknown): string[] {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data
      .map(item => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item !== null) {
          const d = item as Record<string, unknown>;
          return typeof d.topic === "string"
            ? d.topic
            : typeof d.name === "string"
            ? d.name
            : null;
        }
        return null;
      })
      .filter((x): x is string => x !== null);
  }
  return [];
}

const DEFAULT_COMPETITORS: CompetitorEvent[] = [
  { name: "Acme Corp", event: "New SaaS Launch", time: "2h ago" },
  { name: "Global Dyn", event: "Series B Raised", time: "5h ago" },
];

const DEFAULT_TRENDS = [
  "AI First",
  "Composable Architecture",
  "Autonomous Swarms",
  "Token Economy",
];

export function CompetitorTracker({
  isLoading,
  trendLoading,
  competitorData,
  trendData,
  onFetchCompetitors,
  onFetchTrends,
}: CompetitorTrackerProps) {
  const competitors = extractCompetitors(competitorData).length > 0
    ? extractCompetitors(competitorData)
    : DEFAULT_COMPETITORS;

  const topics = extractTopics(trendData).length > 0
    ? extractTopics(trendData)
    : DEFAULT_TRENDS;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Activity className="w-5 h-5 text-blue-500" />
        Market Pulse
      </h2>
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-6">
        {/* Trending Topics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest font-bold text-zinc-500">
              Trending Keywords
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onFetchTrends}
              disabled={trendLoading}
              className="h-6 px-2 text-zinc-500 hover:text-zinc-300"
            >
              {trendLoading
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <RefreshCw className="w-3 h-3" />}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {topics.map(tag => (
              <span
                key={tag}
                className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 text-zinc-300 rounded-lg text-xs hover:bg-zinc-700 cursor-default transition-colors border border-zinc-700/50"
              >
                <Tag className="w-3 h-3 text-zinc-500" />
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Competitor Activity */}
        <div className="space-y-4 pt-4 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest font-bold text-zinc-500">
              Competitor Activity
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onFetchCompetitors}
              disabled={isLoading}
              className="h-6 px-2 text-zinc-500 hover:text-zinc-300"
            >
              {isLoading
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <TrendingUp className="w-3 h-3" />}
            </Button>
          </div>
          <div className="space-y-4">
            {competitors.map(e => (
              <div
                key={`${e.name}-${e.event}`}
                className="flex items-center gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] flex-shrink-0" />
                <div className="flex-1 text-sm min-w-0">
                  <span className="text-zinc-400 underline decoration-zinc-800 block truncate">
                    {e.name}
                  </span>
                  <p className="text-zinc-200 mt-0.5 truncate">{e.event}</p>
                </div>
                <span className="text-[10px] text-zinc-600 font-mono flex-shrink-0">
                  {e.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
