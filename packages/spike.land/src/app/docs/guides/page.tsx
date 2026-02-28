import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/components/ui/link";
import type { DocsGuide } from "@/lib/docs/types";
import { BookOpen, FileText } from "lucide-react";
import { truncate } from "@/lib/utils";

import markdownManifest from "@/lib/docs/generated/markdown-manifest.json";

export const metadata = {
  title: "Guides & Documentation - spike.land",
  description:
    "Browse all guides, architecture docs, best practices, and more for the spike.land platform.",
};

const CATEGORY_COLORS: Record<string, string> = {
  architecture: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  "best-practices": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  features: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  guides: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  api: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  business: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  blog: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  security: "bg-red-500/15 text-red-400 border-red-500/20",
  database: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  integrations: "bg-teal-500/15 text-teal-400 border-teal-500/20",
  general: "bg-white/10 text-muted-foreground border-white/10",
  archive: "bg-white/5 text-muted-foreground/60 border-white/5",
  plans: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  migrations: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  sprints: "bg-lime-500/15 text-lime-400 border-lime-500/20",
  testing: "bg-sky-500/15 text-sky-400 border-sky-500/20",
};

function groupByCategory(guides: DocsGuide[]): Record<string, DocsGuide[]> {
  const groups: Record<string, DocsGuide[]> = {};
  for (const guide of guides) {
    const category = guide.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(guide);
  }
  return groups;
}

export default function GuidesPage() {
  const guides = markdownManifest as DocsGuide[];
  const grouped = groupByCategory(guides);
  const categoryNames = Object.keys(grouped).sort();

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="relative py-8 px-6 rounded-2xl overflow-hidden bg-white/5 border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-purple-500/5 pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <BookOpen className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-heading tracking-tight text-foreground">
                Guides & Documentation
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {guides.length} guides across {categoryNames.length} categories
              </p>
            </div>
          </div>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            Architecture docs, best practices, feature guides, integration tutorials, and more.
            Everything you need to build on the spike.land platform.
          </p>
        </div>
      </div>

      {/* Category Sections */}
      {categoryNames.map(category => {
        const categoryGuides = grouped[category];
        if (!categoryGuides) return null;

        return (
          <section key={category} className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold font-heading capitalize tracking-tight text-foreground">
                {category.replace(/-/g, " ")}
              </h2>
              <span className="text-[10px] font-semibold bg-white/10 text-muted-foreground px-2 py-0.5 rounded-md tabular-nums">
                {categoryGuides.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {categoryGuides.map(guide => (
                <Link
                  key={guide.slug}
                  href={`/docs/guides/${guide.slug}`}
                  className="group block no-underline"
                >
                  <Card className="h-full bg-white/5 border border-white/10 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(var(--primary-rgb,59,130,246),0.15)] transition-all duration-300">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="p-1.5 rounded-lg bg-white/10 border border-white/10 text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <Badge
                          className={`text-[9px] px-1.5 py-0 shrink-0 border ${
                            CATEGORY_COLORS[category]
                              ?? "bg-white/10 text-muted-foreground border-white/10"
                          }`}
                        >
                          {category}
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-semibold leading-snug mt-2 line-clamp-2">
                        {guide.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {truncate(guide.excerpt, 160)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
