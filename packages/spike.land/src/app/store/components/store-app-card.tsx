"use client";

import type { StoreApp } from "@/app/store/data/store-apps";
import { ContentViewStats } from "@/components/engagement/ContentViewStats";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import Link from "next/link";
import { getStoreIcon } from "./store-icon-map";

interface StoreAppCardProps {
  app: StoreApp;
}

function formatInstallCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

function StarRating({ rating, count }: { rating: number; count: number; }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < fullStars
                ? "fill-amber-400 text-amber-400"
                : i === fullStars && hasHalf
                ? "fill-amber-400/50 text-amber-400"
                : "text-muted-foreground/40"
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {rating.toFixed(1)} ({count.toLocaleString()})
      </span>
    </div>
  );
}

const variantColors: Record<
  string,
  { bg: string; glow: string; icon: string; }
> = {
  blue: {
    bg: "from-blue-500/15 to-cyan-500/15",
    glow:
      "group-hover:shadow-[0_8px_40px_-12px_rgba(59,130,246,0.3)] group-hover:border-blue-500/40",
    icon: "from-blue-400 to-cyan-400",
  },
  fuchsia: {
    bg: "from-fuchsia-500/15 to-pink-500/15",
    glow:
      "group-hover:shadow-[0_8px_40px_-12px_rgba(217,70,239,0.3)] group-hover:border-fuchsia-500/40",
    icon: "from-fuchsia-400 to-pink-400",
  },
  green: {
    bg: "from-emerald-500/15 to-green-500/15",
    glow:
      "group-hover:shadow-[0_8px_40px_-12px_rgba(16,185,129,0.3)] group-hover:border-emerald-500/40",
    icon: "from-emerald-400 to-green-400",
  },
  purple: {
    bg: "from-purple-500/15 to-indigo-500/15",
    glow:
      "group-hover:shadow-[0_8px_40px_-12px_rgba(168,85,247,0.3)] group-hover:border-purple-500/40",
    icon: "from-purple-400 to-indigo-400",
  },
  orange: {
    bg: "from-orange-500/15 to-amber-500/15",
    glow:
      "group-hover:shadow-[0_8px_40px_-12px_rgba(249,115,22,0.3)] group-hover:border-orange-500/40",
    icon: "from-orange-400 to-amber-400",
  },
  pink: {
    bg: "from-pink-500/15 to-rose-500/15",
    glow:
      "group-hover:shadow-[0_8px_40px_-12px_rgba(236,72,153,0.3)] group-hover:border-pink-500/40",
    icon: "from-pink-400 to-rose-400",
  },
};

export function StoreAppCard({ app }: StoreAppCardProps) {
  const IconComponent = getStoreIcon(app.icon);
  const colors = variantColors[app.cardVariant] ?? variantColors.blue!;
  const appUrl = app.appUrl;
  const isInternal = appUrl?.startsWith("/");

  return (
    <div
      className={`group relative h-full flex flex-col rounded-[28px] border border-border/40 bg-gradient-to-b from-card/30 to-transparent backdrop-blur-xl p-6 transition-all duration-500 hover:border-border hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] ${colors.glow}`}
    >
      {/* Background colored glow that appears on hover */}
      <div
        className={`absolute inset-0 rounded-[28px] bg-gradient-to-br ${colors.bg} opacity-0 transition-opacity duration-500 group-hover:opacity-100 mix-blend-screen pointer-events-none`}
      />

      {/* Full card link */}
      <Link
        href={`/apps/${app.slug}`}
        className="absolute inset-0 z-0 rounded-[28px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <span className="sr-only">View {app.name} details</span>
      </Link>

      {/* Badges */}
      {app.isNew && (
        <span className="absolute top-2 right-2 rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-300 z-10">
          New
        </span>
      )}
      {app.isBeta && (
        <span
          className={`absolute ${
            app.isNew ? "top-8" : "top-2"
          } right-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300 z-10`}
        >
          Beta
        </span>
      )}

      <div className="relative z-10 flex flex-col h-full pointer-events-none">
        {/* App icon + title row */}
        <div className="flex items-start gap-5 mb-5">
          {/* Squircle icon with gradient */}
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br ${colors.icon} shadow-[0_4px_20px_rgba(0,0,0,0.3)] shadow-white/5 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3`}
          >
            <IconComponent className="h-8 w-8 text-white filter drop-shadow-sm" />
          </div>

          <div className="flex-1 min-w-0 pt-1">
            <h3 className="text-[1.15rem] font-bold text-white truncate tracking-tight">
              {app.name}
            </h3>
            <p className="text-[0.85rem] font-medium text-muted-foreground line-clamp-1 mt-0.5 group-hover:text-foreground/80 transition-colors">
              {app.tagline}
            </p>
          </div>

          {/* Get button */}
          {appUrl && (
            <div className="pointer-events-auto shrink-0">
              {isInternal
                ? (
                  <Link
                    href={appUrl}
                    className="inline-flex items-center justify-center rounded-full bg-white/10 px-5 py-1.5 text-sm font-semibold text-blue-400 transition-all hover:bg-white/15 hover:text-blue-300"
                  >
                    Get
                  </Link>
                )
                : (
                  <a
                    href={appUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-full bg-white/10 px-5 py-1.5 text-sm font-semibold text-blue-400 transition-all hover:bg-white/15 hover:text-blue-300"
                  >
                    Get
                  </a>
                )}
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-[0.9rem] text-muted-foreground group-hover:text-foreground/80 transition-colors leading-relaxed mb-6 flex-1 line-clamp-2">
          {app.description}
        </p>

        {/* Rating & install count */}
        {(app.rating !== undefined || app.installCount !== undefined) && (
          <div className="flex items-center gap-3 mb-3">
            {app.rating !== undefined && app.ratingCount !== undefined && (
              <StarRating rating={app.rating} count={app.ratingCount} />
            )}
            {app.installCount !== undefined && (
              <span className="text-xs text-muted-foreground/70">
                ↓ {formatInstallCount(app.installCount)}
              </span>
            )}
            <ContentViewStats path={`/store/${app.slug}`} compact />
          </div>
        )}

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-2 mt-auto">
          <Badge
            variant="secondary"
            className="bg-muted/60 text-muted-foreground border border-border text-[11px] font-semibold capitalize tracking-wide px-2.5 py-0.5"
          >
            {app.category}
          </Badge>
          {app.pricing === "freemium" && (
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-amber-400">
              Freemium
            </span>
          )}
          {app.pricing === "paid" && (
            <span className="rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-muted-foreground">
              Paid
            </span>
          )}
          {(!app.pricing || app.pricing === "free") && (
            <Badge
              variant="secondary"
              className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold tracking-wide px-2.5 py-0.5"
            >
              Free
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
