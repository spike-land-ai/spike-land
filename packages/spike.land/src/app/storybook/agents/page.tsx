"use client";

import { AgentCard } from "@/components/agents/AgentCard";
import { AgentStatsCard } from "@/components/agents/AgentStatsCard";
import { RenameAgentDialog } from "@/components/agents/RenameAgentDialog";
import { SendTaskDialog } from "@/components/agents/SendTaskDialog";
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
import { Card, CardContent } from "@/components/ui/card";
import type { AgentResponse } from "@/lib/validations/agent";
import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const now = Date.now();

const mockAgents: AgentResponse[] = [
  {
    id: "agent-001",
    userId: "user-1",
    machineId: "m4c-b00k-pr0-2024",
    sessionId: "sess-abc12345",
    displayName: "Code Writer",
    projectPath: "/Users/dev/spike.land",
    workingDirectory: "/Users/dev/spike.land/src",
    status: "online",
    createdAt: new Date(now - 86400000 * 7).toISOString(),
    updatedAt: new Date(now - 30000).toISOString(),
    lastSeenAt: new Date(now - 15000).toISOString(),
    totalTokensUsed: 1_284_500,
    totalTasksCompleted: 47,
    totalSessionTime: 14400,
    recentActivity: [
      {
        type: "tool_use",
        description: "Edited src/components/agents/AgentCard.tsx",
        timestamp: now - 60000,
      },
      {
        type: "tool_use",
        description: "Ran vitest on 12 test files",
        timestamp: now - 120000,
      },
    ],
    toolStats: { Edit: 124, Read: 310, Bash: 87, Grep: 56 },
  },
  {
    id: "agent-002",
    userId: "user-1",
    machineId: "lnx-srv-prod-01",
    sessionId: "sess-def67890",
    displayName: "UI Designer",
    projectPath: "/home/deploy/spike.land",
    workingDirectory: "/home/deploy/spike.land/src/components",
    status: "online",
    createdAt: new Date(now - 86400000 * 3).toISOString(),
    updatedAt: new Date(now - 10000).toISOString(),
    lastSeenAt: new Date(now - 5000).toISOString(),
    totalTokensUsed: 892_100,
    totalTasksCompleted: 31,
    totalSessionTime: 9200,
    recentActivity: [
      {
        type: "tool_use",
        description: "Created new Tailwind component variants",
        timestamp: now - 45000,
      },
    ],
    toolStats: { Edit: 98, Read: 215, Write: 42, Glob: 33 },
  },
  {
    id: "agent-003",
    userId: "user-1",
    machineId: "win-desk-gaming",
    sessionId: "sess-ghi11223",
    displayName: "Researcher",
    projectPath: "C:\\Projects\\spike.land",
    workingDirectory: "C:\\Projects\\spike.land\\docs",
    status: "sleeping",
    createdAt: new Date(now - 86400000 * 14).toISOString(),
    updatedAt: new Date(now - 3600000).toISOString(),
    lastSeenAt: new Date(now - 3600000).toISOString(),
    totalTokensUsed: 2_156_000,
    totalTasksCompleted: 63,
    totalSessionTime: 28800,
    recentActivity: [
      {
        type: "search",
        description: "Searched MDN docs for Web Worker API",
        timestamp: now - 3600000,
      },
      {
        type: "tool_use",
        description: "Read 14 documentation files",
        timestamp: now - 3700000,
      },
    ],
    toolStats: { Read: 540, WebSearch: 128, Grep: 96, WebFetch: 72 },
  },
  {
    id: "agent-004",
    userId: "user-1",
    machineId: "ci-runner-gh-01",
    sessionId: "sess-jkl44556",
    displayName: "Test Runner",
    projectPath: "/workspace/spike.land",
    workingDirectory: "/workspace/spike.land",
    status: "offline",
    createdAt: new Date(now - 86400000 * 30).toISOString(),
    updatedAt: new Date(now - 86400000 * 2).toISOString(),
    lastSeenAt: new Date(now - 86400000 * 2).toISOString(),
    totalTokensUsed: 456_300,
    totalTasksCompleted: 19,
    totalSessionTime: 5400,
    recentActivity: [],
    toolStats: { Bash: 210, Read: 88, Grep: 45 },
  },
  {
    id: "agent-005",
    userId: "user-1",
    machineId: "m4c-b00k-air-z",
    sessionId: "sess-mno77889",
    displayName: "DevOps Engineer",
    projectPath: "/Users/ops/spike.land",
    workingDirectory: "/Users/ops/spike.land/.github",
    status: "online",
    createdAt: new Date(now - 86400000 * 5).toISOString(),
    updatedAt: new Date(now - 8000).toISOString(),
    lastSeenAt: new Date(now - 3000).toISOString(),
    totalTokensUsed: 674_200,
    totalTasksCompleted: 22,
    totalSessionTime: 7800,
    recentActivity: [
      {
        type: "tool_use",
        description: "Updated GitHub Actions workflow",
        timestamp: now - 20000,
      },
      {
        type: "tool_use",
        description: "Configured Depot CI caching",
        timestamp: now - 90000,
      },
    ],
    toolStats: { Bash: 180, Edit: 76, Read: 145, Write: 34 },
  },
];

