import type { WorkspaceRole } from "@prisma/client";

/**
 * Workspace with user's role information
 */
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatarUrl: string | null;
  isPersonal: boolean;
  role: WorkspaceRole;
}

/**
 * Context value for workspace management
 */
export interface WorkspaceContextValue {
  /** Currently selected workspace */
  workspace: Workspace | null;
  /** All workspaces the user has access to */
  workspaces: Workspace[];
  /** Loading state for initial fetch */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Switch to a different workspace by slug */
  switchWorkspace: (workspaceSlug: string) => void;
  /** Refetch workspaces from API */
  refetch: () => Promise<void>;
}

/**
 * API response for GET /api/workspaces
 */
export interface WorkspacesApiResponse {
  workspaces: Workspace[];
}

// ============================================================================
// Multi-Workspace Management
// ============================================================================

/**
 * Extended workspace with favorite status and last accessed time
 */
export interface WorkspaceWithMetadata extends Workspace {
  isFavorite: boolean;
  lastAccessedAt: Date | null;
}

/**
 * API response for GET /api/workspaces with favorites and recents
 */
export interface WorkspacesWithMetadataApiResponse {
  workspaces: WorkspaceWithMetadata[];
  favorites: string[]; // Workspace IDs that are favorited
  recentIds: string[]; // Workspace IDs in order of recent access
}

/**
 * Workspace context with favorites and recent access support
 */
export interface ExtendedWorkspaceContextValue
  extends Omit<WorkspaceContextValue, "workspace" | "workspaces"> {
  /** Currently selected workspace with metadata */
  workspace: WorkspaceWithMetadata | null;
  /** All workspaces with metadata */
  workspaces: WorkspaceWithMetadata[];
  /** Favorite workspace IDs */
  favoriteIds: string[];
  /** Recently accessed workspace IDs (most recent first) */
  recentIds: string[];
  /** Toggle favorite status for a workspace */
  toggleFavorite: (workspaceId: string) => Promise<void>;
  /** Record workspace access (called on workspace switch) */
  recordAccess: (workspaceId: string) => Promise<void>;
}

// ============================================================================
// Aggregate Dashboard Types
// ============================================================================

/**
 * Aggregate KPIs across workspaces
 */
export interface AggregateKPIs {
  totalWorkspaces: number;
  totalSocialAccounts: number;
  totalScheduledPosts: number;
  totalPublishedPosts: number;
  totalEngagements: number;
  totalFollowers: number;
  totalImpressions: number;
}

/**
 * Per-workspace summary for aggregate view
 */
export interface WorkspaceSummary {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  socialAccountCount: number;
  scheduledPostCount: number;
  publishedPostCount: number;
  totalEngagements: number;
  totalFollowers: number;
  totalImpressions: number;
  lastActivityAt: Date | null;
}

/**
 * Date range for aggregate queries
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Aggregate report request
 */
export interface AggregateReportRequest {
  workspaceIds?: string[]; // Optional filter, defaults to all accessible
  dateRange?: DateRange;
  metrics?: Array<keyof AggregateKPIs>;
}

/**
 * API response for aggregate dashboard
 */
export interface AggregateApiResponse {
  kpis: AggregateKPIs;
  workspaceSummaries: WorkspaceSummary[];
  dateRange: DateRange;
}
