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
import { GlassCard } from "@/components/infographic/shared/GlassCard";
import { InteractiveChecklist } from "@/components/infographic/shared/InteractiveChecklist";
import { ProgressGauge } from "@/components/infographic/shared/ProgressGauge";
import { useAnimatedNumber } from "@/components/infographic/hooks/useAnimatedNumber";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Marquee } from "@/components/ui/marquee";
import { SalaryChart } from "@/components/career/SalaryChart";
import { SkillRadarChart } from "@/components/career/SkillRadarChart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  BarChart3,
  Cpu,
  Globe,
  Rocket,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

// --- Mock data ---

const mockSalaryData = {
  median: 95000,
  p25: 72000,
  p75: 130000,
  currency: "$",
  source: "Mock Data (Storybook)",
  location: "San Francisco, CA",
};

const mockSkillGaps = [
  {
    skill: {
      uri: "1",
      title: "TypeScript",
      skillType: "essential" as const,
      importance: 0.9,
    },
    userProficiency: 4,
    requiredLevel: 5,
    gap: 1,
    priority: "high" as const,
  },
  {
    skill: {
      uri: "2",
      title: "React",
      skillType: "essential" as const,
      importance: 0.85,
    },
    userProficiency: 4,
    requiredLevel: 4,
    gap: 0,
    priority: "low" as const,
  },
  {
    skill: {
      uri: "3",
      title: "Node.js",
      skillType: "essential" as const,
      importance: 0.8,
    },
    userProficiency: 3,
    requiredLevel: 4,
    gap: 1,
    priority: "medium" as const,
  },
  {
    skill: {
      uri: "4",
      title: "PostgreSQL",
      skillType: "essential" as const,
      importance: 0.7,
    },
    userProficiency: 2,
    requiredLevel: 4,
    gap: 2,
    priority: "high" as const,
  },
  {
    skill: {
      uri: "5",
      title: "AWS",
      skillType: "optional" as const,
      importance: 0.6,
    },
    userProficiency: 3,
    requiredLevel: 4,
    gap: 1,
    priority: "medium" as const,
  },
  {
    skill: {
      uri: "6",
      title: "Docker",
      skillType: "optional" as const,
      importance: 0.5,
    },
    userProficiency: 2,
    requiredLevel: 3,
    gap: 1,
    priority: "medium" as const,
  },
  {
    skill: {
      uri: "7",
      title: "GraphQL",
      skillType: "optional" as const,
      importance: 0.4,
    },
    userProficiency: 1,
    requiredLevel: 3,
    gap: 2,
    priority: "high" as const,
  },
  {
    skill: {
      uri: "8",
      title: "CI/CD",
      skillType: "optional" as const,
      importance: 0.35,
    },
    userProficiency: 3,
    requiredLevel: 3,
    gap: 0,
    priority: "low" as const,
  },
];

const checklistItems = [
  { id: "design", label: "Create wireframes and mockups", checked: true },
  { id: "api", label: "Define API contracts" },
  { id: "db", label: "Design database schema" },
  { id: "frontend", label: "Implement frontend components" },
  { id: "tests", label: "Write unit and integration tests" },
  { id: "deploy", label: "Deploy to staging environment" },
];

const marqueeItems = [
  { icon: TrendingUp, label: "Revenue +24%", color: "text-emerald-400" },
  { icon: Users, label: "Users 12.4k", color: "text-blue-400" },
  { icon: Zap, label: "Uptime 99.9%", color: "text-amber-400" },
  { icon: Globe, label: "42 Countries", color: "text-purple-400" },
  { icon: Shield, label: "SOC2 Compliant", color: "text-cyan-400" },
  { icon: Cpu, label: "Latency 12ms", color: "text-rose-400" },
];

