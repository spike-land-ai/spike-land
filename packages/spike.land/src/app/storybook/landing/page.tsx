"use client";

import {
  AccessibilityPanel,
  Breadcrumbs,
  CodePreview,
  ComponentSample,
  PageHeader,
  RelatedComponents,
  UsageGuide,
} from "@/components/storybook";
import { LandingHero } from "@/components/landing/LandingHero";
import { ThreePillarsSection } from "@/components/landing/ThreePillarsSection";
import { AppShowcaseSection } from "@/components/landing/AppShowcaseSection";
import { BlogPreviewSection } from "@/components/landing/BlogPreviewSection";
import { CreateCTASection } from "@/components/landing/CreateCTASection";
import { PlatformHero } from "@/components/platform-landing/PlatformHero";
import { FeaturedAppCard } from "@/components/platform-landing/FeaturedAppCard";
import { WaitlistInlineForm } from "@/components/waitlist/WaitlistInlineForm";
import { WaitlistCTABanner } from "@/components/waitlist/WaitlistCTABanner";
import { ThemeCard } from "@/components/landing-sections/shared/ThemeCard";
import {
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/scroll-reveal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ShowcaseApp } from "@/lib/landing/showcase-feed";
import {
  Blocks,
  Crown,
  Globe,
  Music,
  Palette,
  Rocket,
  Sparkles,
  Swords,
} from "lucide-react";

const mockShowcaseApps: ShowcaseApp[] = [
  {
    id: "app-1",
    title: "AI Task Manager",
    description: "A smart task manager that prioritizes and organizes your work using AI.",
    slug: "ai-task-manager",
    codespaceId: "cs-001",
    lastActivity: new Date("2026-02-20"),
    source: "created-app",
    viewCount: 1420,
  },
  {
    id: "app-2",
    title: "Code Review Bot",
    description: "Automated code review assistant with real-time suggestions.",
    slug: "code-review-bot",
    codespaceId: "cs-002",
    lastActivity: new Date("2026-02-18"),
    source: "app",
    viewCount: 890,
  },
  {
    id: "app-3",
    title: "Design System Generator",
    description: "Generate complete design systems from a single brand color palette.",
    slug: "design-system-gen",
    codespaceId: "cs-003",
    lastActivity: new Date("2026-02-15"),
    source: "created-app",
    viewCount: 2100,
  },
  {
    id: "app-4",
    title: "Meeting Summarizer",
    description: "Transcribe and summarize meetings with action items in real time.",
    slug: "meeting-summarizer",
    codespaceId: "cs-004",
    lastActivity: new Date("2026-02-12"),
    source: "app",
    viewCount: 3200,
  },
  {
    id: "app-5",
    title: "API Playground",
    description: "Interactive API testing environment with auto-generated documentation.",
    slug: "api-playground",
    codespaceId: "cs-005",
    lastActivity: new Date("2026-02-10"),
    source: "created-app",
    viewCount: 760,
  },
];

