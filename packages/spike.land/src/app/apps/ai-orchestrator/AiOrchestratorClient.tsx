"use client";

import { useCallback, useState } from "react";
import { useAiOrchestratorMcp } from "./hooks/useAiOrchestratorMcp";
import { SwarmDashboard } from "./components/SwarmDashboard";
import { TaskGraph } from "./components/TaskGraph";
import { MessageLog } from "./components/MessageLog";
import { TopologyView } from "./components/TopologyView";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BrainCircuit,
  ChevronLeft,
  FlaskConical,
  GitBranch,
  Layers,
  MessageSquare,
  Network,
  Play,
  Save,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type {
  AgentMessage,
  SwarmAgent,
  TopologyNode,
} from "./components/types";
import type { PipelineStep } from "./components/TaskGraph";

// ---------------------------------------------------------------------------
// Demo / seed data
// ---------------------------------------------------------------------------

const DEMO_PIPELINE_STEPS: PipelineStep[] = [
  {
    id: 1,
    label: "Extract Requirements",
    model: "GPT-4o",
    status: "done",
    durationMs: 3420,
  },
  {
    id: 2,
    label: "Generate Architecture",
    model: "Claude 3.5",
    status: "done",
    durationMs: 8150,
  },
  { id: 3, label: "Code Implementation", model: "GPT-4o", status: "running" },
  { id: 4, label: "Review & Test", model: "Gemini 2.0", status: "idle" },
];

const DEMO_AGENTS: SwarmAgent[] = [
  {
    id: "agent-001",
    displayName: "Architect Alpha",
    machineId: "mac-pro-1",
    projectPath: "/Developer/spike.land",
    lastSeenAt: new Date(Date.now() - 2 * 60_000).toISOString(),
    totalTokensUsed: 128_400,
    totalTasksCompleted: 14,
    messageCount: 32,
    status: "active",
    trustLevel: "TRUSTED",
    trustSuccessful: 42,
    trustFailed: 3,
  },
  {
    id: "agent-002",
    displayName: "Builder Beta",
    machineId: "mac-pro-2",
    projectPath: "/Developer/spike.land",
    lastSeenAt: new Date(Date.now() - 12 * 60_000).toISOString(),
    totalTokensUsed: 54_200,
    totalTasksCompleted: 7,
    messageCount: 18,
    status: "idle",
    trustLevel: "SANDBOX",
    trustSuccessful: 12,
    trustFailed: 5,
  },
  {
    id: "agent-003",
    displayName: "Reviewer Gamma",
    machineId: "mac-mini-1",
    projectPath: null,
    lastSeenAt: null,
    totalTokensUsed: 20_100,
    totalTasksCompleted: 3,
    messageCount: 9,
    status: "stopped",
    trustLevel: "SANDBOX",
    trustSuccessful: 8,
    trustFailed: 2,
  },
];

const DEMO_MESSAGES: AgentMessage[] = [
  {
    id: "msg-001",
    agentId: "agent-001",
    agentName: "Architect Alpha",
    role: "AGENT",
    content:
      "Architecture phase complete. Generated a modular component structure with 6 main modules.",
    isRead: true,
    createdAt: new Date(Date.now() - 8 * 60_000).toISOString(),
  },
  {
    id: "msg-002",
    agentId: "agent-002",
    agentName: "Builder Beta",
    role: "SYSTEM",
    content:
      "[TASK:HIGH] Implement the SwarmDashboard component following the established design system. Reference chess-arena for patterns.",
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    metadata: { type: "delegation", priority: "high" },
  },
  {
    id: "msg-003",
    agentId: "agent-001",
    agentName: "Architect Alpha",
    role: "AGENT",
    content: "Code implementation 60% complete. Estimated ETA: 4 minutes remaining.",
    isRead: false,
    createdAt: new Date(Date.now() - 90_000).toISOString(),
  },
  {
    id: "msg-004",
    agentId: "agent-002",
    agentName: "Builder Beta",
    role: "USER",
    content: "Please focus on type safety. No `any` types in the implementation.",
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 60_000).toISOString(),
  },
];

const DEMO_TOPOLOGY_NODES: TopologyNode[] = DEMO_AGENTS.map(a => ({
  id: a.id,
  displayName: a.displayName,
  status: a.status,
  trustLevel: a.trustLevel,
  successCount: a.trustSuccessful,
  failCount: a.trustFailed,
}));

