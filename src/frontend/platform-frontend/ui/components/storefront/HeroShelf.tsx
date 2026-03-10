import { Sparkles } from "lucide-react";
import type { McpAppSummary } from "../../hooks/useApps";
import { Link } from "@tanstack/react-router";

interface HeroShelfProps {
  featuredApps: McpAppSummary[];
}

export function HeroShelf({ featuredApps }: HeroShelfProps) {
  if (!featuredApps || featuredApps.length === 0) return null;

  // Take up to 3 for the hero banner, first is the main feature
  const heroApp = featuredApps[0];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/50 bg-card">
      {/* Abstract geometric background elements (Rubik identity: structured, dense) */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-card to-background pointer-events-none" />
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative flex flex-col md:flex-row items-center gap-8 p-8 md:p-12">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Featured App
          </div>

          <div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
              {heroApp.name}
            </h2>
            <p className="mt-4 max-w-lg text-lg text-muted-foreground leading-relaxed">
              {heroApp.tagline || heroApp.description}
            </p>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <Link
              to="/apps/$appSlug"
              params={{ appSlug: heroApp.slug }}
              className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-8 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
            >
              Get App
            </Link>
            <span className="text-sm font-semibold text-muted-foreground">
              {heroApp.pricing === "free" ? "Free" : "Premium"} • {heroApp.category}
            </span>
          </div>
        </div>

        <div className="shrink-0 hidden md:block">
          <div className="flex h-32 w-32 md:h-48 md:w-48 items-center justify-center rounded-[2rem] border border-border/40 bg-gradient-to-br from-muted/50 to-muted/20 text-7xl md:text-8xl shadow-2xl shadow-primary/10 ring-1 ring-white/10">
            {heroApp.emoji || "✨"}
          </div>
        </div>
      </div>
    </section>
  );
}
