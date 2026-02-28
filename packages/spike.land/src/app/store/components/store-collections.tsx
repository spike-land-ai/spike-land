"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface Collection {
  id: string;
  label: string;
  description: string;
  icon: string;
  gradient: string;
  border: string;
  glow: string;
  tags: string[];
}

export const COLLECTIONS: Collection[] = [
  {
    id: "ai-starter-pack",
    label: "AI Starter Pack",
    description: "Essential AI tools to get started",
    icon: "\u{1F916}",
    gradient: "from-violet-500/20 to-fuchsia-500/20",
    border: "border-violet-500/20 hover:border-violet-400/40",
    glow: "hover:shadow-[0_8px_32px_-8px_rgba(139,92,246,0.4)]",
    tags: ["ai", "automation"],
  },
  {
    id: "creative-suite",
    label: "Creative Suite",
    description: "Everything for creators",
    icon: "\u{1F3A8}",
    gradient: "from-pink-500/20 to-orange-500/20",
    border: "border-pink-500/20 hover:border-pink-400/40",
    glow: "hover:shadow-[0_8px_32px_-8px_rgba(236,72,153,0.4)]",
    tags: ["design", "image", "video", "audio"],
  },
  {
    id: "developer-toolkit",
    label: "Developer Toolkit",
    description: "Tools built for developers",
    icon: "\u26A1",
    gradient: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/20 hover:border-blue-400/40",
    glow: "hover:shadow-[0_8px_32px_-8px_rgba(59,130,246,0.4)]",
    tags: ["api", "database", "git", "logs"],
  },
  {
    id: "productivity-bundle",
    label: "Productivity Bundle",
    description: "Work smarter, not harder",
    icon: "\u{1F680}",
    gradient: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/20 hover:border-emerald-400/40",
    glow: "hover:shadow-[0_8px_32px_-8px_rgba(16,185,129,0.4)]",
    tags: ["tasks", "time-tracking", "focus", "meetings"],
  },
];

export const COLLECTION_TAGS: Record<string, string[]> = Object.fromEntries(
  COLLECTIONS.map(c => [c.id, c.tags]),
);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export function StoreCollections() {
  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="text-lg font-bold text-foreground tracking-tight">
          Collections
        </h2>
        <span className="text-xs text-muted-foreground">
          {COLLECTIONS.length} curated sets
        </span>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {COLLECTIONS.map(col => (
          <motion.div
            key={col.id}
            variants={itemVariants}
            className="flex-shrink-0 flex"
          >
            <Link
              href={`/apps/store?collection=${col.id}`}
              className={`relative flex h-full w-52 flex-col gap-2 rounded-2xl bg-gradient-to-br ${col.gradient} border ${col.border} p-5 transition-all duration-300 hover:-translate-y-1 ${col.glow} group overflow-hidden backdrop-blur-sm`}
            >
              {/* Subtle noise texture */}
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none bg-[url('/noise.png')] rounded-2xl"
              />

              {/* Icon with slight scale on hover */}
              <span
                className="text-3xl leading-none transition-transform duration-300 group-hover:scale-110 inline-block"
                role="img"
                aria-hidden="true"
              >
                {col.icon}
              </span>

              <p className="text-sm font-bold text-white leading-tight">
                {col.label}
              </p>
              <p className="text-xs text-zinc-300/70 leading-snug">
                {col.description}
              </p>

              {/* Arrow hint on hover */}
              <div className="mt-auto pt-2 flex items-center gap-1 text-[11px] font-medium text-white/40 group-hover:text-white/70 transition-colors">
                <span>Browse</span>
                <svg
                  className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
