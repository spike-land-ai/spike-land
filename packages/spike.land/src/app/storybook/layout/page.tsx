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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  MasonryGrid,
  MasonryGridUniform,
  type ZoomLevel,
} from "@/components/ui/masonry-grid";
import { Separator } from "@/components/ui/separator";
import { TextOverlay } from "@/components/ui/text-overlay";
import { ZoomSlider } from "@/components/ui/zoom-slider";
import Image from "next/image";
import { useState } from "react";

// Sample items with varying heights for masonry demo
const masonryItems = [
  {
    id: 1,
    height: "h-48",
    color: "bg-gradient-to-br from-cyan-500/20 to-blue-500/20",
  },
  {
    id: 2,
    height: "h-32",
    color: "bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20",
  },
  {
    id: 3,
    height: "h-56",
    color: "bg-gradient-to-br from-amber-500/20 to-orange-500/20",
  },
  {
    id: 4,
    height: "h-40",
    color: "bg-gradient-to-br from-emerald-500/20 to-green-500/20",
  },
  {
    id: 5,
    height: "h-48",
    color: "bg-gradient-to-br from-violet-500/20 to-purple-500/20",
  },
  {
    id: 6,
    height: "h-36",
    color: "bg-gradient-to-br from-rose-500/20 to-red-500/20",
  },
];

// Sample images for text overlay demo
const overlayImages = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
    alt: "Mountain landscape",
    label: "Enhanced",
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop",
    alt: "Nature scene",
    label: "Original",
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop",
    alt: "Forest path",
    label: "Pro Tier",
  },
];

const codeSnippets = {
  masonry: `import { MasonryGrid } from "@/components/ui/masonry-grid";
import { ZoomSlider } from "@/components/ui/zoom-slider";

const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(3);

<ZoomSlider value={zoomLevel} onChange={setZoomLevel} />

<MasonryGrid zoomLevel={zoomLevel}>
  {items.map((item) => (
    <div key={item.id} className="rounded-lg border">
      {/* Variable height content */}
    </div>
  ))}
</MasonryGrid>`,
  uniform: `import { MasonryGridUniform } from "@/components/ui/masonry-grid";

<MasonryGridUniform zoomLevel={3}>
  {items.map((item) => (
    <div key={item.id} className="aspect-square rounded-lg border">
      {/* Uniform aspect ratio content */}
    </div>
  ))}
</MasonryGridUniform>`,
  textOverlay: `import { TextOverlay } from "@/components/ui/text-overlay";

<div className="relative rounded-lg overflow-hidden">
  <Image src={src} alt={alt} width={400} height={300} />
  <TextOverlay position="bottom-left">
    Label Text
  </TextOverlay>
</div>

{/* Available positions */}
<TextOverlay position="top-left">Top Left</TextOverlay>
<TextOverlay position="top-right">Top Right</TextOverlay>
<TextOverlay position="center">Center</TextOverlay>
<TextOverlay position="bottom-left">Bottom Left</TextOverlay>
<TextOverlay position="bottom-right">Bottom Right</TextOverlay>

{/* Without gradient */}
<TextOverlay position="bottom-left" gradient={false}
  className="bg-primary text-primary-foreground">
  Custom Styled
</TextOverlay>`,
  zoomSlider: `import { ZoomSlider } from "@/components/ui/zoom-slider";

{/* Uncontrolled (persists to localStorage) */}
<ZoomSlider />

{/* Controlled */}
const [zoom, setZoom] = useState<ZoomLevel>(3);
<ZoomSlider value={zoom} onChange={setZoom} />`,
};