const mockStats = {
  online: 3,
  sleeping: 1,
  offline: 1,
  total: 5,
};

// Named references to avoid undefined-index TS errors
const onlineAgent = mockAgents[0] as AgentResponse;
const sleepingAgent = mockAgents[2] as AgentResponse;
const offlineAgent = mockAgents[3] as AgentResponse;

// ---------------------------------------------------------------------------
// Mock task queue data for demo
// ---------------------------------------------------------------------------

interface MockTask {
  id: string;
  prompt: string;
  status: "queued" | "running" | "completed" | "failed";
  assignedTo: string;
  createdAt: number;
  completedAt?: number;
}

const mockTaskQueue: MockTask[] = [
  {
    id: "task-001",
    prompt: "Refactor the AgentCard component to use compound pattern",
    status: "completed",
    assignedTo: "Code Writer",
    createdAt: now - 600000,
    completedAt: now - 300000,
  },
  {
    id: "task-002",
    prompt: "Write unit tests for the agent heartbeat service",
    status: "running",
    assignedTo: "Code Writer",
    createdAt: now - 120000,
  },
  {
    id: "task-003",
    prompt: "Audit accessibility of all agent management dialogs",
    status: "queued",
    assignedTo: "UI Designer",
    createdAt: now - 60000,
  },
  {
    id: "task-004",
    prompt: "Research best practices for agent session persistence",
    status: "failed",
    assignedTo: "Researcher",
    createdAt: now - 1800000,
    completedAt: now - 900000,
  },
];

// ---------------------------------------------------------------------------
// Code snippets for CodePreview
// ---------------------------------------------------------------------------

const codeSnippets = {
  agentCard: `import { AgentCard } from "@/components/agents/AgentCard";
import type { AgentResponse } from "@/lib/validations/agent";

function AgentDashboard({ agents }: { agents: AgentResponse[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => (
        <AgentCard
          key={agent.id}
          agent={agent}
          onRename={(a) => openRenameDialog(a)}
          onSendTask={(a) => openTaskDialog(a)}
          onDisconnect={(a) => disconnectAgent(a.id)}
          onDelete={(a) => deleteAgent(a.id)}
        />
      ))}
    </div>
  );
}`,
  statsCard: `import { AgentStatsCard } from "@/components/agents/AgentStatsCard";

// Stats are typically fetched from the /api/agents/stats endpoint
const stats = {
  online: 3,
  sleeping: 1,
  offline: 1,
  total: 5,
};

<AgentStatsCard stats={stats} />`,
  sendTask: `import { SendTaskDialog } from "@/components/agents/SendTaskDialog";

<SendTaskDialog
  agent={selectedAgent}
  open={dialogOpen}
  onOpenChange={setDialogOpen}
  onSend={async (prompt) => {
    await fetch(\`/api/agents/\${agent.id}/task\`, {
      method: "POST",
      body: JSON.stringify({ prompt }),
    });
  }}
/>`,
};

// ---------------------------------------------------------------------------
// Status indicator component
// ---------------------------------------------------------------------------

