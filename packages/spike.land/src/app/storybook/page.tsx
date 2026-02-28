"use client";

import { storybookIconMap, storybookSections } from "@/components/storybook";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "@/components/ui/link";
import { cn } from "@/lib/utils";
import {
  Component,
  Hash,
  LayoutGrid,
  Palette,
  Search,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const NEW_SECTION_IDS = new Set([
  "agents",
  "state-machine",
  "create",
  "forms",
  "infographic",
  "bazdmeg",
  "store-apps",
]);

const QUICK_START_SNIPPETS = [
  {
    label: "shadcn/ui component",
    code:
      `import { Button } from "@/components/ui/button";\n\n<Button variant="default">Click me</Button>`,
  },
  {
    label: "Storybook helper",
    code:
      `import { PageHeader } from "@/components/storybook";\n\n<PageHeader title="My Page" description="Description here" />`,
  },
  {
    label: "Tailwind + cn utility",
    code:
      `import { cn } from "@/lib/utils";\n\n<div className={cn("base-class", condition && "extra-class")} />`,
  },
];

const CATEGORY_ORDER = [
  "Foundation",
  "Actions",
  "Elements",
  "Data",
  "Structure",
  "Status",
  "Overlays",
  "Principles",
  "Features",
  "Systems",
  "Content",
  "Apps",
  "Platform",
  "Marketing",
];

type Section = (typeof storybookSections)[number];

function groupSectionsByCategory(sections: readonly Section[]) {
  const grouped = sections.reduce<Record<string, Section[]>>((acc, section) => {
    const cat = section.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(section);
    return acc;
  }, {});

  return CATEGORY_ORDER.filter(cat => cat in grouped).map(cat => ({
    category: cat,
    sections: grouped[cat] ?? [],
  }));
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };
    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return value;
}

