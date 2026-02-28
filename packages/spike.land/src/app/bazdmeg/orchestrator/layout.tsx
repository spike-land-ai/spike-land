import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BAZDMEG Orchestrator | Dev Management Chat",
  description:
    "Chat-driven development management. Check quality gates, monitor CI, create tickets, and orchestrate agents.",
};

export default function OrchestratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-950 min-h-screen flex flex-col">
      <main className="flex-1">{children}</main>
    </div>
  );
}