function StatusIndicator(
  { status }: { status: "online" | "sleeping" | "offline"; },
) {
  const config = {
    online: {
      color: "bg-green-500",
      ring: "ring-green-500/30",
      label: "Online",
      pulse: true,
    },
    sleeping: {
      color: "bg-yellow-500",
      ring: "ring-yellow-500/30",
      label: "Sleeping",
      pulse: false,
    },
    offline: {
      color: "bg-zinc-500",
      ring: "ring-zinc-500/30",
      label: "Offline",
      pulse: false,
    },
  };

  const { color, ring, label, pulse } = config[status];

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-3 w-3">
        {pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-3 w-3 ${color} ring-4 ${ring}`}
        />
      </span>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Task queue item component
// ---------------------------------------------------------------------------

function TaskQueueItem({ task }: { task: MockTask; }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (task.status !== "running") return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - task.createdAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [task.status, task.createdAt]);

  const statusStyles = {
    queued: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    running: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    completed: "bg-green-500/10 text-green-400 border-green-500/20",
    failed: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const statusIcons = {
    queued: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    running: (
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    ),
    completed: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
    failed: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border ${statusStyles[task.status]}`}
    >
      <div className="mt-0.5 shrink-0">
        {statusIcons[task.status]}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">
          {task.prompt}
        </p>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span>{task.assignedTo}</span>
          {task.status === "running" && (
            <span className="text-blue-400 font-mono">
              {formatDuration(elapsed)}
            </span>
          )}
          {task.status === "completed" && task.completedAt && (
            <span className="text-green-400">
              Completed in {formatDuration(
                Math.floor((task.completedAt - task.createdAt) / 1000),
              )}
            </span>
          )}
          {task.status === "failed" && <span className="text-red-400">Timed out</span>}
        </div>
      </div>
      <Badge
        variant={task.status === "completed"
          ? "success"
          : task.status === "failed"
          ? "destructive"
          : "outline"}
        className="shrink-0 text-xs"
      >
        {task.status}
      </Badge>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AgentsPage() {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [sendTaskDialogOpen, setSendTaskDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentResponse | null>(
    null,
  );

  const handleRename = (agent: AgentResponse) => {
    setSelectedAgent(agent);
    setRenameDialogOpen(true);
  };

  const handleSendTask = (agent: AgentResponse) => {
    setSelectedAgent(agent);
    setSendTaskDialogOpen(true);
  };

  const noopAsync = async () => {};

  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="Agent Management"
        description="Components for monitoring and managing Claude Code agents. These cards, dialogs, and stats panels let users view agent status, assign tasks, and track performance across connected sessions."
        usage="Use the AgentCard grid as the primary agent dashboard. Pair with AgentStatsCard for at-a-glance metrics and dialogs for interactive management."
      />

      <UsageGuide
        dos={[
          "Display agent status clearly with color-coded indicators (green = online, yellow = sleeping, gray = offline).",
          "Show the most relevant stats (tokens used, tasks completed, top tools) at a glance on each card.",
          "Use the AgentStatsCard row above the grid for aggregate metrics.",
          "Open dialogs from card dropdown menus for rename and task assignment.",
          "Truncate long project paths with a tooltip for the full value.",
        ]}
        donts={[
          "Don't allow sending tasks to offline agents -- disable the action.",
          "Don't show more than 3 top tools per card to avoid clutter.",
          "Don't auto-refresh faster than every 30 seconds to avoid unnecessary load.",
          "Avoid stacking multiple confirmation dialogs at once.",
        ]}
      />

      {/* --- Status Indicators -------------------------------------------- */}
      <ComponentSample
        title="Status Indicators"
        description="Live status indicators with color-coded dots, pulse animations for online agents, and ring highlights. These indicators are used within AgentCards but can also stand alone."
      >
        <div className="flex flex-wrap items-center gap-8">
          <StatusIndicator status="online" />
          <StatusIndicator status="sleeping" />
          <StatusIndicator status="offline" />
        </div>
      </ComponentSample>

      {/* --- AgentStatsCard --- */}
      <ComponentSample
        title="Agent Stats Card"
        description="Aggregate metrics row showing online, sleeping, offline, and total agent counts. Uses color-coded icons for quick scanning."
      >
        <div className="w-full max-w-4xl">
          <AgentStatsCard stats={mockStats} />
        </div>
      </ComponentSample>

      {/* --- AgentCard Grid --- */}
      <ComponentSample
        title="Agent Card Grid"
        description="Primary dashboard layout. Each card shows agent name, status, project path, usage stats, top tools, and recent activity. Hover to reveal the action menu."
      >
        <div className="w-full grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockAgents.slice(0, 3).map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onRename={handleRename}
              onSendTask={handleSendTask}
              onDisconnect={() => {}}
              onDelete={() => {}}
            />
          ))}
        </div>
      </ComponentSample>

      {/* --- Status Variants --- */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold font-heading">Status Variants</h2>
        <p className="text-muted-foreground -mt-4">
          Each agent card adapts its visual treatment based on connection status. Online agents have
          a green ring and pulsing indicator.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Online */}
          <div className="space-y-2">
            <Badge variant="success">Online</Badge>
            <AgentCard
              agent={onlineAgent}
              onRename={handleRename}
              onSendTask={handleSendTask}
              onDisconnect={() => {}}
              onDelete={() => {}}
            />
          </div>
          {/* Sleeping */}
          <div className="space-y-2">
            <Badge variant="warning">Sleeping</Badge>
            <AgentCard
              agent={sleepingAgent}
              onRename={handleRename}
              onSendTask={handleSendTask}
              onDisconnect={() => {}}
              onDelete={() => {}}
            />
          </div>
          {/* Offline */}
          <div className="space-y-2">
            <Badge variant="outline">Offline</Badge>
            <AgentCard
              agent={offlineAgent}
              onRename={handleRename}
              onSendTask={handleSendTask}
              onDisconnect={() => {}}
              onDelete={() => {}}
            />
          </div>
        </div>
      </section>

      {/* --- Task Queue Demo ---------------------------------------------- */}
      <ComponentSample
        title="Task Queue"
        description="Visual representation of the task dispatch queue. Tasks are assigned to agents and transition through queued, running, completed, and failed states. The running task shows a live elapsed timer."
      >
        <div className="w-full max-w-2xl space-y-3">
          {mockTaskQueue.map(task => <TaskQueueItem key={task.id} task={task} />)}
        </div>
      </ComponentSample>

      {/* --- AgentStatsCard Variations --- */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold font-heading">Stats Scenarios</h2>
        <div className="space-y-6">
          <div className="space-y-2">
            <Badge variant="outline">All Online</Badge>
            <AgentStatsCard
              stats={{ online: 8, sleeping: 0, offline: 0, total: 8 }}
            />
          </div>
          <div className="space-y-2">
            <Badge variant="outline">Mixed Fleet</Badge>
            <AgentStatsCard stats={mockStats} />
          </div>
          <div className="space-y-2">
            <Badge variant="outline">No Agents</Badge>
            <AgentStatsCard
              stats={{ online: 0, sleeping: 0, offline: 0, total: 0 }}
            />
          </div>
        </div>
      </section>

      {/* --- Rename Dialog --- */}
      <ComponentSample
        title="Rename Agent Dialog"
        description="Modal dialog for changing an agent's display name. Includes validation, loading state, and error handling. Click 'Rename' on any agent card dropdown to preview."
      >
        <div className="w-full max-w-md">
          <Card className="glass-1">
            <CardContent className="pt-6 space-y-3">
              <p className="text-sm text-muted-foreground">
                The RenameAgentDialog is a controlled Dialog component. It pre-fills the current
                display name and validates input before submission.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">Props</Badge>
                <code>agent, open, onOpenChange, onRename</code>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">Max Length</Badge>
                <code>100 characters</code>
              </div>
            </CardContent>
          </Card>
        </div>
      </ComponentSample>

      {/* --- Send Task Dialog --- */}
      <ComponentSample
        title="Send Task Dialog"
        description="Modal for dispatching a task prompt to an active agent. The task is queued and picked up on the next heartbeat cycle. Click 'Task' on any online agent card to preview."
      >
        <div className="w-full max-w-md">
          <Card className="glass-1">
            <CardContent className="pt-6 space-y-3">
              <p className="text-sm text-muted-foreground">
                The SendTaskDialog provides a multi-line textarea for composing task prompts up to
                10,000 characters. Disabled when no agent is selected or the prompt is empty.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">Props</Badge>
                <code>agent, open, onOpenChange, onSend</code>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">Max Length</Badge>
                <code>10,000 characters</code>
              </div>
            </CardContent>
          </Card>
        </div>
      </ComponentSample>

      {/* --- Full Dashboard Preview --- */}
      <ComponentSample
        title="Full Dashboard Preview"
        description="Complete agent management layout combining stats row and agent card grid, as it would appear on the /agents page."
      >
        <div className="w-full space-y-6">
          <AgentStatsCard stats={mockStats} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mockAgents.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onRename={handleRename}
                onSendTask={handleSendTask}
                onDisconnect={() => {}}
                onDelete={() => {}}
              />
            ))}
          </div>
        </div>
      </ComponentSample>

      {/* -- Code Snippets ------------------------------------------------- */}
      <CodePreview
        code={codeSnippets.agentCard}
        title="Usage Examples"
        tabs={[
          { label: "AgentCard", code: codeSnippets.agentCard },
          { label: "StatsCard", code: codeSnippets.statsCard },
          { label: "SendTask", code: codeSnippets.sendTask },
        ]}
      />

      <AccessibilityPanel
        notes={[
          "Agent status indicators use both color and text labels for color-blind accessibility.",
          "Dropdown menus are fully keyboard-navigable via Radix UI primitives.",
          "Dialog components trap focus and return focus to trigger on close.",
          "The pulsing online indicator uses CSS animation that respects prefers-reduced-motion.",
          "All interactive elements meet the 44px minimum touch target guideline.",
          "Card action buttons include descriptive text alongside icons.",
          "Tool stats badges use high-contrast text for readability.",
          "Disabled states (e.g., Send Task on offline agents) are communicated via aria-disabled.",
        ]}
      />

      <RelatedComponents currentId="agents" />

      {/* Dialogs (controlled, open via card interactions) */}
      <RenameAgentDialog
        agent={selectedAgent}
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        onRename={noopAsync}
      />

      <SendTaskDialog
        agent={selectedAgent}
        open={sendTaskDialogOpen}
        onOpenChange={setSendTaskDialogOpen}
        onSend={noopAsync}
      />
    </div>
  );
}
