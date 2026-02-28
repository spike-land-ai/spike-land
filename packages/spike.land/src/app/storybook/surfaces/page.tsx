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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Layers, Plus, Search, Share2, Wifi, X } from "lucide-react";
import { useState } from "react";

const GLASS_TIERS = [
  {
    cls: "glass-0",
    label: "Tier 0",
    role: "Base / Recessed",
    blur: "4px",
    description: "Used for backgrounds, recessed panels, or secondary containers.",
    border: "border-white/5",
    badgeClass: "bg-black/20",
  },
  {
    cls: "glass-1",
    label: "Tier 1",
    role: "Standard",
    blur: "8px",
    description: "The default surface for cards, panels, and main content.",
    border: "border-white/10",
    badgeClass: "bg-primary/20 text-primary border-primary/20",
  },
  {
    cls: "glass-2",
    label: "Tier 2",
    role: "Interactive",
    blur: "16px",
    description: "For floating elements, modals, sticky headers, and hover states.",
    border: "border-white/20",
    badgeClass: "bg-white/20 text-white border-white/20",
  },
] as const;

const SHADOW_LEVELS = [
  { cls: "shadow-sm", label: "sm", depth: "2px" },
  { cls: "shadow-md", label: "md", depth: "6px" },
  { cls: "shadow-lg", label: "lg", depth: "10px" },
  { cls: "shadow-xl", label: "xl", depth: "16px" },
  { cls: "shadow-2xl", label: "2xl", depth: "24px" },
] as const;

const AURA_COLORS = [
  {
    color: "cyan",
    name: "Cyan Aura",
    gradient: "from-cyan-400 via-cyan-500 to-teal-600",
    glow: "shadow-cyan-500/40",
  },
  {
    color: "fuchsia",
    name: "Fuchsia Aura",
    gradient: "from-fuchsia-400 via-fuchsia-500 to-purple-600",
    glow: "shadow-fuchsia-500/40",
  },
  {
    color: "green",
    name: "Forest Aura",
    gradient: "from-green-400 via-emerald-500 to-teal-600",
    glow: "shadow-green-500/40",
  },
  {
    color: "orange",
    name: "Solar Aura",
    gradient: "from-orange-400 via-amber-500 to-yellow-600",
    glow: "shadow-orange-500/40",
  },
  {
    color: "blue",
    name: "Sky Aura",
    gradient: "from-blue-400 via-blue-500 to-indigo-600",
    glow: "shadow-blue-500/40",
  },
  {
    color: "purple",
    name: "Deep Aura",
    gradient: "from-purple-400 via-violet-500 to-indigo-600",
    glow: "shadow-purple-500/40",
  },
] as const;

const BORDER_RADIUS_OPTIONS = [
  { label: "none", cls: "rounded-none", px: "0px", isDefault: false },
  { label: "sm", cls: "rounded-sm", px: "2px", isDefault: false },
  { label: "md", cls: "rounded-md", px: "6px", isDefault: false },
  { label: "lg", cls: "rounded-lg", px: "8px", isDefault: false },
  { label: "xl (default)", cls: "rounded-xl", px: "12px", isDefault: true },
  { label: "2xl", cls: "rounded-2xl", px: "16px", isDefault: false },
  { label: "3xl", cls: "rounded-3xl", px: "24px", isDefault: false },
  { label: "full", cls: "rounded-full", px: "9999px", isDefault: false },
] as const;

