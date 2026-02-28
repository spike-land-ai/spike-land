import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BAZDMEG | The Quality First Manifesto for AI-Assisted Development",
  description:
    "Seven principles for AI-assisted development. Discipline before automation. Context is architecture. Own what you ship. Ask questions, explore the methodology.",
  openGraph: {
    title: "BAZDMEG | Stop Coding, Start Orchestrating",
    description:
      "The quality-first manifesto for agentic developers. 7 principles, effort splits, and quality gates for AI-assisted development.",
    type: "website",
    siteName: "Spike Land",
  },
  twitter: {
    card: "summary_large_image",
    title: "BAZDMEG | The Quality First Manifesto",
    description:
      "Seven principles for AI-assisted development that separate orchestrators from typists.",
  },
};

export default function BazdmegLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-950 min-h-screen selection:bg-amber-500/30">
      {children}
    </div>
  );
}
