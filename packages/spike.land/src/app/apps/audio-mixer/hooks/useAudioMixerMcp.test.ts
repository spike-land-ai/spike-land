import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const mockUseMcpTool = vi.hoisted(() => vi.fn());
const mockUseMcpMutation = vi.hoisted(() => vi.fn());

vi.mock("@/lib/mcp/client/hooks/use-mcp-tool", () => ({
  useMcpTool: mockUseMcpTool,
}));

vi.mock("@/lib/mcp/client/hooks/use-mcp-mutation", () => ({
  useMcpMutation: mockUseMcpMutation,
}));

import { useAudioMixerMcp } from "./useAudioMixerMcp";

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

describe("useAudioMixerMcp", () => {
  beforeEach(() => {
    mockUseMcpTool.mockReset();
    mockUseMcpMutation.mockReset();

    mockUseMcpTool.mockReturnValue(makeQueryResult());
    mockUseMcpMutation.mockReturnValue(makeMutationResult());
  });

  describe("initial hook shape", () => {
    it("returns all expected keys", () => {
      const { result } = renderHook(() => useAudioMixerMcp(null));

      expect(result.current).toHaveProperty("projectsQuery");
      expect(result.current).toHaveProperty("tracksQuery");
      expect(result.current).toHaveProperty("createProjectMut");
      expect(result.current).toHaveProperty("deleteProjectMut");
      expect(result.current).toHaveProperty("deleteTrackMut");
      expect(result.current).toHaveProperty("updateTrackMut");
    });
  });

  describe("projectsQuery", () => {
    it("calls useMcpTool with audio_list_projects and enabled:true", () => {
      renderHook(() => useAudioMixerMcp(null));

      expect(mockUseMcpTool).toHaveBeenCalledWith(
        "audio_list_projects",
        {},
        expect.objectContaining({ enabled: true, refetchInterval: 30_000 }),
      );
    });

    it("exposes the query result object", () => {
      const queryResult = makeQueryResult({ data: "Project A\nProject B", isLoading: false });
      mockUseMcpTool.mockReturnValueOnce(queryResult).mockReturnValue(makeQueryResult());

      const { result } = renderHook(() => useAudioMixerMcp(null));

      expect(result.current.projectsQuery).toBe(queryResult);
    });
  });

  describe("tracksQuery", () => {
    it("calls useMcpTool with audio_list_tracks and enabled:false when no project", () => {
      renderHook(() => useAudioMixerMcp(null));

      expect(mockUseMcpTool).toHaveBeenCalledWith(
        "audio_list_tracks",
        { project_id: null },
        expect.objectContaining({ enabled: false }),
      );
    });

    it("enables tracksQuery when activeProjectId is provided", () => {
      renderHook(() => useAudioMixerMcp("proj-123"));

      expect(mockUseMcpTool).toHaveBeenCalledWith(
        "audio_list_tracks",
        { project_id: "proj-123" },
        expect.objectContaining({ enabled: true, refetchInterval: 10_000 }),
      );
    });
  });

  describe("createProjectMut", () => {
    it("calls useMcpMutation with audio_create_project", () => {
      renderHook(() => useAudioMixerMcp(null));

      const calls = mockUseMcpMutation.mock.calls;
      const createCall = calls.find(([name]) => name === "audio_create_project");
      expect(createCall).toBeDefined();
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
          if (name === "audio_create_project") capturedOptions = opts;
          return makeMutationResult();
        },
      );

      renderHook(() => useAudioMixerMcp(null));

      capturedOptions.onSuccess?.();
      expect(projectsRefetch).toHaveBeenCalledOnce();
    });
  });

  describe("deleteProjectMut", () => {
    it("calls useMcpMutation with audio_delete_project", () => {
      renderHook(() => useAudioMixerMcp(null));

      const calls = mockUseMcpMutation.mock.calls;
      const deleteCall = calls.find(([name]) => name === "audio_delete_project");
      expect(deleteCall).toBeDefined();
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
          if (name === "audio_delete_project") capturedOptions = opts;
          return makeMutationResult();
        },
      );

      renderHook(() => useAudioMixerMcp(null));

      capturedOptions.onSuccess?.();
      expect(projectsRefetch).toHaveBeenCalledOnce();
    });
  });

  describe("deleteTrackMut", () => {
    it("calls useMcpMutation with audio_delete_track", () => {
      renderHook(() => useAudioMixerMcp(null));

      const calls = mockUseMcpMutation.mock.calls;
      const deleteTrackCall = calls.find(([name]) => name === "audio_delete_track");
      expect(deleteTrackCall).toBeDefined();
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
          if (name === "audio_delete_track") capturedOptions = opts;
          return makeMutationResult();
        },
      );

      renderHook(() => useAudioMixerMcp("proj-123"));

      capturedOptions.onSuccess?.();
      expect(tracksRefetch).toHaveBeenCalledOnce();
    });
  });

  describe("updateTrackMut", () => {
    it("calls useMcpMutation with audio_update_track", () => {
      renderHook(() => useAudioMixerMcp(null));

      const calls = mockUseMcpMutation.mock.calls;
      const updateTrackCall = calls.find(([name]) => name === "audio_update_track");
      expect(updateTrackCall).toBeDefined();
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
          if (name === "audio_update_track") capturedOptions = opts;
          return makeMutationResult();
        },
      );

      renderHook(() => useAudioMixerMcp("proj-123"));

      capturedOptions.onSuccess?.();
      expect(tracksRefetch).toHaveBeenCalledOnce();
    });
  });

  describe("mutation result passthrough", () => {
    it("exposes mutation result objects directly", () => {
      const createResult = makeMutationResult({ isLoading: true });
      const deleteProjectResult = makeMutationResult();
      const deleteTrackResult = makeMutationResult();
      const updateTrackResult = makeMutationResult();

      mockUseMcpMutation
        .mockReturnValueOnce(createResult)
        .mockReturnValueOnce(deleteProjectResult)
        .mockReturnValueOnce(deleteTrackResult)
        .mockReturnValueOnce(updateTrackResult);

      const { result } = renderHook(() => useAudioMixerMcp(null));

      expect(result.current.createProjectMut).toBe(createResult);
      expect(result.current.deleteProjectMut).toBe(deleteProjectResult);
      expect(result.current.deleteTrackMut).toBe(deleteTrackResult);
      expect(result.current.updateTrackMut).toBe(updateTrackResult);
    });
  });
});
