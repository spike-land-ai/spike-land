"use client";

import { ScrollReveal } from "@/components/ui/scroll-reveal";
import Link from "next/link";
import { ArrowRight, Cpu, MessageSquare, Rocket } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Describe",
    description: "Tell AI what you want to build. One prompt is all it takes.",
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconGlow: "shadow-[0_0_20px_rgba(59,130,246,0.35)]",
    borderHover: "hover:border-blue-500/30",
    dotColor: "bg-blue-400",
  },
  {
    number: "02",
    icon: Cpu,
    title: "Build",
    description:
      "AI agents assemble your app using lazy-loaded MCP toolsets — only the tools needed for each step are visible.",
    gradient: "from-purple-500/20 to-fuchsia-500/20",
    iconGlow: "shadow-[0_0_20px_rgba(168,85,247,0.35)]",
    borderHover: "hover:border-purple-500/30",
    dotColor: "bg-purple-400",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Deploy",
    description: "Your app goes live instantly. Share it, iterate on it, ship it.",
    gradient: "from-emerald-500/20 to-green-500/20",
    iconGlow: "shadow-[0_0_20px_rgba(16,185,129,0.35)]",
    borderHover: "hover:border-emerald-500/30",
    dotColor: "bg-emerald-400",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" as const },
  },
};

export function StoreDeveloperCta() {
  return (
    <ScrollReveal>
      <section id="how-it-works" className="relative py-24 md:py-32 overflow-hidden">
        {/* Ambient background glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-r from-blue-600/5 via-purple-600/8 to-emerald-600/5 blur-[120px]" />
        </div>

        <div className="container mx-auto max-w-5xl px-6 relative z-10">
          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400 mb-4">
              How it works
            </p>
            <h2 className="text-4xl font-black md:text-5xl mb-4">
              From idea to app
              <br />
              <span className="text-muted-foreground">in minutes, not months.</span>
            </h2>
          </div>

          {/* Steps */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-12 relative"
          >
            {/* Connecting line — desktop only */}
            <div
              aria-hidden="true"
              className="hidden md:block absolute top-[3.25rem] left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-emerald-500/30 z-0"
            />

            {steps.map(step => (
              <motion.div
                key={step.title}
                variants={itemVariants}
                className={`group relative rounded-3xl border border-border bg-card/20 p-8 transition-all duration-300 ${step.borderHover} hover:bg-card/40 hover:-translate-y-1 hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-sm z-10 overflow-hidden`}
              >
                {/* Subtle noise texture */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none bg-[url('/noise.png')] rounded-3xl"
                />

                {/* Step number + dot */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-xs font-bold tracking-widest text-muted-foreground/50">
                    {step.number}
                  </span>
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${step.dotColor} opacity-60`}
                    aria-hidden="true"
                  />
                </div>

                {/* Icon */}
                <div
                  className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${step.gradient} ${step.iconGlow} transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}
                >
                  <step.icon className="h-6 w-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-2 text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground group-hover:text-muted-foreground/80 transition-colors">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Blog link */}
          <div className="text-center">
            <Link
              href="/blog/godspeed-development-100-app-ideas"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground group"
            >
              Read the full story — 100 app ideas you can build today
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}
