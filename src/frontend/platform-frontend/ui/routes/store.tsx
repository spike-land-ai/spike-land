import { useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowRight, Search, Sparkles, X } from "lucide-react";
import { useCallback, useDeferredValue, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CategoryRail, HeroShelf, StoreSection } from "../components/storefront";
import { AppCard } from "../components/store";
import { groupAppsByCategory, useApps } from "../hooks/useApps";
import type { McpAppSummary } from "../hooks/useApps";

// ---------------------------------------------------------------------------
// Search helpers
// ---------------------------------------------------------------------------

function normalizeSearchToken(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function matchesSearch(app: McpAppSummary, query: string): boolean {
  if (!query) return true;
  const token = normalizeSearchToken(query);
  const haystack = [app.name, app.description, app.tagline, app.category, ...app.tags]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return token.split(" ").every((part) => haystack.includes(part));
}

/** Converts a display category name to the URL slug used by the category detail route. */
function categoryToSlug(category: string): string {
  return encodeURIComponent(
    category
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, ""),
  );
}

// ---------------------------------------------------------------------------
// Page-level skeleton helpers
// ---------------------------------------------------------------------------

function HeroSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card">
      <div className="flex flex-col gap-8 p-8 md:flex-row md:items-center md:p-12">
        <div className="flex-1 space-y-6">
          <div className="rubik-panel h-6 w-28 animate-pulse rounded-full" />
          <div className="space-y-3">
            <div className="rubik-panel h-10 animate-pulse rounded-xl" />
            <div className="rubik-panel h-10 w-3/4 animate-pulse rounded-xl" />
          </div>
          <div className="rubik-panel h-11 w-28 animate-pulse rounded-full" />
        </div>
        <div className="hidden md:block">
          <div className="rubik-panel h-48 w-48 animate-pulse rounded-[2rem]" />
        </div>
      </div>
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <section className="rubik-panel-strong flex flex-col gap-6 p-6 sm:p-8">
      <div className="rubik-panel h-6 w-24 animate-pulse rounded-full" />
      <div className="space-y-3">
        <div className="rubik-panel h-10 animate-pulse rounded-xl" />
        <div className="rubik-panel h-10 w-5/6 animate-pulse rounded-xl" />
        <div className="rubik-panel h-5 animate-pulse rounded-lg" />
      </div>
      <div className="flex gap-3">
        <div className="rubik-panel h-7 w-20 animate-pulse rounded-full" />
        <div className="rubik-panel h-7 w-28 animate-pulse rounded-full" />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Search input with debounce via useDeferredValue
// ---------------------------------------------------------------------------

interface StoreSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

