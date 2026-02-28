"use client";

import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { getStoreStats } from "@/app/store/data/store-apps";
import { motion } from "framer-motion";

const CATEGORY_QUICK_LINKS = [
  "creative",
  "productivity",
  "developer",
  "communication",
  "lifestyle",
  "ai-agents",
] as const;

export function StoreHero() {
  const stats = getStoreStats();
  return (
    <ScrollReveal>
      <section className="relative overflow-hidden pt-32 pb-24 md:pt-44 md:pb-32 bg-background">
        {/* Deep, rich background mixing */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-screen z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(59,130,246,0.18),_transparent_60%)]" />
          <motion.div
            animate={{
              scale: [1, 1.1, 0.9, 1],
              opacity: [0.18, 0.28, 0.18],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-20%] left-1/2 -translate-x-1/2 h-[750px] w-[1100px] rounded-full bg-gradient-to-br from-blue-600/30 via-cyan-500/20 to-purple-600/20 blur-[150px]"
          />
          {/* Secondary accent orb — lower left */}
          <motion.div
            animate={{
              scale: [1, 0.9, 1.1, 1],
              opacity: [0.08, 0.14, 0.08],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
            className="absolute bottom-[-10%] left-[-5%] h-[500px] w-[600px] rounded-full bg-gradient-to-br from-purple-600/20 via-fuchsia-500/15 to-transparent blur-[130px]"
          />
        </div>

        {/* Subtle noise texture */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('/noise.png')] z-0" />

        <div className="container relative z-10 mx-auto max-w-5xl px-6 text-center">
          {/* Dynamic app count badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 text-sm font-medium text-blue-400 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400" />
            </span>
            {stats.appCount} Apps in Store
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-6xl font-black leading-[1.1] tracking-tighter md:text-8xl lg:text-[7.5rem] drop-shadow-2xl">
            <span className="text-white">Create.</span>
            <br />
            <span className="bg-gradient-to-br from-blue-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent filter drop-shadow-[0_0_30px_rgba(56,189,248,0.4)]">
              Deploy.
            </span>
            <br />
            <span className="text-white">Done.</span>
          </h1>

          {/* Subline */}
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl drop-shadow-md">
            Full-stack apps from a single prompt. spike-cli lazy-loads MCP tools — your AI sees only
            what it needs. Powered by{" "}
            <span className="text-foreground font-medium">
              Model Context Protocol
            </span>.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col items-center justify-center gap-5 sm:flex-row mb-12 relative z-20">
            <Button
              size="lg"
              asChild
              className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 border border-blue-400/50 text-white hover:from-blue-500 hover:to-cyan-400 font-bold rounded-full px-10 h-14 text-base shadow-[0_0_40px_rgba(56,189,248,0.5)] hover:shadow-[0_0_60px_rgba(56,189,248,0.7)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
            >
              <Link href="/create">
                <Sparkles className="h-5 w-5" />
                Start Building
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="gap-2 text-zinc-300 hover:text-white rounded-full px-10 h-14 text-base border-white/[0.1] bg-white/[0.04] backdrop-blur-xl hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:scale-[1.03] active:scale-[0.97]"
            >
              <Link href="/blog/godspeed-development-100-app-ideas">
                Read the story
                <ArrowRight className="h-5 w-5 opacity-70" />
              </Link>
            </Button>
          </div>

          {/* Category quick-links */}
          <div className="flex flex-wrap gap-2 justify-center mt-4 mb-14">
            {CATEGORY_QUICK_LINKS.map(cat => (
              <a
                key={cat}
                href={`/apps/store?category=${cat}`}
                className="rounded-full border border-white/5 bg-white/[0.03] px-4 py-1.5 text-xs font-medium capitalize text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-300 backdrop-blur-sm"
              >
                {cat.replace("-", " ")}
              </a>
            ))}
          </div>

          {/* Stats row — frosted glass pills */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { label: `${stats.appCount} Apps`, accent: false },
              { label: `${stats.categoryCount} Categories`, accent: false },
              { label: "Lazy-Load MCP", accent: true },
              { label: "Free & Open", accent: false },
            ].map(({ label, accent }) => (
              <span
                key={label}
                className={`rounded-full border px-5 py-2 text-sm font-medium backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.3)] ${
                  accent
                    ? "border-blue-500/20 bg-blue-500/[0.06] text-blue-300"
                    : "border-border bg-card/30 text-muted-foreground"
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}
