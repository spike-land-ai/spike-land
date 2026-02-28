import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const mockUseMcpTool = vi.hoisted(() => vi.fn());
const mockUseMcpMutation = vi.hoisted(() => vi.fn());
const mockUseMcpStream = vi.hoisted(() => vi.fn());

vi.mock("@/lib/mcp/client/hooks/use-mcp-tool", () => ({
  useMcpTool: mockUseMcpTool,
}));

vi.mock("@/lib/mcp/client/hooks/use-mcp-mutation", () => ({
  useMcpMutation: mockUseMcpMutation,
}));

vi.mock("@/lib/mcp/client/hooks/use-mcp-stream", () => ({
  useMcpStream: mockUseMcpStream,
}));

import { useMusicCreatorMcp } from "./useMusicCreatorMcp";

function makeQueryResult(overrides: Record<string, unknown> = {}) {
  return {
    data: undefined,
    error: undefined,
    isLoading: false,
    isRefetching: false,
    refetch: vi.fn(),
    ...overrides,
  };
}

function makeMutationResult(overrides: Record<string, unknown> = {}) {
  return {
    data: undefined,
    error: undefined,
    isLoading: false,
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  };
}

function makeStreamResult(overrides: Record<string, unknown> = {}) {
  return {
    chunks: [],
    fullText: "",
    isDone: false,
    error: undefined,
    start: vi.fn(),
    stop: vi.fn(),
    ...overrides,
  };
}

