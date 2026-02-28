"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  BazdmegFaq,
  BazdmegHero,
  EngagementTracker,
  HourglassModel,
  PrincipleCard,
  QualityCheckpoints,
  SocialProof,
} from "@/components/bazdmeg";

const EffortSplit = dynamic(
  () => import("@/components/bazdmeg/EffortSplit").then(mod => mod.EffortSplit),
  { ssr: false },
);
import { trackEngagement } from "@/components/bazdmeg/EngagementTracker";
import {
  Box,
  Briefcase,
  FileText,
  GitPullRequest,
  Layers,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const PRINCIPLES = [
  {
    id: 1,
    title: "Requirements Are The Product",
    oneLiner:
      "The code is just the output. If you don't know the 'what', the AI will give you anything.",
    color: "#EF4444",
    icon: FileText,
  },
  {
    id: 2,
    title: "Discipline Before Automation",
    oneLiner: "You cannot automate chaos. Fast garbage is still garbage.",
    color: "#F59E0B",
    icon: Zap,
  },
  {
    id: 3,
    title: "Context Is Architecture",
    oneLiner: "What the model knows determines what it builds. Manage context like code.",
    color: "#3B82F6",
    icon: Layers,
  },
  {
    id: 4,
    title: "Test The Lies",
    oneLiner:
      "LLMs are professional liars. Unit tests, E2E tests, and agent audits are your only truth.",
    color: "#10B981",
    icon: ShieldCheck,
  },
  {
    id: 5,
    title: "Orchestrate, Do Not Operate",
    oneLiner: "Coordinate agents, not keystrokes. Think like a conductor, not a typist.",
    color: "#8B5CF6",
    icon: Briefcase,
  },
  {
    id: 6,
    title: "Trust Is Earned In PRs",
    oneLiner: "Not in promises, not in demos. If the PR diff is a mess, the feature is a mess.",
    color: "#EC4899",
    icon: GitPullRequest,
  },
  {
    id: 7,
    title: "Own What You Ship",
    oneLiner:
      "If you cannot explain it at 3am, do not ship it. You are responsible for the AI's output.",
    color: "#6366F1",
    icon: Box,
  },
];

const SECTIONS = [
  { id: "hero", label: "Manifesto" },
  { id: "principles", label: "Principles" },
  { id: "effort", label: "Effort Split" },
  { id: "checkpoints", label: "Checkpoints" },
  { id: "hourglass", label: "Hourglass Model" },
  { id: "faq", label: "FAQ" },
  { id: "cta", label: "Get Started" },
];

const SECTION_IDS = SECTIONS.map(s => s.id);

export default function BazdmegPage() {
  const [visitorId] = useState(() => {
    if (typeof window === "undefined") return "ssr";
    const stored = localStorage.getItem("bazdmeg-visitor-id");
    if (stored) return stored;
    const id = crypto.randomUUID();
    localStorage.setItem("bazdmeg-visitor-id", id);
    return id;
  });

  const handleChatOpened = useCallback(() => {
    trackEngagement("chatOpened");
  }, []);

  // Listen for global chat widget opening
  useEffect(() => {
    window.addEventListener("chat-opened", handleChatOpened);
    return () => window.removeEventListener("chat-opened", handleChatOpened);
  }, [handleChatOpened]);

  const handleFaqExpanded = useCallback(() => {
    trackEngagement("faqExpanded");
  }, []);

  const handleCtaClick = useCallback((cta: string) => {
    trackEngagement("ctaClicked", cta);
  }, []);

  return (
    <div className="relative text-white pb-32">
      {/* Engagement Tracker (invisible) */}
      <EngagementTracker
        visitorId={visitorId}
        page="/bazdmeg"
        sectionIds={SECTION_IDS}
      />

      <main>
        <section id="hero">
          <BazdmegHero />
          <div className="flex justify-center -mt-16 mb-12 relative z-10">
            <SocialProof />
          </div>
        </section>

        <section id="principles" className="py-24 bg-zinc-950/50">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-4xl font-bold mb-4">The Seven Principles</h2>
              <p className="text-zinc-400">
                Core values that separate &quot;Agentic Developers&quot; from those drowned in AI
                slop.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 [perspective:1000px]">
              {PRINCIPLES.map((principle, i) => (
                <PrincipleCard
                  key={principle.id}
                  principle={principle}
                  index={i}
                />
              ))}
            </div>
          </div>
        </section>

        <section
          id="effort"
          className="py-24 border-y border-white/5 bg-gradient-to-b from-transparent to-zinc-900/20"
        >
          <div className="container mx-auto px-6 max-w-5xl">
            <EffortSplit />
          </div>
        </section>

        <section id="checkpoints" className="py-24">
          <div className="container mx-auto px-6">
            <QualityCheckpoints />
          </div>
        </section>

        <section id="hourglass" className="py-24 bg-zinc-900/30">
          <div className="container mx-auto px-6">
            <HourglassModel />
          </div>
        </section>

        <section id="faq" className="py-24">
          <div className="container mx-auto px-6">
            <BazdmegFaq onFaqExpanded={handleFaqExpanded} />
          </div>
        </section>

        <section id="cta" className="py-24">
          <div className="container mx-auto px-6 text-center max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative group"
            >
              {/* Animated border glow */}
              <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-amber-500/40 via-indigo-500/40 to-emerald-500/40 opacity-60 group-hover:opacity-100 blur-sm transition-opacity duration-500" />
              <motion.div
                className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-amber-500/30 via-indigo-500/30 to-emerald-500/30 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-700"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "center" }}
              />

              <div className="relative bg-gradient-to-br from-amber-500/15 via-zinc-900/90 to-indigo-500/15 border border-white/10 rounded-3xl p-12 backdrop-blur-xl overflow-hidden">
                {/* Background shimmer */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear",
                    repeatDelay: 3,
                  }}
                />

                <div className="relative">
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl font-black mb-6"
                  >
                    Ready to stop coding and start orchestrating?
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="text-xl text-zinc-400 mb-10 leading-relaxed"
                  >
                    Add the{" "}
                    <code className="text-amber-500 font-bold bg-amber-500/10 px-2 py-1 rounded">
                      bazdmeg
                    </code>{" "}
                    skill to your AI agent and enforce quality gates today.
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col md:flex-row gap-4 justify-center"
                  >
                    <motion.div
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Link
                        href="/store/skills/bazdmeg"
                        className="inline-block px-10 py-5 bg-white text-zinc-950 font-black rounded-2xl hover:bg-zinc-100 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_50px_rgba(255,255,255,0.2)]"
                        onClick={() => handleCtaClick("adopt-skill")}
                      >
                        Adopt the Skill
                      </Link>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <a
                        href="https://github.com/spike-land-ai/spike.land"
                        className="inline-block px-10 py-5 bg-zinc-900 text-white font-black rounded-2xl border border-white/10 hover:border-white/25 hover:bg-zinc-800 transition-all"
                        onClick={() => handleCtaClick("join-community")}
                      >
                        Join the Community
                      </a>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="py-12 bg-zinc-950 border-t border-white/5 text-center text-zinc-500 text-sm">
        <div className="container mx-auto px-6">
          <p className="text-zinc-600">
            &copy; {new Date().getFullYear()} Spike Land Ltd. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <Link
              href="/store/skills"
              className="hover:text-amber-400 transition-colors duration-200"
            >
              Skill Store
            </Link>
            <a
              href="https://github.com/spike-land-ai/spike.land"
              className="hover:text-amber-400 transition-colors duration-200"
            >
              GitHub
            </a>
            <a
              href="https://discord.com"
              className="hover:text-amber-400 transition-colors duration-200"
            >
              Discord
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
