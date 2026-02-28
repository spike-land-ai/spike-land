"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SkillGapTable } from "@/components/career/SkillGapTable";
import { useSkillComparison } from "@/hooks/useSkillComparison";
import { useCareerStore } from "@/lib/store/career";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchBadge } from "@/components/career/MatchBadge";
import dynamic from "next/dynamic";

// SkillRadarChart depends on a canvas/SVG charting library.
// Keep it out of the initial parse with a dynamic import + loading skeleton.
const SkillRadarChart = dynamic(
  () => import("@/components/career/SkillRadarChart").then(mod => mod.SkillRadarChart),
  { ssr: false, loading: () => <Skeleton className="h-60 bg-zinc-800" /> },
);

function CompareContent() {
  const searchParams = useSearchParams();
  const occupationUri = searchParams.get("occupation") ?? "";
  const { userSkills } = useCareerStore();
  const { comparison, isLoading, error } = useSkillComparison(
    occupationUri,
    userSkills,
  );

  if (!occupationUri) {
    return (
      <div className="text-center py-12 text-zinc-500">
        Select an occupation to compare your skills against.
      </div>
    );
  }

  if (userSkills.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        Complete your skills assessment first to see comparisons.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-80 bg-zinc-800" />
        <Skeleton className="h-60 bg-zinc-800" />
      </div>
    );
  }

  if (error || !comparison) {
    return (
      <div className="text-center py-12 text-red-400">
        Failed to load comparison data. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">
            {comparison.occupation.title}
          </h2>
          <p className="text-sm text-zinc-400">
            {comparison.matchedSkills}/{comparison.totalRequired} skills matched
          </p>
        </div>
        <MatchBadge score={comparison.score} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-white text-sm">Skills Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <SkillRadarChart gaps={comparison.gaps} />
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-white text-sm">
              Skill Gap Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SkillGapTable gaps={comparison.gaps} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold text-white mb-2">Skills Comparison</h1>
      <p className="text-zinc-400 mb-8">
        See how your skills stack up against occupation requirements.
      </p>
      <Suspense fallback={<Skeleton className="h-96 bg-zinc-800" />}>
        <CompareContent />
      </Suspense>
    </div>
  );
}
