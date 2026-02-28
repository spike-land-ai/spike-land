import type { Metadata } from "next";
import { StoreStructuredData } from "./components/store-structured-data";

export const metadata: Metadata = {
  description:
    "Create and deploy full-stack apps from a single prompt. Powered by Model Context Protocol. Free and open source. Alpha.",
  keywords: [
    "AI apps",
    "AI-generated applications",
    "MCP tools",
    "AI agents",
    "React apps",
    "free apps",
    "Spike Land",
    "AI app store",
    "full-stack apps",
    "model context protocol",
    "single prompt",
    "deploy apps",
  ],
  alternates: {
    canonical: "https://spike.land/apps/store",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "App Store — 40+ AI-Powered Apps | Spike Land",
    description:
      "Create and deploy full-stack apps from a single prompt. Powered by Model Context Protocol. Free and open source.",
    type: "website",
    url: "https://spike.land/apps/store",
    siteName: "Spike Land",
  },
  twitter: {
    card: "summary_large_image",
    title: "App Store — 40+ AI-Powered Apps | Spike Land",
    description:
      "Create and deploy full-stack apps from a single prompt. Powered by Model Context Protocol. Free and open source.",
  },
};

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative bg-zinc-950 min-h-screen selection:bg-blue-500/30 overflow-hidden">
      {/* Ambient mesh gradient — persistent behind all store content */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        {/* Top-center blue halo */}
        <div className="absolute -top-60 left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-blue-600/10 blur-[180px]" />
        {/* Bottom-right accent */}
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-purple-600/8 blur-[160px]" />
        {/* Bottom-left subtle warmth */}
        <div className="absolute bottom-1/4 -left-20 h-[400px] w-[400px] rounded-full bg-cyan-600/6 blur-[140px]" />
      </div>

      <div className="relative z-10">
        <StoreStructuredData />
        {children}
      </div>
    </div>
  );
}
