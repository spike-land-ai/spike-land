"use client";

import {
  AccessibilityPanel,
  Breadcrumbs,
  CodePreview,
  ComponentSample,
  PageHeader,
  RelatedComponents,
  Section,
  UsageGuide,
} from "@/components/storybook";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

function IndeterminateProgress() {
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="absolute h-full w-1/3 rounded-full bg-primary"
        style={{
          animation: "indeterminate 1.5s ease-in-out infinite",
        }}
      />
      <style>
        {`
        @keyframes indeterminate {
          0% { left: -33%; }
          100% { left: 100%; }
        }
      `}
      </style>
    </div>
  );
}

function ContentTransitionDemo() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="w-full max-w-sm space-y-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setLoaded(prev => !prev)}
        className="w-full"
      >
        {loaded ? "Reset to Skeleton" : "Simulate Load"}
      </Button>

      <Card className="overflow-hidden">
        <CardContent className="pt-4 space-y-3">
          {loaded
            ? (
              <div className="space-y-3 transition-all duration-500">
                <div className="h-32 w-full rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">IMG</span>
                </div>
                <p className="font-semibold text-sm">Loaded Card Title</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This is the real content that appears after loading is complete.
                </p>
              </div>
            )
            : (
              <div className="space-y-3">
                <Skeleton
                  variant="shimmer"
                  className="h-32 w-full rounded-lg"
                />
                <Skeleton variant="shimmer" className="h-4 w-3/4" />
                <Skeleton variant="shimmer" className="h-4 w-1/2" />
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingOverlayDemo() {
  const [overlayVisible, setOverlayVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setOverlayVisible(v => !v), 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full max-w-xs rounded-xl overflow-hidden border border-border/50">
      <div className="p-6 space-y-2 bg-background/80">
        <p className="font-semibold">Dashboard Overview</p>
        <p className="text-sm text-muted-foreground">Revenue: $12,400</p>
        <p className="text-sm text-muted-foreground">Users: 3,280</p>
        <p className="text-sm text-muted-foreground">Conversion: 4.2%</p>
      </div>
      {overlayVisible && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] flex items-center justify-center rounded-xl">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-xs text-muted-foreground">Refreshing...</span>
          </div>
        </div>
      )}
    </div>
  );
}

const codeSnippets = {
  skeleton: `import { Skeleton } from "@/components/ui/skeleton";

{/* Default (animate-pulse) */}
<div className="flex items-center space-x-4">
  <Skeleton className="h-12 w-12 rounded-full" />
  <div className="space-y-2">
    <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
  </div>
</div>

{/* Shimmer variant */}
<Skeleton variant="shimmer" className="h-12 w-12 rounded-full" />`,
  transition: `const [loaded, setLoaded] = useState(false);

{loaded ? (
  <div>{/* real content */}</div>
) : (
  <div className="space-y-3">
    <Skeleton variant="shimmer" className="h-32 w-full rounded-lg" />
    <Skeleton variant="shimmer" className="h-4 w-3/4" />
    <Skeleton variant="shimmer" className="h-4 w-1/2" />
  </div>
)}`,
  spinners: `{/* Ring Spinner */}
<div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />

{/* Lucide Loader2 */}
<Loader2 className="h-8 w-8 animate-spin text-primary" />

{/* Pulsing Dots (staggered) */}
{[0, 150, 300].map((delay) => (
  <div
    key={delay}
    className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse"
    style={{ animationDelay: \`\${delay}ms\` }}
  />
))}

{/* Bouncing Bars (staggered) */}
{[0, 100, 200].map((delay) => (
  <div
    key={delay}
    className="w-2 h-6 rounded-sm bg-primary animate-bounce"
    style={{ animationDelay: \`\${delay}ms\` }}
  />
))}`,
  progress: `import { Progress } from "@/components/ui/progress";

{/* Determinate */}
<Progress value={66} />
<Progress value={66} glow />
<Progress value={100} variant="success" glow />
<Progress value={45} variant="warning" />

{/* Indeterminate (CSS keyframes) */}
<div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
  <div
    className="absolute h-full w-1/3 rounded-full bg-primary"
    style={{ animation: "indeterminate 1.5s ease-in-out infinite" }}
  />
</div>`,
  overlay: `{/* Wrap target content in a relative container */}
<div className="relative">
  <div>{/* your content here */}</div>

  {isLoading && (
    <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] flex items-center justify-center rounded-xl">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-xs text-muted-foreground">Loading...</span>
      </div>
    </div>
  )}
</div>`,
};

