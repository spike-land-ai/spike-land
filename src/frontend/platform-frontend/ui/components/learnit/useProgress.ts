/**
 * LearnIt Progress Tracker
 *
 * Tracks completed topics in localStorage, calculates category completion
 * percentages, and awards badges based on progress.
 */

import { useCallback, useEffect, useState } from "react";

export type BadgeTier = "Beginner" | "Explorer" | "Master";

export interface Badge {
  tier: BadgeTier;
  category: string;
  earnedAt: number;
}

export interface TopicProgress {
  slug: string;
  completedAt: number;
  score: number; // quiz score 0-100
}

interface ProgressState {
  completedTopics: Record<string, TopicProgress>;
  badges: Badge[];
}

const STORAGE_KEY = "learnit-progress-v1";

const CATEGORY_TOPICS: Record<string, string[]> = {
  "web-dev": [
    "typescript",
    "react-hooks",
    "graphql",
    "websockets",
    "webassembly",
    "css-grid",
    "service-workers",
    "web-components",
  ],
  "ai-ml": [
    "llms",
    "mcp-protocol",
    "transformers",
    "neural-networks",
    "prompt-engineering",
    "rag",
    "fine-tuning",
    "embeddings",
  ],
  cloud: [
    "edge-computing",
    "cloudflare-workers",
    "docker",
    "kubernetes",
    "serverless",
    "cdn",
    "load-balancing",
    "auto-scaling",
  ],
  devops: [
    "ci-cd",
    "docker",
    "kubernetes",
    "monitoring",
    "logging",
    "infrastructure-as-code",
    "gitops",
    "observability",
  ],
  mobile: [
    "react-native",
    "pwa",
    "flutter",
    "ios-swift",
    "android-kotlin",
    "mobile-performance",
    "offline-first",
    "push-notifications",
  ],
  data: [
    "sql",
    "postgresql",
    "data-pipelines",
    "apache-kafka",
    "data-warehousing",
    "pandas",
    "data-visualization",
    "etl",
  ],
  security: [
    "oauth-2",
    "jwt",
    "csrf",
    "xss-prevention",
    "https-tls",
    "api-security",
    "zero-trust",
    "penetration-testing",
  ],
  design: [
    "figma",
    "design-systems",
    "accessibility",
    "color-theory",
    "typography",
    "ux-research",
    "prototyping",
    "design-tokens",
  ],
};

function loadState(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { completedTopics: {}, badges: [] };
    return JSON.parse(raw) as ProgressState;
  } catch {
    return { completedTopics: {}, badges: [] };
  }
}

function saveState(state: ProgressState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded)
  }
}

function computeBadges(completedTopics: Record<string, TopicProgress>): Badge[] {
  const badges: Badge[] = [];
  const completedSlugs = Object.keys(completedTopics);

  for (const [category, topics] of Object.entries(CATEGORY_TOPICS)) {
    const completedInCategory = topics.filter((t) => completedSlugs.includes(t));
    const count = completedInCategory.length;

    if (count === 0) continue;

    // Find earliest completion time in this category for badge timestamp
    const earnedAt = Math.min(
      ...completedInCategory.map((t) => completedTopics[t]?.completedAt ?? Date.now()),
    );

    if (count >= topics.length) {
      badges.push({ tier: "Master", category, earnedAt });
    } else if (count >= 5) {
      badges.push({ tier: "Explorer", category, earnedAt });
    } else {
      badges.push({ tier: "Beginner", category, earnedAt });
    }
  }

  return badges;
}

export interface UseProgressReturn {
  completedTopics: Record<string, TopicProgress>;
  badges: Badge[];
  /** Mark a topic complete with a given quiz score (0–100) */
  completeTopic: (slug: string, score: number) => void;
  /** Whether a topic has been completed */
  isCompleted: (slug: string) => boolean;
  /** Completion percentage for a category (0–100) */
  getCategoryProgress: (category: string) => number;
  /** Total topics completed count */
  totalCompleted: number;
  /** Reset all progress (useful for testing) */
  reset: () => void;
}

export function useProgress(): UseProgressReturn {
  const [state, setState] = useState<ProgressState>(loadState);

  // Sync to localStorage on changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  const completeTopic = useCallback((slug: string, score: number) => {
    setState((prev) => {
      const updated: ProgressState = {
        ...prev,
        completedTopics: {
          ...prev.completedTopics,
          [slug]: {
            slug,
            completedAt: Date.now(),
            score,
          },
        },
      };
      updated.badges = computeBadges(updated.completedTopics);
      return updated;
    });
  }, []);

  const isCompleted = useCallback(
    (slug: string) => slug in state.completedTopics,
    [state.completedTopics],
  );

  const getCategoryProgress = useCallback(
    (category: string): number => {
      const topics = CATEGORY_TOPICS[category];
      if (!topics || topics.length === 0) return 0;
      const completed = topics.filter((t) => t in state.completedTopics).length;
      return Math.round((completed / topics.length) * 100);
    },
    [state.completedTopics],
  );

  const reset = useCallback(() => {
    setState({ completedTopics: {}, badges: [] });
  }, []);

  return {
    completedTopics: state.completedTopics,
    badges: state.badges,
    completeTopic,
    isCompleted,
    getCategoryProgress,
    totalCompleted: Object.keys(state.completedTopics).length,
    reset,
  };
}
