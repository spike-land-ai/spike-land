"use client";

import { ComparisonViewToggle } from "@/components/enhance/ComparisonViewToggle";
import { ImageComparisonSlider } from "@/components/enhance/ImageComparisonSlider";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCallback, useRef, useState } from "react";

// --- Keyboard-Accessible Slider Wrapper ---

function KeyboardAccessibleSlider() {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2;
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowDown":
        e.preventDefault();
        setPosition(prev => Math.max(0, prev - step));
        break;
      case "ArrowRight":
      case "ArrowUp":
        e.preventDefault();
        setPosition(prev => Math.min(100, prev + step));
        break;
      case "Home":
        e.preventDefault();
        setPosition(0);
        break;
      case "End":
        e.preventDefault();
        setPosition(100);
        break;
    }
  }, []);

  return (
    <div className="space-y-3 w-full">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">
          Position:{" "}
          <span className="font-semibold text-foreground">
            {Math.round(position)}%
          </span>
        </Label>
        <span className="text-[10px] text-muted-foreground">
          Arrow keys to move, Shift+Arrow for large steps, Home/End for extremes
        </span>
      </div>
      <div
        ref={containerRef}
        className="relative bg-muted rounded-lg overflow-hidden w-full select-none cursor-ew-resize focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none"
        style={{ aspectRatio: "16 / 9" }}
        tabIndex={0}
        role="slider"
        aria-label="Keyboard-accessible image comparison slider"
        aria-valuenow={Math.round(position)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`Showing ${Math.round(position)}% original, ${
          Math.round(100 - position)
        }% enhanced`}
        onKeyDown={handleKeyDown}
        onMouseDown={e => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          setPosition(Math.max(0, Math.min(100, (x / rect.width) * 100)));
        }}
      >
        {/* Enhanced side (full background) */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
          <span className="text-sm font-semibold text-foreground/60">
            Enhanced
          </span>
        </div>

        {/* Original side (clipped overlay) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
            <span className="text-sm font-semibold text-foreground/60">
              Original
            </span>
          </div>
        </div>

        {/* Divider line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-[0_0_8px_rgba(0,229,255,0.5)] pointer-events-none"
          style={{ left: `${position}%`, transform: "translateX(-50%)" }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-glow-cyan-sm">
            <span className="text-primary-foreground text-xs font-bold">
              ||
            </span>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm text-foreground text-xs font-medium px-2.5 py-1 rounded-full border border-border/50">
          Original
        </div>
        <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm text-foreground text-xs font-medium px-2.5 py-1 rounded-full border border-border/50">
          Enhanced
        </div>
      </div>
    </div>
  );
}

// --- Code Snippets ---

const codeSnippets = {
  slider: `import { ImageComparisonSlider } from "@/components/enhance/ImageComparisonSlider";

<ImageComparisonSlider
  originalUrl="/images/original.jpg"
  enhancedUrl="/images/enhanced.jpg"
  originalLabel="Original"
  enhancedLabel="Enhanced"
  width={16}
  height={9}
/>`,
  viewToggle: `import { ComparisonViewToggle } from "@/components/enhance/ComparisonViewToggle";

<ComparisonViewToggle
  originalUrl="/images/original.jpg"
  enhancedUrl="/images/enhanced.jpg"
  width={16}
  height={9}
  defaultMode="slider"
  onModeChange={(mode) => console.log(mode)}
/>`,
  keyboard: `// The slider supports keyboard navigation:
// - ArrowLeft / ArrowDown: move divider left
// - ArrowRight / ArrowUp: move divider right
// - Shift + Arrow: move in larger increments (10%)
// - Home: jump to 0% (full enhanced)
// - End: jump to 100% (full original)

// The component uses role="slider" with proper ARIA attributes:
<div
  role="slider"
  tabIndex={0}
  aria-label="Image comparison slider"
  aria-valuenow={position}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuetext={\`Showing \${position}% original\`}
  onKeyDown={handleKeyDown}
/>`,
};

// --- Page ---

export default function ComparisonPage() {
  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="Image Comparison"
        description="Before/after comparison components for showcasing image enhancements. Includes a draggable slider, side-by-side view, and split preview modes."
        usage="Use comparison components to let users evaluate enhancement results. The slider is ideal for fine detail inspection, while side-by-side works well for overall impression comparisons."
      />

      <UsageGuide
        dos={[
          "Provide both mouse/touch drag and keyboard controls for the comparison slider.",
          "Label both sides clearly (Original / Enhanced) so users know which is which.",
          "Use the same aspect ratio for both images to prevent misalignment.",
          "Offer multiple comparison modes (slider, side-by-side, split) so users can choose their preference.",
          "Default the slider to 50% so users see equal portions of both images initially.",
          "Use high-quality images to make enhancement differences visible.",
        ]}
        donts={[
          "Don't use different image dimensions for original and enhanced — they must match.",
          "Avoid auto-animating the slider — let the user control the position.",
          "Don't hide comparison labels behind the slider handle.",
          "Avoid placing comparison sliders in very narrow containers where the effect is hard to see.",
        ]}
      />

      {/* Image Comparison Slider */}
      <ComponentSample
        title="Image Comparison Slider"
        description="Drag the handle to compare original and enhanced images. Supports mouse, touch, and keyboard interaction. The slider uses role='slider' with proper ARIA attributes."
      >
        <div className="w-full max-w-2xl">
          <ImageComparisonSlider
            originalUrl="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=60"
            enhancedUrl="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=90&sat=20"
            originalLabel="Original"
            enhancedLabel="Enhanced"
            width={16}
            height={9}
          />
        </div>
      </ComponentSample>

      {/* Aspect Ratio Variants */}
      <ComponentSample
        title="Aspect Ratio Variants"
        description="The slider adapts to any aspect ratio. The container uses CSS aspect-ratio to maintain proportions while both images fill the space with object-cover."
      >
        <div className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Badge variant="outline">16:9</Badge>
              <ImageComparisonSlider
                originalUrl="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=225&fit=crop&q=60"
                enhancedUrl="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=225&fit=crop&q=90&sat=20"
                width={16}
                height={9}
              />
            </div>
            <div className="space-y-2">
              <Badge variant="outline">4:3</Badge>
              <ImageComparisonSlider
                originalUrl="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop&q=60"
                enhancedUrl="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop&q=90&sat=20"
                width={4}
                height={3}
              />
            </div>
            <div className="space-y-2">
              <Badge variant="outline">1:1</Badge>
              <ImageComparisonSlider
                originalUrl="https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=400&fit=crop&q=60"
                enhancedUrl="https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=400&fit=crop&q=90&sat=20"
                width={1}
                height={1}
              />
            </div>
          </div>
        </div>
      </ComponentSample>

      {/* Keyboard Accessible Demo */}
      <ComponentSample
        title="Keyboard-Accessible Slider"
        description="Focus the slider and use arrow keys to move the divider. Shift+Arrow moves in larger 10% increments. Home and End jump to the extremes. The slider announces its position via aria-valuetext."
      >
        <div className="w-full max-w-2xl">
          <KeyboardAccessibleSlider />
        </div>
      </ComponentSample>

      <Separator />

      {/* Comparison View Toggle */}
      <ComponentSample
        title="Comparison View Toggle"
        description="Switch between slider, side-by-side, and split comparison modes using a tab interface. Each mode uses the same image pair but presents the comparison differently."
      >
        <div className="w-full max-w-3xl">
          <ComparisonViewToggle
            originalUrl="https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600&h=400&fit=crop&q=60"
            enhancedUrl="https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600&h=400&fit=crop&q=90&sat=20"
            width={16}
            height={9}
            defaultMode="slider"
          />
        </div>
      </ComponentSample>

      {/* Code Snippets */}
      <CodePreview
        code={codeSnippets.slider}
        title="Usage Examples"
        tabs={[
          { label: "Slider", code: codeSnippets.slider },
          { label: "View Toggle", code: codeSnippets.viewToggle },
          { label: "Keyboard", code: codeSnippets.keyboard },
        ]}
      />

      <AccessibilityPanel
        notes={[
          "The slider uses role='slider' with aria-valuenow, aria-valuemin, and aria-valuemax for screen reader support.",
          "Keyboard navigation: ArrowLeft/Right moves the divider, Shift+Arrow for larger increments, Home/End for extremes.",
          "Focus is indicated with a visible ring (focus-visible) meeting WCAG 2.4.7 Focus Visible.",
          "Both images have descriptive alt text (Original / Enhanced labels).",
          "The comparison view toggle uses Radix Tabs with built-in keyboard navigation (arrow keys between tabs).",
          "Image load errors display a fallback message instead of a broken image placeholder.",
          "The slider handle is large enough (40px) to meet the 44px minimum touch target guideline.",
          "aria-valuetext provides a human-readable description of the slider position for screen readers.",
        ]}
      />

      <RelatedComponents currentId="comparison" />
    </div>
  );
}