export default function LoadingPage() {
  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="Loading States"
        description="Skeleton loaders, spinners, progress bars, and animated placeholders for communicating async activity to users."
        usage="Use skeleton loaders to match the shape of incoming content. Reserve spinners for short, indeterminate waits. Always pair loading states with ARIA attributes for screen reader support."
      />

      <UsageGuide
        dos={[
          "Match skeleton shape to the content it represents",
          "Use shimmer variant for prominent loading areas",
          "Add aria-busy and aria-label to loading containers",
          "Show skeletons immediately on data fetch initiation",
          "Use indeterminate progress for unknown-duration operations",
          "Provide text alongside spinners for context (e.g. 'Uploading...')",
        ]}
        donts={[
          "Don't use generic spinners when skeleton loaders better fit the layout",
          "Don't animate more than 3-4 skeleton elements simultaneously",
          "Don't leave loading states visible indefinitely -- add timeouts",
          "Don't use overlays for non-blocking background operations",
          "Don't omit accessible labels on loading indicators",
        ]}
      />

      {/* Skeleton Variants */}
      <Section
        title="Skeleton Loaders"
        description="Placeholder shapes that mimic the layout of incoming content"
      >
        <ComponentSample
          title="Default & Shimmer Variants"
          description="Two skeleton animation styles: the default pulse and the shimmer sweep."
        >
          <div className="w-full space-y-8">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Default (animate-pulse)
              </Label>
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Shimmer Sweep
              </Label>
              <div className="flex items-center space-x-4">
                <Skeleton
                  variant="shimmer"
                  className="h-12 w-12 rounded-full"
                />
                <div className="space-y-2">
                  <Skeleton variant="shimmer" className="h-4 w-[250px]" />
                  <Skeleton variant="shimmer" className="h-4 w-[200px]" />
                </div>
              </div>
            </div>
          </div>
        </ComponentSample>

        {/* Skeleton Variations */}
        <ComponentSample
          title="Card Skeleton"
          description="Image placeholder + title + description lines, repeated in a grid"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="pt-6 space-y-3">
                  <Skeleton
                    variant="shimmer"
                    className="h-32 w-full rounded-lg"
                  />
                  <Skeleton variant="shimmer" className="h-4 w-3/4" />
                  <Skeleton variant="shimmer" className="h-3 w-full" />
                  <Skeleton variant="shimmer" className="h-3 w-5/6" />
                </CardContent>
              </Card>
            ))}
          </div>
        </ComponentSample>

        <ComponentSample
          title="List Skeleton"
          description="Avatar circle + two text lines, repeated 3x"
        >
          <div className="w-full max-w-md space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton
                  variant="shimmer"
                  className="h-10 w-10 rounded-full shrink-0"
                />
                <div className="space-y-2 flex-1">
                  <Skeleton variant="shimmer" className="h-4 w-3/4" />
                  <Skeleton variant="shimmer" className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </ComponentSample>

        <ComponentSample
          title="Table Skeleton"
          description="Header row + 3 body rows mimicking a data table"
        >
          <div className="w-full max-w-lg space-y-2">
            {/* Header */}
            <div className="flex gap-4 pb-2 border-b border-border/40">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            {/* Rows */}
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4 py-2">
                <Skeleton variant="shimmer" className="h-4 w-1/4" />
                <Skeleton variant="shimmer" className="h-4 w-1/4" />
                <Skeleton variant="shimmer" className="h-4 w-1/4" />
                <Skeleton variant="shimmer" className="h-4 w-1/4" />
              </div>
            ))}
          </div>
        </ComponentSample>

        <ComponentSample
          title="Profile Skeleton"
          description="A profile header skeleton with cover image, avatar, name, and bio lines"
        >
          <div className="w-full max-w-sm space-y-4">
            <Skeleton variant="shimmer" className="h-28 w-full rounded-xl" />
            <div className="flex items-center gap-4 -mt-8 px-4">
              <Skeleton
                variant="shimmer"
                className="h-16 w-16 rounded-full border-4 border-background shrink-0"
              />
              <div className="space-y-2 flex-1 pt-6">
                <Skeleton variant="shimmer" className="h-5 w-1/2" />
                <Skeleton variant="shimmer" className="h-3 w-1/3" />
              </div>
            </div>
            <div className="px-4 space-y-2">
              <Skeleton variant="shimmer" className="h-3 w-full" />
              <Skeleton variant="shimmer" className="h-3 w-4/5" />
            </div>
          </div>
        </ComponentSample>

        <ComponentSample
          title="Dashboard Stats Skeleton"
          description="A row of stat cards with icon placeholder, number, and label"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton
                      variant="shimmer"
                      className="h-8 w-8 rounded-md"
                    />
                    <Skeleton variant="shimmer" className="h-3 w-12" />
                  </div>
                  <Skeleton variant="shimmer" className="h-7 w-20" />
                  <Skeleton variant="shimmer" className="h-3 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </ComponentSample>

        <CodePreview
          code={codeSnippets.skeleton}
          title="Skeleton Usage"
        />
      </Section>

      {/* Content Loading Transition */}
      <Section
        title="Content Transition"
        description="Toggle between skeleton and real content with a smooth state transition"
      >
        <ComponentSample
          title="Skeleton to Content"
          description="Click the button to simulate data arriving and see the skeleton replaced by real content"
        >
          <ContentTransitionDemo />
        </ComponentSample>

        <CodePreview
          code={codeSnippets.transition}
          title="Content Transition"
        />
      </Section>

      {/* Spinner Variants */}
      <Section
        title="Spinners"
        description="Custom spinner variants built with Tailwind CSS animations"
      >
        <ComponentSample
          title="Spinner Variants"
          description="Spinning circle, pulsing dots, bouncing bars, and ring spinner"
        >
          <div className="flex flex-wrap gap-12 items-end justify-center">
            {/* Spinning circle (Loader2) */}
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">
                Spinning Circle
              </span>
            </div>

            {/* Ring spinner */}
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-xs text-muted-foreground">
                Ring Spinner
              </span>
            </div>

            {/* Pulsing dots */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-1.5 items-center h-8">
                {[0, 150, 300].map(delay => (
                  <div
                    key={delay}
                    className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                Pulsing Dots
              </span>
            </div>

            {/* Bouncing bars */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-1 items-end h-8">
                {[0, 100, 200].map(delay => (
                  <div
                    key={delay}
                    className="w-2 h-6 rounded-sm bg-primary animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                Bouncing Bars
              </span>
            </div>

            {/* Pulse Cyan */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full animate-pulse-cyan" />
              <span className="text-xs text-muted-foreground">Pulse Cyan</span>
            </div>

            {/* Pulse Aura */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full animate-pulse-aura" />
              <span className="text-xs text-muted-foreground">Pulse Aura</span>
            </div>
          </div>
        </ComponentSample>

        <CodePreview
          code={codeSnippets.spinners}
          title="Spinner Variants"
        />
      </Section>

      {/* Progress Bars */}
      <Section
        title="Progress Indicators"
        description="Determinate and indeterminate progress bars"
      >
        <ComponentSample
          title="Determinate Progress"
          description="Progress bars with known completion percentage. Supports default, success, and warning variants with optional glow."
        >
          <div className="w-full max-w-lg space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>Default (33%)</Label>
                <span className="text-muted-foreground">33%</span>
              </div>
              <Progress value={33} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>With Glow (66%)</Label>
                <span className="text-muted-foreground">66%</span>
              </div>
              <Progress value={66} glow />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>Success (100%)</Label>
                <span className="text-muted-foreground">100%</span>
              </div>
              <Progress value={100} variant="success" glow />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>Warning (45%)</Label>
                <span className="text-muted-foreground">45%</span>
              </div>
              <Progress value={45} variant="warning" />
            </div>
          </div>
        </ComponentSample>

        <ComponentSample
          title="Indeterminate Progress"
          description="Continuous left-to-right animation for unknown duration operations"
        >
          <div className="w-full max-w-md space-y-4">
            <p className="text-xs text-muted-foreground text-center">
              Uploading file...
            </p>
            <IndeterminateProgress />
          </div>
        </ComponentSample>

        <CodePreview
          code={codeSnippets.progress}
          title="Progress Indicators"
        />
      </Section>

      {/* Loading Overlay */}
      <Section
        title="Loading Overlay"
        description="Semi-transparent overlay with centered spinner for blocking operations"
      >
        <ComponentSample
          title="Overlay Demo"
          description="Card with auto-toggling overlay simulating a data refresh cycle"
        >
          <LoadingOverlayDemo />
        </ComponentSample>

        <CodePreview
          code={codeSnippets.overlay}
          title="Loading Overlay"
        />
      </Section>

      <AccessibilityPanel
        notes={[
          "Add role=\"status\" and aria-live=\"polite\" to loading regions",
          "Use aria-busy=\"true\" on the container while loading",
          "Provide aria-label=\"Loading...\" on spinner elements that have no text",
          "Ensure skeletons are hidden from screen readers with aria-hidden=\"true\"",
          "Announce completion with aria-live=\"assertive\" for critical loads",
          "Respect prefers-reduced-motion -- disable or reduce animations",
          "Do not rely on color alone to convey loading state",
        ]}
      />

      <RelatedComponents currentId="loading" />
    </div>
  );
}
