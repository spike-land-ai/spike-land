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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
  ChevronUpIcon,
  Grid2X2,
  Inbox,
  LayoutGrid,
  List,
  Loader2,
} from "lucide-react";
import { useState } from "react";

// --- Rich Data Table ---

type SortField = "name" | "role" | "lastActive" | "status";
type SortDir = "asc" | "desc" | null;

interface TeamMember {
  id: number;
  name: string;
  status: "active" | "idle" | "offline";
  role: string;
  lastActive: string;
}

const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: "Alice Chen",
    status: "active",
    role: "Admin",
    lastActive: "Just now",
  },
  {
    id: 2,
    name: "Bob Martinez",
    status: "idle",
    role: "Editor",
    lastActive: "5 min ago",
  },
  {
    id: 3,
    name: "Clara Osei",
    status: "active",
    role: "Developer",
    lastActive: "2 min ago",
  },
  {
    id: 4,
    name: "David Kim",
    status: "offline",
    role: "Viewer",
    lastActive: "3 days ago",
  },
  {
    id: 5,
    name: "Eva Rossi",
    status: "active",
    role: "Admin",
    lastActive: "1 min ago",
  },
];

const statusVariants: Record<TeamMember["status"], string> = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  idle: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  offline: "bg-muted text-muted-foreground border-border",
};

function SortIcon(
  { field, sort }: {
    field: SortField;
    sort: { field: SortField | null; dir: SortDir; };
  },
) {
  if (sort.field !== field) {
    return <ChevronsUpDownIcon className="h-3.5 w-3.5 opacity-40" />;
  }
  if (sort.dir === "asc") {
    return <ChevronUpIcon className="h-3.5 w-3.5 text-primary" />;
  }
  return <ArrowDownIcon className="h-3.5 w-3.5 text-primary" />;
}

