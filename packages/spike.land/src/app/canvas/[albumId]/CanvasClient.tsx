"use client";

import { PixelLogo } from "@/components/brand";
import { FloatingHint, HINT_TEXT } from "@/components/canvas/FloatingHint";
import { SlideshowView } from "@/components/canvas/SlideshowView";
import { SmartGrid } from "@/components/canvas/SmartGrid";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { useSmartGallery } from "@/hooks/useSmartGallery";
import { useTouchGestures } from "@/hooks/useTouchGestures";
import type {
  CanvasRotation,
  CanvasSettings,
  GalleryImage,
} from "@/lib/canvas/types";
import { Play } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface CanvasClientProps {
  images: GalleryImage[];
  settings: CanvasSettings;
  albumName: string;
}

/**
 * Shuffles an array using Fisher-Yates algorithm.
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j] as T;
    shuffled[j] = temp as T;
  }
  return shuffled;
}

/**
 * CanvasClient orchestrates the Smart Gallery experience.
 *
 * Features:
 * - Grid view with thumbnail selection and neon glow effect
 * - Fullscreen slideshow with navigation
 * - Keyboard navigation (Spacebar, Arrow keys, B for peek, Escape)
 * - Touch gestures (swipe, double-tap, long-press)
 * - Before/After peek to compare original and enhanced images
 * - CSS rotation support for display orientation
 * - Auto-cycling in grid mode
 */
export function CanvasClient({
  images,
  settings,
  albumName,
}: CanvasClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [currentRotation, setCurrentRotation] = useState<CanvasRotation>(
    settings.rotation,
  );

  // Handle rotation changes from slideshow view
  const handleRotate = useCallback((direction: "cw" | "ccw") => {
    setCurrentRotation(prev => {
      const rotations: CanvasRotation[] = [0, 90, 180, 270];
      const currentIdx = rotations.indexOf(prev);
      if (direction === "cw") {
        return rotations[(currentIdx + 1) % 4] as CanvasRotation;
      } else {
        return rotations[(currentIdx + 3) % 4] as CanvasRotation;
      }
    });
  }, []);

  // Shuffle images if order is random (only on mount)
  const displayImages = useMemo(() => {
    if (settings.order === "random" && images.length > 0) {
      return shuffleArray(images);
    }
    return images;
  }, [images, settings.order]);

  // Detect touch device on mount
  useEffect(() => {
    setIsTouchDevice(
      "ontouchstart" in window || navigator.maxTouchPoints > 0,
    );
  }, []);

  // Core gallery state management
  // Note: autoSelectInterval is always passed; the hook ignores it when not in grid mode
  const {
    viewMode,
    selectedImageId,
    currentIndex,
    isPeeking,
    isTransitioning,
    selectImage,
    enterSlideshow,
    exitSlideshow,
    goToNext,
    goToPrev,
    startPeek,
    endPeek,
    getTransitionOrigin,
  } = useSmartGallery({
    images: displayImages,
    autoSelectInterval: settings.interval * 1000,
  });

  // Keyboard navigation
  useKeyboardNavigation({
    onSpacebar: () => viewMode === "grid" ? enterSlideshow() : exitSlideshow(),
    onLeftArrow: goToPrev,
    onRightArrow: goToNext,
    onBKeyDown: startPeek,
    onBKeyUp: endPeek,
    onEscape: exitSlideshow,
    isEnabled: true,
  });

  // Touch gestures for slideshow navigation
  useTouchGestures(containerRef, {
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrev,
    onDoubleTap: () => viewMode === "grid" ? enterSlideshow() : exitSlideshow(),
    onLongPressStart: startPeek,
    onLongPressEnd: endPeek,
    isEnabled: viewMode === "slideshow",
  });

  // Hide cursor after 3s idle (for fullscreen display)
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const hide = () => {
      document.body.style.cursor = "none";
    };

    const show = () => {
      document.body.style.cursor = "auto";
      clearTimeout(timeout);
      timeout = setTimeout(hide, 3000);
    };

    document.addEventListener("mousemove", show);
    timeout = setTimeout(hide, 3000);

    return () => {
      document.removeEventListener("mousemove", show);
      clearTimeout(timeout);
      document.body.style.cursor = "auto";
    };
  }, []);

  // Empty state
  if (displayImages.length === 0) {
    return (
      <div
        className="min-h-screen bg-[#0B0E14] flex items-center justify-center"
        data-testid="canvas-empty"
      >
        <p className="text-white/50 text-lg">No images in this album</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#0B0E14] overflow-hidden"
      data-testid="canvas-container"
      aria-label={`Canvas display: ${albumName}`}
    >
      {/* Header with Pixel Logo and CTA */}
      {viewMode === "grid" && (
        <header
          className="sticky top-0 z-40 bg-[#0B0E14]/90 backdrop-blur-sm border-b border-white/10"
          data-testid="canvas-toolbar"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <Link
                href="/apps/pixel"
                className="transition-opacity hover:opacity-80"
                data-testid="pixel-logo-link"
              >
                <PixelLogo size="sm" variant="horizontal" />
              </Link>
              <h1
                className="text-white/80 text-sm font-medium truncate max-w-[200px]"
                data-testid="album-title"
              >
                {albumName}
              </h1>
            </div>
            <Button
              onClick={enterSlideshow}
              disabled={!selectedImageId}
              className="bg-[#00E5FF] hover:bg-[#00E5FF]/80 text-[#0B0E14] font-semibold shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-50 disabled:shadow-none"
              data-testid="start-slideshow-button"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Slideshow
            </Button>
          </div>
        </header>
      )}

      {/* Grid View */}
      <SmartGrid
        images={displayImages}
        selectedImageId={selectedImageId}
        onImageSelect={selectImage}
        onEnterSlideshow={enterSlideshow}
        isBlurred={viewMode === "slideshow"}
        rotation={currentRotation}
      />

      {/* Slideshow View */}
      {viewMode === "slideshow" && (
        <SlideshowView
          images={displayImages}
          currentIndex={currentIndex}
          isPeeking={isPeeking}
          onNavigate={dir => (dir === "next" ? goToNext() : goToPrev())}
          onExit={exitSlideshow}
          transitionState={{
            isActive: isTransitioning,
            originRect: getTransitionOrigin(),
            direction: "expand",
          }}
          rotation={currentRotation}
          onRotate={handleRotate}
        />
      )}

      {/* Floating Hint */}
      <FloatingHint
        text={isTouchDevice ? HINT_TEXT.touch : HINT_TEXT.desktop}
        isVisible={viewMode === "grid" && selectedImageId !== null}
        isTouchDevice={isTouchDevice}
      />
    </div>
  );
}
