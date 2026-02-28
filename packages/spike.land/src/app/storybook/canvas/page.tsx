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
import { CanvasSettingsForm } from "@/components/canvas/CanvasSettingsForm";
import type { CanvasSettings } from "@/components/canvas/CanvasSettingsForm";
import { HINT_TEXT } from "@/components/canvas/FloatingHint";
import { MasonryGrid } from "@/components/ui/masonry-grid";
import { ZoomSlider } from "@/components/ui/zoom-slider";
import type { ZoomLevel } from "@/components/ui/masonry-grid";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

// Gradient placeholders to simulate gallery thumbnails
const GRADIENTS = [
  "from-cyan-500 to-blue-600",
  "from-purple-500 to-pink-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-rose-400 to-red-500",
  "from-indigo-400 to-violet-500",
  "from-lime-400 to-green-500",
  "from-fuchsia-400 to-purple-500",
  "from-sky-400 to-cyan-500",
  "from-yellow-400 to-amber-500",
  "from-teal-400 to-emerald-600",
  "from-pink-400 to-rose-500",
];

const ASPECT_RATIOS = [
  "aspect-square",
  "aspect-[3/4]",
  "aspect-[4/5]",
  "aspect-square",
  "aspect-[3/4]",
  "aspect-[4/3]",
  "aspect-square",
  "aspect-[3/4]",
  "aspect-[4/5]",
  "aspect-square",
  "aspect-[3/4]",
  "aspect-[4/3]",
];

function PlaceholderThumbnail({
  gradient,
  aspectRatio,
  label,
  selected,
}: {
  gradient: string;
  aspectRatio: string;
  label: string;
  selected?: boolean;
}) {
  return (
    <div
      className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${aspectRatio} ${
        selected ? "ring-2 ring-primary shadow-glow-cyan" : "hover:scale-[1.02]"
      }`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-80`}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white/70 text-xs font-medium">{label}</span>
      </div>
    </div>
  );
}

