import { GenerateExplorer } from "@/components/generate/generate-explorer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prompt Explorer | Spike Land AI",
  description:
    "Explore how AI system prompts are built from your topic. See which skills activate and what instructions the AI receives.",
};

export default function GeneratePage() {
  return (
    <div className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Prompt Explorer</h1>
        <p className="text-muted-foreground">
          See how your topic activates different AI skills and shapes the system prompt.
        </p>
      </div>
      <GenerateExplorer />
    </div>
  );
}