describe("useMusicCreatorMcp", () => {
  beforeEach(() => {
    mockUseMcpTool.mockReset();
    mockUseMcpMutation.mockReset();
    mockUseMcpStream.mockReset();

    mockUseMcpTool.mockReturnValue(makeQueryResult());
    mockUseMcpMutation.mockReturnValue(makeMutationResult());
    mockUseMcpStream.mockReturnValue(makeStreamResult());
  });

  describe("initial hook shape", () => {
    it("returns all expected keys", () => {
      const { result } = renderHook(() => useMusicCreatorMcp(null));

      // Queries
      expect(result.current).toHaveProperty("projectsQuery");
      expect(result.current).toHaveProperty("tracksQuery");
      // Project mutations
      expect(result.current).toHaveProperty("createProjectMut");
      expect(result.current).toHaveProperty("deleteProjectMut");
      expect(result.current).toHaveProperty("saveProjectMut");
      expect(result.current).toHaveProperty("exportProjectMut");
      // Track mutations
      expect(result.current).toHaveProperty("addTrackMut");
      expect(result.current).toHaveProperty("removeTrackMut");
      expect(result.current).toHaveProperty("reorderTracksMut");
      expect(result.current).toHaveProperty("updateTrackMut");
      expect(result.current).toHaveProperty("selectInstrumentMut");
      // Playback mutations
      expect(result.current).toHaveProperty("playMut");
      expect(result.current).toHaveProperty("stopMut");
      expect(result.current).toHaveProperty("pauseMut");
      // AI stream
      expect(result.current).toHaveProperty("aiGenerateStream");
    });
  });

  describe("projectsQuery", () => {
    it("calls useMcpTool with music_list_projects and enabled:true", () => {
      renderHook(() => useMusicCreatorMcp(null));

      expect(mockUseMcpTool).toHaveBeenCalledWith(
        "music_list_projects",
        {},
        expect.objectContaining({ enabled: true, refetchInterval: 30_000 }),
      );
    });

    it("exposes the query result object", () => {
      const queryResult = makeQueryResult({ data: "Project A\nProject B", isLoading: false });
      mockUseMcpTool.mockReturnValueOnce(queryResult).mockReturnValue(makeQueryResult());

      const { result } = renderHook(() => useMusicCreatorMcp(null));

      expect(result.current.projectsQuery).toBe(queryResult);
    });
  });

  describe("tracksQuery", () => {
    it("calls useMcpTool with music_list_tracks and enabled:false when no project", () => {
      renderHook(() => useMusicCreatorMcp(null));

      expect(mockUseMcpTool).toHaveBeenCalledWith(
        "music_list_tracks",
        { project_id: null },
        expect.objectContaining({ enabled: false }),
      );
    });

    it("enables tracksQuery when activeProjectId is provided", () => {
      renderHook(() => useMusicCreatorMcp("proj-abc"));

      expect(mockUseMcpTool).toHaveBeenCalledWith(
        "music_list_tracks",
        { project_id: "proj-abc" },
        expect.objectContaining({ enabled: true, refetchInterval: 10_000 }),
      );
    });
  });

  describe("createProjectMut", () => {
    it("calls useMcpMutation with music_create_project", () => {
      renderHook(() => useMusicCreatorMcp(null));

      const calls = mockUseMcpMutation.mock.calls;
      const call = calls.find(([name]) => name === "music_create_project");
      expect(call).toBeDefined();
    });

    it("onSuccess refetches projects", () => {
      const projectsRefetch = vi.fn();
      const projectsQueryResult = makeQueryResult({ refetch: projectsRefetch });

      mockUseMcpTool
        .mockReturnValueOnce(projectsQueryResult)
        .mockReturnValue(makeQueryResult());

      let capturedOptions: { onSuccess?: () => void; } = {};
      mockUseMcpMutation.mockImplementation(
        (name: string, opts: { onSuccess?: () => void; } = {}) => {
          if (name === "music_create_project") capturedOptions = opts;
          return makeMutationResult();
        },
      );

      renderHook(() => useMusicCreatorMcp(null));

      capturedOptions.onSuccess?.();
      expect(projectsRefetch).toHaveBeenCalledOnce();
    });
  });

  describe("addTrackMut", () => {
    it("calls useMcpMutation with music_add_track", () => {
      renderHook(() => useMusicCreatorMcp(null));

      const calls = mockUseMcpMutation.mock.calls;
      const call = calls.find(([name]) => name === "music_add_track");
      expect(call).toBeDefined();
    });

    it("onSuccess refetches tracks", () => {
      const tracksRefetch = vi.fn();
      const tracksQueryResult = makeQueryResult({ refetch: tracksRefetch });

      mockUseMcpTool
        .mockReturnValueOnce(makeQueryResult())
        .mockReturnValueOnce(tracksQueryResult);

      let capturedOptions: { onSuccess?: () => void; } = {};
      mockUseMcpMutation.mockImplementation(
        (name: string, opts: { onSuccess?: () => void; } = {}) => {
          if (name === "music_add_track") capturedOptions = opts;
          return makeMutationResult();
        },
      );

      renderHook(() => useMusicCreatorMcp("proj-123"));

      capturedOptions.onSuccess?.();
      expect(tracksRefetch).toHaveBeenCalledOnce();
    });
  });

  describe("removeTrackMut", () => {
    it("calls useMcpMutation with music_remove_track", () => {
      renderHook(() => useMusicCreatorMcp(null));

      const calls = mockUseMcpMutation.mock.calls;
      const call = calls.find(([name]) => name === "music_remove_track");
      expect(call).toBeDefined();
    });

    it("onSuccess refetches tracks", () => {
      const tracksRefetch = vi.fn();
      const tracksQueryResult = makeQueryResult({ refetch: tracksRefetch });

      mockUseMcpTool
        .mockReturnValueOnce(makeQueryResult())
        .mockReturnValueOnce(tracksQueryResult);

      let capturedOptions: { onSuccess?: () => void; } = {};
      mockUseMcpMutation.mockImplementation(
        (name: string, opts: { onSuccess?: () => void; } = {}) => {
          if (name === "music_remove_track") capturedOptions = opts;
          return makeMutationResult();
        },
      );

      renderHook(() => useMusicCreatorMcp("proj-123"));

      capturedOptions.onSuccess?.();
      expect(tracksRefetch).toHaveBeenCalledOnce();
    });
  });

  describe("selectInstrumentMut", () => {
    it("calls useMcpMutation with music_select_instrument", () => {
      renderHook(() => useMusicCreatorMcp(null));

      const calls = mockUseMcpMutation.mock.calls;
      const call = calls.find(([name]) => name === "music_select_instrument");
      expect(call).toBeDefined();
    });
  });

  describe("playback mutations", () => {
    it("registers play, stop, and pause mutations", () => {
      renderHook(() => useMusicCreatorMcp(null));

      const names = mockUseMcpMutation.mock.calls.map(([name]) => name as string);
      expect(names).toContain("music_playback_play");
      expect(names).toContain("music_playback_stop");
      expect(names).toContain("music_playback_pause");
    });
  });

  describe("aiGenerateStream", () => {
    it("calls useMcpStream with music_ai_generate", () => {
      renderHook(() => useMusicCreatorMcp(null));

      expect(mockUseMcpStream).toHaveBeenCalledWith("music_ai_generate");
    });

    it("exposes stream result on aiGenerateStream", () => {
      const streamResult = makeStreamResult({ fullText: "C Major arpeggio..." });
      mockUseMcpStream.mockReturnValueOnce(streamResult);

      const { result } = renderHook(() => useMusicCreatorMcp(null));

      expect(result.current.aiGenerateStream).toBe(streamResult);
    });
  });

  describe("saveProjectMut and exportProjectMut", () => {
    it("registers save and export project mutations", () => {
      renderHook(() => useMusicCreatorMcp(null));

      const names = mockUseMcpMutation.mock.calls.map(([name]) => name as string);
      expect(names).toContain("music_save_project");
      expect(names).toContain("music_export_project");
    });

    it("saveProjectMut onSuccess refetches projects", () => {
      const projectsRefetch = vi.fn();
      const projectsQueryResult = makeQueryResult({ refetch: projectsRefetch });

      mockUseMcpTool
        .mockReturnValueOnce(projectsQueryResult)
        .mockReturnValue(makeQueryResult());

      let capturedOptions: { onSuccess?: () => void; } = {};
      mockUseMcpMutation.mockImplementation(
        (name: string, opts: { onSuccess?: () => void; } = {}) => {
          if (name === "music_save_project") capturedOptions = opts;
          return makeMutationResult();
        },
      );

      renderHook(() => useMusicCreatorMcp(null));

      capturedOptions.onSuccess?.();
      expect(projectsRefetch).toHaveBeenCalledOnce();
    });
  });

  describe("mutation result passthrough", () => {
    it("exposes mutation result objects directly", () => {
      const createResult = makeMutationResult({ isLoading: true });
      const deleteProjectResult = makeMutationResult();
      const saveResult = makeMutationResult();
      const exportResult = makeMutationResult();
      const addTrackResult = makeMutationResult();
      const removeTrackResult = makeMutationResult();
      const reorderResult = makeMutationResult();
      const updateTrackResult = makeMutationResult();
      const selectInstrumentResult = makeMutationResult();
      const playResult = makeMutationResult();
      const stopResult = makeMutationResult();
      const pauseResult = makeMutationResult();

      mockUseMcpMutation
        .mockReturnValueOnce(createResult)
        .mockReturnValueOnce(deleteProjectResult)
        .mockReturnValueOnce(saveResult)
        .mockReturnValueOnce(exportResult)
        .mockReturnValueOnce(addTrackResult)
        .mockReturnValueOnce(removeTrackResult)
        .mockReturnValueOnce(reorderResult)
        .mockReturnValueOnce(updateTrackResult)
        .mockReturnValueOnce(selectInstrumentResult)
        .mockReturnValueOnce(playResult)
        .mockReturnValueOnce(stopResult)
        .mockReturnValueOnce(pauseResult);

      const { result } = renderHook(() => useMusicCreatorMcp(null));

      expect(result.current.createProjectMut).toBe(createResult);
      expect(result.current.deleteProjectMut).toBe(deleteProjectResult);
      expect(result.current.saveProjectMut).toBe(saveResult);
      expect(result.current.exportProjectMut).toBe(exportResult);
      expect(result.current.addTrackMut).toBe(addTrackResult);
      expect(result.current.removeTrackMut).toBe(removeTrackResult);
      expect(result.current.reorderTracksMut).toBe(reorderResult);
      expect(result.current.updateTrackMut).toBe(updateTrackResult);
      expect(result.current.selectInstrumentMut).toBe(selectInstrumentResult);
      expect(result.current.playMut).toBe(playResult);
      expect(result.current.stopMut).toBe(stopResult);
      expect(result.current.pauseMut).toBe(pauseResult);
    });
  });
});
