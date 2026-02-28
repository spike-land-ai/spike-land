import type { Metadata } from "next";
import { AiOrchestratorClient } from "./AiOrchestratorClient";

export const metadata: Metadata = {
  title: "AI Orchestrator | spike.land",
  description: "Multi-model AI pipeline builder and prompt engineering studio.",
};

export default function AiOrchestratorPage() {
  return <AiOrchestratorClient />;
}
