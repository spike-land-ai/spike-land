import { Link } from "@tanstack/react-router";
import { type AppStatus, StatusBadge } from "./StatusBadge";

interface AppCardProps {
  id: string;
  name: string;
  description?: string;
  category?: string;
  status: AppStatus;
  ownerName?: string;
  createdAt?: string;
  toolCount?: number;
}

const categoryColors: Record<string, string> = {
  mcp: "bg-info text-info-foreground",
  utility: "bg-accent text-accent-foreground",
  game: "bg-destructive/50 text-destructive-foreground",
  tool: "bg-primary/10 text-primary",
  social: "bg-success/50 text-success-foreground",
  other: "bg-muted text-muted-foreground",
};

export function AppCard({
  id,
  name,
  description,
  category,
  status,
  ownerName,
  createdAt,
  toolCount,
}: AppCardProps) {
  return (
    <Link
      to="/apps/$appId"
      params={{ appId: id }}
      search={{ tab: "Overview" }}
      className="block rounded-xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md hover:bg-muted/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold leading-tight text-foreground">{name}</h3>
          <span className="inline-flex items-center rounded bg-info px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-info-foreground">
            MCP
          </span>
        </div>
        <StatusBadge status={status} />
      </div>
      {description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        {category && (
          <span
            className={`rounded-full px-2 py-0.5 font-medium ${
              categoryColors[category] ?? categoryColors.other
            }`}
          >
            {category}
          </span>
        )}
        {toolCount !== undefined && toolCount > 0 && (
          <span>{toolCount} tool{toolCount === 1 ? "" : "s"}</span>
        )}
        {ownerName && <span>{ownerName}</span>}
        {createdAt && (
          <>
            <span>&middot;</span>
            <span>{new Date(createdAt).toLocaleDateString()}</span>
          </>
        )}
      </div>
    </Link>
  );
}

export type { AppCardProps };
