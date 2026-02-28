"use client";

import { useCallback, useState } from "react";
import { useMcpTool } from "@/lib/mcp/client/hooks/use-mcp-tool";
import { useMcpMutation } from "@/lib/mcp/client/hooks/use-mcp-mutation";

/* ── Types ──────────────────────────────────────────────────────────── */

export type GamePhase = "welcome" | "playing" | "unique" | "already_profiled";

interface AnswerEntry {
  question: string;
  answer: boolean;
  tags: string[];
}

interface ProfileData {
  tags: string[];
  leafNodeId: string;
  answerCount: number;
}

interface TreeStatsData {
  userCount: number;
  maxDepth: number;
  nodeCount: number;
  occupiedLeaves: number;
  emptyLeaves: number;
}

interface BeUniqState {
  phase: GamePhase;
  sessionId: string | null;
  currentQuestion: string | null;
  currentTags: string[];
  answers: AnswerEntry[];
  profile: ProfileData | null;
  treeStats: TreeStatsData | null;
  error: string | null;
}

const initialState: BeUniqState = {
  phase: "welcome",
  sessionId: null,
  currentQuestion: null,
  currentTags: [],
  answers: [],
  profile: null,
  treeStats: null,
  error: null,
};

/* ── Helpers ─────────────────────────────────────────────────────────── */

function parseStats(text: string): TreeStatsData | null {
  const userCount = text.match(/Users\s*\|\s*(\d+)/);
  const maxDepth = text.match(/Max Depth\s*\|\s*(\d+)/);
  const nodeCount = text.match(/Total Nodes\s*\|\s*(\d+)/);
  const occupied = text.match(/Occupied Leaves\s*\|\s*(\d+)/);
  const empty = text.match(/Empty Leaves\s*\|\s*(\d+)/);

  if (!userCount || !maxDepth || !nodeCount) return null;

  return {
    userCount: parseInt(userCount[1]!, 10),
    maxDepth: parseInt(maxDepth[1]!, 10),
    nodeCount: parseInt(nodeCount[1]!, 10),
    occupiedLeaves: occupied ? parseInt(occupied[1]!, 10) : 0,
    emptyLeaves: empty ? parseInt(empty[1]!, 10) : 0,
  };
}

function parseProfile(text: string): ProfileData | null {
  const tags = text.match(/\*\*Tags:\*\*\s*(.+)/);
  const leaf = text.match(/\*\*Leaf Node:\*\*\s*(\S+)/);
  const answerCount = text.match(/\*\*Answers:\*\*\s*(\d+)/);

  if (!leaf) return null;

  const tagList = tags?.[1]?.trim();
  return {
    tags: tagList && tagList !== "none" ? tagList.split(", ") : [],
    leafNodeId: leaf[1]!,
    answerCount: answerCount ? parseInt(answerCount[1]!, 10) : 0,
  };
}

/* ── Hook ────────────────────────────────────────────────────────────── */

export function useBeUniq() {
  const [state, setState] = useState<BeUniqState>(initialState);

  // Fetch tree stats on mount
  useMcpTool<string>("profile_tree_stats", { tree_name: "default" }, {
    enabled: true,
    onSuccess: text => {
      const stats = parseStats(text);
      if (stats) {
        setState(prev => ({ ...prev, treeStats: stats }));
      }
    },
  });

  // Start mutation
  const startMut = useMcpMutation<string>("profile_start", {
    onSuccess: text => {
      if (text.includes("Already Profiled")) {
        const profile = parseProfile(text);
        setState(prev => ({
          ...prev,
          phase: "already_profiled",
          profile,
        }));
        return;
      }

      if (text.includes("Profile Created")) {
        const profile = parseProfile(text);
        setState(prev => ({
          ...prev,
          phase: "unique",
          profile,
          answers: [],
        }));
        return;
      }

      // QUESTION status
      const sessionMatch = text.match(/\*\*Session ID:\*\*\s*(\S+)/);
      const questionMatch = text.match(/\*\*Question:\*\*\s*(.+)/);
      const tagsMatch = text.match(/\*\*Tags:\*\*\s*(.+)/);

      setState(prev => ({
        ...prev,
        phase: "playing",
        sessionId: sessionMatch?.[1] ?? null,
        currentQuestion: questionMatch?.[1]?.trim() ?? null,
        currentTags: tagsMatch?.[1]?.trim() === "none"
          ? []
          : (tagsMatch?.[1]?.split(", ") ?? []),
        answers: [],
        error: null,
      }));
    },
    onError: err => {
      setState(prev => ({ ...prev, error: err.message }));
    },
  });

  // Answer mutation
  const answerMut = useMcpMutation<string>("profile_answer", {
    onSuccess: text => {
      if (text.includes("Profile Assigned")) {
        const profile = parseProfile(text);
        setState(prev => ({
          ...prev,
          phase: "unique",
          profile,
          currentQuestion: null,
        }));
        return;
      }

      // Next question
      const questionMatch = text.match(/\*\*Question:\*\*\s*(.+)/);
      const tagsMatch = text.match(/\*\*Tags:\*\*\s*(.+)/);

      setState(prev => ({
        ...prev,
        currentQuestion: questionMatch?.[1]?.trim() ?? null,
        currentTags: tagsMatch?.[1]?.trim() === "none"
          ? []
          : (tagsMatch?.[1]?.split(", ") ?? []),
      }));
    },
    onError: err => {
      setState(prev => ({ ...prev, error: err.message }));
    },
  });

  // Reset mutation
  const resetMut = useMcpMutation<string>("profile_reset", {
    onSuccess: () => {
      setState({ ...initialState, treeStats: state.treeStats });
    },
  });

  /* ── Actions ──────────────────────────────────────────────────────── */

  const startGame = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: "playing",
      error: null,
      answers: [],
    }));
    startMut.mutate({ tree_name: "default" });
  }, [startMut]);

  const answer = useCallback(
    (yes: boolean) => {
      if (!state.sessionId || !state.currentQuestion) return;

      // Record answer locally
      setState(prev => ({
        ...prev,
        answers: [
          ...prev.answers,
          {
            question: prev.currentQuestion!,
            answer: yes,
            tags: prev.currentTags,
          },
        ],
        currentQuestion: null, // Clear while loading next
      }));

      answerMut.mutate({
        session_id: state.sessionId,
        answer: yes,
      });
    },
    [state.sessionId, state.currentQuestion, answerMut],
  );

  const playAgain = useCallback(() => {
    resetMut.mutate({});
  }, [resetMut]);

  const backToWelcome = useCallback(() => {
    setState(prev => ({ ...prev, phase: "welcome" }));
  }, []);

  return {
    ...state,
    isLoading: startMut.isLoading || answerMut.isLoading || resetMut.isLoading,
    startGame,
    answer,
    playAgain,
    backToWelcome,
  };
}
