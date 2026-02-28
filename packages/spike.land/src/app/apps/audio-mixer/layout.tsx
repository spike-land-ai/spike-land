/**
 * Audio Studio App Layout
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audio Studio | Spike Land",
  description:
    "Multi-track audio mixing, AI text-to-speech, and voice cloning powered by MCP tools.",
};

export default function AudioStudioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-zinc-950 text-white">
      {children}
    </div>
  );
}
