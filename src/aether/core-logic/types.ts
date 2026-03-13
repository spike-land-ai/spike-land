// Existing types (extracted from aether-prompt.ts)
export interface AetherNote {
  id: string;
  trigger: string;
  lesson: string;
  confidence: number; // 0-1, Bayesian
  helpCount: number;
  createdAt: number;
  lastUsedAt: number;
}

export interface UserMemory {
  lifeSummary: string;
  notes: AetherNote[];
  currentGoals: string[];
}

export interface SplitPrompt {
  stablePrefix: string;
  dynamicSuffix: string;
}

// New PKG types (Phase 1 prep)
export const PKGNodeType = {
  SKILL: "skill",
  DECISION: "decision",
  GOAL: "goal",
  BELIEF: "belief",
  EVENT: "event",
  HEALTH_SIGNAL: "health_signal",
} as const;
export type PKGNodeType = (typeof PKGNodeType)[keyof typeof PKGNodeType];

export const PKGEdgeType = {
  LEARNED: "learned",
  DECIDED: "decided",
  CAUSED: "caused",
  HOLDS: "holds",
  PURSUES: "pursues",
  CORRELATES: "correlates",
} as const;
export type PKGEdgeType = (typeof PKGEdgeType)[keyof typeof PKGEdgeType];

export interface PKGNode {
  id: string;
  userId: string;
  nodeType: PKGNodeType;
  label: string;
  dataJson: Record<string, unknown>;
  confidence: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

export interface PKGEdge {
  id: string;
  userId: string;
  sourceNodeId: string;
  targetNodeId: string;
  edgeType: PKGEdgeType;
  weight: number;
  metadata: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface PKGEventLogEntry {
  id: string;
  userId: string;
  nodeId: string;
  eventType: string;
  snapshotJson: Record<string, unknown>;
  createdAt: number;
}

export interface PKGQueryResult {
  nodes: PKGNode[];
  edges: PKGEdge[];
}