const DEMO_MODELS = [
  { name: "GPT-4o", provider: "OpenAI", colorClass: "bg-green-500" },
  { name: "Claude 3.5", provider: "Anthropic", colorClass: "bg-amber-500" },
  { name: "Gemini 2.0", provider: "Google", colorClass: "bg-blue-500" },
  { name: "Llama 3.1", provider: "Meta", colorClass: "bg-purple-500" },
];

const TEMPLATES = [
  "Code Generator",
  "Content Pipeline",
  "Data Transformer",
  "Chat Agent",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AiOrchestratorClient() {
  const { mutations } = useAiOrchestratorMcp();

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(
    DEMO_PIPELINE_STEPS,
  );
  const [agents] = useState<SwarmAgent[]>(DEMO_AGENTS);
  const [messages] = useState<AgentMessage[]>(DEMO_MESSAGES);
  const [topologyNodes] = useState<TopologyNode[]>(DEMO_TOPOLOGY_NODES);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [promptOutput, setPromptOutput] = useState("");

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await mutations.listAgents.mutate({ status: "all" });
    setIsRefreshing(false);
  }, [mutations.listAgents]);

  const handleStopAgent = useCallback((id: string) => {
    mutations.stopAgent.mutate({ agent_id: id });
  }, [mutations.stopAgent]);

  const handleSendMessage = useCallback((id: string) => {
    mutations.sendMessage.mutate({
      target_agent_id: id,
      content: "Hello from the dashboard!",
    });
  }, [mutations.sendMessage]);

  const handleSpawnAgent = useCallback(() => {
    mutations.spawnAgent.mutate({
      display_name: `Agent ${Date.now().toString(36).toUpperCase()}`,
      machine_id: "local",
      session_id: `session-${Date.now()}`,
    });
  }, [mutations.spawnAgent]);

  const handleBroadcast = useCallback(() => {
    mutations.broadcast.mutate({
      content: "Status check: please report current task.",
    });
  }, [mutations.broadcast]);

  const handleAddStep = useCallback(() => {
    mutations.editStep.mutate({});
    const newId = Math.max(...pipelineSteps.map(s => s.id)) + 1;
    setPipelineSteps(prev => [
      ...prev,
      { id: newId, label: `Step ${newId}`, model: "GPT-4o", status: "idle" },
    ]);
  }, [mutations.editStep, pipelineSteps]);

  const handleEditStep = useCallback((id: number) => {
    mutations.editStep.mutate({ step_id: id });
  }, [mutations.editStep]);

  const handleRunStep = useCallback((id: number) => {
    setPipelineSteps(prev => prev.map(s => (s.id === id ? { ...s, status: "running" } : s)));
    mutations.runPipeline.mutate({ step_id: id });
  }, [mutations.runPipeline]);

  const handleTestPrompt = useCallback(async () => {
    if (!promptText.trim()) return;
    setPromptOutput("Running...");
    await mutations.testPrompt.mutate({ prompt: promptText });
    setPromptOutput("Test complete. Check MCP response for details.");
  }, [mutations.testPrompt, promptText]);

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-zinc-950 text-zinc-100 flex flex-col">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                               */}
      {/* ------------------------------------------------------------------ */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-xl flex items-center justify-between px-5 sticky top-0 z-50 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/store"
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Back to store"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-violet-400" />
            <span className="font-semibold tracking-tight">
              AI Orchestrator
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-zinc-400 hidden sm:flex"
            onClick={() => mutations.savePipeline.mutate({})}
          >
            <Save className="w-4 h-4" />
            Save
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-violet-600 hover:bg-violet-500 text-white border-0"
            onClick={() => mutations.runPipeline.mutate({})}
          >
            <Play className="w-4 h-4" />
            Run Pipeline
          </Button>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Body                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 flex overflow-hidden">
        {/* ---- Left sidebar: Templates & Models ---- */}
        <aside className="w-60 border-r border-zinc-800 bg-zinc-900/20 flex-col hidden lg:flex shrink-0">
          <div className="p-4 border-b border-zinc-800">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
              Templates
            </p>
            <div className="space-y-1">
              {TEMPLATES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => mutations.loadTemplate.mutate({ template: t })}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 flex-1">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
              Available Models
            </p>
            <div className="space-y-1.5">
              {DEMO_MODELS.map(m => (
                <div
                  key={m.name}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${m.colorClass}`} />
                  <div>
                    <p className="text-sm font-medium text-zinc-300">
                      {m.name}
                    </p>
                    <p className="text-[10px] text-zinc-600">{m.provider}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ---- Main content: tabbed dashboard ---- */}
        <main className="flex-1 overflow-hidden">
          <Tabs defaultValue="swarm" className="h-full flex flex-col">
            {/* Tab nav */}
            <div className="border-b border-zinc-800 px-4 pt-3 shrink-0 bg-zinc-900/20">
              <TabsList className="bg-zinc-800/60 h-8">
                <TabsTrigger value="swarm" className="gap-1.5 text-xs h-6 px-3">
                  <BrainCircuit className="w-3 h-3" />
                  Swarm
                </TabsTrigger>
                <TabsTrigger
                  value="pipeline"
                  className="gap-1.5 text-xs h-6 px-3"
                >
                  <GitBranch className="w-3 h-3" />
                  Pipeline
                </TabsTrigger>
                <TabsTrigger
                  value="messages"
                  className="gap-1.5 text-xs h-6 px-3"
                >
                  <MessageSquare className="w-3 h-3" />
                  Messages
                </TabsTrigger>
                <TabsTrigger
                  value="topology"
                  className="gap-1.5 text-xs h-6 px-3"
                >
                  <Network className="w-3 h-3" />
                  Topology
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Swarm tab */}
            <TabsContent value="swarm" className="flex-1 overflow-hidden m-0">
              <div className="h-full overflow-y-auto p-4">
                <SwarmDashboard
                  agents={agents}
                  isLoading={isRefreshing}
                  selectedAgentId={selectedAgentId}
                  onSelectAgent={setSelectedAgentId}
                  onStopAgent={handleStopAgent}
                  onSendMessage={handleSendMessage}
                  onRefresh={handleRefresh}
                  onSpawnAgent={handleSpawnAgent}
                  onBroadcast={handleBroadcast}
                />
              </div>
            </TabsContent>

            {/* Pipeline tab */}
            <TabsContent
              value="pipeline"
              className="flex-1 overflow-hidden m-0"
            >
              <div className="h-full overflow-y-auto p-4">
                <TaskGraph
                  steps={pipelineSteps}
                  onAddStep={handleAddStep}
                  onEditStep={handleEditStep}
                  onRunStep={handleRunStep}
                />
              </div>
            </TabsContent>

            {/* Messages tab */}
            <TabsContent
              value="messages"
              className="flex-1 overflow-hidden m-0"
            >
              <div className="h-full overflow-y-auto p-4">
                <MessageLog
                  messages={messages}
                  isLoading={isRefreshing}
                  onRefresh={handleRefresh}
                />
              </div>
            </TabsContent>

            {/* Topology tab */}
            <TabsContent
              value="topology"
              className="flex-1 overflow-hidden m-0"
            >
              <div className="h-full overflow-y-auto p-4">
                <TopologyView
                  nodes={topologyNodes}
                  selectedAgentId={selectedAgentId}
                  onSelectAgent={setSelectedAgentId}
                />
              </div>
            </TabsContent>
          </Tabs>
        </main>

        {/* ---- Right sidebar: Prompt Tester ---- */}
        <aside className="w-80 border-l border-zinc-800 bg-zinc-900/20 flex-col hidden xl:flex shrink-0">
          <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-semibold">Prompt Tester</span>
          </div>
          <div className="flex-1 p-4 space-y-4">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                Model
              </p>
              <div className="flex flex-wrap gap-1.5">
                {DEMO_MODELS.map(m => (
                  <button
                    key={m.name}
                    type="button"
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-400 transition-colors"
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${m.colorClass}`}
                    />
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="prompt-input"
                className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block"
              >
                Prompt
              </label>
              <textarea
                id="prompt-input"
                placeholder="Enter a test prompt..."
                value={promptText}
                onChange={e => setPromptText(e.target.value)}
                className="w-full h-28 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-zinc-300 placeholder:text-zinc-600"
              />
            </div>

            <Button
              className="w-full gap-2 bg-violet-600 hover:bg-violet-500 text-white border-0"
              onClick={handleTestPrompt}
              disabled={!promptText.trim() || mutations.testPrompt.isLoading}
            >
              <Sparkles className="w-4 h-4" />
              {mutations.testPrompt.isLoading ? "Testing..." : "Test Prompt"}
            </Button>

            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                Output
              </p>
              <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 min-h-[100px]">
                {promptOutput
                  ? (
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {promptOutput}
                    </p>
                  )
                  : (
                    <p className="text-xs text-zinc-600 italic">
                      Output will appear here...
                    </p>
                  )}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                Compare Models
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs"
                onClick={() => mutations.compareOutputs.mutate({})}
              >
                <Layers className="w-3.5 h-3.5" />
                Compare Outputs
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
