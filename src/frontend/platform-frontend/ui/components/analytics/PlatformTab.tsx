import type { TimeRange, DashboardData, FunnelRow, PlatformEvent } from "./types";

const FUNNEL_ORDER = [
  "signup_completed",
  "mcp_server_connected",
  "first_tool_call",
  "second_session",
  "upgrade_completed",
];

const FUNNEL_LABELS: Record<string, string> = {
  signup_completed: "Signup",
  mcp_server_connected: "MCP Connected",
  first_tool_call: "First Tool Call",
  second_session: "Second Session",
  upgrade_completed: "Upgrade",
};

function ConversionFunnel({ data }: { data: FunnelRow[] }) {
  const ordered = FUNNEL_ORDER.map((type) => {
    const row = data.find((r) => r.event_type === type);
    return {
      type,
      label: FUNNEL_LABELS[type] ?? type,
      count: row?.unique_users ?? 0,
    };
  }).filter((step) => step.count > 0 || data.length > 0);

  const maxCount = Math.max(...ordered.map((s) => s.count), 1);

  if (ordered.every((s) => s.count === 0)) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border-2 border-dashed border-border text-muted-foreground">
        No funnel data yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {ordered.map((step, i) => {
        const prevCount = i > 0 ? (ordered[i - 1]?.count ?? 0) : 0;
        const pct = i > 0 && prevCount > 0 ? ((step.count / prevCount) * 100).toFixed(1) : null;
        return (
          <div key={step.type} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{step.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-foreground font-semibold">{step.count}</span>
                {pct && <span className="text-xs text-muted-foreground">{pct}% of prev</span>}
              </div>
            </div>
            <div className="h-3 w-full rounded-full bg-muted">
              <div
                className="h-3 rounded-full bg-primary transition-all"
                style={{ width: `${Math.max(2, (step.count / maxCount) * 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 1000) return "just now";
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return `${Math.floor(diff / 86400_000)}d ago`;
}

function isRealtimeRange(range: TimeRange): boolean {
  return ["1m", "5m", "15m", "1h"].includes(range);
}

export function PlatformTab({
  range,
  data,
  loading,
}: {
  range: TimeRange;
  data: DashboardData | null;
  loading: boolean;
}) {
  const summary = data?.summary;
  const recentEvents: PlatformEvent[] = (data?.recentEvents ?? []) as PlatformEvent[];
  const showFunnel = data?.funnel !== null && data?.funnel !== undefined;
  const isRealtime = isRealtimeRange(range);
  const toolInvocations =
    summary?.eventsByType.find((e) => e.event_type === "tool_use")?.count ?? 0;
  const signups =
    summary?.eventsByType.find((e) => e.event_type === "signup_completed")?.count ?? 0;
  const conversionRate =
    summary && summary.uniqueUsers > 0 ? ((signups / summary.uniqueUsers) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* Platform KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rubik-panel p-5">
          <p className="text-sm text-muted-foreground">Unique Visitors</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {loading ? "..." : String(summary?.uniqueUsers ?? 0)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {isRealtime && data?.activeUsers != null ? `${data.activeUsers} active now` : range}
          </p>
        </div>
        <div className="rubik-panel p-5">
          <p className="text-sm text-muted-foreground">Total Events</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {loading ? "..." : String(summary?.totalEvents ?? 0)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{range}</p>
        </div>
        <div className="rubik-panel p-5">
          <p className="text-sm text-muted-foreground">Tool Invocations</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {loading ? "..." : String(toolInvocations)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{range}</p>
        </div>
        <div className="rubik-panel p-5">
          <p className="text-sm text-muted-foreground">Conversion Rate</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {loading ? "..." : `${conversionRate}%`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {showFunnel ? "signups / visitors" : `${range} (need 7d+)`}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tool Usage */}
        <div className="rubik-panel p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Top Tools by Usage
          </h2>
          {!summary?.toolUsage.length ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border">
              <p className="text-sm text-muted-foreground">
                {loading ? "Loading..." : "No tool usage data yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {summary.toolUsage.slice(0, 10).map((tool) => (
                <div
                  key={tool.tool_name}
                  className="flex items-center justify-between rounded-2xl bg-muted px-3 py-2"
                >
                  <span className="text-sm font-medium text-foreground">{tool.tool_name}</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{
                        width: `${Math.max(12, (tool.count / (summary.toolUsage[0]?.count ?? 1)) * 120)}px`,
                      }}
                    />
                    <span className="text-xs text-muted-foreground">{tool.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rubik-panel p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recent Activity
          </h2>
          {recentEvents.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border">
              <p className="text-sm text-muted-foreground">
                {loading ? "Loading..." : "No recent events"}
              </p>
            </div>
          ) : (
            <div className="max-h-80 space-y-1 overflow-y-auto">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-muted"
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {event.event_type}
                    </span>
                    <span className="text-sm text-muted-foreground">{event.source}</span>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {isRealtime
                      ? relativeTime(event.created_at)
                      : new Date(event.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conversion Funnel */}
        {showFunnel && data?.funnel && (
          <div className="rubik-panel p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Conversion Funnel
            </h2>
            <ConversionFunnel data={data.funnel} />
          </div>
        )}

        {!showFunnel && !loading && (
          <div className="rubik-panel p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Conversion Funnel
            </h2>
            <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border">
              <p className="text-sm text-muted-foreground">Requires 7d+ range</p>
              <p className="max-w-52 text-center text-xs text-muted-foreground/70">
                Switch to a 7-day or longer time window to view the signup-to-upgrade funnel.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Events by Type */}
      {summary?.eventsByType && summary.eventsByType.length > 0 && (
        <div className="rubik-panel p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Events by Type
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-2 font-medium">Event Type</th>
                  <th className="pb-2 text-right font-medium">Count</th>
                </tr>
              </thead>
              <tbody>
                {summary.eventsByType.map((entry) => (
                  <tr key={entry.event_type} className="border-b border-border last:border-0">
                    <td className="py-2 font-medium text-foreground">{entry.event_type}</td>
                    <td className="py-2 text-right text-foreground">{entry.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
