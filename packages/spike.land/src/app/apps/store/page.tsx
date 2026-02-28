import type { Metadata } from "next";
import { Suspense } from "react";
import { StorePageClient } from "@/app/store/components/store-page-client";
import { StoreAppGridSkeleton } from "@/app/store/components/store-app-grid";

export const metadata: Metadata = {
  title: "App Store — Build Full-Stack Apps with a Single Prompt | Spike Land",
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
  openGraph: {
    title: "App Store — Build Full-Stack Apps with a Single Prompt | Spike Land",
    description:
      "Create and deploy full-stack apps from a single prompt. Powered by Model Context Protocol. Free and open source.",
    type: "website",
    url: "https://spike.land/apps/store",
    siteName: "Spike Land",
  },
  twitter: {
    card: "summary_large_image",
    title: "App Store — Build Full-Stack Apps with a Single Prompt | Spike Land",
    description:
      "Create and deploy full-stack apps from a single prompt. Powered by Model Context Protocol. Free and open source.",
  },
};

export default function AppStorePage() {
  return (
    <div className="bg-background min-h-screen selection:bg-blue-500/30">
      {/* Ambient page glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[1200px] rounded-full bg-gradient-to-b from-primary/8 via-accent/5 to-transparent blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[600px] rounded-full bg-gradient-to-tl from-primary/5 to-transparent blur-[120px]" />
      </div>
      <Suspense
        fallback={
          <div className="pt-32 pb-24">
            <StoreAppGridSkeleton count={6} />
          </div>
        }
      >
        <StorePageClient />
      </Suspense>
    </div>
  );
}