export default function LayoutPage() {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(3);

  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="Layout"
        description="Components for organizing and displaying content in flexible, responsive layouts. Includes masonry grids, text overlays, and zoom controls."
        usage="Use MasonryGrid for variable-height content like galleries or card feeds. Use MasonryGridUniform when all items share the same aspect ratio. Pair with ZoomSlider to let users control density."
      />

      <UsageGuide
        dos={[
          "Use MasonryGrid for content with naturally varying heights (galleries, feeds)",
          "Use MasonryGridUniform when all items share the same aspect ratio",
          "Pair grids with ZoomSlider to give users control over content density",
          "Use TextOverlay with gradient for readability on unpredictable image backgrounds",
          "Keep overlay text short -- one or two words for labels",
          "Persist zoom state to localStorage for returning users",
        ]}
        donts={[
          "Don't mix variable-height and uniform items in the same grid",
          "Don't place long text in TextOverlay -- it's designed for short labels",
          "Don't use MasonryGrid for fewer than 3 items -- a simple flex or grid is clearer",
          "Don't disable the gradient on TextOverlay unless the background has guaranteed contrast",
          "Don't force a specific zoom level -- respect user preference",
        ]}
      />

      {/* Masonry Grid */}
      <Section
        title="Masonry Grid"
        description="CSS columns-based masonry layout for items with varying heights"
      >
        <ComponentSample
          title="Interactive Masonry Grid"
          description="Drag the zoom slider to adjust column count. Items flow into columns with natural height variation."
        >
          <div className="w-full space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Zoom Level: {zoomLevel}
              </Label>
              <ZoomSlider value={zoomLevel} onChange={setZoomLevel} />
            </div>
            <MasonryGrid zoomLevel={zoomLevel}>
              {masonryItems.map(item => (
                <div
                  key={item.id}
                  className={`${item.height} ${item.color} rounded-lg border border-border flex items-center justify-center`}
                >
                  <span className="text-sm text-muted-foreground">
                    Item {item.id}
                  </span>
                </div>
              ))}
            </MasonryGrid>
          </div>
        </ComponentSample>

        <CodePreview
          code={codeSnippets.masonry}
          title="MasonryGrid"
        />
      </Section>

      {/* Masonry Grid Uniform */}
      <Section
        title="Masonry Grid Uniform"
        description="Grid-based variant for items with uniform aspect ratios"
      >
        <ComponentSample
          title="Uniform Aspect Ratio Grid"
          description="All items share the same aspect-square ratio, creating a clean, even grid layout."
        >
          <div className="w-full">
            <MasonryGridUniform zoomLevel={3}>
              {[1, 2, 3, 4, 5, 6].map(item => (
                <div
                  key={item}
                  className="aspect-square bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-border flex items-center justify-center"
                >
                  <span className="text-sm text-muted-foreground">
                    Square {item}
                  </span>
                </div>
              ))}
            </MasonryGridUniform>
          </div>
        </ComponentSample>

        <CodePreview
          code={codeSnippets.uniform}
          title="MasonryGridUniform"
        />
      </Section>

      {/* Text Overlay */}
      <Section
        title="Text Overlay"
        description="Position text labels on top of images with gradient backing"
      >
        <ComponentSample
          title="Image Labels"
          description="Text overlays with gradient backgrounds for readability on any image."
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            {overlayImages.map(image => (
              <div
                key={image.id}
                className="relative rounded-lg overflow-hidden"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={400}
                  height={300}
                  className="w-full h-48 object-cover"
                />
                <TextOverlay position="bottom-left">
                  {image.label}
                </TextOverlay>
              </div>
            ))}
          </div>
        </ComponentSample>

        <ComponentSample
          title="All Position Options"
          description="TextOverlay supports five positions and an optional no-gradient mode for custom styling."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            <div className="relative rounded-lg overflow-hidden aspect-video bg-muted">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 to-fuchsia-500/30" />
              <TextOverlay position="top-left">Top Left</TextOverlay>
            </div>
            <div className="relative rounded-lg overflow-hidden aspect-video bg-muted">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 to-orange-500/30" />
              <TextOverlay position="top-right">Top Right</TextOverlay>
            </div>
            <div className="relative rounded-lg overflow-hidden aspect-video bg-muted">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 to-green-500/30" />
              <TextOverlay position="center">Center</TextOverlay>
            </div>
            <div className="relative rounded-lg overflow-hidden aspect-video bg-muted">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/30 to-purple-500/30" />
              <TextOverlay position="bottom-left">Bottom Left</TextOverlay>
            </div>
            <div className="relative rounded-lg overflow-hidden aspect-video bg-muted">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/30 to-red-500/30" />
              <TextOverlay position="bottom-right">
                Bottom Right
              </TextOverlay>
            </div>
            <div className="relative rounded-lg overflow-hidden aspect-video bg-muted">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-indigo-500/30" />
              <TextOverlay
                position="bottom-left"
                gradient={false}
                className="bg-primary text-primary-foreground"
              >
                No Gradient
              </TextOverlay>
            </div>
          </div>
        </ComponentSample>

        <CodePreview
          code={codeSnippets.textOverlay}
          title="TextOverlay"
        />
      </Section>

      {/* Zoom Slider */}
      <Section
        title="Zoom Slider"
        description="Control zoom level for masonry grids with localStorage persistence"
      >
        <ComponentSample
          title="Default Zoom Slider"
          description="Uncontrolled mode with automatic localStorage persistence."
        >
          <div className="flex items-center gap-4">
            <ZoomSlider />
            <Badge variant="outline">Persists to localStorage</Badge>
          </div>
        </ComponentSample>

        <ComponentSample
          title="Controlled Zoom Slider"
          description="Controlled mode with external state management. The slider and buttons stay in sync."
        >
          <div className="w-full space-y-6">
            <div className="flex items-center gap-4 justify-center">
              <ZoomSlider value={zoomLevel} onChange={setZoomLevel} />
              <Badge variant="secondary">Level: {zoomLevel}</Badge>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Zoom State Synchronization
                </Label>
                <span className="text-[10px] text-muted-foreground/70">
                  Slider and buttons stay in sync
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {([1, 2, 3, 4, 5] as ZoomLevel[]).map(level => (
                  <button
                    key={level}
                    onClick={() => setZoomLevel(level)}
                    className={`p-4 rounded-lg border text-center transition-colors ${
                      zoomLevel === level
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-2xl font-bold">{level}</span>
                    <span className="block text-xs text-muted-foreground mt-1">
                      {level === 1
                        ? "Smallest"
                        : level === 5
                        ? "Largest"
                        : `Level ${level}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ComponentSample>

        <CodePreview
          code={codeSnippets.zoomSlider}
          title="ZoomSlider"
        />
      </Section>

      <AccessibilityPanel
        notes={[
          "MasonryGrid uses CSS columns which maintain source order for screen readers",
          "ZoomSlider renders as an accessible range input with proper labeling",
          "TextOverlay content is readable by screen readers in document order",
          "Zoom level buttons include descriptive text for each level",
          "Grid layout adapts to reduced motion preferences -- no layout animations",
          "All interactive elements meet the 44px minimum touch target guideline",
          "Image alt text should describe the content, not the overlay label",
        ]}
      />

      <RelatedComponents currentId="layout" />
    </div>
  );
}
