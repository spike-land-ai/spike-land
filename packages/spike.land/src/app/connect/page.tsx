import { ArenaDashboard } from "@/components/arena/ArenaDashboard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Prompt Arena | Spike Land",
  description:
    "Compete in the AI Prompt Arena. Write single-shot prompts, generate React apps, and climb the ELO leaderboard.",
};

export default function ConnectPage() {
  return <ArenaDashboard />;
}
