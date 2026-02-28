import { ChallengeDetail } from "@/components/arena/ChallengeDetail";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Challenge | AI Prompt Arena",
};

export default async function ChallengePage({
  params,
}: {
  params: Promise<{ challengeId: string; }>;
}) {
  const { challengeId } = await params;
  return <ChallengeDetail challengeId={challengeId} />;
}