const codeSnippets = {
  glassCard: `import { GlassCard } from "@/components/infographic/shared/GlassCard";

// Available variants: neutral, claude, openClaw, critical, high, highlighted
<GlassCard variant="highlighted" className="p-6 space-y-4">
  <h3 className="text-lg font-semibold">Platform Metrics</h3>
  <p>Content goes here</p>
</GlassCard>`,
  progressGauge: `import { ProgressGauge } from "@/components/infographic/shared/ProgressGauge";

// Circular gauge
<ProgressGauge value={75} type="circle" size={120} label="Sprint Progress" color="#3b82f6" />

// Horizontal bar
<ProgressGauge value={88} type="bar" label="Build Success Rate" color="#3b82f6" />`,
  animatedNumber:
    `import { useAnimatedNumber } from "@/components/infographic/hooks/useAnimatedNumber";

function MetricDisplay({ value }: { value: number }) {
  const animated = useAnimatedNumber(value);
  return (
    <span className="text-4xl font-bold tabular-nums">
      {animated.toLocaleString()}
    </span>
  );
}`,
  checklist:
    `import { InteractiveChecklist } from "@/components/infographic/shared/InteractiveChecklist";

<InteractiveChecklist
  title="Project Milestones"
  items={[
    { id: "design", label: "Create wireframes", checked: true },
    { id: "api", label: "Define API contracts" },
    { id: "tests", label: "Write tests" },
  ]}
/>`,
  scrollReveal: `import { ScrollReveal } from "@/components/ui/scroll-reveal";

// Available presets: fadeUp, fadeIn, slideLeft, slideRight, scale
<ScrollReveal preset="fadeUp" delay={0.1} once={false}>
  <Card>Content appears on scroll</Card>
</ScrollReveal>`,
  marquee: `import { Marquee } from "@/components/ui/marquee";

<Marquee pauseOnHover className="[--duration:25s]">
  {items.map((item) => (
    <MarqueeCard key={item.label} {...item} />
  ))}
</Marquee>

// Reverse direction
<Marquee reverse pauseOnHover className="[--duration:30s]">
  {items.map((item) => (
    <MarqueeCard key={item.label} {...item} />
  ))}
</Marquee>`,
};

// --- Helper components ---

function AnimatedNumberDemo() {
  const [target, setTarget] = useState(0);
  const animated = useAnimatedNumber(target);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-6xl font-bold font-mono tabular-nums text-primary drop-shadow-sm">
        {animated.toLocaleString()}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" size="sm" onClick={() => setTarget(1234)}>
          1,234
        </Button>
        <Button variant="outline" size="sm" onClick={() => setTarget(50000)}>
          50,000
        </Button>
        <Button variant="outline" size="sm" onClick={() => setTarget(99999)}>
          99,999
        </Button>
        <Button variant="outline" size="sm" onClick={() => setTarget(0)}>
          Reset
        </Button>
      </div>
    </div>
  );
}

function MarqueeCard(
  { icon: Icon, label, color }: {
    icon: React.ComponentType<{ className?: string; }>;
    label: string;
    color: string;
  },
) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm whitespace-nowrap">
      <Icon className={`h-5 w-5 ${color}`} />
      <span className="text-sm font-medium text-foreground/80">{label}</span>
    </div>
  );
}

// --- Page ---

