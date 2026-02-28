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
import { AppCard } from "@/components/create/app-card";
import { ComposerGlow } from "@/components/create/composer-glow";
import { SkillBadge } from "@/components/create/skill-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { SkillDefinition } from "@/lib/create/skill-definitions";
import { AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Code2,
  Gamepad2,
  Music,
  PenTool,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const MOCK_APPS = [
  {
    title: "Chess Arena",
    description: "Multiplayer chess with ELO ratings, AI opponents, and real-time spectating.",
    slug: "chess-arena",
    viewCount: 12840,
  },
  {
    title: "Beat Sequencer",
    description: "Create drum patterns and melodies with a grid-based music sequencer.",
    slug: "beat-sequencer",
    viewCount: 8320,
  },
  {
    title: "Markdown Blog",
    description: "A minimal blogging platform with live markdown preview and syntax highlighting.",
    slug: "markdown-blog",
    viewCount: 5410,
  },
  {
    title: "Pixel Canvas",
    description: "Collaborative pixel art editor with layers, color palettes, and export to PNG.",
    slug: "pixel-canvas",
    viewCount: 9150,
  },
  {
    title: "Budget Tracker",
    description: "Track expenses and income with interactive charts and category breakdowns.",
    slug: "budget-tracker",
    viewCount: 6720,
  },
  {
    title: "Quiz Builder",
    description: "Create and share interactive quizzes with timed questions and leaderboards.",
    slug: "quiz-builder",
    viewCount: 3890,
  },
];

const MOCK_SKILLS: SkillDefinition[] = [
  {
    id: "recharts",
    name: "Recharts",
    icon: "📊",
    category: "Data Viz",
    colorClass: "border-green-400/30 bg-green-500/10 text-green-400",
    triggers: [],
    description: "Interactive charts",
  },
  {
    id: "react-hook-form",
    name: "React Hook Form",
    icon: "📝",
    category: "Form",
    colorClass: "border-orange-400/30 bg-orange-500/10 text-orange-400",
    triggers: [],
    description: "Form state and validation",
  },
  {
    id: "three-js",
    name: "Three.js",
    icon: "🧊",
    category: "3D",
    colorClass: "border-blue-400/30 bg-blue-500/10 text-blue-400",
    triggers: [],
    description: "3D scene rendering",
  },
  {
    id: "dnd-kit",
    name: "DnD Kit",
    icon: "🖱️",
    category: "DnD",
    colorClass: "border-cyan-400/30 bg-cyan-500/10 text-cyan-400",
    triggers: [],
    description: "Drag and drop",
  },
  {
    id: "howler",
    name: "Howler.js",
    icon: "🎵",
    category: "Audio",
    colorClass: "border-red-400/30 bg-red-500/10 text-red-400",
    triggers: [],
    description: "Audio playback",
  },
  {
    id: "canvas-confetti",
    name: "Confetti",
    icon: "🎉",
    category: "Game",
    colorClass: "border-purple-400/30 bg-purple-500/10 text-purple-400",
    triggers: [],
    description: "Celebration effects",
  },
  {
    id: "roughjs",
    name: "Rough.js",
    icon: "✏️",
    category: "Drawing",
    colorClass: "border-pink-400/30 bg-pink-500/10 text-pink-400",
    triggers: [],
    description: "Hand-drawn graphics",
  },
  {
    id: "react-markdown",
    name: "React Markdown",
    icon: "📄",
    category: "Content",
    colorClass: "border-amber-400/30 bg-amber-500/10 text-amber-400",
    triggers: [],
    description: "Markdown rendering",
  },
];

const RELATED_LINKS = [
  "pomodoro-timer",
  "habit-tracker",
  "gradient-generator",
  "typing-speed-test",
  "morse-code-translator",
];

const STARTER_IDEAS = [
  "Todo List",
  "Calculator",
  "Color Picker",
  "Pomodoro Timer",
  "Snake Game",
  "Drawing Canvas",
  "Password Generator",
  "JSON Formatter",
];

// ---------------------------------------------------------------------------
// Code Snippets
// ---------------------------------------------------------------------------

const codeSnippets = {
  appCard: `import { AppCard } from "@/components/create/app-card";

<AppCard
  title="Chess Arena"
  description="Multiplayer chess with ELO ratings and AI opponents."
  slug="chess-arena"
  viewCount={12840}
/>`,
  skillBadge: `import { SkillBadge } from "@/components/create/skill-badge";
import type { SkillDefinition } from "@/lib/create/skill-definitions";

const skill: SkillDefinition = {
  id: "recharts",
  name: "Recharts",
  icon: "📊",
  category: "Data Viz",
  colorClass: "border-green-400/30 bg-green-500/10 text-green-400",
  triggers: [],
  description: "Interactive charts",
};

<SkillBadge skill={skill} index={0} />`,
  composerGlow: `import { ComposerGlow } from "@/components/create/composer-glow";

<ComposerGlow isFocused={isFocused}>
  <textarea
    placeholder="Describe the app you want to create..."
    className="w-full bg-transparent px-5 py-4 min-h-[96px]"
    onFocus={() => setIsFocused(true)}
    onBlur={() => setIsFocused(false)}
  />
</ComposerGlow>`,
  appGrid: `import { AppCard } from "@/components/create/app-card";

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {apps.map((app) => (
    <AppCard key={app.slug} {...app} />
  ))}
</div>`,
};

export default function CreateStorybookPage() {
  const [glowFocused, setGlowFocused] = useState(false);

  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="App Creator"
        description="The App Creator is spike.land's AI-powered app builder. Users describe what they want, and AI generates a fully working React app in seconds. These components power the creation flow."
        usage="Use AppCard to display generated apps in grids. Use ComposerGlow to wrap input areas with the signature animated border. SkillBadge displays matched technology skills based on user input."
      />

      <UsageGuide
        dos={[
          "Use AppCard in responsive grids (2-3 columns) to showcase generated apps.",
          "Apply ComposerGlow around any focused input to give the signature AI-builder feel.",
          "Display SkillBadges dynamically as the user types to show matched technologies.",
          "Keep starter idea chips concise (2-3 words each) for scannability.",
          "Use the live preview variant (LiveAppCard) only when a codespace ID is available.",
        ]}
        donts={[
          "Don't show more than 8 skill badges at once -- it overwhelms the interface.",
          "Don't auto-submit the composer -- always require explicit user action.",
          "Don't use ComposerGlow on non-interactive elements; the animation implies interactivity.",
          "Don't display view counts of zero -- omit the prop instead.",
        ]}
      />

      {/* App Cards */}
      <ComponentSample
        title="App Cards"
        description="Cards represent generated apps in the creator gallery. Each card shows the title, description, and optional view count."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {MOCK_APPS.map(app => <AppCard key={app.slug} {...app} />)}
        </div>
      </ComponentSample>

      {/* Skill Badges */}
      <ComponentSample
        title="Skill Badges"
        description="Animated badges that appear when the AI matches user input to specific technologies. Each badge has a category color and icon."
      >
        <div className="flex flex-wrap gap-2 items-center">
          <AnimatePresence mode="popLayout">
            {MOCK_SKILLS.map((skill, i) => <SkillBadge key={skill.id} skill={skill} index={i} />)}
          </AnimatePresence>
        </div>
      </ComponentSample>

      {/* Skill Badge Categories */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold font-heading">
          Skill Badge Categories
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              category: "3D",
              icon: <Code2 className="h-4 w-4" />,
              skills: MOCK_SKILLS.filter(s => s.category === "3D"),
            },
            {
              category: "Data Viz",
              icon: <BarChart3 className="h-4 w-4" />,
              skills: MOCK_SKILLS.filter(s => s.category === "Data Viz"),
            },
            {
              category: "Audio",
              icon: <Music className="h-4 w-4" />,
              skills: MOCK_SKILLS.filter(s => s.category === "Audio"),
            },
            {
              category: "Game",
              icon: <Gamepad2 className="h-4 w-4" />,
              skills: MOCK_SKILLS.filter(s => s.category === "Game"),
            },
            {
              category: "Drawing",
              icon: <PenTool className="h-4 w-4" />,
              skills: MOCK_SKILLS.filter(s => s.category === "Drawing"),
            },
            {
              category: "DnD",
              icon: <Code2 className="h-4 w-4" />,
              skills: MOCK_SKILLS.filter(s => s.category === "DnD"),
            },
            {
              category: "Form",
              icon: <Code2 className="h-4 w-4" />,
              skills: MOCK_SKILLS.filter(s => s.category === "Form"),
            },
            {
              category: "Content",
              icon: <Code2 className="h-4 w-4" />,
              skills: MOCK_SKILLS.filter(s => s.category === "Content"),
            },
          ].map(group => (
            <Card key={group.category} className="glass-1">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2">
                  {group.icon}
                  <Badge variant="outline">{group.category}</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <AnimatePresence mode="popLayout">
                    {group.skills.map((skill, i) => (
                      <SkillBadge key={skill.id} skill={skill} index={i} />
                    ))}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Composer Glow */}
      <ComponentSample
        title="Composer Glow"
        description="The signature animated border that wraps the composer input. Toggle focus state to see the glow transition between idle and active."
      >
        <div className="w-full max-w-2xl space-y-4">
          <div className="flex gap-3 justify-center mb-4">
            <button
              type="button"
              onClick={() => setGlowFocused(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !glowFocused
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/5 text-zinc-400 hover:text-white"
              }`}
            >
              Idle
            </button>
            <button
              type="button"
              onClick={() => setGlowFocused(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                glowFocused
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/5 text-zinc-400 hover:text-white"
              }`}
            >
              Focused
            </button>
          </div>
          <ComposerGlow isFocused={glowFocused}>
            <div className="px-5 py-4 rounded-xl min-h-[96px] flex items-center">
              <span className="text-zinc-500 text-base">
                {glowFocused
                  ? "Build me a multiplayer chess game with ELO ratings..."
                  : "Describe the app you want to create..."}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.07]">
              <span className="text-zinc-500 text-xs">Attach image</span>
              <div className="flex items-center gap-2">
                <kbd className="text-xs text-zinc-500 bg-white/5 border border-white/[0.06] px-2 py-1 rounded font-mono">
                  {"\u2318"}Enter
                </kbd>
                <span className="px-3 py-1.5 rounded-md bg-primary/80 text-primary-foreground text-sm font-medium">
                  Create
                </span>
              </div>
            </div>
          </ComposerGlow>
        </div>
      </ComponentSample>

      {/* Create Hero (simplified) */}
      <ComponentSample
        title="Create Hero"
        description="The landing section of the app creator page. Features the headline, subtitle, composer box, and starter idea chips."
      >
        <div className="w-full text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-sm text-cyan-400">
            <Sparkles className="w-4 h-4" />
            <span className="font-semibold tracking-widest uppercase text-[10px]">
              AI App Builder
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tighter">
            Describe it.{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              We build it.
            </span>
          </h2>

          <p className="text-lg text-zinc-400 max-w-xl mx-auto font-light">
            Type any app idea and watch AI generate a fully working React app in seconds.
          </p>

          {/* Starter idea chips */}
          <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto pt-2">
            {STARTER_IDEAS.map(idea => (
              <span
                key={idea}
                className="px-3.5 py-1.5 text-sm rounded-full border border-white/10 bg-white/[0.04] text-zinc-400 hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-cyan-500/[0.07] transition-all cursor-pointer"
              >
                {idea}
              </span>
            ))}
          </div>
        </div>
      </ComponentSample>

      {/* Related Apps sidebar */}
      <ComponentSample
        title="Related Apps Sidebar"
        description="A sidebar panel that suggests related apps and generation ideas. Shown alongside the app builder on large screens."
      >
        <div className="w-72 rounded-xl border bg-card overflow-hidden">
          <div className="p-3">
            <h3 className="font-semibold mb-3 text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Generate New
            </h3>
            <nav className="space-y-1">
              {RELATED_LINKS.map(link => (
                <Link
                  key={link}
                  href={`/create/${link}`}
                  className="block px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm"
                >
                  <div className="font-medium truncate">
                    {link.replace(/-/g, " ")}
                  </div>
                </Link>
              ))}
            </nav>
          </div>
          <div className="p-3 border-t">
            <p className="text-xs text-muted-foreground">
              Try typing any path in the URL to generate a new app!
            </p>
          </div>
        </div>
      </ComponentSample>

      {/* Live App Card indicator */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold font-heading">Live App Card</h2>
        <p className="text-muted-foreground -mt-4">
          When a codespace ID is available, cards upgrade to show a live preview with a 4:3 aspect
          ratio. Below is the fallback state (no codespace) alongside a simulated live indicator.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Fallback card */}
          <div className="space-y-2">
            <Badge variant="outline" className="text-xs">
              Fallback (no codespace)
            </Badge>
            <AppCard
              title="Pomodoro Timer"
              description="A focused work timer with break intervals and session tracking."
              slug="pomodoro-timer"
              viewCount={4210}
            />
          </div>
          {/* Simulated live card */}
          <div className="space-y-2">
            <Badge
              variant="outline"
              className="text-xs border-green-500/30 text-green-400"
            >
              Live Preview (simulated)
            </Badge>
            <div className="rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
              <div className="relative aspect-[4/3] overflow-hidden bg-zinc-950 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/40 mx-auto flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  </div>
                  <span className="text-zinc-500 text-xs">Live Preview</span>
                </div>
                <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-zinc-900/60 to-transparent" />
              </div>
              <div className="border-t border-zinc-800" />
              <div className="px-4 pt-3 pb-2">
                <h3 className="text-zinc-100 font-semibold text-base">
                  Snake Game
                </h3>
              </div>
              <div className="px-4 pb-4">
                <p className="text-zinc-400 text-sm line-clamp-2">
                  Classic snake game with score tracking and increasing difficulty.
                </p>
                <span className="inline-flex items-center gap-1 text-zinc-500 text-xs mt-2">
                  7,320 views
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Code Preview */}
      <CodePreview
        code={codeSnippets.appCard}
        title="Usage Examples"
        tabs={[
          { label: "App Card", code: codeSnippets.appCard },
          { label: "Skill Badge", code: codeSnippets.skillBadge },
          { label: "Composer Glow", code: codeSnippets.composerGlow },
          { label: "App Grid", code: codeSnippets.appGrid },
        ]}
      />

      <AccessibilityPanel
        notes={[
          "The composer textarea has an explicit aria-label for screen readers.",
          "Skill badges include a title attribute with the full skill description.",
          "AppCards are wrapped in Next.js Link components for proper navigation semantics.",
          "Starter idea chips are interactive buttons with clear hover/focus states.",
          "The ComposerGlow animation respects prefers-reduced-motion via useReducedMotion hook.",
          "Keyboard shortcuts (Cmd+K to focus, Cmd+Enter to submit) are available for power users.",
          "File attachment button has an aria-label for screen readers.",
          "Error messages use semantic color (destructive for blocked, muted for unclear).",
        ]}
      />

      <RelatedComponents currentId="create" />
    </div>
  );
}
