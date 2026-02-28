"use client";

import { useBrandCommandMcp } from "./hooks/useBrandCommandMcp";
import { BrandScoreCard } from "./components/BrandScoreCard";
import { CopyGenerator } from "./components/CopyGenerator";
import { CompetitorTracker } from "./components/CompetitorTracker";
import { PolicyChecker } from "./components/PolicyChecker";
import { Button } from "@/components/ui/button";
import {
  Activity,
  ChevronLeft,
  LayoutDashboard,
  Megaphone,
} from "lucide-react";
import Link from "next/link";

const BRAND_VOICE_ITEMS = [
  { name: "Website Homepage", score: 98, status: "Perfect Match" },
  { name: "Twitter Launch Thread", score: 82, status: "Slightly Off-Tone" },
  { name: "Customer Support Email", score: 91, status: "Consistent" },
];

export function BrandCommandClient() {
  const { mutations } = useBrandCommandMcp();

  const handleReview = (_name: string) => {
    mutations.analyzeBrandVoice.mutate({});
  };

  const handleGenerate = (args: { type: string; prompt: string; }) => {
    mutations.generateAdCopy.mutate(args);
  };

  const handleCheckPolicy = (args: { content: string; }) => {
    mutations.brandConsistencyCheck.mutate(args);
  };

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Header */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link
            href="/store"
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-fuchsia-400" />
            <span className="font-semibold tracking-tight">Brand Command</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => mutations.audienceInsights.mutate({})}
            disabled={mutations.audienceInsights.isLoading}
            className="gap-2 text-zinc-400"
          >
            <Activity className="w-4 h-4" />
            Live Insights
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white border-0"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10 max-w-7xl mx-auto w-full">
        {/* Welcome Section */}
        <section className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Welcome back,{" "}
            <span className="text-fuchsia-400 underline decoration-fuchsia-500/30 underline-offset-8">
              Spike
            </span>
          </h1>
          <p className="text-zinc-400 max-w-2xl text-lg">
            Unified control center for your brand identity and creative execution.
          </p>
        </section>

        {/* Primary Dashboard Grid: Brand Score + Copy Generator */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Brand Voice Integrity — spans 2 cols */}
          <div className="lg:col-span-2">
            <BrandScoreCard
              items={BRAND_VOICE_ITEMS}
              onReview={handleReview}
            />
          </div>

          {/* Competitor Tracker sidebar */}
          <div>
            <CompetitorTracker
              isLoading={mutations.competitorAnalysis.isLoading}
              trendLoading={mutations.trendDetection.isLoading}
              competitorData={mutations.competitorAnalysis.data}
              trendData={mutations.trendDetection.data}
              onFetchCompetitors={() => mutations.competitorAnalysis.mutate({})}
              onFetchTrends={() => mutations.trendDetection.mutate({})}
            />
          </div>
        </div>

        {/* Secondary Grid: Copy Generator + Policy Checker */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <CopyGenerator
            isLoading={mutations.generateAdCopy.isLoading}
            result={mutations.generateAdCopy.data}
            onGenerate={handleGenerate}
            onReset={mutations.generateAdCopy.reset}
          />

          <PolicyChecker
            isLoading={mutations.brandConsistencyCheck.isLoading}
            result={mutations.brandConsistencyCheck.data}
            onCheck={handleCheckPolicy}
            onReset={mutations.brandConsistencyCheck.reset}
          />
        </div>
      </main>
    </div>
  );
}