export default function CanvasPage() {
  const [settings, setSettings] = useState<CanvasSettings>({
    rotation: 0,
    order: "album",
    interval: 10,
  });
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(3);
  const [selectedThumbnail] = useState<number | null>(2);
  const [showHint, setShowHint] = useState(true);
  const [slideshowIndex, setSlideshowIndex] = useState(0);

  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="Canvas & Album Editor"
        description="Components for the photo gallery, album editor, and canvas display system. These power the masonry grid layout, slideshow view, QR code sharing, and image zoom controls."
        usage="Canvas components are designed for immersive photo experiences with support for rotation, zoom levels, slideshows, and responsive masonry layouts."
      />

      <UsageGuide
        dos={[
          "Use MasonryGrid for varied aspect-ratio content to create visual interest.",
          "Pair ZoomSlider with MasonryGrid to give users control over grid density.",
          "Use FloatingHint to provide contextual navigation cues that auto-dismiss.",
          "Use CanvasSettingsForm to let users configure slideshow behavior before sharing.",
          "Provide gradient placeholders while images load to maintain layout stability.",
        ]}
        donts={[
          "Don't render SmartGrid without accessible keyboard navigation handlers.",
          "Don't use fixed column counts -- let the masonry system handle responsiveness.",
          "Don't show the slideshow controls permanently; they should appear on hover/tap.",
          "Don't skip the QR code panel when sharing canvas URLs -- it's critical for TV displays.",
        ]}
      />

      {/* GridThumbnail showcase */}
      <ComponentSample
        title="Grid Thumbnails"
        description="Individual image tiles with selection state, neon glow effect, and natural aspect ratio. Click any tile to see the selected state."
      >
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4 w-full max-w-2xl">
          {GRADIENTS.slice(0, 8).map((gradient, i) => (
            <PlaceholderThumbnail
              key={i}
              gradient={gradient}
              aspectRatio={ASPECT_RATIOS[i] ?? "aspect-square"}
              label={`IMG ${i + 1}`}
              selected={selectedThumbnail === i}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center w-full">
          Tile 3 shown in selected state with cyan glow ring
        </p>
      </ComponentSample>

      {/* MasonryGrid showcase */}
      <ComponentSample
        title="Masonry Grid"
        description="CSS-columns-based masonry layout that adapts from 1 to 8 columns based on zoom level and viewport. Supports varied aspect ratios for visual rhythm."
      >
        <div className="w-full">
          <MasonryGrid zoomLevel={zoomLevel}>
            {GRADIENTS.map((gradient, i) => (
              <PlaceholderThumbnail
                key={i}
                gradient={gradient}
                aspectRatio={ASPECT_RATIOS[i] ?? "aspect-square"}
                label={`Photo ${i + 1}`}
              />
            ))}
          </MasonryGrid>
        </div>
      </ComponentSample>

      {/* ZoomSlider showcase */}
      <ComponentSample
        title="Zoom Slider"
        description="Controls the grid density (zoom level 1-5). Higher zoom means fewer columns with larger items. Persists preference to localStorage."
      >
        <div className="flex flex-col items-center gap-6">
          <ZoomSlider value={zoomLevel} onChange={setZoomLevel} />
          <div className="flex items-center gap-2">
            <Badge variant="outline">Zoom Level: {zoomLevel}</Badge>
            <span className="text-xs text-muted-foreground">
              (Adjust the slider above to see the masonry grid change)
            </span>
          </div>
        </div>
      </ComponentSample>

      {/* Slideshow View representation */}
      <ComponentSample
        title="Slideshow View"
        description="Full-screen immersive slideshow with hero animation transitions, keyboard navigation (arrows, escape), rotation controls, and auto-hiding overlays."
      >
        <div className="relative w-full max-w-xl aspect-video rounded-2xl overflow-hidden bg-[#0B0E14]">
          {/* Simulated slideshow image */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${
              GRADIENTS[slideshowIndex]
            } opacity-60 transition-all duration-500`}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/50 text-lg font-medium">
              Slideshow Image {slideshowIndex + 1}
            </span>
          </div>

          {/* Navigation controls */}
          <div className="absolute inset-0 flex items-center justify-between px-4">
            <button
              type="button"
              onClick={() =>
                setSlideshowIndex(
                  prev => (prev - 1 + GRADIENTS.length) % GRADIENTS.length,
                )}
              className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/60 transition-all"
              aria-label="Previous image"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={() =>
                setSlideshowIndex(
                  prev => (prev + 1) % GRADIENTS.length,
                )}
              className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/60 transition-all"
              aria-label="Next image"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Counter */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white/80 text-xs">
            {slideshowIndex + 1} of {GRADIENTS.length}
          </div>
        </div>
      </ComponentSample>

      {/* FloatingHint showcase */}
      <ComponentSample
        title="Floating Hint"
        description="Contextual floating hint bar that appears at the bottom of the screen with smooth animations. Shows different icons for touch vs desktop devices."
      >
        <div className="flex flex-col items-center gap-6 w-full">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              {showHint ? "Hide Hint" : "Show Hint"}
            </button>
          </div>
          {/* Inline hint preview (not fixed-position) */}
          <div className="relative w-full h-16 rounded-xl bg-black/20 border border-white/5 overflow-hidden flex items-end justify-center pb-2">
            <div
              className={`flex items-center gap-3 bg-black/60 backdrop-blur-sm text-white/90 text-sm font-medium rounded-full px-6 py-3 transition-all duration-300 ${
                showHint
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-full"
              }`}
            >
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <span>{HINT_TEXT.desktop}</span>
            </div>
          </div>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <Badge variant="outline">
              Desktop: &quot;{HINT_TEXT.desktop}&quot;
            </Badge>
            <Badge variant="outline">
              Touch: &quot;{HINT_TEXT.touch}&quot;
            </Badge>
          </div>
        </div>
      </ComponentSample>

      {/* CanvasSettingsForm showcase */}
      <ComponentSample
        title="Canvas Settings Form"
        description="Configure canvas display settings including rotation (0/90/180/270), image order (album/random), and slideshow interval (5-60 seconds)."
      >
        <div className="w-full max-w-sm">
          <Card className="glass-1">
            <CardContent className="pt-6 space-y-4">
              <CanvasSettingsForm settings={settings} onChange={setSettings} />
              <div className="pt-4 border-t border-white/10 space-y-1">
                <p className="text-xs text-muted-foreground">Current values:</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    Rotation: {settings.rotation}&deg;
                  </Badge>
                  <Badge variant="outline">Order: {settings.order}</Badge>
                  <Badge variant="outline">
                    Interval: {settings.interval}s
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ComponentSample>

      {/* SmartGrid with Rotation */}
      <ComponentSample
        title="SmartGrid with Rotation"
        description="SmartGrid wraps GridThumbnails in a responsive masonry layout with support for CSS rotation transforms. The grid fades out when transitioning to slideshow mode."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          {([0, 90, 180, 270] as const).map(rotation => (
            <Card key={rotation} className="glass-1">
              <CardContent className="pt-6 space-y-4">
                <Badge variant="outline">Rotation: {rotation}&deg;</Badge>
                <div
                  className="grid grid-cols-3 gap-2 p-4 rounded-lg bg-black/20 border border-white/5"
                  style={{
                    transform: rotation !== 0
                      ? `rotate(${rotation}deg) scale(0.6)`
                      : undefined,
                    transformOrigin: "center center",
                    minHeight: rotation !== 0 ? "180px" : undefined,
                  }}
                >
                  {GRADIENTS.slice(0, 6).map((gradient, i) => (
                    <div
                      key={i}
                      className={`rounded-md overflow-hidden ${
                        ASPECT_RATIOS[i] ?? "aspect-square"
                      }`}
                    >
                      <div
                        className={`w-full h-full bg-gradient-to-br ${gradient} opacity-70`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ComponentSample>

      {/* QR Code Panel */}
      <ComponentSample
        title="QR Code Panel"
        description="Generates a scannable QR code for sharing canvas display URLs. Includes the CanvasSettingsForm inline and provides copy-to-clipboard and open-in-new-tab actions. Requires qrcode.react for SVG rendering."
      >
        <div className="p-10 rounded-3xl border border-white/5 bg-black/20 flex justify-center w-full">
          <Card className="w-full max-w-xs">
            <CardContent className="pt-6 space-y-4 flex flex-col items-center">
              {/* Placeholder QR code */}
              <div className="rounded-lg bg-white p-2">
                <div className="w-40 h-40 bg-[repeating-conic-gradient(#000_0%_25%,#fff_0%_50%)] bg-[length:20%_20%]" />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Scannable QR code linking to the canvas display URL with embedded settings
              </p>
              <div className="flex gap-2 w-full">
                <div className="flex-1 h-9 rounded-md border border-input bg-background/50 flex items-center justify-center text-xs text-muted-foreground">
                  Copy URL
                </div>
                <div className="flex-1 h-9 rounded-md border border-input bg-background/50 flex items-center justify-center text-xs text-muted-foreground">
                  Open
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ComponentSample>

      <CodePreview
        title="Canvas Component Usage"
        code={`import { MasonryGrid } from "@/components/ui/masonry-grid";
import { ZoomSlider } from "@/components/ui/zoom-slider";
import { CanvasSettingsForm } from "@/components/canvas/CanvasSettingsForm";

// Masonry grid with zoom control
<ZoomSlider value={zoomLevel} onChange={setZoomLevel} />
<MasonryGrid zoomLevel={zoomLevel}>
  {images.map((img) => (
    <GridThumbnail key={img.id} image={img} />
  ))}
</MasonryGrid>

// Canvas settings form
<CanvasSettingsForm settings={settings} onChange={setSettings} />`}
        tabs={[
          {
            label: "MasonryGrid",
            code: `import { MasonryGrid } from "@/components/ui/masonry-grid";
import type { ZoomLevel } from "@/components/ui/masonry-grid";

const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(3);

<MasonryGrid zoomLevel={zoomLevel}>
  {images.map((img) => (
    <GridThumbnail key={img.id} image={img} />
  ))}
</MasonryGrid>`,
          },
          {
            label: "ZoomSlider",
            code: `import { ZoomSlider } from "@/components/ui/zoom-slider";

<ZoomSlider value={zoomLevel} onChange={setZoomLevel} />`,
          },
          {
            label: "Settings",
            code: `import { CanvasSettingsForm } from "@/components/canvas/CanvasSettingsForm";
import type { CanvasSettings } from "@/components/canvas/CanvasSettingsForm";

const [settings, setSettings] = useState<CanvasSettings>({
  rotation: 0,
  order: "album",
  interval: 10,
});

<CanvasSettingsForm settings={settings} onChange={setSettings} />`,
          },
        ]}
      />

      <AccessibilityPanel
        notes={[
          "GridThumbnail uses role='gridcell' with aria-selected for screen reader selection state.",
          "SmartGrid uses role='grid' with keyboard navigation (Enter to enter slideshow).",
          "SlideshowView uses role='dialog' with aria-modal and aria-live regions for image counter announcements.",
          "FloatingHint uses role='status' with aria-live='polite' for non-intrusive notifications.",
          "All navigation buttons include descriptive aria-labels (Previous image, Next image, Exit slideshow).",
          "ZoomSlider buttons are disabled at boundaries (zoom 1 and 5) with proper disabled state communication.",
          "Rotation controls include directional labels (Rotate clockwise, Rotate counter-clockwise).",
          "Focus rings use the primary cyan color for visibility, consistent with the design system.",
        ]}
      />

      <RelatedComponents currentId="canvas" />
    </div>
  );
}
