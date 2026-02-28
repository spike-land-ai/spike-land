import type {
  BranchType,
  StepRunStatus,
  WorkflowEventType,
  WorkflowRunStatus,
  WorkflowStatus,
  WorkflowStepType,
} from "@prisma/client";

/**
 * Workflow step configuration for different action types
 */
export type WorkflowStepConfig = Record<string, unknown>;

/**
 * Workflow step with branching support
 */
export interface WorkflowStepData {
  id?: string;
  name: string;
  type: WorkflowStepType;
  sequence?: number;
  config: WorkflowStepConfig;
  dependencies?: string[];
  parentStepId?: string | null;
  branchType?: BranchType | null;
  branchCondition?: string | null;
  childSteps?: WorkflowStepData[];
}

/**
 * Workflow version with steps
 */
export interface WorkflowVersionData {
  id?: string;
  version: number;
  description?: string | null;
  isPublished: boolean;
  publishedAt?: Date | null;
  steps: WorkflowStepData[];
}

/**
 * Full workflow data structure
 */
export interface WorkflowData {
  id?: string;
  name: string;
  description?: string | null;
  status: WorkflowStatus;
  workspaceId: string;
  createdById?: string;
  versions?: WorkflowVersionData[];
}

/**
 * Create workflow input
 */
export interface CreateWorkflowInput {
  name: string;
  description?: string;
  steps?: WorkflowStepData[];
}

/**
 * Update workflow input
 */
export interface UpdateWorkflowInput {
  name?: string;
  description?: string | null;
  status?: WorkflowStatus;
}

/**
 * Create workflow version input
 */
export interface CreateVersionInput {
  description?: string;
  steps: WorkflowStepData[];
}

/**
 * Workflow run log entry
 */
export interface WorkflowRunLogEntry {
  stepId?: string;
  stepStatus?: StepRunStatus;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp?: Date;
}

/**
 * Workflow run data
 */
export interface WorkflowRunData {
  id: string;
  workflowId: string;
  status: WorkflowRunStatus;
  startedAt: Date;
  endedAt?: Date | null;
  logs: WorkflowRunLogEntry[];
}

/**
 * DSL format for workflow import/export
 */
export interface WorkflowDSL {
  version: "1.0";
  name: string;
  description?: string;
  steps: WorkflowStepDSL[];
}

/**
 * DSL format for a single step
 */
export interface WorkflowStepDSL {
  id: string;
  name: string;
  type: WorkflowStepType;
  config: WorkflowStepConfig;
  dependsOn?: string[];
  branches?: WorkflowBranchDSL[];
}

/**
 * DSL format for a branch
 */
export interface WorkflowBranchDSL {
  type: BranchType;
  condition?: string;
  steps: WorkflowStepDSL[];
}

/**
 * Validation result
 */
export interface WorkflowValidationResult {
  valid: boolean;
  errors: WorkflowValidationError[];
  warnings: WorkflowValidationWarning[];
}

/**
 * Validation error
 */
export interface WorkflowValidationError {
  code: string;
  message: string;
  stepId?: string;
  path?: string;
}

/**
 * Validation warning
 */
export interface WorkflowValidationWarning {
  code: string;
  message: string;
  stepId?: string;
  path?: string;
}

/**
 * API response for workflow operations
 */
export interface WorkflowApiResponse {
  workflow: WorkflowData;
}

/**
 * API response for listing workflows
 */
export interface WorkflowsListApiResponse {
  workflows: WorkflowData[];
  total: number;
  page: number;
  pageSize: number;
}

// ============================================================================
// Workflow Triggers
// ============================================================================

/**
 * Schedule trigger data
 */
export interface WorkflowScheduleData {
  id: string;
  workflowId: string;
  cronExpression: string;
  timezone: string;
  isActive: boolean;
  nextRunAt?: Date | null;
  lastRunAt?: Date | null;
}

/**
 * Create schedule trigger input
 */
export interface CreateScheduleInput {
  cronExpression: string;
  timezone?: string;
}

/**
 * Update schedule trigger input
 */
export interface UpdateScheduleInput {
  cronExpression?: string;
  timezone?: string;
  isActive?: boolean;
}

/**
 * Webhook trigger data
 */
export interface WorkflowWebhookData {
  id: string;
  workflowId: string;
  webhookToken: string;
  webhookUrl: string; // Computed URL for the webhook
  hasSecret: boolean; // Whether a secret is configured (don't expose the actual secret)
  isActive: boolean;
  lastTriggeredAt?: Date | null;
}

/**
 * Create webhook trigger input
 */
export interface CreateWebhookInput {
  secret?: string; // Optional secret for HMAC verification
}

/**
 * Update webhook trigger input
 */
export interface UpdateWebhookInput {
  secret?: string;
  regenerateToken?: boolean;
  isActive?: boolean;
}

/**
 * Event subscription data
 */
export interface WorkflowEventSubscriptionData {
  id: string;
  workflowId: string;
  eventType: WorkflowEventType;
  filterConfig?: Record<string, unknown>;
  isActive: boolean;
}

/**
 * Create event subscription input
 */
export interface CreateEventSubscriptionInput {
  eventType: WorkflowEventType;
  filterConfig?: Record<string, unknown>;
}

/**
 * Update event subscription input
 */
export interface UpdateEventSubscriptionInput {
  filterConfig?: Record<string, unknown>;
  isActive?: boolean;
}

/**
 * Combined triggers data for a workflow
 */
export interface WorkflowTriggersData {
  schedules: WorkflowScheduleData[];
  webhooks: WorkflowWebhookData[];
  eventSubscriptions: WorkflowEventSubscriptionData[];
}

/**
 * Trigger type enum for manual trigger API
 */
export type TriggerType = "schedule" | "webhook" | "event" | "manual";

/**
 * Workflow execution context passed to the executor
 */
export interface WorkflowExecutionContext {
  workflowId: string;
  versionId: string;
  triggerType: TriggerType;
  triggerId?: string; // ID of the schedule/webhook/event subscription that triggered
  triggerData?: Record<string, unknown>; // Data from webhook payload or event
  manualParams?: Record<string, unknown>; // Parameters for manual trigger
}

/**
 * Step execution result
 */
export interface StepExecutionResult {
  stepId: string;
  status: StepRunStatus;
  output?: Record<string, unknown>;
  error?: string;
  durationMs: number;
}

/**
 * Workflow execution result
 */
export interface WorkflowExecutionResult {
  runId: string;
  status: WorkflowRunStatus;
  startedAt: Date;
  endedAt?: Date;
  stepResults: StepExecutionResult[];
  error?: string;
}

// Re-export the enum type for convenience
export type { WorkflowEventType };
