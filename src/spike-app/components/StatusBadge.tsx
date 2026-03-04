type AppStatus = "prompting" | "drafting" | "building" | "live" | "archived" | "deleted";

const statusConfig: Record<AppStatus, { color: string; icon: string }> = {
  prompting: { color: "bg-warning text-warning-foreground", icon: "?" },
  drafting: { color: "bg-info text-info-foreground", icon: "\u270E" },
  building: { color: "bg-warning text-warning-foreground", icon: "\u2699" },
  live: { color: "bg-success text-success-foreground", icon: "\u25CF" },
  archived: { color: "bg-muted text-muted-foreground", icon: "\u25A0" },
  deleted: { color: "bg-destructive text-destructive-foreground", icon: "\u2715" },
};

interface StatusBadgeProps {
  status: AppStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.drafting;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}
    >
      <span className="text-[10px]">{config.icon}</span>
      {status}
    </span>
  );
}

export type { AppStatus };
