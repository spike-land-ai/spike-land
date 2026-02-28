import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

/* ── Hoisted mocks ───────────────────────────────────────────────────── */

const mockUseMcpTool = vi.hoisted(() => vi.fn());
const mockUseMcpMutation = vi.hoisted(() => vi.fn());

vi.mock("@/lib/mcp/client/hooks/use-mcp-tool", () => ({
  useMcpTool: mockUseMcpTool,
}));

vi.mock("@/lib/mcp/client/hooks/use-mcp-mutation", () => ({
  useMcpMutation: mockUseMcpMutation,
}));

import { useBeUniq } from "./useBeUniq";

/* ── Helpers ─────────────────────────────────────────────────────────── */

function makeMutationHandle(overrides: Partial<{
  mutate: ReturnType<typeof vi.fn>;
  mutateAsync: ReturnType<typeof vi.fn>;
  data: string | undefined;
  error: Error | undefined;
  isLoading: boolean;
  reset: ReturnType<typeof vi.fn>;
}> = {}) {
  return {
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    data: undefined,
    error: undefined,
    isLoading: false,
    reset: vi.fn(),
    ...overrides,
  };
}

const TREE_STATS_TEXT = `
| Metric | Value |
|---|---|
| Users | 42 |
| Max Depth | 10 |
| Total Nodes | 100 |
| Occupied Leaves | 15 |
| Empty Leaves | 85 |
`;

const QUESTION_TEXT = `
**Session ID:** sess-abc123
**Question:** Do you prefer mountains over beaches?
**Tags:** outdoors, nature
`;

const NEXT_QUESTION_TEXT = `
**Question:** Do you enjoy cooking?
**Tags:** none
`;

const PROFILE_ASSIGNED_TEXT = `
Profile Assigned
**Leaf Node:** leaf-xyz789
**Tags:** outdoors, nature, creative
**Answers:** 5
`;

const ALREADY_PROFILED_TEXT = `
Already Profiled
**Leaf Node:** leaf-existing
**Tags:** tech, music
**Answers:** 3
`;

const PROFILE_CREATED_TEXT = `
Profile Created
**Leaf Node:** leaf-new
**Tags:** none
**Answers:** 0
`;

/* ── Test suite ──────────────────────────────────────────────────────── */

