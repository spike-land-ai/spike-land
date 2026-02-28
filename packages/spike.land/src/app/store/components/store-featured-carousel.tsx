"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Star } from "lucide-react";
import type { StoreApp } from "@/app/store/data/store-apps";
import { getStoreIcon } from "./store-icon-map";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

interface StoreFeaturedCarouselProps {
  apps: StoreApp[];
}

const variantGradients: Record<string, string> = {
  blue: "from-blue-600/30 via-cyan-600/20 to-blue-800/30",
  fuchsia: "from-fuchsia-600/30 via-pink-600/20 to-fuchsia-800/30",
  green: "from-emerald-600/30 via-green-600/20 to-emerald-800/30",
  purple: "from-purple-600/30 via-indigo-600/20 to-purple-800/30",
  orange: "from-orange-600/30 via-amber-600/20 to-orange-800/30",
  pink: "from-pink-600/30 via-rose-600/20 to-pink-800/30",
};

function StarRating({ rating, count }: { rating: number; count: number; }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i < Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-white/20"
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-white/60">{rating.toFixed(1)}</span>
      <span className="text-xs text-white/40">({count})</span>
    </div>
  );
}

export function StoreFeaturedCarousel({ apps }: StoreFeaturedCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scroll = useCallback(
    (direction: "left" | "right") => {
      if (!scrollRef.current) return;
      const cardWidth = scrollRef.current.offsetWidth * 0.85;
      const newIndex = direction === "left"
        ? Math.max(0, activeIndex - 1)
        : Math.min(apps.length - 1, activeIndex + 1);
      scrollRef.current.scrollTo({
        left: cardWidth * newIndex,
        behavior: "smooth",
      });
      setActiveIndex(newIndex);
    },
    [activeIndex, apps.length],
  );

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, offsetWidth } = scrollRef.current;
    const cardWidth = offsetWidth * 0.85;
    const newIndex = Math.round(scrollLeft / cardWidth);
    setActiveIndex(newIndex);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") scroll("left");
      if (e.key === "ArrowRight") scroll("right");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scroll]);

  if (apps.length === 0) return null;

  return (
    <ScrollReveal preset="fadeUp">
      <section className="py-16 md:py-20">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-400 mb-2">
                Featured
              </p>
              <h2 className="text-3xl font-black md:text-4xl">
                Apps we love.
              </h2>
            </div>

            {/* Nav arrows */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => scroll("left")}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/30 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/30 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Scroll container */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex items-stretch gap-6 overflow-x-auto pb-4 snap-x snap-mandatory -mx-6 px-6"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {apps.map(app => {
              const Icon = getStoreIcon(app.icon);
              const gradient = variantGradients[app.cardVariant]
                ?? variantGradients.blue;

              return (
                <Link
                  key={app.id}
                  href={`/apps/${app.slug}`}
                  className="flex-shrink-0 snap-start group outline-none h-full"
                >
                  <div
                    className={`relative w-[85vw] sm:w-[520px] min-h-[320px] rounded-[28px] border border-white/[0.04] bg-gradient-to-br ${gradient} p-6 sm:p-8 flex flex-col justify-between transition-all duration-500 hover:border-white/10 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] group-focus-visible:ring-2 group-focus-visible:ring-blue-500 overflow-hidden backdrop-blur-3xl`}
                  >
                    {/* Inner shadow/deepness */}
                    <div className="absolute inset-0 bg-background/40 -z-10 mix-blend-overlay" />

                    {/* Subtle noise texture */}
                    <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none bg-[url('/noise.png')] z-0" />

                    {/* New chip */}
                    {app.isNew && (
                      <span className="absolute top-4 right-4 z-10 rounded-full bg-white/10 border border-white/10 backdrop-blur-md px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                        New
                      </span>
                    )}

                    {/* Top: icon + name */}
                    <div className="relative flex items-start gap-5 z-10">
                      <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-white/10 backdrop-blur-sm">
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-2xl font-black text-white mb-0.5">
                          {app.name}
                        </h3>
                        <p className="text-sm text-white/60 line-clamp-2">
                          {app.tagline}
                        </p>
                      </div>
                    </div>

                    {/* Bottom: meta */}
                    <div className="relative flex items-center justify-between z-10">
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-white/10 backdrop-blur-md px-4 py-1.5 text-sm font-semibold tracking-wide text-white/90 capitalize border border-white/10">
                          {app.category}
                        </span>
                        <span className="rounded-full bg-emerald-500/20 border border-emerald-500/20 px-4 py-1.5 text-sm font-semibold tracking-wide text-emerald-300">
                          Free
                        </span>
                        {app.rating !== undefined
                          && app.ratingCount !== undefined && (
                          <div className="bg-background/40 rounded-full px-3 py-1.5 border border-white/10 backdrop-blur-md">
                            <StarRating
                              rating={app.rating}
                              count={app.ratingCount}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-white/50 transition-colors group-hover:text-white">
                        Explore
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Progress bar (replaces dots) */}
          {apps.length > 1 && (
            <div className="mt-5 relative h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-white/60 rounded-full transition-all duration-300"
                style={{
                  width: `${((activeIndex + 1) / apps.length) * 100}%`,
                }}
              />
            </div>
          )}
        </div>
      </section>
    </ScrollReveal>
  );
}
