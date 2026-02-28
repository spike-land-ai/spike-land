import { Leaderboard } from "@/components/arena/Leaderboard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leaderboard | AI Prompt Arena",
  description: "See who writes the best AI prompts. ELO rankings for the Prompt Arena.",
};

export default function LeaderboardPage() {
  return <Leaderboard />;
}
