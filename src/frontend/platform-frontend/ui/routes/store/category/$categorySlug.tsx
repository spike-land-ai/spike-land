import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { StoreSection } from "../../components/storefront";
import { groupAppsByCategory, useApps } from "../../hooks/useApps";

export function StoreCategoryPage() {
  const { categorySlug } = useParams({ strict: false }) as { categorySlug: string };
  const navigate = useNavigate();
  const { data: apps, isLoading, isError } = useApps();

  const groupedApps = useMemo(() => groupAppsByCategory(apps ?? []), [apps]);

  // Convert slug back to display name: "ai-tools" → match against group categories
  const activeGroup = useMemo(() => {
    if (!groupedApps.length) return null;
    return (
      groupedApps.find(
        (g) => g.category.toLowerCase().replace(/[^a-z0-9]+/g, "-") === categorySlug,
      ) ?? null
    );
  }, [groupedApps, categorySlug]);

  const displayName = activeGroup?.category ?? categorySlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  if (isLoading) {
    return (
      <div className="rubik-container-wide rubik-page">
        <div className="space-y-8">
          <div className="rubik-panel animate-pulse p-6">
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="mt-2 h-8 w-48 rounded bg-muted" />
          </div>
          <StoreSection title={displayName} apps={[]} layout="grid" isLoading skeletonCount={8} />
        </div>
      </div>
    );
  }

  if (isError || (!isLoading && !activeGroup)) {
    return (
      <div className="rubik-container rubik-page">
        <div className="rubik-panel space-y-4 p-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Category not found</h1>
          <p className="text-muted-foreground">
            The category <span className="font-semibold text-foreground">{displayName}</span> does
            not exist or has no apps yet.
          </p>
          <Link
            to="/apps"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Browse All Apps
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rubik-container-wide rubik-page space-y-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/apps" className="hover:text-foreground transition-colors">
          App Store
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-foreground">{displayName}</span>
      </nav>

      <header className="rubik-panel-strong flex flex-col gap-4 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Category
          </span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {displayName}
          </h1>
          {activeGroup && (
            <p className="text-muted-foreground">
              {activeGroup.apps.length} {activeGroup.apps.length === 1 ? "app" : "apps"} available
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void navigate({ to: "/apps" })}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:border-primary/20 hover:text-primary transition-colors"
          >
            All Categories
          </button>
        </div>
      </header>

      {/* Sibling categories */}
      {groupedApps.length > 1 && (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-2">
            {groupedApps.map((g) => {
              const slug = g.category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
              const isActive = slug === categorySlug;
              return (
                <Link
                  key={g.category}
                  to="/store/category/$categorySlug"
                  params={{ categorySlug: slug }}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {g.category}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {activeGroup && (
        <StoreSection
          title={`All ${displayName} Apps`}
          apps={activeGroup.apps}
          categoryName={activeGroup.category}
          layout="grid"
        />
      )}
    </div>
  );
}
