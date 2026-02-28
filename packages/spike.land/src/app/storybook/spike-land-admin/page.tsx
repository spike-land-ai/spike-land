"use client";

import {
  AccessibilityPanel,
  Breadcrumbs,
  CodePreview,
  ComponentSample,
  PageHeader,
  RelatedComponents,
  UsageGuide,
} from "@/components/storybook";
import { AdminActivityFeed } from "@/components/spike-land-admin/AdminActivityFeed";
import { AdminStatsBar } from "@/components/spike-land-admin/AdminStatsBar";
import { AdminUserRow } from "@/components/spike-land-admin/AdminUserRow";
import { SystemHealthCard } from "@/components/spike-land-admin/SystemHealthCard";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockStats = [
  {
    label: "Total Users",
    value: "12,450",
    delta: "+5.2%",
    deltaType: "up" as const,
    icon: "👤",
  },
  {
    label: "MRR",
    value: "$8,320",
    delta: "+12%",
    deltaType: "up" as const,
    icon: "💰",
  },
  {
    label: "Active Sessions",
    value: "847",
    delta: "+3.1%",
    deltaType: "up" as const,
    icon: "⚡",
  },
  {
    label: "Errors (24h)",
    value: "3",
    delta: "-80%",
    deltaType: "down" as const,
    icon: "🔴",
  },
];

const mockUsers = [
  {
    userId: "u-001",
    email: "nova@example.com",
    name: "Nova Star",
    plan: "enterprise" as const,
    joinedDate: "2024-01-15",
    lastActive: "2 min ago",
    avatarInitials: "NS",
  },
  {
    userId: "u-002",
    email: "pixel@example.com",
    name: "Pixel Forge",
    plan: "pro" as const,
    joinedDate: "2024-03-22",
    lastActive: "1 hr ago",
    avatarInitials: "PF",
  },
  {
    userId: "u-003",
    email: "code@example.com",
    name: "Code Alchemist",
    plan: "pro" as const,
    joinedDate: "2024-05-10",
    lastActive: "Yesterday",
    avatarInitials: "CA",
  },
  {
    userId: "u-004",
    email: "byte@example.com",
    name: "Byte Queen",
    plan: "free" as const,
    joinedDate: "2024-09-01",
    lastActive: "3 days ago",
    avatarInitials: "BQ",
  },
  {
    userId: "u-005",
    email: "syntax@example.com",
    name: "Syntax Samurai",
    plan: "free" as const,
    joinedDate: "2024-11-17",
    lastActive: "1 week ago",
    avatarInitials: "SS",
  },
];

const mockServices = [
  { name: "API Gateway", status: "healthy" as const, latencyMs: 42, uptime: "99.99%" },
  { name: "Database (Postgres)", status: "healthy" as const, latencyMs: 8, uptime: "99.97%" },
  { name: "Redis Cache", status: "healthy" as const, latencyMs: 2, uptime: "100%" },
  { name: "Auth Service", status: "degraded" as const, latencyMs: 340, uptime: "98.2%" },
  { name: "Email Worker", status: "healthy" as const, latencyMs: 120, uptime: "99.85%" },
  { name: "Stripe Webhooks", status: "down" as const, uptime: "0%" },
];

const now = new Date();
const mockActivities = [
  {
    id: "a-1",
    timestamp: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
    action: "signed up",
    actor: "nova@example.com",
    type: "user" as const,
  },
  {
    id: "a-2",
    timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
    action: "upgraded plan to",
    actor: "pixel@example.com",
    target: "Enterprise",
    type: "payment" as const,
  },
  {
    id: "a-3",
    timestamp: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
    action: "deployed config update",
    actor: "system",
    target: "auth-service",
    type: "system" as const,
  },
  {
    id: "a-4",
    timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    action: "reported a 502 error on",
    actor: "byte@example.com",
    target: "/api/mcp",
    type: "error" as const,
  },
  {
    id: "a-5",
    timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
    action: "processed payment of $99",
    actor: "stripe",
    target: "for syntax@example.com",
    type: "payment" as const,
  },
];

// ---------------------------------------------------------------------------
// Code snippets
// ---------------------------------------------------------------------------

