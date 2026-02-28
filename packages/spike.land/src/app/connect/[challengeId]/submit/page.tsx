import { PromptSubmitForm } from "@/components/arena/PromptSubmitForm";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Submit Prompt | AI Prompt Arena",
};

export default async function SubmitPage({
  params,
}: {
  params: Promise<{ challengeId: string; }>;
}) {
  const { challengeId } = await params;
  return <PromptSubmitForm challengeId={challengeId} />;
}
