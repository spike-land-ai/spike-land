import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { groupAppsByCategory, useApps } from "../../hooks/useApps";
import { Sparkles } from "lucide-react";
import { useEffect, useMemo } from "react";

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "Identity & Access": "Auth, profiles, permissions, and organizational control surfaces.",
  "Browser Automation": "Apps that drive browsers, inspect pages, and automate web workflows.",
  "Code & Developer Tools": "Review, build, debug, and compose developer-facing MCP capabilities.",
  "Agents & Collaboration": "Chat-native and multi-actor workflows around agents, teams, and threads.",
  "Docs & Knowledge": "Runbooks, MDX surfaces, learning flows, and knowledge-oriented apps.",
  "Analytics & Insights": "Dashboards, signals, and reporting surfaces for business and product data.",
  "Commerce & Billing": "Payments, billing operations, and marketplace-facing app families.",
  "Media & Creative": "Image, video, and other creative generation or transformation workflows.",
  "Games & Simulation": "Interactive games, engines, and simulation-oriented MCP apps.",
  "Infrastructure & Ops": "Deployment, orchestration, terminal-heavy workflows, and operational tools.",
  "Integrations & APIs": "Gateway, bridge, and API integration apps that connect external systems.",
  "General Utility": "Cross-cutting MCP apps that do not fit a more specific product family yet.",
};

export function ToolsIndexPage() {
  const search = useSearch({ strict: false }) as { category?: string };
  const navigate = useNavigate();
  const { data: apps, isLoading, isError, error } = useApps();
  const groupedApps = useMemo(() => groupAppsByCategory(apps ?? []), [apps]);
  const activeGroup = useMemo(() => {
    if (groupedApps.length === 0) return null;
    return groupedApps.find((group) => group.category === search.category) ?? groupedApps[0];
  }, [groupedApps, search.category]);

  useEffect(() => {
    if (!activeGroup || search.category === activeGroup.category) return;

    void navigate({
      search: (prev) => ({
        ...prev,
        category: activeGroup.category,
      }),
      replace: true,
    });
  }, [activeGroup, navigate, search.category]);

  const selectCategory = (category: string) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        category,
      }),
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div role="status" aria-live="polite" className="text-muted-foreground animate-pulse">
          Loading apps...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">MCP Apps</h1>
        </div>
        <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
          <p className="text-muted-foreground">Unable to load apps. Please try again later.</p>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "An unexpected error occurred."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">MCP Apps</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Interactive stateful workflows powered by MCP tools.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
          <Sparkles className="w-3.5 h-3.5" />
          {apps?.length || 0} Apps
        </span>
      </div>

      {!apps || apps.length === 0 ? (
        <div className="rounded-xl border border-border border-dashed p-12 text-center text-muted-foreground">
          No apps available at the moment.
        </div>
      ) : (
        <div className="space-y-8">
          <p className="text-sm text-muted-foreground">
            Browse app families first. Once you pick a category, the grid below only shows the MCP
            apps inside that category.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {groupedApps.map((group) => {
              const isActive = activeGroup?.category === group.category;

              return (
                <button
                  key={group.category}
                  type="button"
                  onClick={() => selectCategory(group.category)}
                  className="rounded-2xl border p-5 text-left transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    borderColor: isActive
                      ? "color-mix(in srgb, var(--primary-color) 45%, transparent)"
                      : "color-mix(in srgb, var(--border-color) 82%, transparent)",
                    background: isActive
                      ? "linear-gradient(180deg, color-mix(in srgb, var(--primary-color) 8%, var(--card-bg)), color-mix(in srgb, var(--card-bg) 92%, transparent))"
                      : "linear-gradient(180deg, color-mix(in srgb, var(--card-bg) 96%, transparent), color-mix(in srgb, var(--muted-bg) 58%, transparent))",
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-foreground">{group.category}</h2>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary ring-1 ring-inset ring-primary/20">
                      {group.apps.length} app{group.apps.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {CATEGORY_DESCRIPTIONS[group.category] ??
                      "A grouped set of MCP apps built around a shared capability family."}
                  </p>
                </button>
              );
            })}
          </div>

          {activeGroup ? (
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-3">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{activeGroup.category}</h2>
                  <p className="text-sm text-muted-foreground">
                    {CATEGORY_DESCRIPTIONS[activeGroup.category] ??
                      "A grouped set of MCP apps built around a shared capability family."}
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary ring-1 ring-inset ring-primary/20">
                  Active Category
                </span>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {activeGroup.apps.map((app) => (
                  <Link
                    key={app.slug}
                    to="/apps/$appSlug"
                    params={{
                      appSlug: app.slug,
                    }}
                    className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:scale-[1.01] hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="mb-4 flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50 text-2xl transition-transform group-hover:scale-110">
                        {app.emoji || "🔧"}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                          {app.name}
                        </h3>
                        <p className="text-xs font-medium text-muted-foreground">
                          {app.tool_count} {app.tool_count === 1 ? "tool" : "tools"}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary ring-1 ring-inset ring-primary/20">
                        {activeGroup.category}
                      </span>
                    </div>

                    <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                      {app.description}
                    </p>

                    <div className="mt-6 flex items-center justify-end text-sm font-semibold text-primary/80 group-hover:text-primary">
                      Launch App{" "}
                      <span
                        aria-hidden="true"
                        className="ml-1 transition-transform group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
