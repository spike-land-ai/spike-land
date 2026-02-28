"use client";

import { useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { MachineTabs } from "@/components/state-machine/MachineTabs";
import { EmptyWorkspace } from "@/components/state-machine/EmptyWorkspace";
import { AddStateDialog } from "@/components/state-machine/AddStateDialog";
import { NewMachineDialog } from "@/components/state-machine/NewMachineDialog";
import {
  Braces,
  CheckCircle,
  ChevronDown,
  GitBranch,
  History,
  LayoutTemplate,
  ListChecks,
  Play,
  Plus,
  RotateCcw,
  Send,
  Trash2,
  X,
  Zap,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_MACHINES = [
  {
    id: "m1",
    name: "Auth Flow",
    stateCount: 4,
    transitionCount: 5,
    hasUnsavedChanges: false,
  },
  {
    id: "m2",
    name: "Payment Process",
    stateCount: 6,
    transitionCount: 8,
    hasUnsavedChanges: true,
  },
  {
    id: "m3",
    name: "File Upload",
    stateCount: 3,
    transitionCount: 3,
    hasUnsavedChanges: false,
  },
];

const MOCK_STATES = [
  { id: "idle", type: "atomic" as const, active: true, initial: true },
  { id: "loading", type: "atomic" as const, active: false, initial: false },
  { id: "success", type: "final" as const, active: false, initial: false },
  { id: "error", type: "atomic" as const, active: false, initial: false },
];

const MOCK_TRANSITIONS = [
  { id: "t1", source: "idle", target: "loading", event: "FETCH" },
  { id: "t2", source: "loading", target: "success", event: "RESOLVE" },
  { id: "t3", source: "loading", target: "error", event: "REJECT" },
  { id: "t4", source: "error", target: "idle", event: "RETRY" },
];

const MOCK_TEMPLATES = [
  {
    name: "Traffic Light",
    description: "Simple 3-state cycle with timers",
    color: "#ef4444",
    states: 3,
    transitions: 3,
    category: "Basics",
  },
  {
    name: "API Request",
    description: "Fetch with loading, success, and error",
    color: "#3b82f6",
    states: 4,
    transitions: 4,
    category: "Web & API",
  },
  {
    name: "Shopping Cart",
    description: "E-commerce cart lifecycle",
    color: "#8b5cf6",
    states: 6,
    transitions: 8,
    category: "E-Commerce",
  },
  {
    name: "Authentication",
    description: "Login/logout with session management",
    color: "#10b981",
    states: 5,
    transitions: 6,
    category: "Web & API",
  },
  {
    name: "Game Loop",
    description: "Menu, playing, paused, game over",
    color: "#f59e0b",
    states: 4,
    transitions: 5,
    category: "Gaming",
  },
  {
    name: "CI Pipeline",
    description: "Build, test, deploy pipeline stages",
    color: "#06b6d4",
    states: 5,
    transitions: 5,
    category: "DevOps & CI/CD",
  },
];

const MOCK_HISTORY = [
  { event: "FETCH", from: "idle", to: "loading", time: "10:32:01" },
  { event: "RESOLVE", from: "loading", to: "success", time: "10:32:03" },
  { event: "RETRY", from: "error", to: "idle", time: "10:31:58" },
];

// ---------------------------------------------------------------------------
// Code Snippets
// ---------------------------------------------------------------------------

const codeSnippets = {
  machineTabs: `import { MachineTabs } from "@/components/state-machine/MachineTabs";

<MachineTabs
  machines={[
    { id: "m1", name: "Auth Flow", stateCount: 4,
      transitionCount: 5, hasUnsavedChanges: false },
    { id: "m2", name: "Payment Process", stateCount: 6,
      transitionCount: 8, hasUnsavedChanges: true },
  ]}
  activeMachineId="m1"
  onSwitch={(id) => setActive(id)}
  onClose={(id) => closeMachine(id)}
  onNew={() => openNewDialog()}
/>`,
  emptyWorkspace: `import { EmptyWorkspace } from "@/components/state-machine/EmptyWorkspace";

<EmptyWorkspace
  onNew={() => setShowNewMachine(true)}
  onTemplate={() => setShowTemplates(true)}
/>`,
  newMachineDialog: `import { NewMachineDialog } from "@/components/state-machine/NewMachineDialog";

<NewMachineDialog
  isOpen={showDialog}
  onSubmit={(data) => createMachine(data)}
  onClose={() => setShowDialog(false)}
/>`,
  addStateDialog: `import { AddStateDialog } from "@/components/state-machine/AddStateDialog";

<AddStateDialog
  isOpen={showAddState}
  existingStates={["idle", "loading", "success"]}
  onSubmit={(data) => addState(data)}
  onClose={() => setShowAddState(false)}
/>`,
};

// ---------------------------------------------------------------------------
// State Graph Mockup (visual substitute for canvas-based StateGraph)
// ---------------------------------------------------------------------------

function StateGraphMockup() {
  const nodePositions = [
    { id: "idle", x: 60, y: 120, active: true, initial: true },
    { id: "loading", x: 260, y: 60, active: false, initial: false },
    { id: "success", x: 460, y: 60, active: false, initial: false },
    { id: "error", x: 260, y: 200, active: false, initial: false },
  ];

  return (
    <div className="relative w-full h-[300px] bg-zinc-950/80 rounded-xl border border-zinc-800/80 overflow-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* SVG edges */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 560 280">
        {/* idle -> loading */}
        <path
          d="M 120 130 C 170 100, 200 80, 250 78"
          fill="none"
          stroke="#6366f1"
          strokeWidth="2"
          opacity="0.5"
        />
        <polygon points="248,74 258,78 248,82" fill="#6366f1" opacity="0.5" />
        <text
          x="170"
          y="92"
          fill="#6366f1"
          fontSize="9"
          fontWeight="600"
          opacity="0.7"
        >
          FETCH
        </text>

        {/* loading -> success */}
        <path
          d="M 330 78 L 430 78"
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          opacity="0.5"
        />
        <polygon points="428,74 438,78 428,82" fill="#10b981" opacity="0.5" />
        <text
          x="365"
          y="70"
          fill="#10b981"
          fontSize="9"
          fontWeight="600"
          opacity="0.7"
        >
          RESOLVE
        </text>

        {/* loading -> error */}
        <path
          d="M 290 98 L 290 180"
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          opacity="0.5"
        />
        <polygon
          points="286,178 290,188 294,178"
          fill="#ef4444"
          opacity="0.5"
        />
        <text
          x="296"
          y="145"
          fill="#ef4444"
          fontSize="9"
          fontWeight="600"
          opacity="0.7"
        >
          REJECT
        </text>

        {/* error -> idle */}
        <path
          d="M 240 210 C 180 210, 130 180, 110 150"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2"
          opacity="0.5"
          strokeDasharray="4 3"
        />
        <polygon
          points="106,152 110,142 114,152"
          fill="#f59e0b"
          opacity="0.5"
        />
        <text
          x="150"
          y="205"
          fill="#f59e0b"
          fontSize="9"
          fontWeight="600"
          opacity="0.7"
        >
          RETRY
        </text>
      </svg>

      {/* State nodes */}
      {nodePositions.map(node => (
        <div
          key={node.id}
          className="absolute flex flex-col items-center"
          style={{
            left: node.x,
            top: node.y,
            transform: "translate(-50%, -50%)",
          }}
        >
          {node.initial && (
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
          )}
          <div
            className={`px-5 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all backdrop-blur-sm ${
              node.active
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                : node.id === "success"
                ? "bg-zinc-900/60 border-zinc-700/50 text-zinc-400 rounded-2xl"
                : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400"
            }`}
          >
            {node.active && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
            {node.id}
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="absolute bottom-3 right-3 flex gap-3 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500" /> Initial
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Simulation Panel Mockup
// ---------------------------------------------------------------------------

function SimulationPanelMockup() {
  const [activeTab, setActiveTab] = useState<
    "events" | "context" | "history" | "validation"
  >("events");

  const tabs = [
    {
      id: "events" as const,
      label: "Events",
      icon: <Zap className="w-3.5 h-3.5" />,
    },
    {
      id: "context" as const,
      label: "Context",
      icon: <Braces className="w-3.5 h-3.5" />,
    },
    {
      id: "history" as const,
      label: "History",
      icon: <History className="w-3.5 h-3.5" />,
      badge: 3,
    },
    {
      id: "validation" as const,
      label: "Validate",
      icon: <ListChecks className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="flex flex-col w-full max-w-md bg-zinc-950/30 backdrop-blur-md rounded-xl overflow-hidden border border-zinc-800/50 shadow-2xl">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-3 border-b border-zinc-800/80 bg-zinc-900/50">
        <Button
          variant="success"
          size="sm"
          className="bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600/30"
        >
          <Play className="w-4 h-4 mr-2 fill-current" />
          Auto Play
        </Button>
        <div className="h-6 w-[1px] bg-zinc-800/80" />
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-lg hover:bg-zinc-800/80 text-zinc-400"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <div className="flex-1" />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5 px-3 py-2.5 border-b border-zinc-800/80 bg-zinc-950/80">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
              activeTab === tab.id
                ? "bg-zinc-800/80 text-white border-zinc-700/50 shadow-sm"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/60 border-transparent"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.badge && tab.badge > 0 && (
              <span className="min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center bg-zinc-700 text-zinc-300">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4 space-y-4 min-h-[250px]">
        {activeTab === "events" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
              <input
                type="text"
                placeholder="Event name..."
                className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none h-9 font-medium"
                readOnly
              />
              <Button
                variant="aurora"
                size="sm"
                className="h-8 px-4 text-xs font-semibold shadow-md"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Send
              </Button>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider pl-1">
                Available Transitions
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {["FETCH", "RESOLVE", "REJECT", "RETRY"].map(evt => (
                  <button
                    key={evt}
                    className="group relative flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-[13px] font-semibold bg-zinc-900/40 text-zinc-300 border border-zinc-800/80 hover:bg-zinc-800/80 hover:border-indigo-500/50 hover:text-white transition-all"
                  >
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500/30 group-hover:bg-indigo-500 transition-colors" />
                    <Zap className="w-3.5 h-3.5 text-indigo-400" />
                    {evt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-zinc-800/50">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                Active States
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  idle
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "context" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider pl-1">
                Machine Context
              </p>
            </div>
            <pre className="w-full min-h-[180px] px-4 py-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl text-[11px] text-zinc-300 font-mono leading-relaxed">
{`{
  "retryCount": 0,
  "data": null,
  "error": null,
  "lastFetched": null
}`}
            </pre>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4 pl-3 border-l-2 border-zinc-800/80 ml-2">
            {MOCK_HISTORY.map((entry, idx) => (
              <div key={idx} className="group relative pl-4 pb-1">
                <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-zinc-800 border-2 border-zinc-950 group-hover:bg-indigo-500 transition-colors z-10" />
                <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 group-hover:bg-zinc-900 group-hover:border-zinc-700 transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200">
                      {entry.event}
                    </span>
                    <span className="text-[10px] text-zinc-600 font-mono">
                      {entry.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-950 text-zinc-500 border border-zinc-800">
                      {entry.from}
                    </span>
                    <span className="text-zinc-600">&rarr;</span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-950 text-zinc-300 border border-zinc-700 font-medium">
                      {entry.to}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "validation" && (
          <div className="space-y-3">
            <div className="text-center py-6 text-zinc-600 text-sm flex flex-col items-center gap-3">
              <CheckCircle className="w-10 h-10 text-emerald-500/20" />
              <p>No issues found. Machine is valid.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// State Editor Mockup
// ---------------------------------------------------------------------------

function StateEditorMockup() {
  return (
    <div className="flex flex-col w-full max-w-sm bg-zinc-950 text-zinc-300 rounded-xl border border-zinc-800/80 overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-zinc-800/80 bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <h3 className="font-semibold text-white tracking-tight text-lg">
            loading
          </h3>
        </div>
        <button className="p-1.5 hover:bg-zinc-800 rounded-lg transition text-zinc-500">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* Properties */}
        <div>
          <h4 className="text-[11px] uppercase font-bold text-zinc-500 tracking-wider mb-3 px-1">
            Properties
          </h4>
          <div className="bg-zinc-900/40 rounded-xl p-4 border border-zinc-800/80">
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400 font-medium">Type</span>
              <span className="text-xs text-zinc-300 font-semibold capitalize bg-zinc-800/50 px-2.5 py-1 rounded-md border border-zinc-700/50">
                atomic
              </span>
            </div>
          </div>
        </div>

        {/* Transitions */}
        <div>
          <h4 className="text-[11px] uppercase font-bold text-zinc-500 tracking-wider mb-3 px-1">
            Transitions
          </h4>
          <div className="space-y-3">
            {[
              { event: "RESOLVE", target: "success" },
              { event: "REJECT", target: "error" },
            ].map((t, idx) => (
              <div
                key={idx}
                className="bg-zinc-900/40 rounded-xl p-3.5 border border-zinc-800/80 group hover:border-zinc-700 transition flex items-center justify-between"
              >
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-md self-start border border-indigo-500/20">
                    {t.event}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-zinc-500">Target:</span>
                    <span className="text-sm text-zinc-200 font-medium">
                      {t.target}
                    </span>
                  </div>
                </div>
                <button className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-5 border-t border-white/5 bg-zinc-900/30">
        <button className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-500/20 text-red-500 hover:bg-red-500/20 rounded-xl text-sm font-medium transition">
          <Trash2 className="w-4 h-4" />
          Delete State
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Transition Editor Mockup
// ---------------------------------------------------------------------------

function TransitionEditorMockup() {
  return (
    <div className="w-full max-w-sm space-y-4">
      <div className="space-y-3 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 shadow-inner">
        <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
          Add Transition
        </h4>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <select
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 appearance-none"
                defaultValue="idle"
                disabled
              >
                <option>idle</option>
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 appearance-none"
                defaultValue="loading"
                disabled
              >
                <option>loading</option>
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>
          </div>
          <input
            type="text"
            defaultValue="FETCH"
            className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600"
            readOnly
          />
          <input
            type="text"
            placeholder='Guard condition (e.g. "context.count > 0")'
            className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 font-mono text-xs"
            readOnly
          />
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md">
            <Zap className="w-4 h-4" />
            Add Transition
          </button>
        </div>
      </div>

      {/* Selected transition inspector */}
      <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
            Selected Transition
          </h4>
          <button className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="flex flex-col gap-1">
            <span className="text-zinc-500 font-medium tracking-wide text-[10px] uppercase">
              Source
            </span>
            <span className="text-zinc-300 bg-zinc-950/50 px-2 py-1.5 rounded-md border border-zinc-800/80">
              idle
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-zinc-500 font-medium tracking-wide text-[10px] uppercase">
              Target
            </span>
            <span className="text-zinc-300 bg-zinc-950/50 px-2 py-1.5 rounded-md border border-zinc-800/80">
              loading
            </span>
          </div>
          <div className="flex flex-col gap-1 col-span-2">
            <span className="text-zinc-500 font-medium tracking-wide text-[10px] uppercase">
              Event Trigger
            </span>
            <span className="text-indigo-300 font-semibold bg-indigo-500/20 px-2 py-1.5 rounded-md border border-indigo-500/30 inline-block w-max">
              FETCH
            </span>
          </div>
        </div>
      </div>

      {/* Transition list */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-1">
          All Transitions ({MOCK_TRANSITIONS.length})
        </h4>
        <div className="space-y-1">
          {MOCK_TRANSITIONS.map((t, idx) => (
            <button
              key={t.id}
              className={`w-full flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-left transition-all ${
                idx === 0
                  ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-inner"
                  : "text-zinc-400 hover:text-zinc-200 bg-zinc-900/40 hover:bg-zinc-800/60 border border-transparent"
              }`}
            >
              <span className="truncate font-medium">{t.source}</span>
              <span className="text-zinc-600">&rarr;</span>
              <span className="truncate font-medium">{t.target}</span>
              <span
                className={`ml-auto px-2 py-1 rounded-md text-[10px] font-semibold border ${
                  idx === 0
                    ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300"
                    : "bg-zinc-800 border-zinc-700/50 text-zinc-400"
                }`}
              >
                {t.event}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Template Library Mockup (inline, non-modal version)
// ---------------------------------------------------------------------------

function TemplateLibraryMockup() {
  const [activeCategory, setActiveCategory] = useState("All");
  const categories = [
    "All",
    "Basics",
    "Web & API",
    "E-Commerce",
    "Gaming",
    "DevOps & CI/CD",
  ];

  const filtered = activeCategory === "All"
    ? MOCK_TEMPLATES
    : MOCK_TEMPLATES.filter(t => t.category === activeCategory);

  return (
    <div className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-950/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <LayoutTemplate className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-100 tracking-wide">
              Template Library
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {filtered.length} templates - Start from a pre-built architecture pattern
            </p>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 px-6 py-3 border-b border-zinc-800/50 bg-zinc-900/30 overflow-x-auto">
        {categories.map(cat => {
          const count = cat === "All"
            ? MOCK_TEMPLATES.length
            : MOCK_TEMPLATES.filter(t => t.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
                activeCategory === cat
                  ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80 border border-transparent"
              }`}
            >
              {cat}
              <span
                className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-md border ${
                  activeCategory === cat
                    ? "bg-indigo-500/20 border-indigo-500/20 text-indigo-300"
                    : "bg-zinc-800/80 border-zinc-700/50 text-zinc-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Templates grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(template => (
            <div
              key={template.name}
              className="group relative flex items-start gap-4 p-4 rounded-xl border transition-all text-left hover:scale-[1.02]"
              style={{
                background: `linear-gradient(135deg, ${template.color}08, transparent)`,
                borderColor: `${template.color}20`,
              }}
            >
              <div
                className="flex-shrink-0 p-2.5 rounded-xl border"
                style={{
                  background: `${template.color}10`,
                  color: template.color,
                  borderColor: `${template.color}30`,
                }}
              >
                <GitBranch className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-zinc-100 group-hover:text-white transition-colors leading-tight tracking-wide">
                  {template.name}
                </h3>
                <p className="text-[11px] text-zinc-400/80 mt-1.5 leading-relaxed">
                  {template.description}
                </p>
                <div className="flex gap-2.5 mt-3 text-[10px] text-zinc-500 font-medium">
                  <span className="bg-zinc-900/80 px-1.5 py-0.5 rounded border border-zinc-800/80">
                    {template.states} states
                  </span>
                  <span className="bg-zinc-900/80 px-1.5 py-0.5 rounded border border-zinc-800/80">
                    {template.transitions} transitions
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function StateMachinePage() {
  const [showAddState, setShowAddState] = useState(false);
  const [showNewMachine, setShowNewMachine] = useState(false);

  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="State Machine Builder"
        description="Create, visualize, and simulate complex hierarchical state machines with live transitions, AI assistance, and interactive debugging. The builder provides a visual canvas, simulation panel, template library, and editor panels for states and transitions."
        usage="Use the State Machine Builder to design finite state machines for workflow orchestration, UI state management, game logic, or any domain requiring deterministic state transitions."
      />

      <UsageGuide
        dos={[
          "Start from a template when building common patterns (auth, API, checkout).",
          "Use the simulation panel to step through transitions and verify behavior.",
          "Name states and events clearly (e.g. 'loading', 'FETCH') for readability.",
          "Leverage guard conditions to model conditional transitions.",
          "Use compound/parallel states for complex hierarchical machines.",
        ]}
        donts={[
          "Don't create unreachable states -- every state should have at least one incoming transition.",
          "Avoid ambiguous event names that could apply to multiple unrelated transitions.",
          "Don't skip validation -- always run the validator before exporting.",
          "Avoid deeply nested state hierarchies (3+ levels) unless strictly necessary.",
        ]}
      />

      {/* MachineTabs */}
      <ComponentSample
        title="Machine Tabs"
        description="Tab navigation for switching between open state machines. Shows state counts, unsaved change indicators, and a button to create new machines."
      >
        <div className="w-full">
          <MachineTabs
            machines={MOCK_MACHINES}
            activeMachineId="m1"
            onSwitch={() => {}}
            onClose={() => {}}
            onNew={() => {}}
          />
        </div>
      </ComponentSample>

      {/* EmptyWorkspace */}
      <ComponentSample
        title="Empty Workspace"
        description="The welcome screen shown when no machines are open. Provides quick actions to create a new machine or browse templates."
      >
        <div className="w-full h-[360px] rounded-xl overflow-hidden">
          <EmptyWorkspace
            onNew={() => setShowNewMachine(true)}
            onTemplate={() => {}}
          />
        </div>
      </ComponentSample>

      {/* State Graph Mockup */}
      <ComponentSample
        title="State Graph (Visual Mockup)"
        description="The interactive canvas where states are rendered as nodes and transitions as directed edges. States glow when active, and the initial state has a marker dot. This is a simplified mockup of the canvas-based StateGraph component."
      >
        <div className="w-full">
          <StateGraphMockup />
        </div>
      </ComponentSample>

      {/* Template Library */}
      <section className="space-y-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold font-heading">Template Library</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Browse and select pre-built state machine templates across categories like Web &amp;
            API, E-Commerce, Gaming, and DevOps. Each template provides states, transitions, and
            context ready to customize.
          </p>
        </div>
        <TemplateLibraryMockup />
      </section>

      {/* Simulation Panel */}
      <ComponentSample
        title="Simulation Panel"
        description="Interactive panel for stepping through machine execution. Includes event dispatch, context editing, transition history timeline, and machine validation. Supports auto-play mode and scenario recording."
      >
        <SimulationPanelMockup />
      </ComponentSample>

      {/* Editor Panels */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold font-heading">Editor Panels</h2>
        <p className="text-sm text-muted-foreground -mt-4">
          Side panels for inspecting and editing individual states and transitions. The State Editor
          shows properties, outgoing transitions, and deletion controls. The Transition Editor
          allows adding new transitions with guard conditions.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-3">
            <Badge variant="outline">State Editor</Badge>
            <StateEditorMockup />
          </div>
          <div className="space-y-3">
            <Badge variant="outline">Transition Editor</Badge>
            <TransitionEditorMockup />
          </div>
        </div>
      </section>

      {/* Dialog Components */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold font-heading">Dialogs</h2>
        <p className="text-sm text-muted-foreground -mt-4">
          Modal dialogs for creating new machines and adding states. Built with shadcn/ui Dialog,
          react-hook-form, and Zod validation.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="glass-1">
            <CardContent className="pt-6 space-y-4">
              <Badge variant="outline">New Machine Dialog</Badge>
              <p className="text-sm text-muted-foreground">
                Creates a new state machine with a name and initial state. Uses Zod schema
                validation for input fields.
              </p>
              <Button
                onClick={() => setShowNewMachine(true)}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Open New Machine Dialog
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-1">
            <CardContent className="pt-6 space-y-4">
              <Badge variant="outline">Add State Dialog</Badge>
              <p className="text-sm text-muted-foreground">
                Adds a new state node with configurable type (atomic, compound, parallel, final) and
                optional parent.
              </p>
              <Button onClick={() => setShowAddState(true)} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Open Add State Dialog
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* State Types Reference */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold font-heading">State Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              type: "Atomic",
              desc: "A simple leaf state with no children. The most common state type.",
              color: "text-indigo-400",
              bg: "bg-indigo-500/10 border-indigo-500/20",
            },
            {
              type: "Compound",
              desc: "A parent state containing nested child states with its own initial state.",
              color: "text-purple-400",
              bg: "bg-purple-500/10 border-purple-500/20",
            },
            {
              type: "Parallel",
              desc: "A state where all child regions are active simultaneously.",
              color: "text-cyan-400",
              bg: "bg-cyan-500/10 border-cyan-500/20",
            },
            {
              type: "Final",
              desc: "A terminal state indicating the machine has completed.",
              color: "text-emerald-400",
              bg: "bg-emerald-500/10 border-emerald-500/20",
            },
          ].map(item => (
            <Card key={item.type} className="glass-1">
              <CardContent className="pt-6 space-y-3">
                <div
                  className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-bold border ${item.bg} ${item.color}`}
                >
                  {item.type}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Code Preview */}
      <CodePreview
        code={codeSnippets.machineTabs}
        title="Usage Examples"
        tabs={[
          { label: "Machine Tabs", code: codeSnippets.machineTabs },
          { label: "Empty Workspace", code: codeSnippets.emptyWorkspace },
          { label: "New Machine", code: codeSnippets.newMachineDialog },
          { label: "Add State", code: codeSnippets.addStateDialog },
        ]}
      />

      <AccessibilityPanel
        notes={[
          "All interactive elements in the state graph are keyboard-navigable.",
          "Tab navigation bar supports keyboard arrow key navigation between machine tabs.",
          "Dialog components trap focus and support Escape key to close.",
          "State nodes in the editor announce their type and active status to screen readers.",
          "Simulation panel events can be triggered via keyboard Enter key.",
          "Color is never the sole indicator of state -- icons and labels always accompany status changes.",
          "Contrast ratios for state labels exceed WCAG AA standards against dark backgrounds.",
        ]}
      />

      <RelatedComponents currentId="state-machine" />

      {/* Render actual dialogs */}
      <NewMachineDialog
        isOpen={showNewMachine}
        onSubmit={() => setShowNewMachine(false)}
        onClose={() => setShowNewMachine(false)}
      />
      <AddStateDialog
        isOpen={showAddState}
        existingStates={MOCK_STATES.map(s => s.id)}
        onSubmit={() => setShowAddState(false)}
        onClose={() => setShowAddState(false)}
      />
    </div>
  );
}
