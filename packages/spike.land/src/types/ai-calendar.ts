/**
 * AI Content Calendar Types
 * Issue #841
 */

import type { ContentSuggestionStatus, SocialPlatform } from "@prisma/client";

export interface PostingTimeRecommendation {
  id: string;
  accountId: string;
  dayOfWeek: number;
  hourUtc: number;
  score: number;
  confidence: "high" | "medium" | "low";
  reason: string;
  lastUpdated: Date;
}

export interface CalendarContentSuggestion {
  id: string;
  workspaceId: string;
  content: string;
  suggestedFor: Date;
  platform: SocialPlatform;
  reason: string;
  status: ContentSuggestionStatus;
  confidence: number;
  keywords: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
}

export interface GenerateContentRequest {
  workspaceId: string;
  platform?: SocialPlatform;
  count?: number; // Number of suggestions to generate
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface OptimalTimesRequest {
  workspaceId: string;
  accountIds?: string[];
  refreshCache?: boolean;
}

export interface HeatmapData {
  accountId: string;
  platform: SocialPlatform;
  accountName: string;
  heatmap: number[][]; // 7x24 matrix (days x hours)
  maxScore: number;
  minScore: number;
}

export interface WeeklyPlan {
  weekStart: Date;
  weekEnd: Date;
  suggestions: CalendarContentSuggestion[];
  coveragePct: number; // Percentage of optimal slots filled
  gaps: Array<{
    day: number;
    hour: number;
    reason: string;
  }>;
}
