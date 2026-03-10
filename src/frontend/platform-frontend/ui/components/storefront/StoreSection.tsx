import { StoreAppCard } from "./StoreAppCard";
import type { McpAppSummary } from "../../hooks/useApps";

interface StoreSectionProps {
  title: string;
  subtitle?: string;
  apps: McpAppSummary[];
  categoryName?: string;
  layout?: "grid" | "list";
  onViewAll?: () => void;
}

export function StoreSection({
  title,
  subtitle,
  apps,
  categoryName,
  layout = "grid",
  onViewAll,
}: StoreSectionProps) {
  if (!apps || apps.length === 0) return null;

  return (
    <section className="space-y-4 pt-6">
      <div className="flex items-end justify-between border-b border-border/40 pb-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {onViewAll && apps.length >= 4 && (
          <button
            onClick={onViewAll}
            className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
          >
            See All
          </button>
        )}
      </div>

      {layout === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {apps.map((app) => (
            <StoreAppCard
              key={app.slug}
              app={app}
              categoryName={categoryName}
              layout="grid"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-x-8 gap-y-2 md:grid-cols-2 lg:grid-cols-3">
          {apps.map((app, index) => (
            <StoreAppCard
              key={app.slug}
              app={app}
              categoryName={categoryName}
              rank={index + 1}
              layout="list"
            />
          ))}
        </div>
      )}
    </section>
  );
}
