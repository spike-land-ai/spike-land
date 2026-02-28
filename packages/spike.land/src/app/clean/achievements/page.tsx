"use client";

import { CleanAchievementGrid } from "@/components/clean/CleanAchievementGrid";
import { useCleanAchievements } from "@/hooks/useCleanAchievements";
import { Loader2 } from "lucide-react";

export default function CleanAchievementsPage() {
  const { achievements, loading } = useCleanAchievements();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Achievements</h2>
        <p className="text-muted-foreground">
          {achievements.filter(a => a.unlockedAt).length} of {achievements.length} unlocked
        </p>
      </div>
      <CleanAchievementGrid achievements={achievements} />
    </div>
  );
}
