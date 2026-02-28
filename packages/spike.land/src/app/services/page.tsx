"use client";

import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Cpu, Rocket, Terminal } from "lucide-react";

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-zinc-950 pt-24 pb-12">
      {/* Hero Section */}
      <section className="container mx-auto px-4 mb-24 text-center">
        <ScrollReveal>
          <Badge className="mb-4 bg-white/5 text-white/70 border-white/10">
            Our Expertise
          </Badge>
          <h1 className="text-4xl font-bold text-white sm:text-5xl md:text-6xl mb-6">
            Services & Solutions
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white/60">
            Based in Brighton, working with businesses across the UK. We build cutting-edge software
            solutions, specializing in AI integration, rapid prototyping, and full-stack development
            to bring your ideas to life.
          </p>
        </ScrollReveal>
      </section>

      {/* Services Grid */}
      <section className="container mx-auto px-4 grid md:grid-cols-2 gap-8 max-w-6xl">
        {/* AI Integration */}
        <ScrollReveal delay={0.1} className="h-full">
          <Card className="bg-zinc-900/50 border-white/10 h-full overflow-hidden hover:border-cyan-500/30 transition-colors">
            <CardHeader>
              <div className="p-3 rounded-lg bg-cyan-500/10 w-fit mb-4">
                <Bot className="w-8 h-8 text-cyan-400" />
              </div>
              <CardTitle className="text-2xl text-white">
                AI Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="text-white/70 space-y-4">
              <p>
                Seamlessly integrate advanced AI capabilities into your existing systems. We help
                you leverage Large Language Models (LLMs), RAG (Retrieval-Augmented Generation), and
                custom agents to automate workflows and enhance user experience.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-white/60">
                <li>Custom LLM Agents & Chatbots</li>
                <li>RAG Pipeline Implementation</li>
                <li>OpenAI, Anthropic & Gemini Integration</li>
                <li>Automated Workflow Orchestration</li>
              </ul>
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Rapid Prototyping */}
        <ScrollReveal delay={0.2} className="h-full">
          <Card className="bg-zinc-900/50 border-white/10 h-full overflow-hidden hover:border-purple-500/30 transition-colors">
            <CardHeader>
              <div className="p-3 rounded-lg bg-purple-500/10 w-fit mb-4">
                <Rocket className="w-8 h-8 text-purple-400" />
              </div>
              <CardTitle className="text-2xl text-white">
                Rapid Prototyping
              </CardTitle>
            </CardHeader>
            <CardContent className="text-white/70 space-y-4">
              <p>
                Turn your concepts into functional MVPs (Minimum Viable Products) in record time. We
                focus on speed and validation, helping you test your market hypothesis without
                unnecessary engineering overhead.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-white/60">
                <li>MVP Development in Weeks</li>
                <li>Proof of Concept (PoC) Build</li>
                <li>Iterative Design & Development</li>
                <li>User Feedback Integration</li>
              </ul>
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Full-Stack Development */}
        <ScrollReveal delay={0.3} className="h-full">
          <Card className="bg-zinc-900/50 border-white/10 h-full overflow-hidden hover:border-green-500/30 transition-colors">
            <CardHeader>
              <div className="p-3 rounded-lg bg-green-500/10 w-fit mb-4">
                <Terminal className="w-8 h-8 text-green-400" />
              </div>
              <CardTitle className="text-2xl text-white">
                Full-Stack Development
              </CardTitle>
            </CardHeader>
            <CardContent className="text-white/70 space-y-4">
              <p>
                End-to-end application development using modern tech stacks. From robust backends
                with scalable databases to responsive, interactive frontends, we build reliable and
                maintainable software.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-white/60">
                <li>Next.js & React Applications</li>
                <li>API Design & Development</li>
                <li>Database Architecture (Prisma/SQL)</li>
                <li>Secure Authentication & Authorization</li>
              </ul>
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* AI Products */}
        <ScrollReveal delay={0.4} className="h-full">
          <Card className="bg-zinc-900/50 border-white/10 h-full overflow-hidden hover:border-amber-500/30 transition-colors">
            <CardHeader>
              <div className="p-3 rounded-lg bg-amber-500/10 w-fit mb-4">
                <Cpu className="w-8 h-8 text-amber-400" />
              </div>
              <CardTitle className="text-2xl text-white">AI Products</CardTitle>
            </CardHeader>
            <CardContent className="text-white/70 space-y-4">
              <p>
                We don&apos;t just add AI to things; we build products where AI is the core
                differentiator. From ideation to deployment, we create intelligent applications that
                solve complex problems in novel ways.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-white/60">
                <li>AI-First SaaS Development</li>
                <li>Generative AI Tools</li>
                <li>Data Analysis & Insight Platforms</li>
                <li>Custom Model Fine-tuning</li>
              </ul>
            </CardContent>
          </Card>
        </ScrollReveal>
      </section>
    </main>
  );
}
