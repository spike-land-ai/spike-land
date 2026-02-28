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
import { PrincipleCard } from "@/components/bazdmeg/PrincipleCard";
import { QualityCheckpoints } from "@/components/bazdmeg/QualityCheckpoints";
import { EffortSplit } from "@/components/bazdmeg/EffortSplit";
import { HourglassModel } from "@/components/bazdmeg/HourglassModel";
import { SocialProof } from "@/components/bazdmeg/SocialProof";
import { WorkflowStatusBadge } from "@/components/bazdmeg/dashboard/WorkflowStatusBadge";
import { WorkflowStepper } from "@/components/bazdmeg/dashboard/WorkflowStepper";
import { TicketListItem } from "@/components/bazdmeg/dashboard/TicketListItem";
import type { TicketItem } from "@/components/bazdmeg/dashboard/TicketListItem";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Shield, TestTube, Workflow } from "lucide-react";

// -- Mock data for PrincipleCard --
const MOCK_PRINCIPLES = [
  {
    id: 1,
    title: "Business-First Requirements",
    oneLiner:
      "Start with the business problem, not the technical solution. AI interviews you before writing a single line.",
    color: "#3B82F6",
    icon: Brain,
  },
  {
    id: 2,
    title: "Agent-Tested, Human-Verified",
    oneLiner:
      "AI agents run your tests like a human would. You verify the results, not the process.",
    color: "#10B981",
    icon: TestTube,
  },
  {
    id: 3,
    title: "Zero Trust Code",
    oneLiner:
      "Every line of AI-generated code is guilty until proven innocent by tests and type checks.",
    color: "#EAB308",
    icon: Shield,
  },
  {
    id: 4,
    title: "Disposable Implementation",
    oneLiner:
      "UI code is disposable. Regenerate, don't fix. Only business logic and tests are permanent.",
    color: "#6366F1",
    icon: Workflow,
  },
];

// -- Mock data for TicketListItem --
const MOCK_TICKETS: TicketItem[] = [
  {
    number: 142,
    title: "Add user onboarding flow with progress tracking",
    labels: ["feature", "p1"],
    author: "zerdos",
    updatedAt: new Date(Date.now() - 3600_000).toISOString(),
    url: "#",
    body: "Implement step-by-step onboarding",
    plan: {
      id: "plan-1",
      status: "JULES_WORKING",
      planVersion: 2,
      julesSessionId: "sess-abc",
      julesLastState: "running",
      updatedAt: new Date(Date.now() - 1800_000).toISOString(),
    },
  },
  {
    number: 138,
    title: "Fix authentication token refresh race condition",
    labels: ["bug", "p0"],
    author: "zerdos",
    updatedAt: new Date(Date.now() - 7200_000).toISOString(),
    url: "#",
    body: null,
    plan: {
      id: "plan-2",
      status: "COMPLETED",
      planVersion: 1,
      julesSessionId: null,
      julesLastState: null,
      updatedAt: new Date(Date.now() - 3600_000).toISOString(),
    },
  },
  {
    number: 135,
    title: "Refactor MCP tool registration to use decorators",
    labels: ["tech-debt", "p2"],
    author: "zerdos",
    updatedAt: new Date(Date.now() - 86400_000).toISOString(),
    url: "#",
    body: null,
    plan: null,
  },
];

// -- All workflow statuses for badge showcase --
const ALL_STATUSES = [
  "UNPLANNED",
  "PLANNING",
  "PLAN_READY",
  "APPROVED",
  "SENT_TO_JULES",
  "JULES_WORKING",
  "JULES_REVIEW",
  "BUILD_FIXING",
  "COMPLETED",
  "FAILED",
];

// -- All workflow statuses for stepper showcase --
const STEPPER_STATUSES = [
  "UNPLANNED",
  "PLANNING",
  "PLAN_READY",
  "APPROVED",
  "SENT_TO_JULES",
  "JULES_WORKING",
  "COMPLETED",
  "FAILED",
];