function RichDataTable() {
  const [sort, setSort] = useState<{ field: SortField | null; dir: SortDir; }>({
    field: null,
    dir: null,
  });

  function toggleSort(field: SortField) {
    setSort(prev => {
      if (prev.field !== field) return { field, dir: "asc" };
      if (prev.dir === "asc") return { field, dir: "desc" };
      return { field: null, dir: null };
    });
  }

  const sorted = [...teamMembers].sort((a, b) => {
    if (!sort.field || !sort.dir) return 0;
    const av = a[sort.field];
    const bv = b[sort.field];
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sort.dir === "asc" ? cmp : -cmp;
  });

  function SortableHead(
    { field, children }: { field: SortField; children: React.ReactNode; },
  ) {
    return (
      <TableHead>
        <button
          type="button"
          onClick={() => toggleSort(field)}
          className="flex items-center gap-1.5 font-semibold hover:text-foreground transition-colors group"
        >
          {children}
          <SortIcon field={field} sort={sort} />
        </button>
      </TableHead>
    );
  }

  return (
    <Table>
      <TableCaption>Team members — click column headers to sort</TableCaption>
      <TableHeader>
        <TableRow>
          <SortableHead field="name">Name</SortableHead>
          <SortableHead field="status">Status</SortableHead>
          <SortableHead field="role">Role</SortableHead>
          <SortableHead field="lastActive">Last Active</SortableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map(member => (
          <TableRow
            key={member.id}
            className="hover:bg-muted/50 transition-colors cursor-default"
          >
            <TableCell className="font-medium">{member.name}</TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={statusVariants[member.status]}
              >
                {member.status}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {member.role}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {member.lastActive}
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm">Edit</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// --- Stats Cards ---

interface StatCard {
  label: string;
  value: string;
  trend: number;
  suffix?: string;
}

const stats: StatCard[] = [
  { label: "Users", value: "1,247", trend: 12 },
  { label: "Apps", value: "456", trend: 8 },
  { label: "Uptime", value: "99.9", trend: 0.1, suffix: "%" },
  { label: "Latency", value: "3.2", trend: -5, suffix: "ms" },
];

function StatsGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      {stats.map(stat => {
        const up = stat.trend >= 0;
        const isLatency = stat.label === "Latency";
        // For latency, lower is better so a negative trend is green
        const isGood = isLatency ? !up : up;
        return (
          <div
            key={stat.label}
            className="rounded-2xl border border-border/60 bg-card p-5 space-y-2 hover:border-primary/30 transition-colors"
          >
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {stat.label}
            </p>
            <p className="text-3xl font-bold tracking-tight">
              {stat.value}
              {stat.suffix && (
                <span className="text-lg font-semibold text-muted-foreground ml-0.5">
                  {stat.suffix}
                </span>
              )}
            </p>
            <div
              className={`flex items-center gap-1 text-xs font-semibold ${
                isGood ? "text-green-500" : "text-red-500"
              }`}
            >
              {up
                ? <ArrowUpIcon className="h-3.5 w-3.5" />
                : <ArrowDownIcon className="h-3.5 w-3.5" />}
              <span>{Math.abs(stat.trend)}% vs last week</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Key-Value List ---

const keyValuePairs = [
  { label: "Plan", value: "Pro" },
  { label: "Billing cycle", value: "Monthly" },
  { label: "Next invoice", value: "Mar 1, 2026" },
  { label: "API requests", value: "48,291 / 100,000" },
  { label: "Team size", value: "5 members" },
  { label: "Region", value: "EU West (Dublin)" },
];

function KeyValueList() {
  return (
    <dl className="divide-y divide-border/50 w-full">
      {keyValuePairs.map(({ label, value }) => (
        <div
          key={label}
          className="flex items-center justify-between py-3 gap-4 group"
        >
          <dt className="text-sm text-muted-foreground font-medium shrink-0">
            {label}
          </dt>
          <div className="flex-1 border-b border-dashed border-border/40 mx-2 group-hover:border-primary/30 transition-colors" />
          <dd className="text-sm font-semibold text-foreground text-right">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// --- Toggle Group View Demo ---

const sampleItems = [
  { id: 1, name: "Dashboard", desc: "Analytics overview" },
  { id: 2, name: "API Keys", desc: "Manage credentials" },
  { id: 3, name: "Webhooks", desc: "Event listeners" },
  { id: 4, name: "Logs", desc: "Request history" },
  { id: 5, name: "Billing", desc: "Plans & invoices" },
  { id: 6, name: "Team", desc: "Members & roles" },
];

type ViewMode = "list" | "grid" | "compact";

function ToggleViewDemo() {
  const [view, setView] = useState<ViewMode>("grid");

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Current view: <span className="font-semibold text-foreground">{view}</span>
        </p>
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={v => v && setView(v as ViewMode)}
        >
          <ToggleGroupItem value="list" aria-label="List view">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="grid" aria-label="Grid view">
            <Grid2X2 className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="compact" aria-label="Compact view">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {view === "grid" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {sampleItems.map(item => (
            <div
              key={item.id}
              className="rounded-xl border border-border/60 bg-card p-4 space-y-1 hover:border-primary/30 transition-colors"
            >
              <p className="font-semibold text-sm">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      )}

      {view === "list" && (
        <div className="divide-y divide-border/40 rounded-xl border border-border/60 overflow-hidden">
          {sampleItems.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/40 transition-colors"
            >
              <span className="font-semibold text-sm">{item.name}</span>
              <span className="text-xs text-muted-foreground">{item.desc}</span>
            </div>
          ))}
        </div>
      )}

      {view === "compact" && (
        <div className="flex flex-wrap gap-2">
          {sampleItems.map(item => (
            <div
              key={item.id}
              className="rounded-full border border-border/60 bg-card px-3 py-1.5 hover:border-primary/30 transition-colors"
            >
              <p className="text-xs font-semibold">{item.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Copy Button Demo ---

function CopyButtonDemo() {
  return (
    <div className="space-y-4 w-full">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">URL Copy</Label>
        <div className="flex items-center gap-2">
          <Input
            value="https://api.spike.land/v1/apps/abc123"
            readOnly
            className="font-mono text-sm"
          />
          <CopyButton text="https://api.spike.land/v1/apps/abc123" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          Code Snippet Copy
        </Label>
        <div className="relative">
          <pre className="bg-muted p-4 rounded-xl text-sm font-mono overflow-x-auto pr-20">
            {`curl -H "Authorization: Bearer $TOKEN" https://api.spike.land/v1/apps`}
          </pre>
          <div className="absolute top-2 right-2">
            <CopyButton
              text={`curl -H "Authorization: Bearer $TOKEN" https://api.spike.land/v1/apps`}
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">API Key Copy</Label>
        <div className="flex items-center gap-2">
          <Input
            value="pk_demo_000000000000000000..."
            readOnly
            className="font-mono text-sm"
            type="password"
          />
          <CopyButton text="pk_demo_00000000000000000000000000000000" />
        </div>
      </div>
    </div>
  );
}

// --- Empty State Demo ---

function EmptyStateDemo() {
  return (
    <div className="w-full flex flex-col items-center justify-center py-12 text-center space-y-4">
      <div className="p-4 rounded-full bg-muted/50 border border-border/40">
        <Inbox className="h-8 w-8 text-muted-foreground/60" />
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-foreground">
          No data available
        </p>
        <p className="text-xs text-muted-foreground max-w-xs">
          There are no records to display. Try adjusting your filters or create a new entry.
        </p>
      </div>
      <Button variant="outline" size="sm">
        Create New Entry
      </Button>
    </div>
  );
}

// --- Loading State Demo ---

function LoadingStateDemo() {
  return (
    <div className="w-full space-y-3">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3 rounded-xl border border-border/40 bg-card"
        >
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 bg-muted rounded animate-pulse" />
            <div className="h-2.5 w-1/2 bg-muted/60 rounded animate-pulse" />
          </div>
          <div className="h-6 w-14 bg-muted rounded animate-pulse" />
        </div>
      ))}
      <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Loading records...</span>
      </div>
    </div>
  );
}

// --- Density Toggle Demo ---

type Density = "comfortable" | "compact" | "spacious";

const densityConfig: Record<
  Density,
  { rowPy: string; textSize: string; label: string; }
> = {
  compact: { rowPy: "py-1.5", textSize: "text-xs", label: "Compact" },
  comfortable: { rowPy: "py-3", textSize: "text-sm", label: "Comfortable" },
  spacious: { rowPy: "py-4", textSize: "text-base", label: "Spacious" },
};

function DensityToggleDemo() {
  const [density, setDensity] = useState<Density>("comfortable");
  const config = densityConfig[density];

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Density: <span className="font-semibold text-foreground">{config.label}</span>
        </p>
        <ToggleGroup
          type="single"
          value={density}
          onValueChange={v => v && setDensity(v as Density)}
        >
          <ToggleGroupItem value="compact" aria-label="Compact density">
            <span className="text-xs">Compact</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="comfortable" aria-label="Comfortable density">
            <span className="text-xs">Comfortable</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="spacious" aria-label="Spacious density">
            <span className="text-xs">Spacious</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="rounded-xl border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={config.textSize}>Name</TableHead>
              <TableHead className={config.textSize}>Role</TableHead>
              <TableHead className={`${config.textSize} text-right`}>
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers.slice(0, 4).map(member => (
              <TableRow
                key={member.id}
                className="hover:bg-muted/50 transition-colors"
              >
                <TableCell
                  className={`${config.rowPy} ${config.textSize} font-medium`}
                >
                  {member.name}
                </TableCell>
                <TableCell
                  className={`${config.rowPy} ${config.textSize} text-muted-foreground`}
                >
                  {member.role}
                </TableCell>
                <TableCell
                  className={`${config.rowPy} ${config.textSize} text-right`}
                >
                  <Badge
                    variant="outline"
                    className={statusVariants[member.status]}
                  >
                    {member.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// --- Code Snippets ---

const codeSnippets = {
  table: `import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map((row) => (
      <TableRow key={row.id}>
        <TableCell>{row.name}</TableCell>
        <TableCell>
          <Badge variant="outline">{row.status}</Badge>
        </TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="sm">Edit</Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>`,
  statsGrid: `const stats = [
  { label: "Users", value: "1,247", trend: 12 },
  { label: "Latency", value: "3.2", trend: -5, suffix: "ms" },
];

<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {stats.map((stat) => (
    <div key={stat.label} className="rounded-2xl border p-5 space-y-2">
      <p className="text-xs text-muted-foreground uppercase">{stat.label}</p>
      <p className="text-3xl font-bold">{stat.value}{stat.suffix}</p>
      <div className="flex items-center gap-1 text-xs">
        {stat.trend >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
        <span>{Math.abs(stat.trend)}% vs last week</span>
      </div>
    </div>
  ))}
</div>`,
  keyValue: `<dl className="divide-y divide-border/50">
  {pairs.map(({ label, value }) => (
    <div key={label} className="flex items-center justify-between py-3 gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <div className="flex-1 border-b border-dashed border-border/40 mx-2" />
      <dd className="text-sm font-semibold">{value}</dd>
    </div>
  ))}
</dl>`,
  copyButton: `import { CopyButton } from "@/components/ui/copy-button";

<div className="flex items-center gap-2">
  <Input value={apiUrl} readOnly className="font-mono text-sm" />
  <CopyButton text={apiUrl} />
</div>`,
  emptyState:
    `<div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
  <div className="p-4 rounded-full bg-muted/50 border border-border/40">
    <Inbox className="h-8 w-8 text-muted-foreground/60" />
  </div>
  <p className="text-sm font-semibold">No data available</p>
  <p className="text-xs text-muted-foreground">
    Try adjusting your filters or create a new entry.
  </p>
  <Button variant="outline" size="sm">Create New Entry</Button>
</div>`,
};

// --- Page ---

export default function DataDisplayPage() {
  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="Data Display"
        description="Components for displaying structured, queryable, and copyable data — tables, stat cards, key-value pairs, view toggles, and copy buttons."
        usage="Use these patterns to surface metrics, user records, configuration values, and code samples in a consistent, accessible way."
      />

      <UsageGuide
        dos={[
          "Use sortable tables when rows exceed 5 and comparison matters.",
          "Show trend arrows in stat cards to give immediate directional context.",
          "Use dashed separator lines in key-value lists to visually link label and value.",
          "Persist view-mode preference (list/grid/compact) in local storage for returning users.",
          "Show copy feedback (Copied / Failed) for at least 2 seconds.",
          "Always provide an empty state when a table or list may have zero rows.",
          "Offer a density toggle for data-heavy views so users can control information density.",
        ]}
        donts={[
          "Don't put too many columns in a table — limit to the 5 most relevant fields.",
          "Avoid using red for latency improvements — context determines what 'good' means.",
          "Don't nest tables or key-value lists inside each other.",
          "Avoid disabling copy buttons — they should always work or explain why they can't.",
          "Don't show a loading spinner without an accompanying text label for context.",
        ]}
      />

      {/* Rich Data Table */}
      <ComponentSample
        title="Rich Data Table"
        description="Sortable table with status badges, role, last-active timestamps, and row actions. Click any column header to toggle sort direction."
      >
        <div className="w-full overflow-x-auto">
          <RichDataTable />
        </div>
      </ComponentSample>

      {/* Stats Grid */}
      <ComponentSample
        title="Stats / Metric Cards"
        description="A 4-column grid of KPI cards with large numbers, labels, and trend indicators. Color coding accounts for metric polarity (lower latency is better)."
      >
        <StatsGrid />
      </ComponentSample>

      {/* Key-Value List */}
      <ComponentSample
        title="Key-Value List"
        description="Definition list pattern for structured metadata. A dashed line visually connects each label to its value."
      >
        <div className="w-full max-w-lg">
          <KeyValueList />
        </div>
      </ComponentSample>

      {/* Toggle View Demo */}
      <ComponentSample
        title="Toggle Group View"
        description="ToggleGroup that switches between list, grid, and compact layouts. The selected view actually changes the rendered layout below."
      >
        <ToggleViewDemo />
      </ComponentSample>

      {/* Density Toggle */}
      <ComponentSample
        title="Density Toggle"
        description="Let users control row spacing and text size for data-dense tables. Compact mode maximizes visible rows, spacious mode improves readability."
      >
        <DensityToggleDemo />
      </ComponentSample>

      {/* Copy Button Demo */}
      <ComponentSample
        title="Copy Button"
        description="CopyButton with different content types: URL, curl code snippet, and a masked API key. Each shows Copied or Failed feedback."
      >
        <CopyButtonDemo />
      </ComponentSample>

      {/* Empty State */}
      <ComponentSample
        title="Empty State"
        description="Shown when a table or list has zero rows. Includes an icon, descriptive text, and a call-to-action button to guide the user forward."
      >
        <EmptyStateDemo />
      </ComponentSample>

      {/* Loading State */}
      <ComponentSample
        title="Loading State"
        description="Skeleton placeholder rows with a pulse animation and a loading indicator. Use this while data is being fetched to prevent layout shift."
      >
        <LoadingStateDemo />
      </ComponentSample>

      {/* Legacy Table Reference */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold font-heading">
          Additional Table Examples
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Token Packages</CardTitle>
              <CardDescription>
                Static pricing table with per-token cost
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Per Token</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    {
                      id: 1,
                      name: "Starter",
                      tokens: 5,
                      price: "$4.99",
                      perToken: "$1.00",
                    },
                    {
                      id: 2,
                      name: "Basic",
                      tokens: 15,
                      price: "$12.99",
                      perToken: "$0.87",
                    },
                    {
                      id: 3,
                      name: "Pro",
                      tokens: 50,
                      price: "$39.99",
                      perToken: "$0.80",
                    },
                    {
                      id: 4,
                      name: "Enterprise",
                      tokens: 200,
                      price: "$149.99",
                      perToken: "$0.75",
                    },
                  ].map(pkg => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">{pkg.name}</TableCell>
                      <TableCell className="text-right">{pkg.tokens}</TableCell>
                      <TableCell className="text-right">{pkg.price}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {pkg.perToken}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Enhancement History</CardTitle>
              <CardDescription>Recent jobs with status badges</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    {
                      id: "ENH-001",
                      date: "2024-01-15",
                      tier: "Pro",
                      status: "completed",
                    },
                    {
                      id: "ENH-002",
                      date: "2024-01-14",
                      tier: "Standard",
                      status: "completed",
                    },
                    {
                      id: "ENH-003",
                      date: "2024-01-14",
                      tier: "Max",
                      status: "processing",
                    },
                    {
                      id: "ENH-004",
                      date: "2024-01-13",
                      tier: "Pro",
                      status: "completed",
                    },
                  ].map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">
                        {item.id}
                      </TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.tier}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={item.status === "completed"
                            ? "default"
                            : "secondary"}
                          className={item.status === "completed"
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Code Snippets */}
      <CodePreview
        code={codeSnippets.table}
        title="Usage Examples"
        tabs={[
          { label: "Table", code: codeSnippets.table },
          { label: "Stats Grid", code: codeSnippets.statsGrid },
          { label: "Key-Value", code: codeSnippets.keyValue },
          { label: "Copy Button", code: codeSnippets.copyButton },
          { label: "Empty State", code: codeSnippets.emptyState },
        ]}
      />

      <AccessibilityPanel
        notes={[
          "Table headers use <th> with scope='col' for proper screen reader column association.",
          "Sort buttons include aria-label and visible icons indicating current sort direction.",
          "Status badges use both color and text to convey state — never color alone.",
          "CopyButton announces 'Copied' or 'Failed' — pair with aria-live for screen readers.",
          "ToggleGroup uses Radix UI primitives with full keyboard navigation (arrow keys).",
          "Key-value lists use <dl>, <dt>, <dd> semantic markup for assistive technologies.",
          "Trend arrows include screen-readable text (e.g., '+12% vs last week') not just icons.",
          "All interactive elements meet the 44px minimum touch target size.",
          "Empty states include descriptive text so screen readers announce meaningful context.",
          "Loading skeletons use aria-busy on the container to indicate pending content.",
        ]}
      />

      <RelatedComponents currentId="data-display" />
    </div>
  );
}