function StoreSearchInput({ value, onChange }: StoreSearchInputProps) {
  const { t } = useTranslation("store");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = useCallback(() => {
    onChange("");
    inputRef.current?.focus();
  }, [onChange]);

  return (
    <div className="relative flex items-center">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        role="searchbox"
        aria-label={t("searchPlaceholder")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label={t("searchClear")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile category pill bar
// ---------------------------------------------------------------------------

interface MobileCategoryBarProps {
  groupedApps: ReturnType<typeof groupAppsByCategory>;
  activeCategory: string | null;
  isDiscover: boolean;
  onSelectCategory: (category: string | null) => void;
  isLoading?: boolean;
}

function MobileCategoryBar({
  groupedApps,
  activeCategory,
  isDiscover,
  onSelectCategory,
  isLoading = false,
}: MobileCategoryBarProps) {
  const { t } = useTranslation("store");
  // Refs for all pill buttons: [0 = Discover, 1..N = categories]
  const pillRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusIndex = useCallback(
    (index: number) => {
      const total = 1 + groupedApps.length;
      const clamped = (index + total) % total;
      pillRefs.current[clamped]?.focus();
    },
    [groupedApps.length],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        focusIndex(currentIndex + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        focusIndex(currentIndex - 1);
      }
    },
    [focusIndex],
  );

  if (isLoading) {
    return (
      <div className="xl:hidden space-y-3">
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-2" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items have no stable identity
              <div key={i} className="rubik-panel h-9 w-20 shrink-0 animate-pulse rounded-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="xl:hidden space-y-3">
      <div className="overflow-x-auto pb-2">
        <div role="group" aria-label={t("categoryRailLabel")} className="flex gap-2">
          <button
            ref={(el) => {
              pillRefs.current[0] = el;
            }}
            type="button"
            aria-selected={isDiscover}
            onClick={() => onSelectCategory(null)}
            onKeyDown={(e) => handleKeyDown(e, 0)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              isDiscover
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("discover")}
          </button>
          {groupedApps.map((group, i) => (
            <button
              key={group.category}
              ref={(el) => {
                pillRefs.current[i + 1] = el;
              }}
              type="button"
              aria-selected={activeCategory === group.category}
              onClick={() => onSelectCategory(group.category)}
              onKeyDown={(e) => handleKeyDown(e, i + 1)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeCategory === group.category
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {group.category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Search results section
// ---------------------------------------------------------------------------

interface SearchResultsProps {
  apps: McpAppSummary[];
  query: string;
  onClearSearch: () => void;
}

function SearchResults({ apps, query, onClearSearch }: SearchResultsProps) {
  const { t } = useTranslation("store");

  if (apps.length === 0) {
    return (
      <div className="rubik-panel flex flex-col items-center gap-4 border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">{t("searchNoResults")}</p>
        <button
          type="button"
          onClick={onClearSearch}
          className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
        >
          {t("searchNoResultsCta")}
        </button>
      </div>
    );
  }

  const countKey = apps.length === 1 ? "searchResultsCount" : "searchResultsCount_other";
  const countLabel = t(countKey, { count: apps.length });

  return (
    <section className="space-y-4 pt-6" aria-live="polite" aria-atomic="true">
      <div className="flex items-end justify-between border-b border-border/40 pb-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            &ldquo;{query}&rdquo;
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{countLabel}</p>
        </div>
        <button
          type="button"
          onClick={onClearSearch}
          className="text-sm font-bold text-primary transition-colors hover:text-primary/80"
        >
          {t("searchClear")}
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {apps.map((app) => (
          <AppCard key={app.slug} app={app} layout="grid" />
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// StorePage
// ---------------------------------------------------------------------------

export function StorePage() {
  const { t } = useTranslation("store");
  const search = useSearch({ strict: false }) as { category?: string };
  const navigate = useNavigate();
  const { data: apps, isLoading, isError, error } = useApps();

  // Raw search input (controlled)
  const [searchInput, setSearchInput] = useState("");
  // Deferred value for filtering — avoids blocking the input on large lists
  const deferredQuery = useDeferredValue(searchInput);

  const groupedApps = useMemo(() => groupAppsByCategory(apps ?? []), [apps]);
  const featuredApps = useMemo(
    () => (apps ?? []).filter((app) => app.is_featured).slice(0, 4),
    [apps],
  );
  const newestApps = useMemo(() => (apps ?? []).filter((app) => app.is_new).slice(0, 8), [apps]);
  const activeGroup = useMemo(() => {
    if (!search.category) return null;
    return groupedApps.find((group) => group.category === search.category) ?? null;
  }, [groupedApps, search.category]);
  const recommendedApps = useMemo(() => (apps ?? []).slice(3, 11), [apps]);

  // Filtered apps for the search results view
  const searchResults = useMemo(() => {
    if (!deferredQuery.trim()) return [];
    return (apps ?? []).filter((app) => matchesSearch(app, deferredQuery));
  }, [apps, deferredQuery]);

  const isSearching = deferredQuery.trim().length > 0;

  const selectCategory = (category: string | null) => {
    if (category === null) {
      void navigate({
        to: "/apps",
        search: (prev) => ({ ...prev, category: undefined }),
      });
    } else {
      void navigate({
        to: "/apps/category/$categorySlug",
        params: { categorySlug: categoryToSlug(category) },
      });
    }
  };

  const clearSearch = useCallback(() => {
    setSearchInput("");
  }, []);

  // ----- Loading state -----
  if (isLoading) {
    return (
      <div className="rubik-container-wide rubik-page flex flex-col gap-8 xl:flex-row">
        {/* Sidebar skeleton */}
        <aside className="hidden xl:block xl:w-64 xl:shrink-0">
          <div className="sticky top-6 space-y-4">
            <div className="rubik-panel animate-pulse p-5">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-8 w-32 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-4 w-full animate-pulse rounded bg-muted" />
            </div>
            <div className="rubik-panel p-3">
              <CategoryRail
                groups={[]}
                activeCategory={null}
                onSelectCategory={() => undefined}
                isLoading
              />
            </div>
          </div>
        </aside>

        {/* Main skeleton */}
        <main className="min-w-0 flex-1 space-y-8">
          <HeaderSkeleton />
          <MobileCategoryBar
            groupedApps={[]}
            activeCategory={null}
            isDiscover
            onSelectCategory={() => undefined}
            isLoading
          />
          <HeroSkeleton />
          <StoreSection
            title={t("topFreeApps")}
            subtitle={t("topFreeAppsDesc")}
            apps={[]}
            layout="list"
            isLoading
            skeletonCount={6}
          />
          <StoreSection
            title={t("newNoteworthy")}
            apps={[]}
            layout="grid"
            isLoading
            skeletonCount={4}
          />
        </main>
      </div>
    );
  }

  // ----- Error state -----
  if (isError) {
    return (
      <div className="rubik-container rubik-page rubik-stack">
        <div className="rubik-panel space-y-4 p-8 text-center">
          <p className="font-display text-lg font-semibold text-foreground">{t("loadError")}</p>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : t("loadError")}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            {t("retry")}
          </button>
        </div>
      </div>
    );
  }

  // ----- Empty state -----
  if (!apps || apps.length === 0) {
    return (
      <div className="rubik-container rubik-page rubik-stack">
        <div className="rubik-panel flex flex-col items-center gap-4 border-dashed p-12 text-center">
          <p className="text-muted-foreground">{t("emptyStore")}</p>
          <button
            type="button"
            onClick={() => selectCategory(null)}
            className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            {t("emptyCta")}
          </button>
        </div>
      </div>
    );
  }

  const isDiscover = activeGroup === null;

  return (
    <div className="rubik-container-wide rubik-page flex flex-col gap-8 xl:flex-row">
      <aside className="hidden xl:block xl:w-64 xl:shrink-0">
        <div className="sticky top-6 space-y-4">
          <div className="rubik-panel p-5">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">
              {t("navigation")}
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">
              {t("appStore")}
            </h1>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {t("sidebarDescription")}
            </p>
          </div>

          <div className="rubik-panel p-3">
            <CategoryRail
              groups={groupedApps}
              activeCategory={activeGroup?.category ?? null}
              onSelectCategory={selectCategory}
            />
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 space-y-8">
        {/* Page header + search */}
        <section className="rubik-panel-strong flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-3xl space-y-4">
            <span className="rubik-eyebrow">
              <Sparkles className="h-3.5 w-3.5" />
              {t("appStore")}
            </span>
            <div className="space-y-3">
              <h2 className="font-display text-4xl font-extrabold tracking-tight text-foreground break-words sm:text-5xl">
                {t("heroTitle")}
              </h2>
              <p className="rubik-lede break-words">{t("heroSubtitle")}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:min-w-[260px]">
            {/* Search input */}
            <StoreSearchInput value={searchInput} onChange={setSearchInput} />

            {/* Chips */}
            <div className="flex flex-wrap gap-3">
              <span className="rubik-chip rubik-chip-accent">
                {t("appsCount", { count: apps.length })}
              </span>
              <span className="rubik-chip">
                {t("categoriesCount", { count: groupedApps.length })}
              </span>
              {!isDiscover && activeGroup && (
                <button
                  type="button"
                  onClick={() => selectCategory(null)}
                  className="rubik-chip transition-colors hover:border-primary/20 hover:text-primary"
                >
                  {t("backToDiscover")}
                </button>
              )}
            </div>
          </div>
        </section>

        <MobileCategoryBar
          groupedApps={groupedApps}
          activeCategory={activeGroup?.category ?? null}
          isDiscover={isDiscover}
          onSelectCategory={selectCategory}
        />

        {/* Search results take over the entire content area */}
        {isSearching ? (
          <SearchResults apps={searchResults} query={deferredQuery} onClearSearch={clearSearch} />
        ) : isDiscover ? (
          <>
            <HeroShelf featuredApps={featuredApps.length > 0 ? featuredApps : apps.slice(0, 1)} />

            <StoreSection
              title={t("topFreeApps")}
              subtitle={t("topFreeAppsDesc")}
              apps={apps.slice(0, 9)}
              layout="list"
            />

            <StoreSection
              title={newestApps.length > 0 ? t("newNoteworthy") : t("recommended")}
              subtitle={newestApps.length > 0 ? t("newNoteworthyDesc") : t("recommendedDesc")}
              apps={newestApps.length > 0 ? newestApps : recommendedApps}
              layout="grid"
            />

            {groupedApps.slice(0, 3).map((group) => (
              <StoreSection
                key={group.category}
                title={group.category}
                subtitle={t("categorySlice", { category: group.category })}
                apps={group.apps.slice(0, 4)}
                categoryName={group.category}
                layout="grid"
                onViewAll={() =>
                  navigate({
                    to: "/apps/category/$categorySlug",
                    params: { categorySlug: categoryToSlug(group.category) },
                  })
                }
              />
            ))}
          </>
        ) : (
          <>
            <section className="rubik-panel flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-widest text-primary">
                  {t("categoryView")}
                </div>
                <h3 className="font-display text-3xl font-bold tracking-tight text-foreground">
                  {activeGroup.category}
                </h3>
                <p className="text-sm leading-7 text-muted-foreground">
                  {t("categoryBrowse", {
                    count: activeGroup.apps.length,
                    apps: activeGroup.apps.length === 1 ? t("app") : t("apps"),
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => selectCategory(null)}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/20 hover:text-primary"
              >
                {t("discoverCategories")}
                <ArrowRight className="h-4 w-4" />
              </button>
            </section>

            <StoreSection
              title={t("allApps")}
              subtitle={t("allAppsDesc")}
              apps={activeGroup.apps}
              categoryName={activeGroup.category}
              layout="grid"
              onViewAll={() => selectCategory(null)}
            />
          </>
        )}
      </main>
    </div>
  );
}
