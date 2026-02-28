"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ToolMetric {
  tool: string;
  calls: number;
  errors: number;
  errorRate: number;
  avgMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  tokens: number;
}

interface SystemHealth {
  database: { status: string; latencyMs: number; };
  redis: { status: string; latencyMs: number; };
  invocations24h: number;
  errors24h: number;
  errorRate: string;
  avgLatency: number;
  totalTokens: number;
  activeTools: number;
}

interface UserAnalytic {
  userId: string;
  calls: number;
  tokens: number;
  errors: number;
  uniqueTools: number;
}

type TabId = "metrics" | "health" | "users";

export function McpDashboardClient() {
  const [activeTab, setActiveTab] = useState<TabId>("metrics");
  const [metrics, setMetrics] = useState<ToolMetric[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [users, setUsers] = useState<UserAnalytic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodHours, setPeriodHours] = useState(24);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/mcp-health?tab=${activeTab}&period=${periodHours}`,
      );
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json() as {
        metrics?: ToolMetric[];
        health?: SystemHealth;
        users?: UserAnalytic[];
      };
      if (data.metrics) setMetrics(data.metrics);
      if (data.health) setHealth(data.health);
      if (data.users) setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [activeTab, periodHours]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const tabs: Array<{ id: TabId; label: string; }> = [
    { id: "metrics", label: "Tool Metrics" },
    { id: "health", label: "System Health" },
    { id: "users", label: "User Analytics" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto pt-24 pb-12 px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">MCP Observability Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Per-tool metrics, system health, and cost attribution
          </p>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <select
            value={periodHours}
            onChange={e => setPeriodHours(Number(e.target.value))}
            className="ml-auto px-3 py-2 rounded-md border bg-background text-sm"
          >
            <option value={1}>Last 1h</option>
            <option value={24}>Last 24h</option>
            <option value={168}>Last 7d</option>
            <option value={720}>Last 30d</option>
          </select>
          <button
            onClick={() => void fetchData()}
            className="px-3 py-2 rounded-md bg-muted text-sm hover:bg-muted/80"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
            {error}
          </div>
        )}

        {loading
          ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )
          : (
            <>
              {activeTab === "metrics" && <ToolMetricsTab metrics={metrics} />}
              {activeTab === "health" && <SystemHealthTab health={health} />}
              {activeTab === "users" && <UserAnalyticsTab users={users} />}
            </>
          )}
      </div>
    </div>
  );
}

function ToolMetricsTab({ metrics }: { metrics: ToolMetric[]; }) {
  if (metrics.length === 0) {
    return <EmptyState message="No tool invocations found for the selected period." />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Per-Tool Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tool</TableHead>
              <TableHead className="text-right">Calls</TableHead>
              <TableHead className="text-right">Errors</TableHead>
              <TableHead className="text-right">Error %</TableHead>
              <TableHead className="text-right">p50 (ms)</TableHead>
              <TableHead className="text-right">p95 (ms)</TableHead>
              <TableHead className="text-right">p99 (ms)</TableHead>
              <TableHead className="text-right">Tokens</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map(m => (
              <TableRow key={m.tool}>
                <TableCell className="font-mono text-sm">{m.tool}</TableCell>
                <TableCell className="text-right">
                  {m.calls.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">{m.errors}</TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={m.errorRate > 5
                      ? "destructive"
                      : m.errorRate > 1
                      ? "secondary"
                      : "outline"}
                  >
                    {m.errorRate.toFixed(1)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{m.p50Ms}</TableCell>
                <TableCell className="text-right">{m.p95Ms}</TableCell>
                <TableCell className="text-right">
                  <span
                    className={m.p99Ms > 1000
                      ? "text-destructive font-medium"
                      : ""}
                  >
                    {m.p99Ms}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {m.tokens.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function SystemHealthTab({ health }: { health: SystemHealth | null; }) {
  if (!health) {
    return <EmptyState message="Health data unavailable." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Database</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={health.database.status} />
            {health.database.latencyMs >= 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Latency: {health.database.latencyMs}ms
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Redis</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={health.redis.status} />
            {health.redis.latencyMs >= 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Latency: {health.redis.latencyMs}ms
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">MCP Metrics (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <MetricCard
              label="Invocations"
              value={health.invocations24h.toLocaleString()}
            />
            <MetricCard
              label="Errors"
              value={`${health.errors24h} (${health.errorRate}%)`}
            />
            <MetricCard label="Avg Latency" value={`${health.avgLatency}ms`} />
            <MetricCard
              label="Total Tokens"
              value={health.totalTokens.toLocaleString()}
            />
            <MetricCard
              label="Active Tools (1h)"
              value={String(health.activeTools)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UserAnalyticsTab({ users }: { users: UserAnalytic[]; }) {
  if (users.length === 0) {
    return <EmptyState message="No user activity found for the selected period." />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Analytics & Cost Attribution</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead className="text-right">Calls</TableHead>
              <TableHead className="text-right">Tokens</TableHead>
              <TableHead className="text-right">Errors</TableHead>
              <TableHead className="text-right">Unique Tools</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.userId}>
                <TableCell className="font-mono text-sm">{u.userId}</TableCell>
                <TableCell className="text-right">
                  {u.calls.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {u.tokens.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">{u.errors}</TableCell>
                <TableCell className="text-right">{u.uniqueTools}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string; }) {
  const variant = status === "HEALTHY"
    ? "outline"
    : status === "DEGRADED"
    ? "secondary"
    : "destructive";
  return <Badge variant={variant}>{status}</Badge>;
}

function MetricCard({ label, value }: { label: string; value: string; }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string; }) {
  return (
    <Card>
      <CardContent className="py-12 text-center text-muted-foreground">
        {message}
      </CardContent>
    </Card>
  );
}
