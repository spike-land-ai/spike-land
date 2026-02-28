"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StoreHero } from "@/app/store/components/store-hero";
import { StoreDeveloperCta } from "@/app/store/components/store-developer-cta";
import { StoreCategoryTabs } from "@/app/store/components/store-category-tabs";
import { StoreAppGrid } from "@/app/store/components/store-app-grid";
import { StoreFeaturedCarousel } from "@/app/store/components/store-featured-carousel";
import { StoreStatsBar } from "./store-stats-bar";
import {
  COLLECTION_TAGS,
  StoreCollections,
} from "@/app/store/components/store-collections";
import {
  getAppsByCategory,
  getFeaturedApps,
  getStoreStats,
} from "@/app/store/data/store-apps";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Button } from "@/components/ui/button";
import { StoreSearch } from "@/app/store/components/store-search";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  LayoutGrid,
  List,
  Search,
  Sparkles,
} from "lucide-react";

type SortOption = "featured" | "tools" | "az" | "rating" | "installs";

export function StorePageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedCategory = searchParams.get("category") || "all";
  const searchQuery = searchParams.get("search") || "";
  const collectionId = searchParams.get("collection") || "";

  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const categoryApps = getAppsByCategory(selectedCategory);
  const filteredApps = categoryApps.filter(app => {
    // Collection filter
    if (collectionId && COLLECTION_TAGS[collectionId]) {
      const collTags = COLLECTION_TAGS[collectionId];
      if (!app.tags.some(tag => collTags.includes(tag))) return false;
    }
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      app.name.toLowerCase().includes(query)
      || app.tagline.toLowerCase().includes(query)
      || app.description.toLowerCase().includes(query)
      || app.tags.some(tag => tag.toLowerCase().includes(query))
    );
  });

  // Sort logic
  const sortedApps = [...filteredApps].sort((a, b) => {
    if (sortBy === "tools") return b.toolCount - a.toolCount;
    if (sortBy === "az") return a.name.localeCompare(b.name);
    if (sortBy === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
    if (sortBy === "installs") {
      return (b.installCount ?? 0) - (a.installCount ?? 0);
    }
    // featured: isFeatured first
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return 0;
  });

  const featuredApps = getFeaturedApps();
  const stats = getStoreStats();

  const clearFilters = () => {
    router.push("/apps/store", { scroll: false });
  };

  return (
    <div className="text-foreground selection:bg-blue-500/30">
      {/* Hero */}
      <StoreHero />

      {/* Stats Bar */}
      <StoreStatsBar appCount={stats.appCount} />

      {/* Featured Carousel */}
      {featuredApps.length > 0 && <StoreFeaturedCarousel apps={featuredApps} />}

      {/* How It Works */}
      <StoreDeveloperCta />

      {/* Divider */}
      <div className="container mx-auto max-w-6xl px-6">
        <div className="border-t border-border/40" />
      </div>

      {/* Collections */}
      <div className="container mx-auto max-w-6xl px-6 pt-16">
        <StoreCollections />
      </div>

      {/* Browse All — Category Tabs + Search + Grid */}
      <section className="py-20 md:py-32 min-h-[600px] relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50 pointer-events-none" />

        <div className="container mx-auto max-w-6xl px-6 relative z-10">
          <ScrollReveal>
            {/* Section header */}
            <div className="text-center mb-16">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400 mb-3 drop-shadow-sm">
                Browse Directory
              </p>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 w-full border-b border-border/[0.5] pb-8">
                <div className="flex flex-col items-center md:items-start gap-2">
                  <h2 className="text-3xl font-black md:text-5xl tracking-tight text-foreground drop-shadow-md">
                    All Apps
                  </h2>
                  <p className="text-base font-medium text-muted-foreground">
                    Discover and install full-stack MCP apps.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as SortOption)}
                      className="appearance-none bg-card border border-border text-muted-foreground text-sm font-medium rounded-xl pl-5 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all hover:bg-card/80 hover:border-border cursor-pointer shadow-sm"
                    >
                      <option value="featured">Featured</option>
                      <option value="tools">Most Tools</option>
                      <option value="rating">Top Rated</option>
                      <option value="installs">Most Installed</option>
                      <option value="az">A–Z</option>
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <ChevronDownIcon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </div>

                  {/* View mode toggle */}
                  <div className="flex items-center rounded-xl bg-card border border-border overflow-hidden p-1 shadow-sm">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`flex items-center justify-center p-2 rounded-lg transition-all ${
                        viewMode === "grid"
                          ? "bg-muted text-foreground shadow-sm ring-1 ring-border"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      }`}
                      aria-label="Grid view"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`flex items-center justify-center p-2 rounded-lg transition-all ${
                        viewMode === "list"
                          ? "bg-muted text-foreground shadow-sm ring-1 ring-border"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      }`}
                      aria-label="List view"
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Search + Tabs */}
            <div className="flex flex-col items-center gap-8 mb-16">
              <div className="w-full max-w-2xl">
                <StoreSearch />
              </div>
              <StoreCategoryTabs />
            </div>
          </ScrollReveal>

          {sortedApps.length > 0
            ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
                <StoreAppGrid apps={sortedApps} viewMode={viewMode} />
              </div>
            )
            : (
              <div className="flex flex-col items-center justify-center py-40 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-full h-full bg-card border border-border rounded-3xl flex items-center justify-center shadow-inner">
                    <Search className="h-10 w-10 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold tracking-tight mb-4 text-foreground">
                  No apps found
                </h3>
                <p className="text-muted-foreground max-w-md mb-10 leading-relaxed font-light text-lg">
                  We couldn&apos;t find any apps matching
                  &ldquo;<span className="text-foreground font-medium">
                    {searchQuery}
                  </span>
                  &rdquo; in the{" "}
                  {selectedCategory === "all" ? "store" : "selected category"}. Try a different
                  search term or explore all categories.
                </p>
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="rounded-full px-10 h-14 border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] font-semibold"
                >
                  Clear Filters
                </Button>
              </div>
            )}
        </div>
      </section>

      {/* Divider */}
      <div className="container mx-auto max-w-6xl px-6">
        <div className="border-t border-border/40" />
      </div>

      {/* Bottom CTA sections */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        <div className="container mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Blog CTA */}
            <ScrollReveal>
              <div className="group relative rounded-[2rem] border border-border bg-gradient-to-br from-blue-500/10 to-cyan-500/5 backdrop-blur-2xl p-12 h-full flex flex-col justify-between overflow-hidden transition-all duration-500 hover:border-blue-500/30 hover:shadow-[0_20px_60px_-15px_rgba(59,130,246,0.3)]">
                <div className="absolute inset-0 bg-background/60 -z-10" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay z-0" />
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] group-hover:bg-blue-400/30 transition-colors duration-500" />

                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/30 mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                    <BookOpen className="h-7 w-7 text-blue-400" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4 tracking-tight drop-shadow-sm group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-colors">
                    100 apps you can build today
                  </h3>
                  <p className="text-muted-foreground text-base leading-relaxed mb-8 font-light">
                    See how MCPs turn a single prompt into a full-stack app — and get inspired by
                    100 ideas you can ship right now.
                  </p>
                </div>
                <Button
                  asChild
                  variant="ghost"
                  className="relative z-10 gap-2 text-blue-400 hover:text-blue-300 w-fit px-0 hover:bg-transparent text-lg font-medium"
                >
                  <Link href="/blog/godspeed-development-100-app-ideas">
                    Read the blog post
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </ScrollReveal>

            {/* Skills CTA */}
            <ScrollReveal>
              <div className="group relative rounded-[2rem] border border-border bg-gradient-to-br from-purple-500/10 to-fuchsia-500/5 backdrop-blur-2xl p-12 h-full flex flex-col justify-between overflow-hidden transition-all duration-500 hover:border-purple-500/30 hover:shadow-[0_20px_60px_-15px_rgba(168,85,247,0.3)]">
                <div className="absolute inset-0 bg-background/60 -z-10" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay z-0" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] group-hover:bg-purple-400/30 transition-colors duration-500" />

                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/30 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                    <Sparkles className="h-7 w-7 text-purple-400" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4 tracking-tight drop-shadow-sm group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-colors">
                    Claude Code Skills
                  </h3>
                  <p className="text-muted-foreground text-base leading-relaxed mb-8 font-light">
                    Browse AI-powered development skills for quality gates, testing, and workflow
                    automation.
                  </p>
                </div>
                <Button
                  asChild
                  variant="ghost"
                  className="relative z-10 gap-2 text-purple-400 hover:text-purple-300 w-fit px-0 hover:bg-transparent text-lg font-medium"
                >
                  <Link href="/store/skills">
                    Browse Skills
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  );
}

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