function GlassTierComparison() {
  const [activeTier, setActiveTier] = useState(1);

  const tier = GLASS_TIERS[activeTier];

  return (
    <div className="w-full space-y-8">
      {/* Tier selector buttons */}
      <div className="flex gap-3 justify-center">
        {GLASS_TIERS.map((t, i) => (
          <Button
            key={t.cls}
            variant={activeTier === i ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTier(i)}
            className="font-mono text-xs gap-2"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: i === 0
                  ? "rgba(255,255,255,0.1)"
                  : i === 1
                  ? "rgba(99,102,241,0.5)"
                  : "rgba(255,255,255,0.4)",
              }}
            />
            {t.cls}
          </Button>
        ))}
      </div>

      {/* Side by side comparison */}
      <div className="relative rounded-3xl overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #6366f1 0%, #ec4899 30%, #f97316 60%, #06b6d4 100%)",
          }}
        />
        {/* Decorative blobs */}
        <div className="absolute top-6 left-1/4 w-40 h-40 bg-yellow-300/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-6 right-1/4 w-40 h-40 bg-white/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 p-10">
          {GLASS_TIERS.map((t, i) => (
            <div
              key={t.cls}
              className={`${t.cls} rounded-2xl border ${t.border} p-6 text-center space-y-3 transition-all duration-300 ${
                activeTier === i
                  ? "ring-2 ring-white/50 scale-[1.03]"
                  : "opacity-60 hover:opacity-80"
              }`}
              onClick={() => setActiveTier(i)}
              onKeyDown={e => (e.key === "Enter" || e.key === " ") && setActiveTier(i)}
              role="button"
              tabIndex={0}
              aria-label={`Select ${t.cls} tier`}
              aria-pressed={activeTier === i}
            >
              <span className="text-2xl font-bold text-white/30">
                {t.label}
              </span>
              <Badge className={`${t.badgeClass} hover:opacity-90`}>
                {t.role}
              </Badge>
              <p className="text-xs text-white/60">blur: {t.blur}</p>
              <code className="text-xs font-mono bg-black/30 text-white/80 px-2 py-1 rounded inline-block">
                .{t.cls}
              </code>
            </div>
          ))}
        </div>
      </div>

      {/* Details panel for selected tier */}
      {tier && (
        <div className="glass-1 rounded-2xl border border-white/10 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold font-heading text-lg">{tier.cls}</h4>
            <Badge variant="outline" className="font-mono text-xs">
              {tier.role}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{tier.description}</p>
          <div className="flex gap-3 text-xs">
            <Badge variant="secondary" className="font-mono">
              blur: {tier.blur}
            </Badge>
            <Badge variant="secondary" className="font-mono">
              {tier.border}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SurfacesPage() {
  const [blurValue, setBlurValue] = useState(8);

  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="Surfaces & Elevation"
        description="Our physical model within the digital space. We use a combination of glass-morphism tiers, deep shadows, and vibrant 'aura' glows to establish hierarchy, depth, and attention."
        usage="Use Glass Tiers for structure, Shadows for floating interaction details, and Aura Surfaces for brand moments."
      />

      <UsageGuide
        dos={[
          "Use Tier 1 (glass-1) as the default container for cards and panels.",
          "Apply Tier 2 (glass-2) sparingly for floating elements like modals or active states.",
          "Use 'Negative' shadow (inset) for grounded, recessed areas like inputs or wells.",
          "Ensure text has sufficient contrast, especially on vibrant Aura surfaces.",
        ]}
        donts={[
          "Avoid stacking glass layers more than 2 levels deep (visual noise).",
          "Don't use glass-2 for large background areas; it's performance-heavy and visually distracting.",
          "Never mix 'Aura' surfaces with competing high-saturation backgrounds.",
        ]}
      />

      {/* 1. Interactive Blur Demo */}
      <ComponentSample
        title="Interactive Blur Demo"
        description="Drag the slider to see how backdrop-filter blur affects a glass card in real time over a vivid background. The three glass tiers map to approximate blur values: glass-0 ~4px, glass-1 ~8px, glass-2 ~16px."
        code={`<div
  className="rounded-2xl border border-white/20 bg-white/10 p-6"
  style={{ backdropFilter: \`blur(\${blurValue}px)\` }}
>
  <p className="text-white font-bold">{blurValue}px blur</p>
</div>`}
      >
        <div className="w-full max-w-lg space-y-8">
          {/* Blurry background container */}
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-500" />
            <div className="absolute top-4 left-8 w-20 h-20 bg-yellow-400/60 rounded-full blur-xl" />
            <div className="absolute bottom-4 right-8 w-16 h-16 bg-cyan-400/60 rounded-full blur-xl" />
            <div className="absolute top-8 right-12 w-12 h-12 bg-white/30 rounded-full blur-lg" />

            <div className="relative z-10 flex items-center justify-center p-12">
              <div
                className="rounded-2xl border border-white/20 bg-white/10 p-6 text-center w-56 space-y-2"
                style={{ backdropFilter: `blur(${blurValue}px)` }}
              >
                <p className="text-white font-bold text-xl">
                  {blurValue}px blur
                </p>
                <p className="text-white/70 text-sm">Backdrop filter active</p>
                <Badge className="bg-white/20 text-white border-white/30 text-xs">
                  custom blur
                </Badge>
              </div>
            </div>
          </div>

          {/* Slider control */}
          <div className="space-y-3 px-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>0px (none)</span>
              <span className="font-mono font-bold text-foreground">
                {blurValue}px
              </span>
              <span>24px (max)</span>
            </div>
            <Slider
              min={0}
              max={24}
              step={1}
              value={[blurValue]}
              onValueChange={([v]) => setBlurValue(v ?? blurValue)}
              aria-label="Blur intensity slider"
            />
            <div className="flex justify-between text-xs text-muted-foreground/60">
              <span>glass-0 ~4px</span>
              <span>glass-1 ~8px</span>
              <span>glass-2 ~16px</span>
            </div>
          </div>
        </div>
      </ComponentSample>

      {/* 2. Glass Tier Comparison (Interactive) */}
      <ComponentSample
        title="Glass Tier Comparison"
        description="Select a tier to highlight it and view its properties. All three tiers displayed side by side over a vivid gradient to show how blur and opacity establish visual hierarchy."
        code={`<div className="glass-0">Tier 0 -- Base / Recessed</div>
<div className="glass-1">Tier 1 -- Standard (default)</div>
<div className="glass-2">Tier 2 -- Interactive / Floating</div>`}
      >
        <GlassTierComparison />
      </ComponentSample>

      {/* 3. Elevation Playground */}
      <ComponentSample
        title="Elevation Playground"
        description="Hover over each card to see it 'rise' off the surface. Shadow depth maps directly to perceived elevation."
        code={`<div className="shadow-sm glass-1 rounded-2xl p-6">sm (2px)</div>
<div className="shadow-md glass-1 rounded-2xl p-6">md (6px)</div>
<div className="shadow-lg glass-1 rounded-2xl p-6">lg (10px)</div>
<div className="shadow-xl glass-1 rounded-2xl p-6">xl (16px)</div>
<div className="shadow-2xl glass-1 rounded-2xl p-6">2xl (24px)</div>`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 w-full">
          {SHADOW_LEVELS.map(level => (
            <div
              key={level.cls}
              className={`group glass-1 rounded-2xl border border-white/10 p-6 flex flex-col items-center gap-3 cursor-default transition-all duration-300 hover:-translate-y-3 ${level.cls}`}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-bold text-sm font-mono">{level.cls}</p>
                <p className="text-xs text-muted-foreground">
                  depth ~{level.depth}
                </p>
              </div>
              <Badge
                variant="outline"
                className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                elevated
              </Badge>
            </div>
          ))}
        </div>
      </ComponentSample>

      {/* 4. Vibrant Aura Surfaces */}
      <ComponentSample
        title="Vibrant Aura Surfaces"
        description="Categories and brands are distinguished by their 'Aura' -- a vivid gradient with colored glow, used for brand moments and feature highlights."
        code={`<div className="bg-gradient-to-br from-cyan-400 via-cyan-500 to-teal-600 shadow-lg shadow-cyan-500/40 rounded-2xl p-6">
  Cyan Aura
</div>`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 w-full">
          {AURA_COLORS.map(aura => (
            <div key={aura.color} className="space-y-3 group cursor-pointer">
              <div
                className={`h-32 rounded-2xl flex items-center justify-center bg-gradient-to-br ${aura.gradient} shadow-lg ${aura.glow} transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl`}
              >
                <span className="font-bold text-lg text-white drop-shadow-md capitalize">
                  {aura.color}
                </span>
              </div>
              <p className="text-sm font-semibold text-center text-muted-foreground group-hover:text-foreground transition-colors">
                {aura.name}
              </p>
            </div>
          ))}
        </div>
      </ComponentSample>

      {/* 5. Border Radius Showcase */}
      <ComponentSample
        title="Border Radius Showcase"
        description="The standard XL (12px) radius is our default for cards and panels. Larger radii are used for modals and full-bleed containers."
        code={`<div className="rounded-xl border p-4">Default (12px)</div>
<div className="rounded-2xl border p-4">Large (16px)</div>
<div className="rounded-3xl border p-4">Extra Large (24px)</div>
<div className="rounded-full border p-4">Full (pill)</div>`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 w-full">
          {BORDER_RADIUS_OPTIONS.map(opt => (
            <div key={opt.label} className="group space-y-3">
              <div
                className={`h-20 bg-primary/10 border-2 ${
                  opt.isDefault ? "border-primary" : "border-white/10"
                } ${opt.cls} flex items-center justify-center transition-all duration-200 group-hover:bg-primary/20 group-hover:border-primary/50`}
              >
                {opt.isDefault && (
                  <Badge className="text-[10px] bg-primary/30 text-primary border-primary/30">
                    default
                  </Badge>
                )}
              </div>
              <div className="text-center space-y-0.5">
                <p className="text-xs font-mono font-bold">{opt.label}</p>
                <p className="text-[10px] text-muted-foreground">{opt.px}</p>
              </div>
            </div>
          ))}
        </div>
      </ComponentSample>

      {/* Shadow-based Surfaces */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold font-heading">
          Shadow-based Surfaces
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Specialized shadows provide depth where transparency isn&apos;t enough.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <ComponentSample
            title="Negative (Inset)"
            description="Creates a recessed feeling, perfect for inputs or wells."
            code={`<div className="shadow-negative bg-black/20 rounded-xl p-4 border border-white/5">
  Recessed content area
</div>`}
          >
            <div className="w-full max-w-sm space-y-4">
              <div className="relative">
                <div className="shadow-negative bg-black/20 rounded-xl p-4 flex items-center gap-3 border border-white/5 group transition-colors focus-within:border-primary/50">
                  <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <span className="text-muted-foreground flex-1">
                    Search documentation...
                  </span>
                  <div className="text-xs bg-white/5 px-2 py-1 rounded text-muted-foreground">
                    Cmd+K
                  </div>
                </div>
              </div>
              <div className="shadow-negative bg-black/20 rounded-xl p-4 border border-white/5">
                <p className="text-sm text-muted-foreground text-center">
                  Recessed Panel Content
                </p>
              </div>
            </div>
          </ComponentSample>

          <ComponentSample
            title="Floating (Elevation)"
            description="High-elevation shadows for elements that sit 'above' the UI."
            code={`<div className="shadow-floating bg-[#1a1a24] rounded-2xl p-4 border border-white/10">
  Floating notification card
</div>`}
          >
            <div className="w-full h-full flex items-center justify-center py-6">
              <div className="shadow-floating bg-[#1a1a24] rounded-2xl p-4 flex items-center gap-4 border border-white/10 max-w-xs transform hover:-translate-y-1 transition-transform duration-300">
                <div className="p-3 bg-green-500/20 text-green-400 rounded-xl">
                  <Wifi className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Connection Restored</h4>
                  <p className="text-xs text-muted-foreground">
                    Your changes are saved.
                  </p>
                </div>
              </div>
            </div>
          </ComponentSample>
        </div>
      </section>

      {/* High-Fidelity Layers */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold font-heading">
          High-Fidelity Layers
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Combining glass tiers and shadows for complex, realistic UI patterns.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ComponentSample
            title="Settings Panel Example"
            description="A complex surface using glass-2, lists, and controls."
            code={`<Card variant="layers" className="shadow-2xl">
  <CardHeader>
    <CardTitle>Notifications</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="flex items-center justify-between">
      <span>Push Notifications</span>
      <Switch defaultChecked />
    </div>
  </CardContent>
</Card>`}
          >
            <Card
              variant="layers"
              className="w-full max-w-md mx-auto shadow-2xl"
            >
              <CardHeader className="pb-4 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Notifications</CardTitle>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-sm font-medium text-white">
                      Push Notifications
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Receive daily summaries
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-sm font-medium text-white">
                      Sound Effects
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Play sounds on action
                    </p>
                  </div>
                  <Switch />
                </div>
                <Button className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/10">
                  Manage Preferences
                </Button>
              </CardContent>
            </Card>
          </ComponentSample>

          <ComponentSample
            title="Visual Content Overlay"
            description="Using glass layers to caption and action rich media."
            code={`<div className="relative aspect-video rounded-3xl overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
  <div className="absolute bottom-4 left-4 right-4 glass-2 rounded-xl p-4 border border-white/20">
    <p className="text-white font-bold">Title</p>
  </div>
</div>`}
          >
            <div className="relative w-full max-w-md mx-auto aspect-video rounded-3xl overflow-hidden group shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-70 mix-blend-overlay hover:scale-105 transition-transform duration-700" />

              <div className="absolute bottom-4 left-4 right-4 glass-2 rounded-xl p-4 flex items-center justify-between border border-white/20 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-white/20">
                    <AvatarImage src="/avatars/01.png" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-400">
                      AR
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-bold text-white line-clamp-1">
                      Abstract Waves
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-white/60">
                      Digital Art
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full bg-primary text-primary-foreground shadow-glow-primary hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </ComponentSample>
        </div>
      </section>

      <CodePreview
        title="Surfaces Quick Reference"
        tabs={[
          {
            label: "Glass Tiers",
            code: `{/* Tier 0 -- Base / Recessed */}
<div className="glass-0">
  Background panels, recessed wells
</div>

{/* Tier 1 -- Standard (default for cards) */}
<div className="glass-1">
  Cards, panels, main content areas
</div>

{/* Tier 2 -- Interactive / Floating */}
<div className="glass-2">
  Modals, sticky headers, tooltips, active hover states
</div>`,
          },
          {
            label: "Shadows",
            code: `{/* Elevation shadows */}
<div className="shadow-sm">Subtle depth (2px)</div>
<div className="shadow-md">Medium depth (6px)</div>
<div className="shadow-lg">Large depth (10px)</div>
<div className="shadow-xl">Extra large depth (16px)</div>
<div className="shadow-2xl">Maximum depth (24px)</div>

{/* Special shadows */}
<div className="shadow-negative">Inset / recessed</div>
<div className="shadow-floating">Floating / elevated</div>`,
          },
          {
            label: "Aura & Radius",
            code: `{/* Aura gradient surfaces */}
<div className="bg-gradient-to-br from-cyan-400 via-cyan-500 to-teal-600 shadow-lg shadow-cyan-500/40">
  Cyan Aura
</div>

{/* Border radius */}
<div className="rounded-xl">Default (12px)</div>
<div className="rounded-2xl">Large (16px)</div>
<div className="rounded-3xl">Extra large (24px)</div>
<div className="rounded-full">Pill shape</div>`,
          },
        ]}
        code=""
      />

      <AccessibilityPanel
        notes={[
          "Glass surfaces use semi-transparent backgrounds with backdrop-filters; ensure fallback colors are set for browsers that don't support backdrop-filter.",
          "All glass tiers include a subtle border (glass-edge) for visual definition without high contrast lines, aiding users with low visual acuity.",
          "Text color must automatically adjust to remain readable over light or dark backgrounds.",
          "Backdrop-filter 'blur' is disabled on low-power devices to maintain performance.",
          "Interactive blur demo uses inline style (backdropFilter) to avoid purging; ensure CSP allows inline styles when needed.",
          "Aura gradient cards must maintain a minimum 3:1 contrast ratio for text against their gradient background.",
          "Glass tier comparison uses aria-pressed and keyboard navigation for full accessibility.",
        ]}
      />

      <RelatedComponents currentId="surfaces" />
    </div>
  );
}
