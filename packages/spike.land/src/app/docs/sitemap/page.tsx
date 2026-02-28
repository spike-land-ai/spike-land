"use client";

import { Badge } from "@/components/ui/badge";
import { Link } from "@/components/ui/link";
import type { DocsPage } from "@/lib/docs/types";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, FileText, Globe, Map } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const SECTION_COLORS: Record<string, string> = {
  home: "text-emerald-400",
  admin: "text-red-400",
  orbit: "text-blue-400",
  apps: "text-purple-400",
  features: "text-cyan-400",
  storybook: "text-pink-400",
  auth: "text-amber-400",
  blog: "text-orange-400",
  albums: "text-teal-400",
  agents: "text-violet-400",
  merch: "text-rose-400",
  landing: "text-lime-400",
  connect: "text-sky-400",
  settings: "text-indigo-400",
};

function groupBySection(pages: DocsPage[]): Record<string, DocsPage[]> {
  const groups: Record<string, DocsPage[]> = {};
  // Filter out dynamic routes that contain [param] segments — they can't be used as Link hrefs
  const safePages = pages.filter(p => !p.path.includes("["));
  for (const page of safePages) {
    const section = page.section;
    if (!groups[section]) {
      groups[section] = [];
    }
    groups[section].push(page);
  }
  return groups;
}

interface SectionNodeProps {
  section: string;
  pages: DocsPage[];
  defaultOpen?: boolean;
}

function SectionNode(
  { section, pages, defaultOpen = false }: SectionNodeProps,
) {
  const [expanded, setExpanded] = useState(defaultOpen);
  const colorClass = SECTION_COLORS[section] ?? "text-muted-foreground";

  const toggle = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
      >
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
        </motion.div>
        <Globe className={cn("h-4 w-4", colorClass)} />
        <span className="text-sm font-semibold capitalize text-foreground flex-1">
          /{section}
        </span>
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 tabular-nums"
        >
          {pages.length}
        </Badge>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/5 px-4 py-2 space-y-0.5">
              {pages.map(page => (
                <Link
                  key={page.path}
                  href={page.path}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <FileText className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate">
                      {page.title !== page.path ? page.title : page.path}
                    </p>
                    {page.description && (
                      <p className="text-xs text-muted-foreground/50 truncate mt-0.5">
                        {page.description}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground/30 font-mono shrink-0">
                    {page.path}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SitemapPage() {
  const [pages, setPages] = useState<DocsPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/docs-data/pages-manifest.json")
      .then(res => res.json())
      .then((data: DocsPage[]) => {
        setPages(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const grouped = groupBySection(pages);
  const sectionNames = Object.keys(grouped).sort();

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="relative py-8 px-6 rounded-2xl overflow-hidden bg-white/5 border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-transparent to-blue-500/5 pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Map className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-heading tracking-tight text-foreground">
                Sitemap
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {loading
                  ? "Loading..."
                  : `${pages.length} pages across ${sectionNames.length} sections`}
              </p>
            </div>
          </div>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            Visual overview of every page on the spike.land platform, organized by section. Expand a
            section to see individual pages with their titles and descriptions.
          </p>
        </div>
      </div>

      {/* Tree View */}
      {loading
        ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="h-12 rounded-xl bg-white/5 border border-white/10 animate-pulse"
              />
            ))}
          </div>
        )
        : (
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {sectionNames.map((section, index) => {
              const sectionPages = grouped[section];
              if (!sectionPages) return null;

              return (
                <motion.div
                  key={section}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                >
                  <SectionNode
                    section={section}
                    pages={sectionPages}
                    defaultOpen={sectionPages.length <= 5}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        )}
    </div>
  );
}