export default function LandingPage() {
  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="Landing Page"
        description="Landing page components power the first impression of spike.land. They combine motion, gradients, and interactive elements to convey the platform value proposition."
        usage="Use these sections to build marketing pages, product showcases, and onboarding flows. Each section is self-contained and composable."
      />

      <UsageGuide
        dos={[
          "Use LandingHero as the primary above-the-fold section on marketing pages.",
          "Combine ThreePillarsSection with the hero to immediately communicate value.",
          "Use AppShowcaseSection with real or curated app data to build social proof.",
          "Place CreateCTASection at the bottom of long-scroll pages for conversion.",
          "Use ScrollReveal to progressively reveal content as users scroll down.",
        ]}
        donts={[
          "Don't stack multiple hero sections on the same page.",
          "Don't use AppShowcaseSection with an empty apps array (it renders nothing).",
          "Don't override the gradient styles on CTAs -- they are brand-specific.",
          "Don't disable framer-motion animations; they are integral to the design language.",
        ]}
      />

      {/* --- LandingHero --- */}
      <ComponentSample
        title="LandingHero"
        description="Full-screen hero with parallax scroll, cyberpunk neon blobs, animated badge, gradient headline, CTA buttons, and live stats. Uses framer-motion scroll transforms."
      >
        <div
          className="w-full overflow-hidden rounded-2xl border border-white/5 bg-zinc-950 relative"
          style={{ height: 600 }}
        >
          <div className="absolute inset-0 overflow-y-auto">
            <LandingHero />
          </div>
        </div>
      </ComponentSample>

      {/* --- ThreePillarsSection --- */}
      <ComponentSample
        title="ThreePillarsSection"
        description="Three value-proposition cards with staggered reveal: Deploy Anywhere, App Marketplace, and Meet Spike. Each card links to its respective feature."
      >
        <div className="w-full overflow-hidden rounded-2xl border border-white/5 bg-zinc-950">
          <ThreePillarsSection />
        </div>
      </ComponentSample>

      {/* --- AppShowcaseSection --- */}
      <ComponentSample
        title="AppShowcaseSection"
        description="Horizontal marquee of app cards with gradient fade edges. First 3 apps get a 'Featured' badge. Accepts a ShowcaseApp[] prop."
      >
        <div className="w-full overflow-hidden rounded-2xl border border-white/5 bg-zinc-950">
          <AppShowcaseSection apps={mockShowcaseApps} />
        </div>
      </ComponentSample>

      {/* --- BlogPreviewSection --- */}
      <ComponentSample
        title="BlogPreviewSection"
        description="Three-column blog card grid with gradient headers, category badges, dates, and read-time. Uses staggered scroll-reveal animations."
      >
        <div className="w-full overflow-hidden rounded-2xl border border-white/5 bg-zinc-950">
          <BlogPreviewSection />
        </div>
      </ComponentSample>

      {/* --- CreateCTASection --- */}
      <ComponentSample
        title="CreateCTASection"
        description="Full-width call-to-action with bold gradient typography and two action buttons. Radial gradient background with subtle pulse animation."
      >
        <div className="w-full overflow-hidden rounded-2xl border border-white/5 bg-zinc-950">
          <CreateCTASection />
        </div>
      </ComponentSample>

      {/* --- PlatformHero --- */}
      <ComponentSample
        title="PlatformHero"
        description="Lighter-themed hero for the platform landing. Clean typography, two CTA buttons, and decorative gradient orbs. No parallax -- simpler than LandingHero."
      >
        <div className="w-full overflow-hidden rounded-2xl border border-border/50 bg-background">
          <PlatformHero />
        </div>
      </ComponentSample>

      {/* --- FeaturedAppCard --- */}
      <ComponentSample
        title="FeaturedAppCard"
        description="Card component for highlighting apps on the platform landing page. Supports a 'featured' variant that spans two columns with a badge and larger icon."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <FeaturedAppCard
            name="Chess Arena"
            description="Multiplayer chess with ELO ratings, AI opponents, and real-time spectating."
            icon={<Swords className="h-7 w-7" />}
            href="/apps/chess-arena"
            featured
            tagline="Real-time multiplayer"
          />
          <FeaturedAppCard
            name="Music Creator"
            description="Compose, arrange, and produce music in the browser with AI assistance."
            icon={<Music className="h-6 w-6" />}
            href="/apps/music-creator"
          />
          <FeaturedAppCard
            name="Design Studio"
            description="Collaborative design tool with component libraries and export to code."
            icon={<Palette className="h-6 w-6" />}
            href="/apps/design-studio"
          />
        </div>
      </ComponentSample>

      {/* --- WaitlistInlineForm & WaitlistCTABanner --- */}
      <ComponentSample
        title="Waitlist Components"
        description="Email capture components for pre-launch pages. WaitlistInlineForm is the raw form; WaitlistCTABanner wraps it with contextual copy in two variants."
      >
        <div className="w-full space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="glass-1">
              <CardContent className="pt-6 space-y-4">
                <Badge variant="outline">WaitlistInlineForm</Badge>
                <p className="text-sm text-muted-foreground">
                  Standalone email input with submit button. Accepts a source tag for analytics.
                </p>
                <WaitlistInlineForm source="storybook" />
              </CardContent>
            </Card>

            <Card className="glass-1">
              <CardContent className="pt-6 space-y-4">
                <Badge variant="outline">WaitlistCTABanner (inline)</Badge>
                <p className="text-sm text-muted-foreground">
                  Compact inline variant with descriptive text above the form.
                </p>
                <WaitlistCTABanner variant="inline" />
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-lg">
              <Badge variant="outline" className="mb-3">
                WaitlistCTABanner (hero variant)
              </Badge>
              <WaitlistCTABanner variant="hero" />
            </div>
          </div>
        </div>
      </ComponentSample>

      {/* --- ThemeCard --- */}
      <ComponentSample
        title="ThemeCard"
        description="A themed container card from the landing-sections system. Supports glass blur and hover effects via CSS custom properties (--landing-*)."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <ThemeCard>
            <div className="space-y-2">
              <Globe className="h-6 w-6 text-primary" />
              <h3 className="font-bold text-foreground">Default</h3>
              <p className="text-sm text-muted-foreground">
                Basic ThemeCard with border and subtle background.
              </p>
            </div>
          </ThemeCard>
          <ThemeCard glass>
            <div className="space-y-2">
              <Crown className="h-6 w-6 text-primary" />
              <h3 className="font-bold text-foreground">Glass</h3>
              <p className="text-sm text-muted-foreground">
                Glassmorphism variant with backdrop blur and transparent background.
              </p>
            </div>
          </ThemeCard>
          <ThemeCard hoverEffect>
            <div className="space-y-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <h3 className="font-bold text-foreground">Hover Effect</h3>
              <p className="text-sm text-muted-foreground">
                Interactive card with border highlight and lift on hover.
              </p>
            </div>
          </ThemeCard>
        </div>
      </ComponentSample>

      {/* --- ScrollReveal --- */}
      <ComponentSample
        title="ScrollReveal"
        description="Scroll-triggered animation wrapper with five presets: fadeUp, fadeIn, slideLeft, slideRight, and scale. Includes StaggerContainer for orchestrated reveals."
      >
        <div className="w-full space-y-8">
          <div>
            <h4 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">
              Individual Presets
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(["fadeUp", "fadeIn", "scale"] as const).map(preset => (
                <ScrollReveal key={preset} preset={preset} once={false}>
                  <Card className="glass-1">
                    <CardContent className="pt-6 text-center space-y-2">
                      <Badge variant="outline">{preset}</Badge>
                      <p className="text-sm text-muted-foreground">
                        Scroll down and back up to replay this animation.
                      </p>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ScrollReveal preset="slideLeft" once={false}>
              <Card className="glass-1">
                <CardContent className="pt-6 text-center space-y-2">
                  <Badge variant="outline">slideLeft</Badge>
                  <p className="text-sm text-muted-foreground">
                    Slides in from the right side.
                  </p>
                </CardContent>
              </Card>
            </ScrollReveal>
            <ScrollReveal preset="slideRight" once={false}>
              <Card className="glass-1">
                <CardContent className="pt-6 text-center space-y-2">
                  <Badge variant="outline">slideRight</Badge>
                  <p className="text-sm text-muted-foreground">
                    Slides in from the left side.
                  </p>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">
              StaggerContainer
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Wrapping multiple StaggerItem components in a StaggerContainer creates an orchestrated
              cascade effect with configurable delay.
            </p>
            <StaggerContainer
              staggerDelay={0.15}
              once={false}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {[
                { icon: Rocket, label: "Deploy" },
                { icon: Blocks, label: "Build" },
                { icon: Sparkles, label: "Create" },
                { icon: Globe, label: "Share" },
              ].map(item => (
                <StaggerItem key={item.label}>
                  <Card className="glass-1">
                    <CardContent className="pt-6 flex flex-col items-center gap-2">
                      <item.icon className="h-8 w-8 text-primary" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </div>
      </ComponentSample>

      <CodePreview
        title="Landing Page Composition"
        code={`import { LandingHero } from "@/components/landing/LandingHero";
import { ThreePillarsSection } from "@/components/landing/ThreePillarsSection";
import { AppShowcaseSection } from "@/components/landing/AppShowcaseSection";
import { CreateCTASection } from "@/components/landing/CreateCTASection";

export default function HomePage({ apps }) {
  return (
    <main>
      <LandingHero />
      <ThreePillarsSection />
      <AppShowcaseSection apps={apps} />
      <CreateCTASection />
    </main>
  );
}`}
      />

      <AccessibilityPanel
        notes={[
          "All CTA buttons meet WCAG AA contrast ratios against dark backgrounds.",
          "Framer Motion animations respect prefers-reduced-motion at the library level.",
          "ScrollReveal uses IntersectionObserver for performant scroll detection.",
          "WaitlistInlineForm uses semantic <form> with required email validation.",
          "FeaturedAppCard includes data-testid attributes for test automation.",
          "Navigation links in PlatformHeader use aria-current for active page indication.",
          "Mobile menu uses Radix Sheet with VisuallyHidden title for screen readers.",
          "Gradient text maintains readable contrast via text-transparent + bg-clip-text pattern.",
        ]}
      />

      <RelatedComponents currentId="landing" />
    </div>
  );
}