const codeSnippets = {
  statsBar: `import { AdminStatsBar } from "@/components/spike-land-admin/AdminStatsBar";

<AdminStatsBar
  stats={[
    { label: "Total Users", value: "12,450", delta: "+5.2%", deltaType: "up", icon: "👤" },
    { label: "MRR", value: "$8,320", delta: "+12%", deltaType: "up", icon: "💰" },
  ]}
/>`,
  userRow: `import { AdminUserRow } from "@/components/spike-land-admin/AdminUserRow";

<Table>
  <TableBody>
    <AdminUserRow
      userId="u-001"
      email="nova@example.com"
      name="Nova Star"
      plan="enterprise"
      joinedDate="2024-01-15"
      lastActive="2 min ago"
      avatarInitials="NS"
    />
  </TableBody>
</Table>`,
  systemHealth: `import { SystemHealthCard } from "@/components/spike-land-admin/SystemHealthCard";

<SystemHealthCard
  services={[
    { name: "API Gateway", status: "healthy", latencyMs: 42, uptime: "99.99%" },
    { name: "Auth Service", status: "degraded", latencyMs: 340, uptime: "98.2%" },
    { name: "Stripe Webhooks", status: "down" },
  ]}
/>`,
  activityFeed:
    `import { AdminActivityFeed } from "@/components/spike-land-admin/AdminActivityFeed";

<AdminActivityFeed
  activities={[
    {
      id: "a-1",
      timestamp: new Date().toISOString(),
      action: "signed up",
      actor: "nova@example.com",
      type: "user",
    },
  ]}
/>`,
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SpikeLandAdminPage() {
  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="Admin Dashboard"
        description="spike-land-admin components provide the building blocks for the platform administration interface. They surface KPI metrics, user management, system health, and real-time activity in a dark-themed, data-dense layout."
        usage="Use AdminStatsBar at the top of admin pages to surface key metrics. Place SystemHealthCard alongside AdminActivityFeed for operational awareness. Use AdminUserRow inside a Table for browsing and managing users."
      />

      <UsageGuide
        dos={[
          "Render AdminStatsBar at the very top of every admin view for immediate KPI visibility.",
          "Use deltaType 'down' for error counts that improve when they go lower.",
          "Show SystemHealthCard with real latency data so on-call engineers can triage quickly.",
          "Keep AdminActivityFeed limited to the last 20-50 events to avoid performance issues.",
          "Use plan badge color coding consistently: gray=free, blue=pro, purple=enterprise.",
        ]}
        donts={[
          "Don't show admin components to non-admin users — always gate behind role checks.",
          "Don't use deltaType 'up' for error counts — that implies improvement, which is misleading.",
          "Avoid embedding SystemHealthCard inside a scrollable modal — it loses context.",
          "Don't truncate user email addresses in AdminUserRow — they are needed for identification.",
          "Avoid polling AdminActivityFeed more than once per 5 seconds to avoid backend pressure.",
        ]}
      />

      {/* KPI Stats Bar */}
      <ComponentSample
        title="KPI Stats Bar"
        description="A responsive grid of KPI tiles, each showing an icon, label, current value, and a delta indicator with directional trend arrows."
      >
        <AdminStatsBar stats={mockStats} />
      </ComponentSample>

      {/* User Table */}
      <ComponentSample
        title="User Table Rows"
        description="User management table rows with avatar initials, name, email, plan badge (color-coded by tier), join date, last active timestamp, and user ID."
      >
        <div className="w-full max-w-4xl border border-zinc-800 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">User</TableHead>
                <TableHead className="text-zinc-400">Plan</TableHead>
                <TableHead className="text-zinc-400">Joined</TableHead>
                <TableHead className="text-zinc-400">Last Active</TableHead>
                <TableHead className="text-zinc-400">ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map(user => (
                <AdminUserRow
                  key={user.userId}
                  userId={user.userId}
                  email={user.email}
                  name={user.name}
                  plan={user.plan}
                  joinedDate={user.joinedDate}
                  lastActive={user.lastActive}
                  avatarInitials={user.avatarInitials}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </ComponentSample>

      {/* System Health */}
      <ComponentSample
        title="System Health Card"
        description="Service health grid showing a status dot (green/yellow/red), service name, measured latency, and uptime percentage for each monitored service."
      >
        <div className="w-full max-w-lg">
          <SystemHealthCard services={mockServices} />
        </div>
      </ComponentSample>

      {/* Activity Feed */}
      <ComponentSample
        title="Activity Feed"
        description="Timestamped admin activity log with type-coded icons (user, system, payment, error), actor, action description, optional target, and relative timestamps."
      >
        <div className="w-full max-w-xl">
          <AdminActivityFeed activities={mockActivities} />
        </div>
      </ComponentSample>

      {/* Full Admin Dashboard Layout */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold font-heading">
          Full Admin Dashboard Layout
        </h2>
        <p className="text-muted-foreground -mt-4">
          Combined layout showing all admin components in their typical arrangement.
        </p>
        <div className="p-6 rounded-3xl border border-border/50 bg-background/50 backdrop-blur-sm space-y-6">
          <AdminStatsBar stats={mockStats} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 border border-zinc-800 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">User</TableHead>
                    <TableHead className="text-zinc-400">Plan</TableHead>
                    <TableHead className="text-zinc-400">Joined</TableHead>
                    <TableHead className="text-zinc-400">Last Active</TableHead>
                    <TableHead className="text-zinc-400">ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUsers.slice(0, 3).map(user => (
                    <AdminUserRow
                      key={user.userId}
                      userId={user.userId}
                      email={user.email}
                      name={user.name}
                      plan={user.plan}
                      joinedDate={user.joinedDate}
                      lastActive={user.lastActive}
                      avatarInitials={user.avatarInitials}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="space-y-4">
              <SystemHealthCard services={mockServices.slice(0, 4)} />
            </div>
          </div>
          <AdminActivityFeed activities={mockActivities.slice(0, 3)} />
        </div>
      </section>

      {/* Code Snippets */}
      <CodePreview
        code={codeSnippets.statsBar}
        title="Admin Components"
        tabs={[
          { label: "AdminStatsBar", code: codeSnippets.statsBar },
          { label: "AdminUserRow", code: codeSnippets.userRow },
          { label: "SystemHealthCard", code: codeSnippets.systemHealth },
          { label: "AdminActivityFeed", code: codeSnippets.activityFeed },
        ]}
      />

      <AccessibilityPanel
        notes={[
          "AdminStatsBar stat cards use semantic markup; delta indicators use both color and icons.",
          "AdminUserRow avatar initials are wrapped with aria-label for screen reader clarity.",
          "Plan badges in AdminUserRow use color and text label — not color alone.",
          "SystemHealthCard status dots include aria-label describing the status text.",
          "Degraded services animate the status dot with a pulse — this is purely visual and does not affect assistive technology.",
          "AdminActivityFeed type icons have aria-label attributes for each activity type.",
          "Relative timestamps in AdminActivityFeed remain readable with screen readers.",
          "Table structure in user management uses proper thead/tbody for screen reader navigation.",
        ]}
      />

      <RelatedComponents currentId="spike-land-admin" />
    </div>
  );
}
