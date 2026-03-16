import { Link } from "@tanstack/react-router";
import { Star, Users } from "lucide-react";
import { cn } from "../../../styling/cn";
import type { McpAppSummary } from "../../hooks/useApps";
import { useInstall } from "../../hooks/useInstall";
import { InstallButton } from "./InstallButton";

// ---------------------------------------------------------------------------
// StarRating — renders 1-5 filled / half / empty stars
// ---------------------------------------------------------------------------

interface StarRatingProps {
  rating: number;
  count?: number;
}

function StarRating({ rating, count }: StarRatingProps) {
  const clamped = Math.max(0, Math.min(5, rating));
  const full = Math.floor(clamped);
  const hasHalf = clamped - full >= 0.5;

  return (
    <span
      className="inline-flex items-center gap-1"
      aria-label={`Rating: ${clamped.toFixed(1)} out of 5`}
    >
      <span className="flex items-center" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < full;
          const half = !filled && i === full && hasHalf;
          return (
            <Star
              // biome-ignore lint/suspicious/noArrayIndexKey: static 5-star display
              key={i}
              className={cn(
                "size-3",
                filled
                  ? "fill-amber-400 text-amber-400"
                  : half
                    ? "fill-amber-400/50 text-amber-400"
                    : "fill-transparent text-muted-foreground/30",
              )}
            />
          );
        })}
      </span>
      {count !== undefined && (
        <span className="text-[11px] font-medium text-muted-foreground">({count})</span>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// CategoryBadge
// ---------------------------------------------------------------------------

interface CategoryBadgeProps {
  category: string;
}

function CategoryBadge({ category }: CategoryBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-primary/15 bg-primary/8 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
      {category}
    </span>
  );
}

// ---------------------------------------------------------------------------
// InstallCountBadge — shows platform-wide install count when > 0
// ---------------------------------------------------------------------------

interface InstallCountBadgeProps {
  count: number;
}

function InstallCountBadge({ count }: InstallCountBadgeProps) {
  if (count === 0) return null;
  const label = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count);
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground"
      aria-label={`${count} installs`}
    >
      <Users className="size-3" />
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// AppCard props
// ---------------------------------------------------------------------------

export interface StoreAppCardEnhancedProps {
  app: McpAppSummary;
  /** Override the displayed category label. */
  categoryName?: string;
  /** Rank number shown in list layout. */
  rank?: number;
  /** Visual layout mode. Defaults to "grid". */
  layout?: "grid" | "list";
  /**
   * Average star rating (0–5). Pass undefined to omit the rating row entirely
   * (e.g. for skeletons or apps with no ratings yet).
   */
  rating?: number;
  /** Number of ratings that produced `rating`. */
  ratingCount?: number;
}

// ---------------------------------------------------------------------------
// Grid variant
// ---------------------------------------------------------------------------

function AppCardGrid({
  app,
  categoryName,
  rating,
  ratingCount,
}: Omit<StoreAppCardEnhancedProps, "rank" | "layout">) {
  const { installCount } = useInstall(app.slug);
  const displayCategory = categoryName ?? app.category;

  return (
    <div className="group relative flex flex-col rounded-2xl border border-border/40 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-border/80 hover:shadow-md">
      {/* Clickable overlay for card navigation */}
      <Link
        to="/apps/$appSlug"
        params={{ appSlug: app.slug }}
        className="absolute inset-0 rounded-2xl"
        aria-label={`Open ${app.name}`}
        tabIndex={-1}
      />

      {/* Header: icon + install button */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30 text-3xl shadow-sm ring-1 ring-border/50 transition-transform group-hover:scale-105">
          {app.emoji || "🔧"}
        </div>
        {/* Install button floats over the card link — needs z-index */}
        <div className="relative z-10">
          <InstallButton slug={app.slug} appName={app.name} size="sm" />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col">
        <Link
          to="/apps/$appSlug"
          params={{ appSlug: app.slug }}
          className="relative z-10 text-lg font-bold text-foreground transition-colors group-hover:text-primary"
        >
          {app.name}
        </Link>

        <CategoryBadge category={displayCategory} />

        <p className="mt-2 mb-3 line-clamp-2 text-sm text-muted-foreground">{app.description}</p>
      </div>

      {/* Footer: rating + installs + tool count */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-border/30">
        <div className="flex items-center gap-2.5 flex-wrap">
          {rating !== undefined && <StarRating rating={rating} count={ratingCount} />}
          <InstallCountBadge count={installCount} />
        </div>
        <span className="shrink-0 text-xs font-semibold text-muted-foreground">
          {app.tool_count} {app.tool_count === 1 ? "tool" : "tools"}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// List variant
// ---------------------------------------------------------------------------

function AppCardList({
  app,
  categoryName,
  rank,
  rating,
}: Omit<StoreAppCardEnhancedProps, "layout">) {
  const { installCount } = useInstall(app.slug);
  const displayCategory = categoryName ?? app.category;

  return (
    <div className="group relative flex items-center gap-4 rounded-xl border border-transparent p-3 transition-colors hover:bg-muted/40 active:bg-muted/60">
      {/* Full-row navigation link */}
      <Link
        to="/apps/$appSlug"
        params={{ appSlug: app.slug }}
        className="absolute inset-0 rounded-xl"
        aria-label={`Open ${app.name}`}
        tabIndex={-1}
      />

      {rank !== undefined && (
        <span className="w-4 shrink-0 text-center text-sm font-bold text-muted-foreground/50">
          {rank}
        </span>
      )}

      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-muted/40 text-2xl shadow-sm ring-1 ring-border/50 transition-transform group-hover:scale-[1.02]">
        {app.emoji || "🔧"}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <h3 className="truncate text-base font-semibold text-foreground transition-colors group-hover:text-primary">
          {app.name}
        </h3>
        <p className="truncate text-xs font-medium text-muted-foreground">{displayCategory}</p>
        <div className="mt-0.5 flex items-center gap-2">
          {rating !== undefined && <StarRating rating={rating} />}
          <InstallCountBadge count={installCount} />
        </div>
      </div>

      {/* Install button — z-index over the card link */}
      <div className="relative z-10 shrink-0">
        <InstallButton slug={app.slug} appName={app.name} size="sm" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public export — selects the right variant by layout prop
// ---------------------------------------------------------------------------

/**
 * Enhanced store app card with install/uninstall button, star rating display,
 * install count, and category badge. Composes {@link InstallButton} and the
 * {@link useInstall} hook for optimistic state management.
 *
 * Use `layout="grid"` (default) for the gallery view and `layout="list"` for
 * the ranked list view.
 */
export function AppCard({
  app,
  categoryName,
  rank,
  layout = "grid",
  rating,
  ratingCount,
}: StoreAppCardEnhancedProps) {
  if (layout === "list") {
    return (
      <AppCardList
        app={app}
        categoryName={categoryName}
        rank={rank}
        rating={rating}
        ratingCount={ratingCount}
      />
    );
  }

  return (
    <AppCardGrid app={app} categoryName={categoryName} rating={rating} ratingCount={ratingCount} />
  );
}

export { StarRating, CategoryBadge, InstallCountBadge };
