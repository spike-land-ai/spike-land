"use client";

import {
  AccessibilityPanel,
  Breadcrumbs,
  CodePreview,
  ComponentSample,
  PageHeader,
  PropsTable,
  RelatedComponents,
  UsageGuide,
} from "@/components/storybook";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowRight, Download, Heart, Plus, Search } from "lucide-react";
import { useState } from "react";

const codeSnippets = {
  basic: `<Button>Primary Action</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>`,
  sizes: `<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">
  <Plus className="h-4 w-4" />
</Button>`,
  icons: `// Left icon
<Button>
  <Download className="h-4 w-4" />
  Download
</Button>

// Right icon
<Button>
  Continue
  <ArrowRight className="h-4 w-4" />
</Button>

// Icon only
<Button size="icon" aria-label="Add item">
  <Plus className="h-4 w-4" />
</Button>

// Icon with badge
<Button variant="outline" className="relative">
  <Heart className="h-4 w-4" />
  Favourites
  <Badge className="ml-1 h-5 px-1.5 text-[10px]">3</Badge>
</Button>`,
  group: `<div className="flex">
  <Button className="rounded-r-none">Previous</Button>
  <Button className="rounded-none border-x-0" variant="outline">
    Page 1
  </Button>
  <Button className="rounded-l-none">Next</Button>
</div>`,
  asChild: `import Link from "next/link";
import { Button } from "@/components/ui/button";

<Button asChild>
  <Link href="/dashboard">Go to Dashboard</Link>
</Button>`,
  loading: `<Button loading>Saving...</Button>

// The loading prop:
// - Replaces children with a spinner
// - Sets aria-busy="true"
// - Disables the button`,
  builder: `// Customize your button
<Button
  variant="default"
  size="default"
  loading={false}
  disabled={false}
>
  Click Me
</Button>`,
};

type ButtonVariant =
  | "default"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "success"
  | "warning"
  | "link"
  | "gradient"
  | "aurora";

type ButtonSize = "sm" | "default" | "lg" | "icon";

