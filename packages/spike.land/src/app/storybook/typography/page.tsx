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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

function CopyButton({ value }: { value: string; }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={handleCopy}
      aria-label={`Copy class ${value}`}
    >
      {copied
        ? <Check className="h-3 w-3 text-success" />
        : <Copy className="h-3 w-3 text-muted-foreground" />}
    </Button>
  );
}

const TYPE_SCALE = [
  {
    tag: "h1",
    label: "Heading 1",
    twClass: "text-6xl",
    fontClass: "font-black font-heading tracking-tighter",
    px: "60px",
    weight: "900",
    text: "Ultimate Enhancement.",
  },
  {
    tag: "h2",
    label: "Heading 2",
    twClass: "text-5xl",
    fontClass: "font-bold font-heading tracking-tight",
    px: "48px",
    weight: "700",
    text: "System Performance.",
  },
  {
    tag: "h3",
    label: "Heading 3",
    twClass: "text-4xl",
    fontClass: "font-semibold font-heading",
    px: "36px",
    weight: "600",
    text: "Core Components",
  },
  {
    tag: "h4",
    label: "Heading 4",
    twClass: "text-2xl",
    fontClass: "font-semibold font-heading",
    px: "24px",
    weight: "600",
    text: "Interactive Elements",
  },
  {
    tag: "h5",
    label: "Heading 5",
    twClass: "text-xl",
    fontClass: "font-medium font-heading",
    px: "20px",
    weight: "500",
    text: "Status Indicators",
  },
  {
    tag: "h6",
    label: "Heading 6",
    twClass: "text-base",
    fontClass: "font-medium font-heading",
    px: "16px",
    weight: "500",
    text: "Inline Meta Data",
  },
] as const;

const FONT_WEIGHTS = [
  { label: "Regular", weight: 400, twClass: "font-normal" },
  { label: "Medium", weight: 500, twClass: "font-medium" },
  { label: "Semibold", weight: 600, twClass: "font-semibold" },
  { label: "Bold", weight: 700, twClass: "font-bold" },
  { label: "Black", weight: 900, twClass: "font-black" },
] as const;

const LETTER_SPACING = [
  { label: "Tight", twClass: "tracking-tight", value: "-0.025em" },
  { label: "Normal", twClass: "tracking-normal", value: "0em" },
  { label: "Wide", twClass: "tracking-wide", value: "0.025em" },
  { label: "Widest", twClass: "tracking-widest", value: "0.1em" },
] as const;

const LINE_HEIGHTS = [
  { label: "None", twClass: "leading-none", value: "1" },
  { label: "Tight", twClass: "leading-tight", value: "1.25" },
  { label: "Normal", twClass: "leading-normal", value: "1.5" },
  { label: "Relaxed", twClass: "leading-relaxed", value: "1.625" },
  { label: "Loose", twClass: "leading-loose", value: "2" },
] as const;

const BODY_TEXT =
  "Spike.land transforms how teams collaborate on creative projects. Our AI-driven platform brings precision and clarity to every workflow, from concept to delivery.";

const WEIGHT_SLIDER_STOPS = [
  { value: 100, label: "Thin", twClass: "font-thin" },
  { value: 200, label: "Extra Light", twClass: "font-extralight" },
  { value: 300, label: "Light", twClass: "font-light" },
  { value: 400, label: "Regular", twClass: "font-normal" },
  { value: 500, label: "Medium", twClass: "font-medium" },
  { value: 600, label: "Semibold", twClass: "font-semibold" },
  { value: 700, label: "Bold", twClass: "font-bold" },
  { value: 800, label: "Extra Bold", twClass: "font-extrabold" },
  { value: 900, label: "Black", twClass: "font-black" },
] as const;

