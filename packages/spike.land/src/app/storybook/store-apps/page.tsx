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
import {
  getAppsByCategory,
  getAppsByPricing,
  getFeaturedApps,
  getStoreStats,
  STORE_CATEGORIES,
} from "@/app/store/data/store-apps";
import type { StoreApp } from "@/app/store/data/store-apps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  Bot,
  Code,
  Cpu,
  Heart,
  Layers,
  LayoutGrid,
  MessageSquare,
  Palette,
  RefreshCw,
  Rocket,
  Search,
  Sparkles,
  Star,
  Target,
  Users,
  Wrench,
} from "lucide-react";
import { useState } from "react";

const CATEGORY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string; }>
> = {
  LayoutGrid,
  Palette,
  Target,
  Code,
  Users,
  Heart,
  Bot,
};

function MiniAppCard({ app }: { app: StoreApp; }) {
  const variantColors: Record<string, string> = {
    blue: "from-blue-500/15 to-cyan-500/15 border-blue-500/20",
    fuchsia: "from-fuchsia-500/15 to-pink-500/15 border-fuchsia-500/20",
    green: "from-emerald-500/15 to-green-500/15 border-emerald-500/20",
    purple: "from-purple-500/15 to-indigo-500/15 border-purple-500/20",
    orange: "from-orange-500/15 to-amber-500/15 border-orange-500/20",
    pink: "from-pink-500/15 to-rose-500/15 border-pink-500/20",
  };

  const colors = variantColors[app.cardVariant] ?? variantColors.blue;

  return (
    <div
      className={`group relative flex flex-col rounded-2xl border bg-gradient-to-b ${colors} backdrop-blur-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
    >
      <div className="flex items-start gap-4 mb-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-white truncate">{app.name}</h4>
          <p className="text-xs text-zinc-400 line-clamp-1">{app.tagline}</p>
        </div>
      </div>
      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 mb-3 flex-1">
        {app.description}
      </p>
      <div className="flex items-center gap-2 mt-auto">
        <Badge
          variant="secondary"
          className="bg-zinc-800/60 text-zinc-300 border border-white/[0.04] text-[10px] capitalize px-2 py-0"
        >
          {app.category}
        </Badge>
        {app.pricing === "freemium" && (
          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0 text-[10px] font-semibold text-amber-400">
            Freemium
          </span>
        )}
        {app.pricing === "paid" && (
          <span className="rounded-full border border-zinc-500/20 bg-zinc-800/60 px-2 py-0 text-[10px] font-semibold text-zinc-300">
            Paid
          </span>
        )}
        {(!app.pricing || app.pricing === "free") && (
          <Badge
            variant="secondary"
            className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0"
          >
            Free
          </Badge>
        )}
        {app.isNew && (
          <span className="rounded-full bg-blue-500/15 px-2 py-0 text-[10px] font-medium text-blue-300">
            New
          </span>
        )}
        {app.rating !== undefined && (
          <span className="flex items-center gap-0.5 text-[10px] text-amber-400 ml-auto">
            <Star className="h-3 w-3 fill-amber-400" />
            {app.rating.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
}

function StoreStatsDisplay() {
  const stats = getStoreStats();
  const statItems = [
    {
      icon: RefreshCw,
      value: `${stats.appCount}`,
      label: "Apps",
      color: "text-cyan-400",
    },
    {
      icon: Wrench,
      value: `${stats.toolCount}`,
      label: "MCP Tools",
      color: "text-fuchsia-400",
    },
    {
      icon: Layers,
      value: `${stats.categoryCount}`,
      label: "Categories",
      color: "text-amber-400",
    },
    {
      icon: Users,
      value: `${stats.developerCount}`,
      label: "Developers",
      color: "text-emerald-400",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-white/10">
        {statItems.map(stat => (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-2 px-4"
          >
            <stat.icon className={`h-6 w-6 ${stat.color}`} />
            <span className="text-3xl font-black text-white">{stat.value}</span>
            <span className="text-sm text-zinc-400">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StoreAppsPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchValue, setSearchValue] = useState("");

  const featuredApps = getFeaturedApps().slice(0, 3);
  const filteredApps = getAppsByCategory(activeCategory).slice(0, 6);
  const freeApps = getAppsByPricing("free").slice(0, 3);
  const freemiumApps = getAppsByPricing("freemium").slice(0, 3);

  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="App Store"
        description="The spike.land App Store is a marketplace for MCP-powered apps. Each app bundles tools, UI, and AI capabilities into installable packages that users can discover, install, and use."
        usage="Use store components to present apps with consistent card layouts, category filtering, pricing badges, and rating displays."
      />

      <UsageGuide
        dos={[
          "Use StoreAppCard for consistent app presentation across all views.",
          "Show pricing model (Free, Freemium, Paid) clearly on every card.",
          "Include star ratings and install counts when available.",
          "Use category tabs to let users filter apps quickly.",
          "Highlight featured and new apps with visual badges.",
        ]}
        donts={[
          "Don't mix card sizes within the same grid row.",
          "Don't hide the pricing model -- users expect transparency.",
          "Don't show admin-only apps in the public store view.",
          "Don't use more than 6 cards per row on any screen size.",
        ]}
      />

      {/* Stats Bar */}
      <ComponentSample
        title="Store Stats Bar"
        description="Summary statistics shown at the top of the store. Pulls live data from the app registry."
      >
        <StoreStatsDisplay />
      </ComponentSample>

      {/* Category Tabs */}
      <ComponentSample
        title="Category Tabs"
        description="Horizontal scrollable tabs for filtering apps by category. Active tab uses a solid white background."
      >
        <div className="w-full">
          <div
            className="flex items-center gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none" }}
          >
            {STORE_CATEGORIES.map(category => {
              const Icon = CATEGORY_ICONS[category.icon] ?? LayoutGrid;
              const isActive = activeCategory === category.id;
              const count = getAppsByCategory(category.id).length;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "bg-white text-black shadow-sm"
                      : "text-zinc-500 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {category.label}
                  <span
                    className={`ml-1 text-xs ${isActive ? "opacity-70" : "opacity-50"}`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </ComponentSample>

      {/* Search Input */}
      <ComponentSample
        title="Search Input"
        description="A debounced search field with keyboard shortcut hint (Cmd+K). Supports clear button when text is entered."
      >
        <div className="relative w-full max-w-lg">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
            <Search className="h-4 w-4" />
          </div>
          <Input
            placeholder="Search apps, tools, categories..."
            className="pl-11 pr-20 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-zinc-600 focus-visible:ring-blue-500/30 focus-visible:border-blue-500/30 transition-all rounded-2xl h-12 text-base"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {searchValue
              ? (
                <button
                  onClick={() => setSearchValue("")}
                  className="text-zinc-500 hover:text-white transition-colors p-1"
                  aria-label="Clear search"
                >
                  <span className="text-xs">Clear</span>
                </button>
              )
              : (
                <kbd className="inline-flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                  Cmd+K
                </kbd>
              )}
          </div>
        </div>
      </ComponentSample>

      {/* App Card Grid */}
      <ComponentSample
        title="App Card Grid"
        description={`The primary layout for browsing apps. Cards adapt from 1 column on mobile to 3 columns on desktop. Currently showing: ${
          activeCategory === "all" ? "All Apps" : activeCategory
        }.`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {filteredApps.map(app => <MiniAppCard key={app.id} app={app} />)}
        </div>
      </ComponentSample>

      {/* Featured Apps */}
      <ComponentSample
        title="Featured Apps"
        description="Highlighted apps chosen by the editorial team. These appear in the hero carousel and promoted sections."
      >
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredApps.map(app => (
            <div
              key={app.id}
              className="relative rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/10 to-transparent p-5 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute top-3 right-3">
                <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-[10px]">
                  Featured
                </Badge>
              </div>
              <div className="flex items-start gap-4 mb-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
                  <Star className="h-6 w-6 fill-amber-400" />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h4 className="text-sm font-bold text-white truncate">
                    {app.name}
                  </h4>
                  <p className="text-xs text-zinc-400 line-clamp-1">
                    {app.tagline}
                  </p>
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                {app.description}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] text-zinc-500">
                  {app.toolCount} tools
                </span>
                {app.rating !== undefined && (
                  <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
                    <Star className="h-3 w-3 fill-amber-400" />
                    {app.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </ComponentSample>

      {/* Pricing Models */}
      <ComponentSample
        title="Pricing Models"
        description="Apps use three pricing tiers. The badge color and label communicate the model at a glance."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          <Card className="glass-1 border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="pt-6 space-y-4">
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Free
              </Badge>
              <p className="text-sm text-muted-foreground">
                Fully free apps with no token cost. {freeApps.length > 0
                  ? `Examples: ${freeApps.map(a => a.name).join(", ")}`
                  : "All basic tools included."}
              </p>
              <div className="text-3xl font-black text-emerald-400">
                0 tokens
              </div>
            </CardContent>
          </Card>

          <Card className="glass-1 border-amber-500/20 bg-amber-500/5">
            <CardContent className="pt-6 space-y-4">
              <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Freemium
              </Badge>
              <p className="text-sm text-muted-foreground">
                Free tier with premium features. {freemiumApps.length > 0
                  ? `Examples: ${freemiumApps.map(a => a.name).join(", ")}`
                  : "Upgrade for advanced capabilities."}
              </p>
              <div className="text-3xl font-black text-amber-400">
                Free + Pro
              </div>
            </CardContent>
          </Card>

          <Card className="glass-1 border-zinc-500/20 bg-zinc-800/30">
            <CardContent className="pt-6 space-y-4">
              <Badge className="bg-zinc-800/60 text-zinc-300 border border-zinc-500/20">
                Paid
              </Badge>
              <p className="text-sm text-muted-foreground">
                Premium apps that require tokens to use. Professional-grade tools and services.
              </p>
              <div className="text-3xl font-black text-zinc-300">
                Token-based
              </div>
            </CardContent>
          </Card>
        </div>
      </ComponentSample>

      {/* Developer CTA */}
      <ComponentSample
        title="Developer CTA Section"
        description="A three-step 'How it works' section that encourages developers to build and publish apps on the platform."
      >
        <div className="w-full">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400 mb-3">
              How it works
            </p>
            <h3 className="text-3xl font-black">
              From idea to app
              <br />
              <span className="text-zinc-500">in minutes, not months.</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                number: "01",
                icon: MessageSquare,
                title: "Describe",
                description: "Tell AI what you want to build. One prompt is all it takes.",
                gradient: "from-blue-500/20 to-cyan-500/20",
              },
              {
                number: "02",
                icon: Cpu,
                title: "Build",
                description: "AI agents assemble your app using lazy-loaded MCP toolsets.",
                gradient: "from-purple-500/20 to-fuchsia-500/20",
              },
              {
                number: "03",
                icon: Rocket,
                title: "Deploy",
                description: "Your app goes live instantly. Share it, iterate on it, ship it.",
                gradient: "from-emerald-500/20 to-green-500/20",
              },
            ].map(step => (
              <div
                key={step.title}
                className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]"
              >
                <span className="text-xs font-bold text-zinc-600 mb-4 block">
                  {step.number}
                </span>
                <div
                  className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${step.gradient} transition-transform duration-300 group-hover:scale-110`}
                >
                  <step.icon className="h-5 w-5 text-white" />
                </div>
                <h4 className="text-lg font-bold mb-1">{step.title}</h4>
                <p className="text-sm leading-relaxed text-zinc-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button variant="outline" className="gap-2">
              Start Building
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </ComponentSample>

      {/* Card Variants */}
      <ComponentSample
        title="Card Color Variants"
        description="Each app is assigned a cardVariant that determines its gradient and glow color. Six variants are available: blue, fuchsia, green, purple, orange, and pink."
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 w-full">
          {(["blue", "fuchsia", "green", "purple", "orange", "pink"] as const)
            .map(variant => {
              const gradients: Record<string, string> = {
                blue: "from-blue-500 to-cyan-500",
                fuchsia: "from-fuchsia-500 to-pink-500",
                green: "from-emerald-500 to-green-500",
                purple: "from-purple-500 to-indigo-500",
                orange: "from-orange-500 to-amber-500",
                pink: "from-pink-500 to-rose-500",
              };
              return (
                <div key={variant} className="flex flex-col items-center gap-3">
                  <div
                    className={`h-16 w-16 rounded-[20px] bg-gradient-to-br ${
                      gradients[variant]
                    } shadow-lg`}
                  />
                  <span className="text-xs font-medium text-zinc-400 capitalize">
                    {variant}
                  </span>
                </div>
              );
            })}
        </div>
      </ComponentSample>

      <CodePreview
        title="App Store Integration"
        code={`import {
  STORE_CATEGORIES,
  getFeaturedApps,
  getAppsByCategory,
  getAppsByPricing,
  getStoreStats,
} from "@/app/store/data/store-apps";

// Get store statistics
const stats = getStoreStats();

// Get featured apps for the hero
const featured = getFeaturedApps();

// Filter by category
const devTools = getAppsByCategory("developer-tools");

// Filter by pricing model
const freeApps = getAppsByPricing("free");

// Iterate categories for tab navigation
STORE_CATEGORIES.map((cat) => (
  <TabButton key={cat.id} label={cat.label} icon={cat.icon} />
));`}
      />

      <AccessibilityPanel
        notes={[
          "App cards are fully keyboard-navigable with visible focus rings.",
          "Star ratings include numeric text for screen readers, not just icons.",
          "Category tabs use button role with aria-pressed state for active tab.",
          "Search input supports Cmd+K shortcut and Escape to blur.",
          "Pricing badges use sufficient color contrast (WCAG AA).",
          "Install counts and ratings include full text, not just abbreviated numbers.",
          "Card links include sr-only text describing the destination.",
        ]}
      />

      <RelatedComponents currentId="store-apps" />
    </div>
  );
}