function ButtonBuilder() {
  const [variant, setVariant] = useState<ButtonVariant>("default");
  const [size, setSize] = useState<ButtonSize>("default");
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [label, setLabel] = useState("Click Me");
  const [withIcon, setWithIcon] = useState(false);

  const generatedCode = `<Button${variant !== "default" ? ` variant="${variant}"` : ""}${
    size !== "default" ? ` size="${size}"` : ""
  }${loading ? " loading" : ""}${disabled ? " disabled" : ""}>
${withIcon ? `  <Download className="h-4 w-4" />\n  ` : "  "}${
    size === "icon" ? "<Plus className=\"h-4 w-4\" />" : label
  }
</Button>`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Variant
          </Label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                "default",
                "secondary",
                "outline",
                "ghost",
                "destructive",
                "success",
                "warning",
                "link",
                "gradient",
                "aurora",
              ] as const
            ).map(v => (
              <button
                key={v}
                onClick={() => setVariant(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 border ${
                  variant === v
                    ? "bg-primary/20 border-primary/40 text-primary"
                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Size
          </Label>
          <div className="flex flex-wrap gap-2">
            {(["sm", "default", "lg", "icon"] as const).map(s => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 border ${
                  size === s
                    ? "bg-primary/20 border-primary/40 text-primary"
                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={loading}
              onChange={e => setLoading(e.target.checked)}
              className="rounded border-white/20"
            />
            Loading
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={disabled}
              onChange={e => setDisabled(e.target.checked)}
              className="rounded border-white/20"
            />
            Disabled
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={withIcon}
              onChange={e => setWithIcon(e.target.checked)}
              className="rounded border-white/20"
            />
            With Icon
          </label>
        </div>

        {size !== "icon" && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Label
            </Label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="p-12 rounded-2xl border border-white/10 bg-background/50 backdrop-blur-sm flex items-center justify-center min-h-[160px]">
          <Button
            variant={variant}
            size={size}
            loading={loading}
            disabled={disabled}
          >
            {withIcon && size !== "icon" && <Download className="h-4 w-4" />}
            {size === "icon" ? <Plus className="h-4 w-4" /> : label}
          </Button>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0a0a1a] overflow-hidden">
          <div className="px-4 py-2 border-b border-white/10">
            <span className="font-mono text-xs text-white/40">
              Generated Code
            </span>
          </div>
          <pre className="p-4 overflow-x-auto">
            <code className="font-mono text-sm text-[#e2e8f0]">{generatedCode}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

export default function ButtonsPage() {
  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="Buttons"
        description="Buttons allow users to take actions, and make choices, with a single tap. They are one of the most used components in the spike.land design system."
        usage="Use buttons for primary actions like submitting forms, navigating between key areas, or triggering major functions."
      />

      <UsageGuide
        dos={[
          "Use the Primary variant for the most important action on a page.",
          "Keep labels short and action-oriented (e.g., 'Save', 'Enhance').",
          "Include icons only when they add clear functional value.",
          "Use Ghost buttons for secondary or tertiary low-priority actions.",
        ]}
        donts={[
          "Don't use more than one Primary button per view.",
          "Avoid using buttons for navigation items that look like text links.",
          "Don't change the border radius; buttons use a consistent rounding from the design system.",
          "Avoid placing Destructive buttons in positions where they can be clicked accidentally.",
        ]}
      />

      {/* Interactive ButtonBuilder Playground */}
      <ComponentSample
        title="Button Builder"
        description="Experiment with different button configurations in real time. Adjust variant, size, states, and label to preview the result and get the code."
        code={codeSnippets.builder}
      >
        <div className="w-full">
          <ButtonBuilder />
        </div>
      </ComponentSample>

      {/* Primary Button */}
      <ComponentSample
        title="Primary Button"
        description="The workhorse of our interface. Uses a vibrant gradient and a subtle glow."
        code={`<Button variant="default">Primary Action</Button>
<Button variant="default" size="lg">Large Action</Button>
<Button variant="default" className="shadow-glow-cyan">
  With Enhanced Glow
</Button>`}
      >
        <div className="flex flex-wrap gap-6 items-center">
          <Button variant="default">Primary Action</Button>
          <Button variant="default" size="lg">Large Action</Button>
          <Button variant="default" className="shadow-glow-cyan">
            With Enhanced Glow
          </Button>
        </div>
      </ComponentSample>

      {/* Size Comparison */}
      <ComponentSample
        title="Sizes"
        description="All four sizes side by side. Use sm for compact UIs, lg for prominent CTAs, and icon for toolbar actions."
        code={codeSnippets.sizes}
      >
        <div className="flex flex-wrap gap-8 items-end justify-center">
          <div className="flex flex-col items-center gap-3">
            <Button size="sm">Small</Button>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              sm
            </span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Button size="default">Default</Button>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              default
            </span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Button size="lg">Large</Button>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              lg
            </span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Button size="icon" aria-label="Add item">
              <Plus className="h-4 w-4" />
            </Button>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              icon
            </span>
          </div>
        </div>
      </ComponentSample>

      {/* Icon Button Patterns */}
      <ComponentSample
        title="Icon Patterns"
        description="Combine icons with labels for clarity, or use icon-only buttons with aria-label for toolbar actions."
        code={codeSnippets.icons}
      >
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Button>
              <Download className="h-4 w-4" />
              Download
            </Button>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              Left icon
            </span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Button>
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              Right icon
            </span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Button size="icon" aria-label="Add item">
              <Plus className="h-4 w-4" />
            </Button>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              Icon only
            </span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Button variant="outline" className="relative gap-2">
              <Heart className="h-4 w-4" />
              Favourites
              <Badge className="h-5 px-1.5 text-[10px] leading-none">3</Badge>
            </Button>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              With badge
            </span>
          </div>
        </div>
      </ComponentSample>

      {/* Button Group */}
      <ComponentSample
        title="Button Group"
        description="Buttons can be grouped in a flex row with adjusted border radii to form a cohesive unit."
        code={codeSnippets.group}
      >
        <div className="flex flex-col gap-6 items-center">
          <div className="flex">
            <Button className="rounded-r-none">Previous</Button>
            <Button
              className="rounded-none border-x-0"
              variant="outline"
            >
              Page 1
            </Button>
            <Button className="rounded-l-none">Next</Button>
          </div>
          <div className="flex">
            <Button variant="outline" className="rounded-r-none gap-1.5">
              <Search className="h-4 w-4" />
              Search
            </Button>
            <Button variant="outline" className="rounded-none border-x-0">
              Filter
            </Button>
            <Button variant="outline" className="rounded-l-none">
              Sort
            </Button>
          </div>
        </div>
      </ComponentSample>

      {/* Style Variants Grid */}
      <ComponentSample
        title="Style Variants"
        description="Each variant communicates a different level of emphasis or intent."
        code={codeSnippets.basic}
      >
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="glass-1">
            <CardContent className="pt-6 space-y-4">
              <Badge variant="outline">Default / Primary</Badge>
              <p className="text-sm text-muted-foreground">
                High emphasis, usually used once per screen.
              </p>
              <Button className="w-full">Get Started</Button>
            </CardContent>
          </Card>

          <Card className="glass-1">
            <CardContent className="pt-6 space-y-4">
              <Badge variant="outline">Secondary</Badge>
              <p className="text-sm text-muted-foreground">
                Medium emphasis for less critical actions.
              </p>
              <Button variant="secondary" className="w-full">Learn More</Button>
            </CardContent>
          </Card>

          <Card className="glass-1">
            <CardContent className="pt-6 space-y-4">
              <Badge variant="outline">Outline</Badge>
              <p className="text-sm text-muted-foreground">
                Low emphasis, subtle and clear.
              </p>
              <Button variant="outline" className="w-full">Settings</Button>
            </CardContent>
          </Card>

          <Card className="glass-1 border-destructive/20 bg-destructive/5">
            <CardContent className="pt-6 space-y-4">
              <Badge variant="destructive">Destructive</Badge>
              <p className="text-sm text-muted-foreground">
                Used for irreversible actions like deletion.
              </p>
              <Button variant="destructive" className="w-full">
                Delete Project
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-1 border-success/20 bg-success/5">
            <CardContent className="pt-6 space-y-4">
              <Badge variant="success">Success</Badge>
              <p className="text-sm text-muted-foreground">
                Used for positive confirmation or saving.
              </p>
              <Button variant="success" className="w-full">
                Publish Changes
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-1 border-warning/20 bg-warning/5">
            <CardContent className="pt-6 space-y-4">
              <Badge variant="warning">Warning</Badge>
              <p className="text-sm text-muted-foreground">
                Used for cautionary actions or low balance.
              </p>
              <Button variant="warning" className="w-full">
                Top Up Tokens
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-1 border-white/5 bg-white/2">
            <CardContent className="pt-6 space-y-4">
              <Badge variant="outline">Ghost &amp; Icon</Badge>
              <p className="text-sm text-muted-foreground">
                Toolbar or utility actions without visual clutter.
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="ghost">Cancel</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-1 border-primary/20 bg-primary/5">
            <CardContent className="pt-6 space-y-4">
              <Badge variant="outline">Link</Badge>
              <p className="text-sm text-muted-foreground">
                Appears as an underlined text link. Use for inline navigation.
              </p>
              <Button variant="link" className="w-full">
                View Documentation
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-1 border-primary/20 bg-primary/5">
            <CardContent className="pt-6 space-y-4">
              <Badge variant="outline">Gradient &amp; Aurora</Badge>
              <p className="text-sm text-muted-foreground">
                Premium variants with animated gradients and glow effects.
              </p>
              <div className="flex gap-2">
                <Button variant="gradient" className="flex-1">Gradient</Button>
                <Button variant="aurora" className="flex-1">Aurora</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ComponentSample>

      {/* Interaction States */}
      <ComponentSample
        title="Interaction States"
        description="Buttons respond to user input with scale and color shifts. (Hover simulated for showcase)"
        code={`<Button>Default</Button>
<Button className="scale-[1.02] ring-2 ring-primary ring-offset-2 ring-offset-background">Hover</Button>
<Button className="scale-[0.96]">Pressed</Button>
<Button loading>Loading</Button>`}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-3">
            <Button>Default</Button>
            <span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              Normal
            </span>
          </div>
          <div className="space-y-3">
            <Button className="scale-[1.02] ring-2 ring-primary ring-offset-2 ring-offset-background">
              Hover
            </Button>
            <span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              Hovered
            </span>
          </div>
          <div className="space-y-3">
            <Button className="scale-[0.96]">Pressed</Button>
            <span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              Active
            </span>
          </div>
          <div className="space-y-3">
            <Button loading>Loading</Button>
            <span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              Busy
            </span>
          </div>
        </div>
      </ComponentSample>

      {/* Disabled State */}
      <ComponentSample
        title="Disabled State"
        description="When a button is disabled, we remove color and apply a grayscale filter to indicate inactivity without hiding the element."
        code={`<Button disabled>Primary Disabled</Button>
<Button variant="secondary" disabled>Secondary Disabled</Button>
<Button variant="outline" disabled>Outline Disabled</Button>
<Button variant="ghost" disabled size="icon">
  <Plus className="h-4 w-4" />
</Button>`}
      >
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <Button disabled>Primary Disabled</Button>
          <Button variant="secondary" disabled>Secondary Disabled</Button>
          <Button variant="outline" disabled>Outline Disabled</Button>
          <Button variant="ghost" disabled size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </ComponentSample>

      {/* Code Snippets */}
      <CodePreview
        code={codeSnippets.basic}
        title="Usage Examples"
        tabs={[
          { label: "Basic", code: codeSnippets.basic },
          { label: "Sizes", code: codeSnippets.sizes },
          { label: "Icons", code: codeSnippets.icons },
          { label: "Group", code: codeSnippets.group },
          { label: "Loading", code: codeSnippets.loading },
          { label: "asChild", code: codeSnippets.asChild },
        ]}
      />

      {/* Props Table */}
      <PropsTable
        componentName="Button"
        importPath='import { Button } from "@/components/ui/button"'
        props={[
          {
            name: "variant",
            type:
              "\"default\" | \"secondary\" | \"outline\" | \"ghost\" | \"destructive\" | \"success\" | \"warning\" | \"link\" | \"gradient\" | \"aurora\"",
            default: "\"default\"",
            description: "Controls the visual style of the button.",
          },
          {
            name: "size",
            type: "\"sm\" | \"default\" | \"lg\" | \"icon\"",
            default: "\"default\"",
            description: "Controls the size and padding of the button.",
          },
          {
            name: "loading",
            type: "boolean",
            default: "false",
            description: "Shows a spinner and sets aria-busy. Disables interaction.",
          },
          {
            name: "disabled",
            type: "boolean",
            default: "false",
            description: "Prevents interaction and applies grayscale styling.",
          },
          {
            name: "asChild",
            type: "boolean",
            default: "false",
            description: "Renders as its child element via Radix Slot (e.g., Link).",
          },
          {
            name: "className",
            type: "string",
            description:
              "Additional CSS classes merged via cn(). Useful for custom glow effects or border-radius overrides.",
          },
          {
            name: "children",
            type: "React.ReactNode",
            required: true,
            description: "Button content. Replaced by a spinner when loading is true.",
          },
        ]}
      />

      <AccessibilityPanel
        notes={[
          "All buttons follow the 44px minimum touch target guideline.",
          "Visual focus ring is always visible when navigating via keyboard (primary cyan).",
          "Buttons include aria-busy when in loading state to alert screen readers.",
          "Contrast ratio for primary button text exceeds WCAG AA standards.",
          "Icons are decorative and hidden from screen readers unless label is empty.",
          "Focus management is handled automatically via Radix UI primitives.",
          "Icon-only buttons require an aria-label for screen reader accessibility.",
          "Disabled buttons retain DOM presence for assistive technology discovery.",
        ]}
      />

      <RelatedComponents currentId="buttons" />
    </div>
  );
}