function FontWeightSlider() {
  const [weightValue, setWeightValue] = useState(400);

  const currentStop = WEIGHT_SLIDER_STOPS.reduce((prev, curr) =>
    Math.abs(curr.value - weightValue) < Math.abs(prev.value - weightValue)
      ? curr
      : prev
  );

  return (
    <div className="w-full space-y-8">
      {/* Preview area */}
      <div className="relative rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/5" />
        <div className="relative z-10 p-10 space-y-6 text-center">
          <p
            className="font-heading text-5xl transition-all duration-200"
            style={{ fontWeight: weightValue }}
          >
            spike.land
          </p>
          <p
            className="font-sans text-2xl text-muted-foreground transition-all duration-200"
            style={{ fontWeight: weightValue }}
          >
            Creative collaboration, redefined.
          </p>
        </div>
      </div>

      {/* Slider control */}
      <div className="space-y-4 px-2">
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-muted-foreground">100 (Thin)</span>
          <div className="text-center space-y-1">
            <span className="font-mono font-bold text-foreground text-lg">
              {weightValue}
            </span>
            <div className="flex items-center gap-2 justify-center">
              <Badge variant="outline" className="font-mono text-[10px]">
                {currentStop.twClass}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {currentStop.label}
              </Badge>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">900 (Black)</span>
        </div>
        <Slider
          min={100}
          max={900}
          step={100}
          value={[weightValue]}
          onValueChange={([v]) => setWeightValue(v ?? weightValue)}
          aria-label="Font weight slider"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground/50">
          {WEIGHT_SLIDER_STOPS.map(stop => (
            <span
              key={stop.value}
              className={stop.value === weightValue
                ? "text-primary font-bold"
                : ""}
            >
              {stop.value}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TypographyPage() {
  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="Typography"
        description="Our typography system is designed for maximum legibility across all creative workflows. We use Montserrat for high-impact headings and Geist Sans for precise body content."
        usage="Use the .font-heading class for titles and .font-sans for general UI text. Ensure sufficient contrast by following our semantic text color guidelines."
      />

      <UsageGuide
        dos={[
          "Use font-heading (Montserrat) for all h1-h4 headings to maintain brand consistency.",
          "Use font-sans (Geist Sans) for body text, labels, and UI controls.",
          "Follow the type scale -- don't invent new sizes outside the scale.",
          "Pair tracking-tight or tracking-tighter with large display headings.",
          "Use leading-relaxed or leading-loose for long-form body paragraphs.",
        ]}
        donts={[
          "Don't apply font-heading to body text or small labels -- it loses legibility.",
          "Don't mix tracking-widest with very large bold headings.",
          "Don't use arbitrary font sizes outside the Tailwind scale.",
          "Don't reduce leading-none on body text -- it harms readability.",
          "Don't use font-black on body copy -- reserve it for display use only.",
        ]}
      />

      {/* Font Stack */}
      <ComponentSample
        title="The Font Stack"
        description="Two carefully paired typefaces form the foundation of the spike.land typographic system."
        code={`<h1 className="font-heading text-5xl font-black tracking-tight">
  Creative Precision.
</h1>
<p className="font-sans text-base text-muted-foreground">
  Crafted for clarity in every pixel.
</p>`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          <Card className="glass-1">
            <CardContent className="pt-8 space-y-6">
              <div className="flex justify-between items-center">
                <Label className="uppercase text-[10px] tracking-widest font-black opacity-60">
                  Heading Typeface
                </Label>
                <Badge variant="secondary">Montserrat</Badge>
              </div>
              <h3 className="text-5xl font-black font-heading leading-tight text-foreground drop-shadow-sm">
                Creative Precision.
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Montserrat is used for all major headings. Its geometric nature provides a modern,
                high-tech aesthetic that aligns with our AI-driven core.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-1">
            <CardContent className="pt-8 space-y-6">
              <div className="flex justify-between items-center">
                <Label className="uppercase text-[10px] tracking-widest font-black opacity-60">
                  Interface Typeface
                </Label>
                <Badge variant="outline">Geist Sans</Badge>
              </div>
              <p className="text-3xl font-sans font-medium leading-tight">
                Crafted for clarity in every pixel.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Geist Sans is our primary interface font. It excels in small sizes and provides the
                technical clarity needed for complex toolbars and data displays.
              </p>
            </CardContent>
          </Card>
        </div>
      </ComponentSample>

      {/* Live Type Scale */}
      <ComponentSample
        title="Live Type Scale"
        description="Hover any row to reveal the copy button for Tailwind classes."
        code={`<h1 className="text-6xl font-black font-heading tracking-tighter">
  Ultimate Enhancement.
</h1>
<h2 className="text-5xl font-bold font-heading tracking-tight">
  System Performance.
</h2>
<h3 className="text-4xl font-semibold font-heading">
  Core Components
</h3>`}
      >
        <div className="divide-y divide-border/40 border border-border/40 rounded-2xl overflow-hidden w-full">
          {TYPE_SCALE.map(({ tag, label, twClass, fontClass, px, text }) => {
            const allClasses = `${twClass} ${fontClass}`;
            const HeadingTag = tag as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
            return (
              <div
                key={tag}
                className="group flex items-center gap-6 px-6 py-5 bg-background/50 hover:bg-primary/5 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <HeadingTag className={`${twClass} ${fontClass} truncate`}>
                    {text}
                  </HeadingTag>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground font-mono hidden sm:block">
                    {px}
                  </span>
                  <Badge
                    variant="outline"
                    className="font-mono text-[10px] hidden md:flex"
                  >
                    {twClass}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="font-mono text-[10px] hidden lg:flex"
                  >
                    {label}
                  </Badge>
                  <CopyButton value={allClasses} />
                </div>
              </div>
            );
          })}
        </div>
      </ComponentSample>

      {/* Interactive Font Weight Slider */}
      <ComponentSample
        title="Interactive Font Weight Explorer"
        description="Drag the slider to preview any font weight from 100 (Thin) to 900 (Black) applied to both typefaces in real time."
        code={`<p className="font-heading text-5xl" style={{ fontWeight: 700 }}>
  spike.land
</p>
<p className="font-sans text-2xl" style={{ fontWeight: 400 }}>
  Creative collaboration, redefined.
</p>`}
      >
        <FontWeightSlider />
      </ComponentSample>

      {/* Font Weight Showcase */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold font-heading">
          Font Weight Showcase
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Montserrat weights */}
          <ComponentSample
            title="Montserrat (font-heading)"
            description="The heading typeface across all supported weights."
            code={`<span className="font-heading font-bold text-2xl">
  spike.land
</span>`}
          >
            <div className="w-full space-y-1">
              {FONT_WEIGHTS.map(({ label, weight, twClass }) => (
                <div
                  key={weight}
                  className="group flex items-center justify-between py-2 border-b border-border/20 last:border-0"
                >
                  <span
                    className={`font-heading text-2xl text-foreground ${twClass}`}
                    style={{ fontWeight: weight }}
                  >
                    spike.land
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {weight}
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {label}
                    </Badge>
                    <CopyButton value={`font-heading ${twClass}`} />
                  </div>
                </div>
              ))}
            </div>
          </ComponentSample>

          {/* Geist Sans weights */}
          <ComponentSample
            title="Geist Sans (font-sans)"
            description="The interface typeface across all supported weights."
            code={`<span className="font-sans font-medium text-2xl">
  spike.land
</span>`}
          >
            <div className="w-full space-y-1">
              {FONT_WEIGHTS.map(({ label, weight, twClass }) => (
                <div
                  key={weight}
                  className="group flex items-center justify-between py-2 border-b border-border/20 last:border-0"
                >
                  <span
                    className={`font-sans text-2xl text-foreground ${twClass}`}
                    style={{ fontWeight: weight }}
                  >
                    spike.land
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {weight}
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {label}
                    </Badge>
                    <CopyButton value={`font-sans ${twClass}`} />
                  </div>
                </div>
              ))}
            </div>
          </ComponentSample>
        </div>
      </section>

      {/* Type Pairing */}
      <ComponentSample
        title="Type Pairing"
        description="Montserrat headings paired with Geist Sans body text -- shown as blog post previews."
        code={`{/* Hero pairing */}
<h2 className="text-4xl font-black font-heading tracking-tight leading-tight">
  Build Something Extraordinary.
</h2>
<p className="text-base font-sans text-muted-foreground leading-relaxed">
  Body text goes here...
</p>

{/* Article pairing */}
<h3 className="text-2xl font-semibold font-heading leading-snug">
  Article Title
</h3>
<p className="text-sm font-sans text-muted-foreground leading-relaxed">
  Body text goes here...
</p>`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          {/* Hero pairing */}
          <Card className="glass-1">
            <CardContent className="pt-8 space-y-4">
              <Label className="uppercase text-[10px] tracking-widest font-black opacity-40">
                Hero / Landing
              </Label>
              <h2 className="text-4xl font-black font-heading tracking-tight leading-tight">
                Build Something Extraordinary.
              </h2>
              <p className="text-base font-sans text-muted-foreground leading-relaxed">
                {BODY_TEXT}
              </p>
              <div className="flex gap-2 pt-2">
                <Badge variant="outline" className="font-mono text-[10px]">
                  text-4xl font-black font-heading
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Article pairing */}
          <Card className="glass-1">
            <CardContent className="pt-8 space-y-4">
              <Label className="uppercase text-[10px] tracking-widest font-black opacity-40">
                Article / Blog
              </Label>
              <h3 className="text-2xl font-semibold font-heading leading-snug">
                How AI is Changing Creative Workflows
              </h3>
              <p className="text-sm font-sans text-muted-foreground leading-relaxed">
                {BODY_TEXT}
              </p>
              <div className="flex gap-2 pt-2">
                <Badge variant="outline" className="font-mono text-[10px]">
                  text-2xl font-semibold font-heading
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Card pairing */}
          <Card className="glass-1">
            <CardContent className="pt-8 space-y-4">
              <Label className="uppercase text-[10px] tracking-widest font-black opacity-40">
                Card / Component
              </Label>
              <h4 className="text-xl font-bold font-heading">
                Feature Highlight
              </h4>
              <p className="text-sm font-sans text-muted-foreground leading-relaxed">
                Spike.land transforms how teams collaborate on creative projects with precision
                tooling.
              </p>
              <div className="flex gap-2 pt-2">
                <Badge variant="outline" className="font-mono text-[10px]">
                  text-xl font-bold font-heading
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Compact pairing */}
          <Card className="glass-1">
            <CardContent className="pt-8 space-y-4">
              <Label className="uppercase text-[10px] tracking-widest font-black opacity-40">
                Label / Meta
              </Label>
              <h5 className="text-base font-semibold font-heading">
                Release Notes v3.1
              </h5>
              <p className="text-xs font-sans text-muted-foreground leading-relaxed">
                New AI inference endpoints, improved latency for real-time collaboration, and
                updated token pricing.
              </p>
              <div className="flex gap-2 pt-2">
                <Badge variant="outline" className="font-mono text-[10px]">
                  text-base font-semibold font-heading
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </ComponentSample>

      {/* Letter Spacing */}
      <ComponentSample
        title="Letter Spacing"
        description="Tailwind tracking utilities applied to heading text. Copy any class to use in your components."
        code={`<p className="text-2xl font-heading font-bold tracking-tight">
  spike.land platform
</p>
<p className="text-2xl font-heading font-bold tracking-wide">
  spike.land platform
</p>`}
      >
        <div className="divide-y divide-border/40 border border-border/40 rounded-2xl overflow-hidden w-full">
          {LETTER_SPACING.map(({ label, twClass, value }) => (
            <div
              key={twClass}
              className="group flex items-center gap-6 px-6 py-5 bg-background/50 hover:bg-primary/5 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p
                  className={`text-2xl font-heading font-bold ${twClass} truncate`}
                >
                  spike.land platform
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground font-mono hidden sm:block">
                  {value}
                </span>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {twClass}
                </Badge>
                <Badge
                  variant="secondary"
                  className="text-[10px] hidden md:flex"
                >
                  {label}
                </Badge>
                <CopyButton value={twClass} />
              </div>
            </div>
          ))}
        </div>
      </ComponentSample>

      {/* Line Height Comparison */}
      <ComponentSample
        title="Line Height Comparison"
        description="The same paragraph rendered across different leading values."
        code={`<p className="text-sm font-sans leading-relaxed">
  Your paragraph text here...
</p>
<p className="text-sm font-sans leading-tight">
  Tighter line height for compact areas...
</p>`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 w-full">
          {LINE_HEIGHTS.map(({ label, twClass, value }) => (
            <div
              key={twClass}
              className="group relative flex flex-col gap-3 p-5 rounded-2xl border border-border/40 bg-background/50 hover:border-primary/30 hover:bg-primary/5 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  {label}
                </span>
                <CopyButton value={twClass} />
              </div>
              <p
                className={`text-sm font-sans text-muted-foreground ${twClass}`}
              >
                {BODY_TEXT}
              </p>
              <div className="mt-auto pt-3 flex gap-2">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {twClass}
                </Badge>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {value}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </ComponentSample>

      {/* Semantic Colors */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold font-heading">Semantic Hierarchy</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <ComponentSample
            title="Content Colors"
            description="Using opacity and hues to denote importance."
            code={`<p className="text-foreground font-bold">Primary Foreground</p>
<p className="text-muted-foreground">Secondary Foreground (Muted)</p>
<p className="text-primary font-mono">Accent / Actionable Class</p>`}
          >
            <div className="space-y-4 w-full">
              <div className="group flex items-center justify-between">
                <p className="text-xl font-bold">Primary Foreground</p>
                <CopyButton value="text-foreground font-bold" />
              </div>
              <div className="group flex items-center justify-between">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Secondary Foreground (Muted)
                </p>
                <CopyButton value="text-muted-foreground" />
              </div>
              <div className="group flex items-center justify-between">
                <p className="text-sm font-mono text-primary">
                  Accent / Actionable Class
                </p>
                <CopyButton value="text-primary font-mono" />
              </div>
            </div>
          </ComponentSample>

          <ComponentSample
            title="State Colors"
            description="WCAG AA compliant semantic messaging."
            code={`<p className="text-success font-semibold">System ready.</p>
<p className="text-warning font-semibold">Token balance low.</p>
<p className="text-destructive font-semibold">Critical failure.</p>`}
          >
            <div className="space-y-2 w-full">
              <div className="group flex items-center justify-between">
                <p className="text-success font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success inline-block" />
                  System ready for deployment.
                </p>
                <CopyButton value="text-success font-semibold" />
              </div>
              <div className="group flex items-center justify-between">
                <p className="text-warning font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-warning inline-block" />
                  Token balance low.
                </p>
                <CopyButton value="text-warning font-semibold" />
              </div>
              <div className="group flex items-center justify-between">
                <p className="text-destructive font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-destructive inline-block" />
                  Critical engine failure.
                </p>
                <CopyButton value="text-destructive font-semibold" />
              </div>
            </div>
          </ComponentSample>
        </div>
      </section>

      <CodePreview
        title="Typography Quick Reference"
        tabs={[
          {
            label: "Headings",
            code: `{/* Montserrat heading scale */}
<h1 className="text-6xl font-black font-heading tracking-tighter">
  Display Heading
</h1>
<h2 className="text-5xl font-bold font-heading tracking-tight">
  Page Title
</h2>
<h3 className="text-4xl font-semibold font-heading">
  Section Title
</h3>
<h4 className="text-2xl font-semibold font-heading">
  Subsection
</h4>
<h5 className="text-xl font-medium font-heading">
  Group Label
</h5>
<h6 className="text-base font-medium font-heading">
  Inline Label
</h6>`,
          },
          {
            label: "Body Text",
            code: `{/* Geist Sans body text */}
<p className="text-base font-sans text-foreground leading-relaxed">
  Primary body text for articles and descriptions.
</p>
<p className="text-sm font-sans text-muted-foreground leading-relaxed">
  Secondary text for captions, metadata, and helpers.
</p>
<p className="text-xs font-sans text-muted-foreground">
  Fine print, timestamps, and tertiary information.
</p>`,
          },
          {
            label: "Utilities",
            code: `{/* Font weights */}
<span className="font-normal">400 - Regular</span>
<span className="font-medium">500 - Medium</span>
<span className="font-semibold">600 - Semibold</span>
<span className="font-bold">700 - Bold</span>
<span className="font-black">900 - Black</span>

{/* Letter spacing */}
<span className="tracking-tight">Tight (-0.025em)</span>
<span className="tracking-normal">Normal (0em)</span>
<span className="tracking-wide">Wide (0.025em)</span>

{/* Line height */}
<p className="leading-tight">Tight (1.25)</p>
<p className="leading-normal">Normal (1.5)</p>
<p className="leading-relaxed">Relaxed (1.625)</p>`,
          },
        ]}
        code=""
      />

      <AccessibilityPanel
        notes={[
          "All headings strictly follow a descending scale (h1 -> h6).",
          "Line heights (leading) are optimized for each font size for readability.",
          "Foreground and Primary text colors pass 4.5:1 contrast ratio against the background.",
          "Destructive text colors pass 4.5:1 contrast against both light and dark backgrounds.",
          "Letter spacing (tracking) adjusted for better legibility at different weights.",
          "CopyButton interactions include aria-label attributes for screen reader support.",
          "Type pairings are structured with semantic heading tags matching visual hierarchy.",
          "All font weights meet WCAG SC 1.4.3 minimum contrast thresholds.",
        ]}
      />

      <RelatedComponents currentId="typography" />
    </div>
  );
}
