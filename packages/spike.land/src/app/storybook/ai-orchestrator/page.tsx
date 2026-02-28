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
import { AgentNodeCard } from "@/components/ai-orchestrator/AgentNodeCard";
import { AgentTopologyDiagram } from "@/components/ai-orchestrator/AgentTopologyDiagram";
import { SwarmStatsBar } from "@/components/ai-orchestrator/SwarmStatsBar";
import { TaskDelegationCard } from "@/components/ai-orchestrator/TaskDelegationCard";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockAgents = [
  {
    agentId: "agent-coord-1",
    agentName: "OrchestrAI",
    agentType: "coordinator" as const,
    status: "active" as const,
    currentTask: "Dispatching subtasks to worker agents",
    completedTasks: 12,
  },
  {
    agentId: "agent-res-1",
    agentName: "ResearchBot",
    agentType: "researcher" as const,
    status: "active" as const,
    currentTask: "Gathering data on TypeScript performance patterns",
    completedTasks: 8,
  },
  {
    agentId: "agent-code-1",
    agentName: "CodeSmith",
    agentType: "coder" as const,
    status: "active" as const,
    currentTask: "Implementing AgentNodeCard component",
    completedTasks: 5,
  },
  {
    agentId: "agent-rev-1",
    agentName: "Critic",
    agentType: "reviewer" as const,
    status: "idle" as const,
    completedTasks: 15,
  },
  {
    agentId: "agent-spec-1",
    agentName: "DataMiner",
    agentType: "specialist" as const,
    status: "completed" as const,
    currentTask: "Extracted 420 records",
    completedTasks: 3,
  },
  {
    agentId: "agent-code-2",
    agentName: "BugHunter",
    agentType: "coder" as const,
    status: "failed" as const,
    currentTask: "Attempted to run failing test suite",
    completedTasks: 0,
  },
];

const topologyAgents = [
  {
    id: "coord",
    name: "OrchestrAI",
    type: "coordinator" as const,
    status: "active" as const,
  },
  {
    id: "res",
    name: "ResearchBot",
    type: "researcher" as const,
    status: "active" as const,
  },
  {
    id: "coder",
    name: "CodeSmith",
    type: "coder" as const,
    status: "idle" as const,
  },
  {
    id: "rev",
    name: "Critic",
    type: "reviewer" as const,
    status: "completed" as const,
  },
];

const topologyConnections = [
  { from: "coord", to: "res", label: "research task" },
  { from: "coord", to: "coder", label: "implement" },
  { from: "coder", to: "rev", label: "review PR" },
];

const mockTasks = [
  {
    taskId: "task-001",
    taskTitle: "Research best React 19 patterns for concurrent rendering",
    priority: "high" as const,
    senderName: "OrchestrAI",
    receiverName: "ResearchBot",
    status: "in-progress" as const,
    estimatedMs: 45000,
  },
  {
    taskId: "task-002",
    taskTitle: "Implement AgentTopologyDiagram component",
    priority: "critical" as const,
    senderName: "OrchestrAI",
    receiverName: "CodeSmith",
    status: "completed" as const,
    estimatedMs: 120000,
  },
  {
    taskId: "task-003",
    taskTitle: "Review SwarmStatsBar for accessibility compliance",
    priority: "medium" as const,
    senderName: "CodeSmith",
    receiverName: "Critic",
    status: "pending" as const,
    estimatedMs: 30000,
  },
  {
    taskId: "task-004",
    taskTitle: "Scrape historical pricing data from public API",
    priority: "low" as const,
    senderName: "OrchestrAI",
    receiverName: "DataMiner",
    status: "failed" as const,
  },
];

// ---------------------------------------------------------------------------
// Code snippets
// ---------------------------------------------------------------------------