describe("useBeUniq", () => {
  let startMut: ReturnType<typeof makeMutationHandle>;
  let answerMut: ReturnType<typeof makeMutationHandle>;
  let resetMut: ReturnType<typeof makeMutationHandle>;

  // Store captured callbacks from useMcpMutation
  let startOnSuccess: ((text: string) => void) | undefined;
  let startOnError: ((err: Error) => void) | undefined;
  let answerOnSuccess: ((text: string) => void) | undefined;
  let answerOnError: ((err: Error) => void) | undefined;
  let resetOnSuccess: (() => void) | undefined;

  // Store captured callback from useMcpTool
  let treeStatsOnSuccess: ((text: string) => void) | undefined;

  beforeEach(() => {
    startMut = makeMutationHandle();
    answerMut = makeMutationHandle();
    resetMut = makeMutationHandle();

    mockUseMcpTool.mockReset();
    mockUseMcpTool.mockImplementation(
      (_toolName: string, _params: unknown, options?: { onSuccess?: (text: string) => void; }) => {
        treeStatsOnSuccess = options?.onSuccess;
        return {
          data: undefined,
          error: undefined,
          isLoading: false,
          isRefetching: false,
          refetch: vi.fn(),
        };
      },
    );

    mockUseMcpMutation.mockReset();
    mockUseMcpMutation.mockImplementation(
      (
        toolName: string,
        options?: { onSuccess?: (text: string) => void; onError?: (err: Error) => void; } | {
          onSuccess?: () => void;
          onError?: (err: Error) => void;
        },
      ) => {
        if (toolName === "profile_start") {
          startOnSuccess = (options as any)?.onSuccess;
          startOnError = options?.onError;
          return startMut;
        }
        if (toolName === "profile_answer") {
          answerOnSuccess = (options as any)?.onSuccess;
          answerOnError = options?.onError;
          return answerMut;
        }
        if (toolName === "profile_reset") {
          resetOnSuccess = (options as any)?.onSuccess;
          return resetMut;
        }
        return makeMutationHandle();
      },
    );
  });

  /* ── Initial state ─────────────────────────────────────────────────── */

  describe("initial state", () => {
    it("starts in welcome phase", () => {
      const { result } = renderHook(() => useBeUniq());
      expect(result.current.phase).toBe("welcome");
    });

    it("starts with null sessionId", () => {
      const { result } = renderHook(() => useBeUniq());
      expect(result.current.sessionId).toBeNull();
    });

    it("starts with null currentQuestion", () => {
      const { result } = renderHook(() => useBeUniq());
      expect(result.current.currentQuestion).toBeNull();
    });

    it("starts with empty answers array", () => {
      const { result } = renderHook(() => useBeUniq());
      expect(result.current.answers).toEqual([]);
    });

    it("starts with null profile", () => {
      const { result } = renderHook(() => useBeUniq());
      expect(result.current.profile).toBeNull();
    });

    it("starts with null treeStats", () => {
      const { result } = renderHook(() => useBeUniq());
      expect(result.current.treeStats).toBeNull();
    });

    it("starts with null error", () => {
      const { result } = renderHook(() => useBeUniq());
      expect(result.current.error).toBeNull();
    });

    it("starts with isLoading false", () => {
      const { result } = renderHook(() => useBeUniq());
      expect(result.current.isLoading).toBe(false);
    });
  });

  /* ── MCP hooks registration ────────────────────────────────────────── */

  describe("MCP hook calls", () => {
    it("calls useMcpTool with profile_tree_stats on mount", () => {
      renderHook(() => useBeUniq());
      expect(mockUseMcpTool).toHaveBeenCalledWith(
        "profile_tree_stats",
        { tree_name: "default" },
        expect.objectContaining({ enabled: true }),
      );
    });

    it("registers profile_start mutation", () => {
      renderHook(() => useBeUniq());
      expect(mockUseMcpMutation).toHaveBeenCalledWith(
        "profile_start",
        expect.any(Object),
      );
    });

    it("registers profile_answer mutation", () => {
      renderHook(() => useBeUniq());
      expect(mockUseMcpMutation).toHaveBeenCalledWith(
        "profile_answer",
        expect.any(Object),
      );
    });

    it("registers profile_reset mutation", () => {
      renderHook(() => useBeUniq());
      expect(mockUseMcpMutation).toHaveBeenCalledWith(
        "profile_reset",
        expect.any(Object),
      );
    });
  });

  /* ── Tree stats parsing ────────────────────────────────────────────── */

  describe("tree stats", () => {
    it("parses and stores tree stats when useMcpTool succeeds", () => {
      const { result } = renderHook(() => useBeUniq());
      act(() => {
        treeStatsOnSuccess?.(TREE_STATS_TEXT);
      });
      expect(result.current.treeStats).toEqual({
        userCount: 42,
        maxDepth: 10,
        nodeCount: 100,
        occupiedLeaves: 15,
        emptyLeaves: 85,
      });
    });

    it("leaves treeStats null if text is unparseable", () => {
      const { result } = renderHook(() => useBeUniq());
      act(() => {
        treeStatsOnSuccess?.("garbage data with no structure");
      });
      expect(result.current.treeStats).toBeNull();
    });

    it("handles missing occupied/empty leaves gracefully (defaults to 0)", () => {
      const { result } = renderHook(() => useBeUniq());
      act(() => {
        treeStatsOnSuccess?.("| Users | 5 |\n| Max Depth | 3 |\n| Total Nodes | 7 |");
      });
      expect(result.current.treeStats).toMatchObject({
        userCount: 5,
        maxDepth: 3,
        nodeCount: 7,
        occupiedLeaves: 0,
        emptyLeaves: 0,
      });
    });
  });

  /* ── startGame action ──────────────────────────────────────────────── */

  describe("startGame", () => {
    it("calls startMut.mutate with default tree_name", () => {
      const { result } = renderHook(() => useBeUniq());
      act(() => {
        result.current.startGame();
      });
      expect(startMut.mutate).toHaveBeenCalledWith({ tree_name: "default" });
    });

    it("sets phase to playing immediately on call", () => {
      const { result } = renderHook(() => useBeUniq());
      act(() => {
        result.current.startGame();
      });
      expect(result.current.phase).toBe("playing");
    });

    it("clears error on start", () => {
      const { result } = renderHook(() => useBeUniq());
      // Inject an error first
      act(() => {
        startOnError?.(new Error("previous error"));
      });
      act(() => {
        result.current.startGame();
      });
      expect(result.current.error).toBeNull();
    });

    it("clears answers on start", () => {
      const { result } = renderHook(() => useBeUniq());
      // Put some answers in state by simulating a successful first session
      act(() => {
        startOnSuccess?.(QUESTION_TEXT);
      });
      // Now start again
      act(() => {
        result.current.startGame();
      });
      expect(result.current.answers).toEqual([]);
    });
  });

  /* ── profile_start onSuccess ───────────────────────────────────────── */

  describe("profile_start success", () => {
    it("transitions to playing phase with question + sessionId", () => {
      const { result } = renderHook(() => useBeUniq());
      act(() => {
        startOnSuccess?.(QUESTION_TEXT);
      });
      expect(result.current.phase).toBe("playing");
      expect(result.current.sessionId).toBe("sess-abc123");
      expect(result.current.currentQuestion).toBe(
        "Do you prefer mountains over beaches?",
      );
    });

    it("parses tags from start response", () => {
      const { result } = renderHook(() => useBeUniq());
      act(() => {
        startOnSuccess?.(QUESTION_TEXT);
      });
      expect(result.current.currentTags).toEqual(["outdoors", "nature"]);
    });

    it("sets empty currentTags when tags field is 'none'", () => {
      const { result } = renderHook(() => useBeUniq());
      const noTagsText = QUESTION_TEXT.replace(
        "**Tags:** outdoors, nature",
        "**Tags:** none",
      );
      act(() => {
        startOnSuccess?.(noTagsText);
      });
      expect(result.current.currentTags).toEqual([]);
    });

    it("transitions to already_profiled phase when text includes 'Already Profiled'", () => {
      const { result } = renderHook(() => useBeUniq());
      act(() => {
        startOnSuccess?.(ALREADY_PROFILED_TEXT);
      });
      expect(result.current.phase).toBe("already_profiled");
    });

    it("parses profile from already profiled response", () => {
      const { result } = renderHook(() => useBeUniq());
      act(() => {
        startOnSuccess?.(ALREADY_PROFILED_TEXT);
      });
      expect(result.current.profile).toMatchObject({
        leafNodeId: "leaf-existing",
        tags: ["tech", "music"],
        answerCount: 3,
      });
    });

    it("transitions to unique phase when text includes 'Profile Created'", () => {
      const { result } = renderHook(() => useBeUniq());
      act(() => {
        startOnSuccess?.(PROFILE_CREATED_TEXT);
      });
      expect(result.current.phase).toBe("unique");
    });

    it("clears answers when Profile Created", () => {
      const { result } = renderHook(() => useBeUniq());
      act(() => {
        startOnSuccess?.(PROFILE_CREATED_TEXT);
      });
      expect(result.current.answers).toEqual([]);
    });

    it("parses profile with no tags (tags='none') for Profile Created", () => {
      const { result } = renderHook(() => useBeUniq());
      act(() => {
        startOnSuccess?.(PROFILE_CREATED_TEXT);
      });
      expect(result.current.profile?.tags).toEqual([]);
    });
  });

  /* ── profile_start onError ─────────────────────────────────────────── */

  describe("profile_start error", () => {
    it("stores error message on mutation error", () => {
      const { result } = renderHook(() => useBeUniq());
      act(() => {
        startOnError?.(new Error("Network failure"));
      });
      expect(result.current.error).toBe("Network failure");
    });
  });

  /* ── answer action ─────────────────────────────────────────────────── */

  describe("answer", () => {
    it("does nothing if sessionId is null", () => {
      const { result } = renderHook(() => useBeUniq());
      act(() => {
        result.current.answer(true);
      });
      expect(answerMut.mutate).not.toHaveBeenCalled();
    });

    it("does nothing if currentQuestion is null", () => {
      const { result } = renderHook(() => useBeUniq());
      // Give it a session but no question
      act(() => {
        startOnSuccess?.(QUESTION_TEXT);
      });
      // Force question to null by simulating answer-in-flight
      act(() => {
        result.current.answer(true);
      });
      // A second answer call should be a no-op (question is now null)
      act(() => {
        result.current.answer(false);
      });
      expect(answerMut.mutate).toHaveBeenCalledTimes(1);
    });

    it("records answer locally and clears currentQuestion", () => {
      const { result } = renderHook(() => useBeUniq());
      act(() => {
        startOnSuccess?.(QUESTION_TEXT);
      });
      act(() => {
        result.current.answer(true);
      });
      expect(result.current.answers).toHaveLength(1);
      expect(result.current.answers[0]).toMatchObject({
        question: "Do you prefer mountains over beaches?",
        answer: true,
        tags: ["outdoors", "nature"],
      });
      expect(result.current.currentQuestion).toBeNull();
    });

    it("calls answerMut.mutate with session_id and answer=true", () => {
      const { result } = renderHook(() => useBeUniq());
      act(() => {
        startOnSuccess?.(QUESTION_TEXT);
      });
      act(() => {
        result.current.answer(true);
      });
      expect(answerMut.mutate).toHaveBeenCalledWith({
        session_id: "sess-abc123",
        answer: true,
      });
    });

    it("calls answerMut.mutate with answer=false for No", () => {
      const { result } = renderHook(() => useBeUniq());
      act(() => {
        startOnSuccess?.(QUESTION_TEXT);
      });
      act(() => {
        result.current.answer(false);
      });
      expect(answerMut.mutate).toHaveBeenCalledWith({
        session_id: "sess-abc123",
        answer: false,
      });
    });
  });

  /* ── profile_answer onSuccess ──────────────────────────────────────── */

  describe("profile_answer success", () => {
    it("transitions to unique phase on 'Profile Assigned'", () => {
      const { result } = renderHook(() => useBeUniq());
      act(() => {
        startOnSuccess?.(QUESTION_TEXT);
      });
      act(() => {
        answerOnSuccess?.(PROFILE_ASSIGNED_TEXT);
      });
      expect(result.current.phase).toBe("unique");
    });

    it("parses and stores profile on 'Profile Assigned'", () => {
      const { result } = renderHook(() => useBeUniq());
      act(() => {
        answerOnSuccess?.(PROFILE_ASSIGNED_TEXT);
      });
      expect(result.current.profile).toMatchObject({
        leafNodeId: "leaf-xyz789",
        tags: ["outdoors", "nature", "creative"],
        answerCount: 5,
      });
    });

    it("clears currentQuestion on 'Profile Assigned'", () => {
      const { result } = renderHook(() => useBeUniq());
      act(() => {
        startOnSuccess?.(QUESTION_TEXT);
      });
      act(() => {
        answerOnSuccess?.(PROFILE_ASSIGNED_TEXT);
      });
      expect(result.current.currentQuestion).toBeNull();
    });

    it("updates currentQuestion with next question text", () => {
      const { result } = renderHook(() => useBeUniq());
      act(() => {
        startOnSuccess?.(QUESTION_TEXT);
      });
      act(() => {
        answerOnSuccess?.(NEXT_QUESTION_TEXT);
      });
      expect(result.current.currentQuestion).toBe("Do you enjoy cooking?");
    });

    it("sets empty currentTags when next question tags is 'none'", () => {
      const { result } = renderHook(() => useBeUniq());
      act(() => {
        startOnSuccess?.(QUESTION_TEXT);
      });
      act(() => {
        answerOnSuccess?.(NEXT_QUESTION_TEXT);
      });
      expect(result.current.currentTags).toEqual([]);
    });
  });

  /* ── profile_answer onError ────────────────────────────────────────── */

  describe("profile_answer error", () => {
    it("stores error message", () => {
      const { result } = renderHook(() => useBeUniq());
      act(() => {
        answerOnError?.(new Error("Server error"));
      });
      expect(result.current.error).toBe("Server error");
    });
  });

  /* ── playAgain action ──────────────────────────────────────────────── */

  describe("playAgain", () => {
    it("calls resetMut.mutate with empty object", () => {
      const { result } = renderHook(() => useBeUniq());
      act(() => {
        result.current.playAgain();
      });
      expect(resetMut.mutate).toHaveBeenCalledWith({});
    });

    it("resets state back to welcome phase on success", () => {
      const { result } = renderHook(() => useBeUniq());
      // Get into unique phase first
      act(() => {
        startOnSuccess?.(QUESTION_TEXT);
        answerOnSuccess?.(PROFILE_ASSIGNED_TEXT);
      });
      act(() => {
        resetOnSuccess?.();
      });
      expect(result.current.phase).toBe("welcome");
    });

    it("preserves treeStats after reset", () => {
      const { result } = renderHook(() => useBeUniq());
      act(() => {
        treeStatsOnSuccess?.(TREE_STATS_TEXT);
      });
      act(() => {
        resetOnSuccess?.();
      });
      expect(result.current.treeStats).toMatchObject({ userCount: 42 });
    });

    it("clears answers after reset", () => {
      const { result } = renderHook(() => useBeUniq());
      act(() => {
        startOnSuccess?.(QUESTION_TEXT);
      });
      act(() => {
        result.current.answer(true);
      });
      act(() => {
        resetOnSuccess?.();
      });
      expect(result.current.answers).toEqual([]);
    });

    it("clears profile after reset", () => {
      const { result } = renderHook(() => useBeUniq());
      act(() => {
        answerOnSuccess?.(PROFILE_ASSIGNED_TEXT);
      });
      act(() => {
        resetOnSuccess?.();
      });
      expect(result.current.profile).toBeNull();
    });
  });

  /* ── backToWelcome action ──────────────────────────────────────────── */

  describe("backToWelcome", () => {
    it("sets phase back to welcome", () => {
      const { result } = renderHook(() => useBeUniq());
      act(() => {
        startOnSuccess?.(QUESTION_TEXT);
      });
      expect(result.current.phase).toBe("playing");
      act(() => {
        result.current.backToWelcome();
      });
      expect(result.current.phase).toBe("welcome");
    });

    it("preserves other state when going back to welcome", () => {
      const { result } = renderHook(() => useBeUniq());
      act(() => {
        treeStatsOnSuccess?.(TREE_STATS_TEXT);
        startOnSuccess?.(QUESTION_TEXT);
      });
      act(() => {
        result.current.backToWelcome();
      });
      expect(result.current.treeStats?.userCount).toBe(42);
      expect(result.current.sessionId).toBe("sess-abc123");
    });
  });

  /* ── isLoading aggregation ─────────────────────────────────────────── */

  describe("isLoading", () => {
    it("is true when startMut is loading", () => {
      startMut = makeMutationHandle({ isLoading: true });
      mockUseMcpMutation.mockImplementation((toolName: string) => {
        if (toolName === "profile_start") return startMut;
        if (toolName === "profile_answer") return answerMut;
        if (toolName === "profile_reset") return resetMut;
        return makeMutationHandle();
      });
      const { result } = renderHook(() => useBeUniq());
      expect(result.current.isLoading).toBe(true);
    });

    it("is true when answerMut is loading", () => {
      answerMut = makeMutationHandle({ isLoading: true });
      mockUseMcpMutation.mockImplementation((toolName: string) => {
        if (toolName === "profile_start") return startMut;
        if (toolName === "profile_answer") return answerMut;
        if (toolName === "profile_reset") return resetMut;
        return makeMutationHandle();
      });
      const { result } = renderHook(() => useBeUniq());
      expect(result.current.isLoading).toBe(true);
    });

    it("is true when resetMut is loading", () => {
      resetMut = makeMutationHandle({ isLoading: true });
      mockUseMcpMutation.mockImplementation((toolName: string) => {
        if (toolName === "profile_start") return startMut;
        if (toolName === "profile_answer") return answerMut;
        if (toolName === "profile_reset") return resetMut;
        return makeMutationHandle();
      });
      const { result } = renderHook(() => useBeUniq());
      expect(result.current.isLoading).toBe(true);
    });

    it("is false when no mutations are loading", () => {
      const { result } = renderHook(() => useBeUniq());
      expect(result.current.isLoading).toBe(false);
    });
  });

  /* ── Return shape ──────────────────────────────────────────────────── */

  describe("return shape", () => {
    it("exposes startGame function", () => {
      const { result } = renderHook(() => useBeUniq());
      expect(typeof result.current.startGame).toBe("function");
    });

    it("exposes answer function", () => {
      const { result } = renderHook(() => useBeUniq());
      expect(typeof result.current.answer).toBe("function");
    });

    it("exposes playAgain function", () => {
      const { result } = renderHook(() => useBeUniq());
      expect(typeof result.current.playAgain).toBe("function");
    });

    it("exposes backToWelcome function", () => {
      const { result } = renderHook(() => useBeUniq());
      expect(typeof result.current.backToWelcome).toBe("function");
    });

    it("exposes currentTags as array", () => {
      const { result } = renderHook(() => useBeUniq());
      expect(Array.isArray(result.current.currentTags)).toBe(true);
    });
  });
});