export default function InfographicPage() {
  return (
    <div className="space-y-16 pb-20">
      {/* Breadcrumbs */}
      <Breadcrumbs />

      <PageHeader
        title="Data Visualization & Infographics"
        description="Components for presenting data, metrics, and progress in engaging visual formats. From animated counters to interactive checklists and charts, these components bring your data stories to life."
        usage="Use these components to display KPIs, progress tracking, skill assessments, salary data, and scrolling tickers. Combine them to build dashboards and data-driven pages."
      />

      <UsageGuide
        dos={[
          "Use GlassCard variants to semantically differentiate data categories.",
          "Combine ProgressGauge (circle) with InteractiveChecklist for task tracking.",
          "Use AnimatedNumber for hero stats and key metrics that benefit from attention.",
          "Use Marquee for non-critical ambient data like status tickers.",
          "Provide accessible labels for all chart axes and data points.",
        ]}
        donts={[
          "Don't overload a single view with too many animated elements.",
          "Don't use AnimatedNumber for values that change frequently in real-time.",
          "Don't rely solely on color to convey data meaning in charts.",
          "Don't use Marquee for critical information users must read carefully.",
        ]}
      />

      {/* --- GlassCard --- */}
      <ComponentSample
        title="GlassCard"
        description="A frosted-glass style container with semantic color variants. Ideal for grouping related metrics or status cards."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
          {(
            [
              {
                variant: "neutral",
                title: "Neutral",
                desc: "Default glass container",
                icon: BarChart3,
              },
              {
                variant: "claude",
                title: "Claude",
                desc: "AI / assistant context",
                icon: Cpu,
              },
              {
                variant: "openClaw",
                title: "OpenClaw",
                desc: "Open-source / community",
                icon: Globe,
              },
              {
                variant: "critical",
                title: "Critical",
                desc: "Error or alert state",
                icon: Shield,
              },
              {
                variant: "high",
                title: "High Priority",
                desc: "Warning or attention",
                icon: Zap,
              },
              {
                variant: "highlighted",
                title: "Highlighted",
                desc: "Featured or promoted",
                icon: Rocket,
              },
            ] as const
          ).map(({ variant, title, desc, icon: Icon }) => (
            <GlassCard
              key={variant}
              variant={variant}
              className="p-5 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <Badge variant="outline" className="text-xs">{variant}</Badge>
              </div>
              <h4 className="font-semibold text-sm">{title}</h4>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </GlassCard>
          ))}
        </div>
      </ComponentSample>

      {/* --- ProgressGauge --- */}
      <ComponentSample
        title="ProgressGauge"
        description="Animated progress indicator available as a circular gauge or horizontal bar. Integrates the useAnimatedNumber hook for smooth counting."
      >
        <div className="flex flex-col md:flex-row gap-12 items-center w-full max-w-3xl">
          <div className="flex gap-8">
            <ProgressGauge
              value={75}
              type="circle"
              size={120}
              label="Sprint Progress"
              color="#3b82f6"
            />
            <ProgressGauge
              value={100}
              type="circle"
              size={120}
              label="Tests Passing"
              color="#10b981"
            />
            <ProgressGauge
              value={42}
              type="circle"
              size={120}
              label="Coverage"
              color="#f59e0b"
            />
          </div>
          <div className="flex-1 space-y-4 w-full">
            <ProgressGauge
              value={88}
              type="bar"
              label="Build Success Rate"
              color="#3b82f6"
            />
            <ProgressGauge
              value={65}
              type="bar"
              label="Code Coverage"
              color="#10b981"
            />
            <ProgressGauge
              value={30}
              type="bar"
              label="Tech Debt Resolved"
              color="#f59e0b"
            />
          </div>
        </div>
      </ComponentSample>

      {/* --- AnimatedNumber --- */}
      <ComponentSample
        title="AnimatedNumber Hook"
        description="A spring-physics-based number animation hook. Click the buttons below to animate to different target values."
      >
        <AnimatedNumberDemo />
      </ComponentSample>

      {/* --- InteractiveChecklist --- */}
      <ComponentSample
        title="InteractiveChecklist"
        description="A toggleable checklist with integrated circular progress gauge. Click items to check them off and watch the progress update."
      >
        <div className="w-full max-w-md">
          <InteractiveChecklist
            title="Project Milestones"
            items={checklistItems}
          />
        </div>
      </ComponentSample>

      {/* --- ScrollReveal --- */}
      <ComponentSample
        title="ScrollReveal"
        description="Scroll-triggered animation wrapper with multiple presets. Scroll down to see each preset animate into view."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
          {(["fadeUp", "fadeIn", "slideLeft", "slideRight", "scale"] as const)
            .map(
              (preset, i) => (
                <ScrollReveal
                  key={preset}
                  preset={preset}
                  delay={i * 0.1}
                  once={false}
                >
                  <Card className="glass-1">
                    <CardContent className="pt-6 space-y-2">
                      <Badge variant="outline">{preset}</Badge>
                      <p className="text-sm text-muted-foreground">
                        This card uses the <code className="text-primary">{preset}</code>{" "}
                        animation preset.
                      </p>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ),
            )}
        </div>
      </ComponentSample>

      {/* --- Marquee --- */}
      <ComponentSample
        title="Marquee"
        description="A continuously scrolling ticker for ambient data display. Supports horizontal/vertical orientation, reverse direction, and pause-on-hover."
      >
        <div className="w-full space-y-6 max-w-4xl">
          <div>
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-bold">
              Horizontal (pause on hover)
            </p>
            <Marquee pauseOnHover className="[--duration:25s]">
              {marqueeItems.map(item => <MarqueeCard key={item.label} {...item} />)}
            </Marquee>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-bold">
              Reverse direction
            </p>
            <Marquee reverse pauseOnHover className="[--duration:30s]">
              {marqueeItems.map(item => <MarqueeCard key={item.label} {...item} />)}
            </Marquee>
          </div>
        </div>
      </ComponentSample>

      {/* --- SalaryChart --- */}
      <ComponentSample
        title="SalaryChart"
        description="A Recharts-powered bar chart showing salary percentile distribution. Used in the Career Navigator for compensation benchmarking."
      >
        <div className="w-full max-w-lg">
          <SalaryChart salary={mockSalaryData} />
        </div>
      </ComponentSample>

      {/* --- SkillRadarChart --- */}
      <ComponentSample
        title="SkillRadarChart"
        description="A radar/spider chart comparing required skill levels against the user's current proficiency. Used in skill gap analysis."
      >
        <div className="w-full max-w-lg">
          <Card className="bg-zinc-900 border-white/[0.06]">
            <CardContent className="pt-6">
              <SkillRadarChart gaps={mockSkillGaps} />
            </CardContent>
          </Card>
        </div>
      </ComponentSample>

      {/* --- Combined Dashboard Example --- */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold font-heading">
          Combined Dashboard Example
        </h2>
        <p className="text-muted-foreground -mt-4">
          Showing how infographic components compose together in a realistic dashboard layout.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard
            variant="highlighted"
            className="p-6 space-y-4 md:col-span-2"
          >
            <h3 className="text-lg font-semibold">Platform Metrics</h3>
            <div className="grid grid-cols-3 gap-6">
              <ProgressGauge
                value={92}
                type="circle"
                size={100}
                label="Uptime"
                color="#10b981"
              />
              <ProgressGauge
                value={78}
                type="circle"
                size={100}
                label="Satisfaction"
                color="#3b82f6"
              />
              <ProgressGauge
                value={45}
                type="circle"
                size={100}
                label="Load"
                color="#f59e0b"
              />
            </div>
          </GlassCard>
          <GlassCard variant="claude" className="p-6 space-y-3">
            <h3 className="text-lg font-semibold">AI Usage</h3>
            <ProgressGauge
              value={67}
              type="bar"
              label="Token Quota Used"
              color="#f59e0b"
            />
            <ProgressGauge
              value={94}
              type="bar"
              label="Request Success"
              color="#10b981"
            />
            <ProgressGauge
              value={23}
              type="bar"
              label="Cache Hit Rate"
              color="#3b82f6"
            />
          </GlassCard>
        </div>
      </section>

      {/* Code snippets */}
      <CodePreview
        code={codeSnippets.glassCard}
        title="Usage Examples"
        tabs={[
          { label: "GlassCard", code: codeSnippets.glassCard },
          { label: "ProgressGauge", code: codeSnippets.progressGauge },
          { label: "AnimatedNumber", code: codeSnippets.animatedNumber },
          { label: "Checklist", code: codeSnippets.checklist },
          { label: "ScrollReveal", code: codeSnippets.scrollReveal },
          { label: "Marquee", code: codeSnippets.marquee },
        ]}
      />

      <AccessibilityPanel
        notes={[
          "ProgressGauge uses SVG with semantic stroke attributes; values are displayed as text for screen readers.",
          "InteractiveChecklist items have role='checkbox' and aria-checked for proper AT announcements.",
          "InteractiveChecklist supports keyboard navigation (Enter/Space to toggle).",
          "ScrollReveal uses CSS transforms only; content is always in the DOM and accessible.",
          "Marquee marks duplicate content with aria-hidden to avoid repetitive announcements.",
          "Charts include axis labels and tooltips for data point identification.",
          "GlassCard maintains sufficient contrast ratios across all color variants.",
          "AnimatedNumber displays final values immediately for reduced-motion preferences.",
        ]}
      />

      {/* Related components */}
      <RelatedComponents currentId="infographic" />
    </div>
  );
}