export default function BazdmegPage() {
  const [selectedTicket, setSelectedTicket] = useState<number>(142);

  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="BAZDMEG AI Workflow"
        description="The BAZDMEG methodology orchestrates AI-assisted development through seven principles, quality gates, and a structured workflow. These components power the workflow dashboard and the public-facing methodology page."
        usage="Use these components to build AI workflow dashboards, display development principles, and visualize quality checkpoints in the BAZDMEG methodology."
      />

      <UsageGuide
        dos={[
          "Use PrincipleCard to display BAZDMEG methodology principles with interactive 3D tilt effects.",
          "Use WorkflowStatusBadge to indicate ticket workflow state throughout the dashboard.",
          "Use QualityCheckpoints as interactive checklists at each development phase.",
          "Use WorkflowStepper for compact, inline progress visualization on ticket lists.",
        ]}
        donts={[
          "Don't modify the workflow status strings -- they map to database enum values.",
          "Don't use EffortSplit without the recharts dependency (PieChart).",
          "Don't render BazdmegHero inside scrollable containers -- it uses viewport-based layout.",
          "Don't skip QualityCheckpoints phases -- all three gates are mandatory in the workflow.",
        ]}
      />

      {/* -- PrincipleCard -- */}
      <ComponentSample
        title="PrincipleCard"
        description="Interactive 3D-tilt cards showcasing BAZDMEG methodology principles. Each card features mouse-tracked spotlight, shimmer effects, and scroll-reveal animations."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {MOCK_PRINCIPLES.map((principle, i) => (
            <PrincipleCard key={principle.id} principle={principle} index={i} />
          ))}
        </div>
      </ComponentSample>

      {/* -- WorkflowStatusBadge -- */}
      <ComponentSample
        title="WorkflowStatusBadge"
        description="Color-coded badges representing every state in the BAZDMEG workflow pipeline. JULES_WORKING pulses to indicate active processing."
      >
        <div className="flex flex-wrap gap-3 justify-center">
          {ALL_STATUSES.map(status => <WorkflowStatusBadge key={status} status={status} />)}
          <WorkflowStatusBadge status={null} />
        </div>
      </ComponentSample>

      {/* -- WorkflowStepper -- */}
      <ComponentSample
        title="WorkflowStepper"
        description="Compact step-by-step progress indicator for workflow pipelines. Shows completed, active, and pending states with animated spinners for in-progress work."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {STEPPER_STATUSES.map(status => (
            <Card key={status} className="glass-1">
              <CardContent className="pt-6 space-y-3">
                <Badge variant="outline" className="text-xs">
                  {status}
                </Badge>
                <WorkflowStepper status={status} />
              </CardContent>
            </Card>
          ))}
        </div>
      </ComponentSample>

      {/* -- TicketListItem -- */}
      <ComponentSample
        title="TicketListItem"
        description="Ticket list entry with workflow badge, labels, and relative timestamps. Supports selection state for detail panel integration."
      >
        <div className="flex flex-col gap-3 w-full max-w-xl">
          {MOCK_TICKETS.map(ticket => (
            <TicketListItem
              key={ticket.number}
              ticket={ticket}
              isSelected={selectedTicket === ticket.number}
              onClick={() => setSelectedTicket(ticket.number)}
            />
          ))}
        </div>
      </ComponentSample>

      {/* -- QualityCheckpoints -- */}
      <ComponentSample
        title="QualityCheckpoints"
        description="Three-phase quality gate system with interactive checklists. Pre-Code, Post-Code, and Pre-PR checkpoints enforce discipline at every development stage."
      >
        <div className="w-full">
          <QualityCheckpoints />
        </div>
      </ComponentSample>

      {/* -- EffortSplit -- */}
      <ComponentSample
        title="EffortSplit"
        description="Donut chart and animated bar visualization showing the BAZDMEG effort distribution: 30% Planning, 50% Testing, 20% Quality, 0% Coding."
      >
        <div className="w-full">
          <EffortSplit />
        </div>
      </ComponentSample>

      {/* -- HourglassModel -- */}
      <ComponentSample
        title="HourglassModel"
        description="Animated SVG hourglass metaphor for the BAZDMEG testing model: heavy E2E specs at top, disposable UI code at the narrow waist, and bulletproof business logic tests at the base."
      >
        <div className="w-full">
          <HourglassModel />
        </div>
      </ComponentSample>

      {/* -- SocialProof -- */}
      <ComponentSample
        title="SocialProof"
        description="Live counter badge showing how many developers have asked about BAZDMEG. Fetches from /api/bazdmeg/chat and renders nothing if count is zero."
      >
        <div className="flex flex-col items-center gap-4">
          <SocialProof />
          <p className="text-xs text-muted-foreground">
            Note: This component fetches live data. It may appear empty if the API is unavailable.
          </p>
        </div>
      </ComponentSample>

      <CodePreview
        title="BAZDMEG Component Usage"
        code={`import { PrincipleCard } from "@/components/bazdmeg/PrincipleCard";
import { WorkflowStatusBadge } from "@/components/bazdmeg/dashboard/WorkflowStatusBadge";
import { WorkflowStepper } from "@/components/bazdmeg/dashboard/WorkflowStepper";
import { QualityCheckpoints } from "@/components/bazdmeg/QualityCheckpoints";

// Principle card with 3D tilt
<PrincipleCard principle={principle} index={0} />

// Workflow status badge
<WorkflowStatusBadge status="JULES_WORKING" />

// Workflow stepper
<WorkflowStepper status="APPROVED" />

// Quality checkpoints
<QualityCheckpoints />`}
        tabs={[
          {
            label: "PrincipleCard",
            code: `import { PrincipleCard } from "@/components/bazdmeg/PrincipleCard";

const principle = {
  id: 1,
  title: "Business-First Requirements",
  oneLiner: "Start with the business problem...",
  color: "#3B82F6",
  icon: Brain,
};

<PrincipleCard principle={principle} index={0} />`,
          },
          {
            label: "Dashboard",
            code:
              `import { WorkflowStatusBadge } from "@/components/bazdmeg/dashboard/WorkflowStatusBadge";
import { WorkflowStepper } from "@/components/bazdmeg/dashboard/WorkflowStepper";
import { TicketListItem } from "@/components/bazdmeg/dashboard/TicketListItem";

// Status badge for any workflow state
<WorkflowStatusBadge status="JULES_WORKING" />

// Compact stepper for inline progress
<WorkflowStepper status="APPROVED" />

// Ticket list with selection
<TicketListItem
  ticket={ticket}
  isSelected={isSelected}
  onClick={() => setSelected(ticket.number)}
/>`,
          },
          {
            label: "Quality",
            code: `import { QualityCheckpoints } from "@/components/bazdmeg/QualityCheckpoints";
import { EffortSplit } from "@/components/bazdmeg/EffortSplit";
import { HourglassModel } from "@/components/bazdmeg/HourglassModel";

// Interactive quality gate checklists
<QualityCheckpoints />

// Effort distribution chart
<EffortSplit />

// Testing model visualization
<HourglassModel />`,
          },
        ]}
      />

      <AccessibilityPanel
        notes={[
          "PrincipleCard disables 3D tilt on touch devices (pointer: coarse) for usability.",
          "WorkflowStatusBadge uses semantic color contrast meeting WCAG AA on dark backgrounds.",
          "WorkflowStepper uses distinct icons (check, circle, spinner, X) alongside color for state differentiation.",
          "TicketListItem is a full-width button element ensuring keyboard navigability and focus management.",
          "QualityCheckpoints interactive checklists use native checkbox semantics with proper labels.",
          "All animated components respect reduced-motion preferences via framer-motion defaults.",
        ]}
      />

      <RelatedComponents currentId="bazdmeg" />
    </div>
  );
}