const codeSnippets = {
  agentNode: `import { AgentNodeCard } from "@/components/ai-orchestrator/AgentNodeCard";

<AgentNodeCard
  agentId="agent-res-1"
  agentName="ResearchBot"
  agentType="researcher"
  status="active"
  currentTask="Gathering TypeScript performance data"
  completedTasks={8}
/>`,
  swarmStats: `import { SwarmStatsBar } from "@/components/ai-orchestrator/SwarmStatsBar";

<SwarmStatsBar
  active={3}
  idle={1}
  completed={2}
  failed={0}
  totalTasks={24}
  completedTasks={18}
/>`,
  topology:
    `import { AgentTopologyDiagram } from "@/components/ai-orchestrator/AgentTopologyDiagram";

<AgentTopologyDiagram
  agents={[
    { id: "coord", name: "OrchestrAI", type: "coordinator", status: "active" },
    { id: "coder", name: "CodeSmith", type: "coder", status: "idle" },
  ]}
  connections={[
    { from: "coord", to: "coder", label: "implement" },
  ]}
/>`,
  delegation: `import { TaskDelegationCard } from "@/components/ai-orchestrator/TaskDelegationCard";

<TaskDelegationCard
  taskId="task-001"
  taskTitle="Research React 19 concurrent rendering"
  priority="high"
  senderName="OrchestrAI"
  receiverName="ResearchBot"
  status="in-progress"
  estimatedMs={45000}
/>`,
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AiOrchestratorPage() {
  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="AI Orchestrator"
        description="Components for visualizing and managing multi-agent AI swarms. Display agent status, task delegation flows, swarm health metrics, and agent connection topology in real time."
        usage="Use these components to build dashboards for AI orchestration systems — showing which agents are active, what tasks have been delegated, and the overall health of the swarm."
      />

      <UsageGuide
        dos={[
          "Use SwarmStatsBar at the top of a dashboard to give an immediate health overview.",
          "Show AgentNodeCard in a responsive grid for browsing the full agent roster.",
          "Use AgentTopologyDiagram to explain how agents relate to each other structurally.",
          "Display TaskDelegationCard in a feed or timeline to trace task handoffs.",
          "Use status colors consistently: green=active, gray=idle, blue=completed, red=failed.",
        ]}
        donts={[
          "Don't animate every status dot on page load — only active agents should pulse.",
          "Avoid showing topology diagrams with more than 8 agents without filtering.",
          "Don't omit the agentId — it's critical for debugging and traceability.",
          "Avoid using AgentTopologyDiagram inside a small card without adequate space.",
          "Don't label all tasks 'critical' — reserve it for genuinely blocking work.",
        ]}
      />

      {/* Swarm Stats Bar */}
      <ComponentSample
        title="Swarm Stats Bar"
        description="Top-level health bar for the agent swarm. Shows active, idle, completed, and failed agent counts alongside a task completion progress bar."
      >
        <div className="w-full max-w-2xl">
          <SwarmStatsBar
            active={3}
            idle={1}
            completed={2}
            failed={1}
            totalTasks={28}
            completedTasks={18}
          />
        </div>
      </ComponentSample>

      {/* Agent Node Cards — all status variants */}
      <ComponentSample
        title="Agent Node Cards"
        description="Tiles representing individual agents in the swarm. Each card shows the agent's type, name, current status with a color-coded indicator dot, current task, and completed task count."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {mockAgents.map(agent => <AgentNodeCard key={agent.agentId} {...agent} />)}
        </div>
      </ComponentSample>

      {/* Agent Topology Diagram */}
      <ComponentSample
        title="Agent Topology Diagram"
        description="Static visual showing how agents connect and delegate work to each other. Coordinators appear at the top, worker agents below, with labeled arrows indicating task flow."
      >
        <div className="w-full max-w-xl">
          <AgentTopologyDiagram
            agents={topologyAgents}
            connections={topologyConnections}
          />
        </div>
      </ComponentSample>

      {/* Task Delegation Cards — different priorities & statuses */}
      <ComponentSample
        title="Task Delegation Cards"
        description="Cards representing tasks delegated from one agent to another. Shows priority badge, status indicator, sender-to-receiver arrow, and optional time estimate."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl">
          {mockTasks.map(task => <TaskDelegationCard key={task.taskId} {...task} />)}
        </div>
      </ComponentSample>

      {/* Code Snippets */}
      <CodePreview
        code={codeSnippets.agentNode}
        title="AI Orchestrator Components"
        tabs={[
          { label: "AgentNodeCard", code: codeSnippets.agentNode },
          { label: "SwarmStatsBar", code: codeSnippets.swarmStats },
          { label: "AgentTopologyDiagram", code: codeSnippets.topology },
          { label: "TaskDelegationCard", code: codeSnippets.delegation },
        ]}
      />

      <AccessibilityPanel
        notes={[
          "AgentNodeCard uses both color and text label for status (not color alone).",
          "Status dots use animate-pulse only for 'active' — idle/completed/failed are static.",
          "SwarmStatsBar progress bar includes aria-friendly numeric labels alongside the visual bar.",
          "AgentTopologyDiagram connection list provides text descriptions of all connections.",
          "TaskDelegationCard uses ArrowRight icon as decorative; sender/receiver names are always visible as text.",
          "Priority and status badges include text labels for screen reader compatibility.",
          "Agent type badges use distinct colors per type for quick visual scanning.",
          "All truncated text uses line-clamp or max-width with title fallback where applicable.",
        ]}
      />

      <RelatedComponents currentId="ai-orchestrator" />
    </div>
  );
}
