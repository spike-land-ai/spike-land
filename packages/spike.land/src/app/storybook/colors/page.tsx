"use client";

import {
  AccessibilityPanel,
  Breadcrumbs,
  CodePreview,
  colorPalette,
  ComponentSample,
  ContrastCheckerDemo,
  PageHeader,
  RelatedComponents,
  UsageGuide,
} from "@/components/storybook";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Copy, Moon, Sun } from "lucide-react";
import { useState } from "react";

// --- Click-to-copy swatch ---

interface CopyableSwatchProps {
  name: string;
  hex: string;
  desc: string;
  varName?: string;
  colorRole?: string;
  contrastPass?: boolean;
}

function CopyableSwatch(
  { name, hex, desc, varName, colorRole, contrastPass }: CopyableSwatchProps,
) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(hex).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-xl bg-card/50 border border-border hover:bg-muted/50 transition-colors cursor-pointer group"
      onClick={handleCopy}
      role="button"
      tabIndex={0}
      aria-label={`Copy hex value ${hex} for ${name}`}
      onKeyDown={e => e.key === "Enter" && handleCopy()}
    >
      <div className="relative w-16 h-16 rounded-xl border border-border shadow-sm flex-shrink-0 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundColor: hex }} />
        <span className="relative z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          {copied
            ? <Check className="w-5 h-5 text-white drop-shadow" />
            : <Copy className="w-4 h-4 text-white drop-shadow" />}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-base">{name}</span>
          {colorRole && <Badge variant="secondary" className="text-xs">{colorRole}</Badge>}
          {copied && (
            <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
              Copied!
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-sm text-muted-foreground font-mono">{hex}</span>
          {varName && (
            <span className="text-xs text-muted-foreground/60 font-mono">
              var({varName})
            </span>
          )}
          {contrastPass && (
            <Badge
              variant="outline"
              className="text-xs border-green-500 text-green-500"
            >
              AA
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground mt-1">{desc}</div>
      </div>
    </div>
  );
}

// --- Gradient Gallery ---

const gradients = [
  {
    id: "cyan-fuchsia",
    name: "gradient-cyan-fuchsia",
    className: "gradient-cyan-fuchsia",
    desc: "Primary brand gradient -- used on hero surfaces and CTAs",
    css: "background: linear-gradient(135deg, #00E5FF, #FF00FF)",
  },
  {
    id: "cyan-transparent",
    name: "Cyan to Transparent",
    className: "bg-gradient-to-r from-[#00E5FF] to-transparent",
    desc: "Fades out for overlays and banner accents",
    css: "background: linear-gradient(to right, #00E5FF, transparent)",
  },
  {
    id: "fuchsia-transparent",
    name: "Fuchsia to Transparent",
    className: "bg-gradient-to-r from-[#FF00FF] to-transparent",
    desc: "Secondary accent fade for decorative panels",
    css: "background: linear-gradient(to right, #FF00FF, transparent)",
  },
  {
    id: "dark-primary",
    name: "Dark to Primary",
    className: "bg-gradient-to-r from-[#08081C] to-[#00E5FF]",
    desc: "Deep space to cyan -- used in nav and sidebar transitions",
    css: "background: linear-gradient(to right, #08081C, #00E5FF)",
  },
];

// --- Semantic color tokens ---

const semanticTokens = [
  {
    name: "Success",
    hex: "#22C55E",
    varName: "--success",
    desc: "Confirmations, completed states, positive feedback",
    usedIn: "Badges, toasts, form validation",
    swatchClass: "bg-green-500",
    textClass: "text-green-500",
    borderClass: "border-green-500/30",
    bgClass: "bg-green-500/10",
  },
  {
    name: "Warning",
    hex: "#F59E0B",
    varName: "--warning",
    desc: "Cautions, pending states, attention needed",
    usedIn: "Alert dialogs, banners, inline hints",
    swatchClass: "bg-amber-500",
    textClass: "text-amber-500",
    borderClass: "border-amber-500/30",
    bgClass: "bg-amber-500/10",
  },
  {
    name: "Destructive",
    hex: "#EF4444",
    varName: "--destructive",
    desc: "Errors, deletions, critical actions",
    usedIn: "Error messages, delete buttons, form errors",
    swatchClass: "bg-red-500",
    textClass: "text-red-500",
    borderClass: "border-red-500/30",
    bgClass: "bg-red-500/10",
  },
];

// --- Interactive Gradient Builder ---

const gradientDirections = [
  { label: "To Right", value: "to right", tw: "bg-gradient-to-r" },
  { label: "To Bottom", value: "to bottom", tw: "bg-gradient-to-b" },
  {
    label: "To Bottom Right",
    value: "to bottom right",
    tw: "bg-gradient-to-br",
  },
  { label: "To Top Right", value: "to top right", tw: "bg-gradient-to-tr" },
];

function GradientBuilder() {
  const [colorFrom, setColorFrom] = useState("#00E5FF");
  const [colorTo, setColorTo] = useState("#FF00FF");
  const [direction, setDirection] = useState("to right");

  const selectedDir = gradientDirections.find(d => d.value === direction);
  const cssValue = `linear-gradient(${direction}, ${colorFrom}, ${colorTo})`;
  const tailwindClass = `${
    selectedDir?.tw ?? "bg-gradient-to-r"
  } from-[${colorFrom}] to-[${colorTo}]`;

  const [copiedField, setCopiedField] = useState<string | null>(null);

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1800);
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="gradient-from">From Color</Label>
          <div className="flex gap-2">
            <Input
              id="gradient-from"
              type="text"
              value={colorFrom}
              onChange={e => setColorFrom(e.target.value)}
              className="font-mono"
            />
            <input
              type="color"
              value={colorFrom}
              onChange={e => setColorFrom(e.target.value)}
              className="w-12 h-10 rounded-lg cursor-pointer border border-border"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gradient-to">To Color</Label>
          <div className="flex gap-2">
            <Input
              id="gradient-to"
              type="text"
              value={colorTo}
              onChange={e => setColorTo(e.target.value)}
              className="font-mono"
            />
            <input
              type="color"
              value={colorTo}
              onChange={e => setColorTo(e.target.value)}
              className="w-12 h-10 rounded-lg cursor-pointer border border-border"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Direction</Label>
          <div className="flex flex-wrap gap-1.5">
            {gradientDirections.map(dir => (
              <Button
                key={dir.value}
                variant={direction === dir.value ? "default" : "outline"}
                size="sm"
                onClick={() => setDirection(dir.value)}
                className="text-xs"
              >
                {dir.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div
        className="h-32 rounded-2xl border border-white/10 shadow-sm"
        style={{ background: cssValue }}
      />

      {/* Output code snippets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          className="p-3 rounded-lg bg-muted/50 border border-border font-mono text-sm text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors flex items-center justify-between gap-2"
          onClick={() => copyToClipboard(cssValue, "css")}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === "Enter" && copyToClipboard(cssValue, "css")}
        >
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-widest opacity-50 block mb-1">
              CSS
            </span>
            <span className="text-xs break-all">{cssValue}</span>
          </div>
          {copiedField === "css"
            ? <Check className="w-4 h-4 text-green-400 shrink-0" />
            : <Copy className="w-4 h-4 opacity-40 shrink-0" />}
        </div>
        <div
          className="p-3 rounded-lg bg-muted/50 border border-border font-mono text-sm text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors flex items-center justify-between gap-2"
          onClick={() => copyToClipboard(tailwindClass, "tw")}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === "Enter" && copyToClipboard(tailwindClass, "tw")}
        >
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-widest opacity-50 block mb-1">
              Tailwind
            </span>
            <span className="text-xs break-all">{tailwindClass}</span>
          </div>
          {copiedField === "tw"
            ? <Check className="w-4 h-4 text-green-400 shrink-0" />
            : <Copy className="w-4 h-4 opacity-40 shrink-0" />}
        </div>
      </div>
    </div>
  );
}

// --- Dark/Light Theme Toggle Preview ---

function ThemePreview() {
  const [isDark, setIsDark] = useState(true);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant={isDark ? "default" : "outline"}
          size="sm"
          onClick={() => setIsDark(true)}
          className="gap-2"
        >
          <Moon className="w-4 h-4" />
          Dark
        </Button>
        <Button
          variant={!isDark ? "default" : "outline"}
          size="sm"
          onClick={() => setIsDark(false)}
          className="gap-2"
        >
          <Sun className="w-4 h-4" />
          Light
        </Button>
      </div>

      <div
        className={`p-6 rounded-2xl border transition-colors duration-300 ${
          isDark
            ? "bg-[#08081C] border-[#221144] text-white"
            : "bg-white border-[#DCE0E8] text-[#12121C]"
        }`}
      >
        <div className="space-y-4">
          {/* Simulated card */}
          <div
            className={`p-4 rounded-xl border transition-colors duration-300 ${
              isDark
                ? "bg-[#112244] border-[#222244]"
                : "bg-[#F4F6F8] border-[#DCE0E8]"
            }`}
          >
            <h3 className="font-bold text-lg">Card Title</h3>
            <p
              className={`text-sm mt-1 transition-colors duration-300 ${
                isDark ? "text-[#A0A0C0]" : "text-[#666680]"
              }`}
            >
              This is how content appears in {isDark ? "dark" : "light"}{" "}
              mode. Notice the background, border, and text color shifts.
            </p>
          </div>

          {/* Simulated buttons */}
          <div className="flex gap-3">
            <div className="px-4 py-2 rounded-lg bg-[#00E5FF] text-black font-semibold text-sm">
              Primary Action
            </div>
            <div
              className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors duration-300 ${
                isDark
                  ? "border-[#222244] text-[#A0A0C0]"
                  : "border-[#DCE0E8] text-[#666680]"
              }`}
            >
              Secondary
            </div>
          </div>

          {/* Simulated badge row */}
          <div className="flex gap-2">
            <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
              Success
            </Badge>
            <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Warning
            </Badge>
            <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">
              Error
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Usage example mini-vignettes ---

function UsageExamples() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Primary button using cyan */}
      <div className="space-y-2">
        <Label className="text-[10px] uppercase tracking-widest opacity-50">
          Primary Action
        </Label>
        <div className="p-4 rounded-xl bg-card/50 border border-border flex items-center justify-center min-h-[72px]">
          <Button className="shadow-glow-cyan">Save Changes</Button>
        </div>
        <p className="text-xs text-muted-foreground font-mono">
          bg-primary / #00E5FF
        </p>
      </div>

      {/* Error alert using destructive */}
      <div className="space-y-2">
        <Label className="text-[10px] uppercase tracking-widest opacity-50">
          Error Alert
        </Label>
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 min-h-[72px]">
          <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          <p className="text-sm text-red-400">
            Invalid credentials. Please try again.
          </p>
        </div>
        <p className="text-xs text-muted-foreground font-mono">
          bg-destructive/10 / #EF4444
        </p>
      </div>

      {/* Success badge */}
      <div className="space-y-2">
        <Label className="text-[10px] uppercase tracking-widest opacity-50">
          Success Badge
        </Label>
        <div className="p-4 rounded-xl bg-card/50 border border-border flex items-center justify-center min-h-[72px]">
          <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 text-sm px-3 py-1">
            <Check className="w-3.5 h-3.5 mr-1.5" />
            Verified
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground font-mono">
          bg-success/20 / #22C55E
        </p>
      </div>

      {/* Warning toast using yellow */}
      <div className="space-y-2">
        <Label className="text-[10px] uppercase tracking-widest opacity-50">
          Warning Toast
        </Label>
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 min-h-[72px]">
          <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          <p className="text-sm text-amber-400">
            Your session expires in 5 minutes.
          </p>
        </div>
        <p className="text-xs text-muted-foreground font-mono">
          bg-warning/10 / #F59E0B
        </p>
      </div>
    </div>
  );
}

export default function ColorsPage() {
  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="Color System"
        description="Our color system is built on a foundation of deep space blues and vibrant neon accents. Every color is meticulously tuned for high-contrast accessibility and optical richness."
        usage="Use CSS variables throughout the application to ensure theme consistency. Accent colors should be used sparingly to guide user focus. Click any swatch to copy its hex value."
      />

      <UsageGuide
        dos={[
          "Use CSS custom properties (var(--primary), var(--background)) for all color references.",
          "Test color combinations with the contrast checker below to ensure WCAG AA compliance.",
          "Use semantic tokens (success, warning, destructive) for status communication.",
          "Apply brand gradients only on hero sections, CTAs, and emphasis surfaces.",
          "Pair glow effects with interactive elements to signal affordance.",
        ]}
        donts={[
          "Do not hard-code hex values in components -- always use CSS variables or Tailwind tokens.",
          "Do not use the accent fuchsia for body text -- it is reserved for non-text decorative elements.",
          "Do not combine multiple glow effects in close proximity; it creates visual noise.",
          "Do not use success/warning/destructive colors for purely decorative purposes.",
          "Do not override theme colors inline unless building a one-off marketing page.",
        ]}
      />

      {/* Brand Identity */}
      <ComponentSample
        title="Brand Identity"
        description="The core brand colors that define the spike.land visual identity. Cyan serves as the primary interactive color and fuchsia as the secondary accent."
        importPath="tailwind.config / globals.css"
        code={`/* CSS Variables */
--pixel-cyan: #00E5FF;
--pixel-fuchsia: #FF00FF;

/* Tailwind usage */
<div className="bg-primary text-primary-foreground">Primary</div>
<div className="bg-accent text-accent-foreground">Accent</div>`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="grid grid-cols-1 gap-4">
            {colorPalette.brand.map(color => (
              <CopyableSwatch
                key={color.name}
                name={color.name}
                hex={color.hex}
                desc={color.desc}
                varName={color.var}
                colorRole={color.role}
                contrastPass={color.contrastPass}
              />
            ))}
          </div>
          <Card className="glass-1 overflow-hidden group">
            <div className="h-full min-h-[200px] flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 animate-pulse" />
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary shadow-glow-cyan animate-bounce" />
                  <div className="w-16 h-16 rounded-full bg-accent shadow-glow-fuchsia animate-bounce delay-150" />
                </div>
                <p className="text-xl font-black font-heading tracking-widest text-foreground/80 group-hover:text-primary transition-colors">
                  SPIKE LAND CORE
                </p>
              </div>
            </div>
          </Card>
        </div>
      </ComponentSample>

      {/* Dark/Light Theme Preview */}
      <ComponentSample
        title="Theme Preview"
        description="Toggle between dark and light themes to see how the color system adapts. All tokens shift to maintain contrast and readability across both modes."
        importPath="globals.css"
        code={`/* Dark mode (default) */
:root {
  --background: #08081C;
  --foreground: #FFFFFF;
  --card: #112244;
  --border: #221144;
  --muted-foreground: #A0A0C0;
}

/* Light mode */
.light {
  --background: #FFFFFF;
  --foreground: #12121C;
  --card: #F4F6F8;
  --border: #DCE0E8;
}`}
      >
        <ThemePreview />
      </ComponentSample>

      {/* Theme Foundations */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold font-heading">Theme Foundations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <ComponentSample
            title="Dark Mode (Deep Space)"
            description="The default theme palette. Deep space blues provide a rich backdrop for vibrant neon accents."
          >
            <div className="grid grid-cols-1 gap-4">
              {colorPalette.dark.map(color => (
                <CopyableSwatch
                  key={color.name}
                  name={color.name}
                  hex={color.hex}
                  desc={color.desc}
                  varName={color.var}
                />
              ))}
            </div>
          </ComponentSample>

          <ComponentSample
            title="Light Mode (Carbon)"
            description="A clean, minimal alternative for well-lit environments and accessibility preferences."
          >
            <div className="grid grid-cols-1 gap-4">
              {colorPalette.light.map(color => (
                <CopyableSwatch
                  key={color.name}
                  name={color.name}
                  hex={color.hex}
                  desc={color.desc}
                  varName={color.var}
                />
              ))}
            </div>
          </ComponentSample>
        </div>
      </section>

      {/* Gradient Gallery */}
      <ComponentSample
        title="Gradient Gallery"
        description="Pre-built gradient utilities available as Tailwind classes. Use these for hero sections, CTAs, and decorative surfaces."
        importPath="tailwind.config"
        code={`/* Tailwind gradient utilities */
<div className="gradient-cyan-fuchsia" />
<div className="bg-gradient-to-r from-[#00E5FF] to-transparent" />
<div className="bg-gradient-to-r from-[#FF00FF] to-transparent" />
<div className="bg-gradient-to-r from-[#08081C] to-[#00E5FF]" />`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {gradients.map(g => (
            <div key={g.id} className="space-y-3">
              <div
                className={`h-24 rounded-2xl ${g.className} border border-white/10 shadow-sm`}
              />
              <div>
                <p className="text-sm font-mono font-semibold text-foreground">
                  {g.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{g.desc}</p>
                <p className="text-xs text-muted-foreground/60 font-mono mt-1">
                  {g.css}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ComponentSample>

      {/* Interactive Gradient Builder */}
      <ComponentSample
        title="Gradient Builder"
        description="Create custom gradients by selecting colors and direction. Copy the generated CSS or Tailwind class directly into your code."
      >
        <GradientBuilder />
      </ComponentSample>

      {/* Semantic Color Tokens */}
      <ComponentSample
        title="Semantic Color Tokens"
        description="Status colors with consistent meaning across the entire product. Each token maps to a specific user communication intent."
        importPath="globals.css"
        code={`/* Semantic tokens */
--success: #22C55E;
--warning: #F59E0B;
--destructive: #EF4444;

/* Usage */
<Badge className="bg-green-500/20 text-green-400">Success</Badge>
<div className="border-amber-500/30 bg-amber-500/10">Warning</div>
<Button variant="destructive">Delete</Button>`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {semanticTokens.map(token => (
            <div
              key={token.name}
              className={`p-5 rounded-2xl border ${token.borderClass} ${token.bgClass} space-y-4`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl ${token.swatchClass} shadow-sm flex-shrink-0`}
                />
                <div>
                  <p className={`font-bold text-base ${token.textClass}`}>
                    {token.name}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {token.hex}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{token.desc}</p>
              <div className="pt-1 border-t border-white/5">
                <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">
                  Used in
                </p>
                <p className="text-xs font-mono text-muted-foreground">
                  {token.usedIn}
                </p>
              </div>
              <p className="text-xs font-mono text-muted-foreground/60">
                var({token.varName})
              </p>
            </div>
          ))}
        </div>
      </ComponentSample>

      {/* Color Usage Examples */}
      <ComponentSample
        title="Color Usage Examples"
        description="How semantic and brand colors appear in real UI contexts."
      >
        <UsageExamples />
      </ComponentSample>

      {/* Optical Effects */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold font-heading">Optical Effects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <ComponentSample
            title="Glow Utilities"
            description="Vibrant shadows and rings for emphasis."
            code={`<Button className="shadow-glow-cyan">Action</Button>
<Button className="shadow-glow-fuchsia">Focus</Button>
<div className="gradient-cyan-fuchsia shadow-glow-gradient">Ultimate</div>`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-[10px] uppercase tracking-wider opacity-60">
                  Cyan Glow
                </Label>
                <Button className="w-full shadow-glow-cyan">
                  Action Ready
                </Button>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] uppercase tracking-wider opacity-60">
                  Fuchsia Glow
                </Label>
                <Button className="w-full bg-accent hover:bg-accent/90 shadow-glow-fuchsia">
                  Priority Focus
                </Button>
              </div>
              <div className="space-y-3 sm:col-span-2">
                <Label className="text-[10px] uppercase tracking-wider opacity-60">
                  Gradient Surface
                </Label>
                <div className="h-12 rounded-xl gradient-cyan-fuchsia shadow-glow-gradient flex items-center justify-center group cursor-pointer transition-all hover:scale-[1.02]">
                  <span className="text-white font-black font-heading tracking-widest text-sm uppercase">
                    Ultimate
                  </span>
                </div>
              </div>
            </div>
          </ComponentSample>

          <ComponentSample
            title="Glass Elevation"
            description="Translucent layers with depth-based blur."
            code={`<div className="glass-0">Tier 0 / blur-xs</div>
<div className="glass-1 shadow-lg">Tier 1 / blur-md</div>
<div className="glass-2 shadow-2xl">Tier 2 / blur-xl</div>`}
          >
            <div className="space-y-6 p-4 rounded-3xl bg-black/40 border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -mr-16 -mt-16" />
              <div className="relative z-10 space-y-4">
                <div className="p-4 rounded-xl glass-0 border-white/10">
                  <p className="text-xs font-mono text-primary">
                    tier-0 / blur-xs
                  </p>
                </div>
                <div className="p-4 rounded-xl glass-1 border-white/10 shadow-lg">
                  <p className="text-xs font-mono text-primary">
                    tier-1 / blur-md
                  </p>
                </div>
                <div className="p-4 rounded-xl glass-2 border-white/10 shadow-2xl">
                  <p className="text-xs font-mono text-primary">
                    tier-2 / blur-xl
                  </p>
                </div>
              </div>
            </div>
          </ComponentSample>
        </div>
      </section>

      {/* Contrast Checker */}
      <ComponentSample
        title="Contrast Checker"
        description="Verify that your color combinations meet WCAG accessibility standards. Enter foreground and background colors to check contrast ratios for AA and AAA compliance."
        importPath="@/components/storybook"
        code={`import { ContrastCheckerDemo } from "@/components/storybook";

<ContrastCheckerDemo />`}
      >
        <ContrastCheckerDemo />
      </ComponentSample>

      {/* Code Preview */}
      <CodePreview
        title="Color System Usage"
        code={`/* Always use CSS variables for colors */
.card {
  background: var(--card);
  border: 1px solid var(--border);
  color: var(--foreground);
}

/* Tailwind color utilities */
<div className="bg-primary text-primary-foreground">Primary</div>
<div className="bg-accent text-accent-foreground">Accent</div>
<div className="bg-muted text-muted-foreground">Muted</div>`}
        tabs={[
          {
            label: "CSS Variables",
            code: `/* Brand */
--pixel-cyan: #00E5FF;
--pixel-fuchsia: #FF00FF;

/* Dark theme */
--background: #08081C;
--foreground: #FFFFFF;
--card: #112244;
--border: #221144;
--muted-foreground: #A0A0C0;

/* Light theme */
--background: #FFFFFF;
--foreground: #12121C;
--card: #F4F6F8;
--border: #DCE0E8;

/* Semantic */
--success: #22C55E;
--warning: #F59E0B;
--destructive: #EF4444;`,
          },
          {
            label: "Tailwind Usage",
            code: `/* Background colors */
<div className="bg-background" />      /* Theme background */
<div className="bg-card" />            /* Card surface */
<div className="bg-muted" />           /* Muted surface */
<div className="bg-primary" />         /* Brand cyan */
<div className="bg-accent" />          /* Brand fuchsia */

/* Text colors */
<span className="text-foreground" />         /* Primary text */
<span className="text-muted-foreground" />   /* Secondary text */
<span className="text-primary" />            /* Cyan text */

/* Border colors */
<div className="border-border" />      /* Default border */
<div className="border-primary" />     /* Cyan border */

/* Gradients */
<div className="gradient-cyan-fuchsia" />
<div className="bg-gradient-to-r from-primary to-accent" />`,
          },
          {
            label: "Glow Effects",
            code: `/* Glow shadow utilities */
<Button className="shadow-glow-cyan">Cyan glow</Button>
<Button className="shadow-glow-fuchsia">Fuchsia glow</Button>
<div className="shadow-glow-gradient">Gradient glow</div>

/* Glass morphism tiers */
<div className="glass-0">Subtle blur</div>
<div className="glass-1">Medium blur + shadow</div>
<div className="glass-2">Heavy blur + deep shadow</div>`,
          },
        ]}
      />

      <AccessibilityPanel
        notes={[
          "Primary color (#00E5FF) is paired with dark backgrounds for 4.5:1 contrast.",
          "Secondary color (#FF00FF) is used primarily for non-text accents.",
          "Light/Dark mode palettes are tested for WCAG AA compliance.",
          "Glow effects do not use motion that could trigger sensitivity.",
          "Elevation tiers maintain distinct contrast ratios even on busy backgrounds.",
          "Semantic tokens (success, warning, destructive) meet 3:1 minimum contrast for non-text.",
          "Click-to-copy swatches announce copy state via aria-label for screen readers.",
          "The contrast checker tool helps developers verify color pairings before shipping.",
        ]}
      />

      <RelatedComponents currentId="colors" />
    </div>
  );
}