function AnimatedStat({
  value,
  label,
  Icon,
  isString = false,
}: {
  value: string | number;
  label: string;
  Icon: React.ComponentType<{ className?: string; }>;
  isString?: boolean;
}) {
  const numericValue = isString ? 0 : Number(value);
  const counted = useCountUp(numericValue);

  return (
    <div className="p-4 rounded-xl glass-0 border border-white/5 text-center flex flex-col items-center gap-1.5 group hover:border-primary/20 transition-colors duration-300">
      <Icon className="h-5 w-5 text-primary opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
      <span className="text-sm font-bold text-foreground tabular-nums">
        {isString ? value : counted}
      </span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

function QuickStartGuide() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary opacity-70" />
        <h2 className="text-base font-bold font-heading">Quick Start</h2>
      </div>
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="flex border-b border-white/10 bg-white/3">
          {QUICK_START_SNIPPETS.map((snippet, i) => (
            <button
              key={snippet.label}
              type="button"
              onClick={() => setActiveTab(i)}
              className={cn(
                "px-4 py-2 text-[11px] font-semibold transition-colors duration-150",
                activeTab === i
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {snippet.label}
            </button>
          ))}
        </div>
        <pre className="p-4 text-[11px] font-mono text-muted-foreground leading-relaxed overflow-x-auto bg-black/30 whitespace-pre-wrap">
          <code>{QUICK_START_SNIPPETS[activeTab]?.code}</code>
        </pre>
      </div>
    </section>
  );
}

function RecentlyUpdatedSection(
  { allSections }: { allSections: readonly Section[]; },
) {
  const newSections = allSections.filter(s => NEW_SECTION_IDS.has(s.id));

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Recently Updated
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {newSections.map(section => {
          const Icon = storybookIconMap[section.icon as keyof typeof storybookIconMap];
          return (
            <Link
              key={section.id}
              href={`/storybook/${section.id}`}
              className="block group"
            >
              <div className="h-full rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  {Icon && (
                    <Icon className="h-4 w-4 text-primary/70 group-hover:text-primary transition-colors duration-200" />
                  )}
                  <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors duration-200">
                    {section.label}
                  </span>
                  <Badge
                    variant="outline"
                    className="ml-auto text-primary border-primary/30 text-[9px] px-1.5 py-0 leading-4"
                  >
                    NEW
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                  {section.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default function StorybookPage() {
  const grouped = groupSectionsByCategory(storybookSections);
  const totalPages = grouped.reduce((sum, g) => sum + g.sections.length, 0);
  const totalSections = storybookSections.length;

  const [filterQuery, setFilterQuery] = useState("");
  const lowerFilter = filterQuery.toLowerCase();

  const filteredGrouped = filterQuery
    ? grouped
      .map(g => ({
        ...g,
        sections: g.sections.filter(
          s =>
            s.label.toLowerCase().includes(lowerFilter)
            || s.description?.toLowerCase().includes(lowerFilter)
            || g.category.toLowerCase().includes(lowerFilter),
        ),
      }))
      .filter(g => g.sections.length > 0)
    : grouped;

  const hasResults = filteredGrouped.length > 0;

  return (
    <div className="space-y-10 pb-20">
      {/* Hero */}
      <div className="relative py-10 px-6 rounded-2xl overflow-hidden glass-1 border-white/5 shadow-glow-primary/5">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-accent/5 pointer-events-none" />
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative z-10 text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-black font-heading tracking-tighter text-foreground drop-shadow-sm">
            spike.land
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-2xl mx-auto opacity-80 leading-snug">
            Design system &amp; component library for AI-powered creative tools.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/10 text-muted-foreground">
              {totalSections} Components
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/10 text-muted-foreground">
              {totalPages} Pages
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/10 text-muted-foreground">
              WCAG AA
            </span>
          </div>
        </div>
      </div>

      {/* Animated Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AnimatedStat
          Icon={Component}
          value={totalSections}
          label="Components"
        />
        <AnimatedStat Icon={LayoutGrid} value={totalPages} label="Pages" />
        <AnimatedStat
          Icon={ShieldCheck}
          value="WCAG AA"
          label="Accessible"
          isString
        />
        <AnimatedStat
          Icon={Palette}
          value="Dark + Light"
          label="Themes"
          isString
        />
      </div>

      {/* Quick Start Guide */}
      <QuickStartGuide />

      {/* Recently Updated */}
      <RecentlyUpdatedSection allSections={storybookSections} />

      {/* Search/filter bar above category grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
            <Input
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              placeholder="Filter categories and components..."
              aria-label="Filter components"
              className="pl-9 pr-8 h-9 bg-white/5 border-white/10 text-sm placeholder:text-muted-foreground/40 focus-visible:ring-primary/30"
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery("")}
                aria-label="Clear filter"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {filterQuery && (
            <span className="text-xs text-muted-foreground/50">
              {filteredGrouped.reduce((n, g) => n + g.sections.length, 0)} results
            </span>
          )}
        </div>

        {/* Category-Grouped Grid */}
        <div className="space-y-10">
          {hasResults
            ? filteredGrouped.map(({ category, sections }) => (
              <section
                key={category}
                id={category.toLowerCase()}
                aria-labelledby={`cat-${category.toLowerCase()}`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <h2
                    id={`cat-${category.toLowerCase()}`}
                    className="text-lg font-bold font-heading"
                  >
                    {category}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 border border-white/10 text-muted-foreground">
                    {sections.length}
                  </span>
                  <a
                    href={`#${category.toLowerCase()}`}
                    aria-label={`Link to ${category} section`}
                    className="text-muted-foreground/30 hover:text-primary transition-colors duration-150"
                  >
                    <Hash className="h-3.5 w-3.5" />
                  </a>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {sections.map(section => {
                    const Icon = storybookIconMap[
                      section.icon as keyof typeof storybookIconMap
                    ];
                    const isNew = NEW_SECTION_IDS.has(section.id);

                    return (
                      <Link
                        key={section.id}
                        href={`/storybook/${section.id}`}
                        className="block group"
                      >
                        <Card className="h-full border-white/0 hover:border-primary/30 hover:scale-[1.015] hover:shadow-xl hover:shadow-primary/8 shadow-lg transition-all duration-300 ease-out">
                          <CardHeader className="p-5">
                            <div className="flex items-center gap-3">
                              {Icon && (
                                <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 text-muted-foreground group-hover:bg-primary/15 group-hover:border-primary/30 group-hover:text-[#00E5FF] group-hover:shadow-[0_0_12px_rgba(0,229,255,0.2)] transition-all duration-300">
                                  <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                                </div>
                              )}
                              <div className="flex items-center gap-2 flex-wrap">
                                <CardTitle className="text-lg font-bold font-heading group-hover:text-foreground transition-colors duration-200">
                                  {section.label}
                                </CardTitle>
                                {isNew && (
                                  <Badge
                                    variant="outline"
                                    className="text-primary border-primary/30 text-[9px] px-1.5 py-0 leading-4"
                                  >
                                    NEW
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="mt-1">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                                {section.category}
                              </span>
                            </div>
                            <CardDescription className="mt-1.5 leading-relaxed line-clamp-2 text-xs">
                              {section.description}
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))
            : (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <Search className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground/40">
                  No components match your search
                </p>
                <button
                  type="button"
                  onClick={() => setFilterQuery("")}
                  className="text-xs text-primary/60 hover:text-primary transition-colors"
                >
                  Clear filter
                </button>
              </div>
            )}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-8 border-t border-white/5 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-3">
          <div className="w-1 h-1 rounded-full bg-success" />
          Stable Version 1.2.0
        </div>
        <p className="text-xs text-muted-foreground/40">
          Built for Spike Land Platform © 2026
        </p>
      </div>
    </div>
  );
}
