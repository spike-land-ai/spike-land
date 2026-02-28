export type AgentStatus = "active" | "idle" | "stopped";
export type TrustLevel = "SANDBOX" | "TRUSTED" | "ADMIN";
export type MessageRole = "USER" | "AGENT" | "SYSTEM";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface SwarmAgent {
  id: string;
  displayName: string;
  machineId: string;
  projectPath: string | null;
  workingDirectory?: string | null;
  lastSeenAt: string | null;
  totalTokensUsed: number;
  totalTasksCompleted: number;
  messageCount: number;
  status: AgentStatus;
  trustLevel: TrustLevel;
  trustSuccessful: number;
  trustFailed: number;
}

export interface AgentMessage {
  id: string;
  agentId: string;
  agentName: string;
  role: MessageRole;
  content: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown> | null | undefined;
}

export interface TimelineEntry {
  action: string;
  actionType: string;
  createdAt: string;
  durationMs: number;
  isError: boolean;
}

export interface TopologyNode {
  id: string;
  displayName: string;
  status: AgentStatus;
  trustLevel: TrustLevel;
  successCount: number;
  failCount: number;
}
