"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/components/ui/link";
import type { LandingPageContent } from "@/lib/onboarding/landing-pages";
import type { OnboardingPersona } from "@/lib/onboarding/personas";
import {
  AlertCircle,
  ArrowRight,
  Gift,
  Mail,
  MapPin,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

interface PersonaLandingProps {
  persona: OnboardingPersona;
  landing: LandingPageContent;
}

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

export function PersonaLanding({ persona, landing }: PersonaLandingProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero */}
      <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4 py-24 sm:py-32">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.04] blur-[120px]" />
          <div className="absolute right-1/4 top-1/2 h-[400px] w-[400px] rounded-full bg-purple-500/[0.04] blur-[120px]" />
        </div>

        <div className="container relative mx-auto max-w-3xl text-center">
          <motion.div {...fadeUp}>
            <Badge
              variant="outline"
              className="mb-6 border-white/10 bg-white/5 text-cyan-400 backdrop-blur-xl"
            >
              <Sparkles className="mr-1.5 h-3 w-3" />
              For {persona.name}s
            </Badge>
          </motion.div>

          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.5, ease: "easeOut" as const, delay: 0.1 }}
            className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl"
          >
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {landing.headline}
            </span>
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.5, ease: "easeOut" as const, delay: 0.2 }}
            className="mx-auto mb-10 max-w-2xl text-lg text-zinc-400 sm:text-xl"
          >
            {landing.subheadline}
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, ease: "easeOut" as const, delay: 0.3 }}
          >
            <Button
              asChild
              size="lg"
              className="gap-2 rounded-xl bg-white px-8 text-base font-bold text-zinc-950 shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all duration-500 hover:scale-105 hover:bg-zinc-100 hover:shadow-[0_0_60px_rgba(168,85,247,0.4)]"
            >
              <Link href={landing.ctaHref}>
                {landing.ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="px-4 py-20 sm:py-28">
        <div className="container mx-auto max-w-4xl">
          <motion.div {...fadeUp} className="mb-12 text-center">
            <div className="mb-3 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-zinc-500">
              <AlertCircle className="h-4 w-4" />
              Sound familiar?
            </div>
            <h2 className="text-3xl font-bold sm:text-4xl">
              We get it. It&apos;s frustrating.
            </h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {landing.painPoints.map((pp, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{
                  duration: 0.5,
                  ease: "easeOut" as const,
                  delay: i * 0.1,
                }}
              >
                <Card className="h-full border-white/5 bg-white/[0.02] backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">
                      {pp.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-zinc-400">{pp.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features / Solution */}
      <section className="px-4 py-20 sm:py-28">
        <div className="container mx-auto max-w-4xl">
          <motion.div {...fadeUp} className="mb-12 text-center">
            <div className="mb-3 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-cyan-400">
              <Wrench className="h-4 w-4" />
              Here&apos;s how spike.land helps
            </div>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Tools built for{" "}
              <span className="text-cyan-400">
                {persona.name.toLowerCase()}s
              </span>
            </h2>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2">
            {landing.features.map((feat, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{
                  duration: 0.5,
                  ease: "easeOut" as const,
                  delay: i * 0.1,
                }}
              >
                <Card className="h-full border-cyan-500/10 bg-gradient-to-br from-cyan-500/[0.03] to-purple-500/[0.03] backdrop-blur-sm transition-colors hover:border-cyan-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-white">
                      <Zap className="h-4 w-4 text-cyan-400" />
                      {feat.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-zinc-400">{feat.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Brighton Section */}
      <section className="px-4 py-20 sm:py-28">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div {...fadeUp}>
            <div className="mb-3 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-pink-400">
              <MapPin className="h-4 w-4" />
              Built in Brighton, for you
            </div>
            <h2 className="mb-6 text-3xl font-bold sm:text-4xl">
              A small team with a big idea
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-zinc-400">
              {landing.brightonMessage}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Free Offer */}
      <section className="px-4 py-20 sm:py-28">
        <div className="container mx-auto max-w-3xl">
          <motion.div {...fadeUp}>
            <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/[0.05] to-pink-500/[0.05] p-8 text-center sm:p-12">
              <div className="mb-4 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-purple-400">
                <Gift className="h-4 w-4" />
                The deal
              </div>
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                Everything is free. Yes, really.
              </h2>
              <p className="mx-auto mb-4 max-w-xl text-zinc-400">
                No credit card. No trial that expires. No &quot;freemium&quot; bait-and-switch.
                We&apos;re looking for our first{" "}
                {persona.name.toLowerCase()}s to try the platform, break things, and help us make it
                great.
              </p>
              <p className="mx-auto max-w-xl text-sm text-zinc-500">
                We know there will be bugs. We promise to fix every one of them the same day you
                report it.
              </p>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="px-4 py-20 sm:py-28">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div {...fadeUp}>
            <h2 className="mb-6 text-3xl font-bold sm:text-4xl">
              Ready to try it?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-zinc-400">
              You&apos;d be one of our first{" "}
              {persona.name.toLowerCase()}s. We&apos;d love to hear what you think.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="gap-2 rounded-xl bg-white px-8 text-base font-bold text-zinc-950 shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all duration-500 hover:scale-105 hover:bg-zinc-100 hover:shadow-[0_0_60px_rgba(168,85,247,0.4)]"
              >
                <Link href={landing.ctaHref}>
                  {landing.ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="gap-2 rounded-xl border-white/10 bg-white/5 px-8 text-base font-medium text-white backdrop-blur-md transition-all hover:bg-white/10"
              >
                <Link href="mailto:hello@spike.land">
                  <Mail className="h-4 w-4" />
                  Or just say hi
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
