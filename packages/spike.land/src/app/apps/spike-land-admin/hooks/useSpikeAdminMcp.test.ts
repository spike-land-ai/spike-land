import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const mockCallTool = vi.hoisted(() => vi.fn());
vi.mock("@/lib/mcp/client/mcp-client", () => ({ callTool: mockCallTool }));

import { useSpikeAdminMcp } from "./useSpikeAdminMcp";

describe("useSpikeAdminMcp", () => {
  beforeEach(() => {
    mockCallTool.mockReset();
  });

  describe("initial state", () => {
    it("should return loading state initially for queries", () => {
      mockCallTool.mockReturnValue(new Promise(() => {})); // never resolves

      const { result } = renderHook(() => useSpikeAdminMcp());

      expect(result.current.usersQuery.isLoading).toBe(true);
      expect(result.current.statsQuery.isLoading).toBe(true);
      expect(result.current.banUserMut.isLoading).toBe(false);
    });

    it("should return idle state for mutation initially", () => {
      mockCallTool.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useSpikeAdminMcp());

      expect(result.current.banUserMut.data).toBeUndefined();
      expect(result.current.banUserMut.error).toBeUndefined();
      expect(result.current.banUserMut.isLoading).toBe(false);
      expect(typeof result.current.banUserMut.mutate).toBe("function");
      expect(typeof result.current.banUserMut.mutateAsync).toBe("function");
      expect(typeof result.current.banUserMut.reset).toBe("function");
    });
  });

  describe("usersQuery (admin_list_users)", () => {
    it("should call admin_list_users on mount", async () => {
      mockCallTool.mockResolvedValue("user-list-data");

      const { result } = renderHook(() => useSpikeAdminMcp());

      await waitFor(() => {
        expect(result.current.usersQuery.isLoading).toBe(false);
      });

      expect(mockCallTool).toHaveBeenCalledWith("admin_list_users", {});
      expect(result.current.usersQuery.data).toBe("user-list-data");
      expect(result.current.usersQuery.error).toBeUndefined();
    });

    it("should set error on usersQuery failure", async () => {
      const testError = new Error("Unauthorized");
      mockCallTool.mockRejectedValue(testError);

      const { result } = renderHook(() => useSpikeAdminMcp());

      await waitFor(() => {
        expect(result.current.usersQuery.isLoading).toBe(false);
      });

      expect(result.current.usersQuery.error).toBeDefined();
    });

    it("should expose refetch on usersQuery", async () => {
      mockCallTool.mockResolvedValue("initial-users");

      const { result } = renderHook(() => useSpikeAdminMcp());

      await waitFor(() => {
        expect(result.current.usersQuery.isLoading).toBe(false);
      });

      mockCallTool.mockResolvedValue("refreshed-users");

      await act(async () => {
        await result.current.usersQuery.refetch();
      });

      expect(result.current.usersQuery.data).toBe("refreshed-users");
    });
  });

  describe("statsQuery (admin_get_stats)", () => {
    it("should call admin_get_stats on mount", async () => {
      mockCallTool.mockResolvedValue("stats-data");

      const { result } = renderHook(() => useSpikeAdminMcp());

      await waitFor(() => {
        expect(result.current.statsQuery.isLoading).toBe(false);
      });

      expect(mockCallTool).toHaveBeenCalledWith("admin_get_stats", {});
      expect(result.current.statsQuery.data).toBe("stats-data");
    });

    it("should set error on statsQuery failure", async () => {
      const testError = new Error("Stats unavailable");
      mockCallTool.mockRejectedValue(testError);

      const { result } = renderHook(() => useSpikeAdminMcp());

      await waitFor(() => {
        expect(result.current.statsQuery.isLoading).toBe(false);
      });

      expect(result.current.statsQuery.error).toBeDefined();
    });
  });

  describe("banUserMut (admin_ban_user)", () => {
    it("should call admin_ban_user with args on mutate", async () => {
      mockCallTool.mockResolvedValue({ banned: true });
      mockCallTool.mockResolvedValueOnce("users");
      mockCallTool.mockResolvedValueOnce("stats");
      mockCallTool.mockResolvedValue({ banned: true });

      const { result } = renderHook(() => useSpikeAdminMcp());

      await waitFor(() => {
        expect(result.current.usersQuery.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.banUserMut.mutate({ userId: "user-123" });
      });

      expect(mockCallTool).toHaveBeenCalledWith("admin_ban_user", { userId: "user-123" });
    });

    it("should set isLoading true during ban mutation", async () => {
      mockCallTool.mockResolvedValueOnce("users");
      mockCallTool.mockResolvedValueOnce("stats");

      let resolveBan: (value: unknown) => void;
      mockCallTool.mockReturnValueOnce(
        new Promise(resolve => {
          resolveBan = resolve;
        }),
      );

      const { result } = renderHook(() => useSpikeAdminMcp());

      await waitFor(() => {
        expect(result.current.usersQuery.isLoading).toBe(false);
      });

      let mutatePromise: Promise<unknown>;
      act(() => {
        mutatePromise = result.current.banUserMut.mutate({ userId: "u1" });
      });

      expect(result.current.banUserMut.isLoading).toBe(true);

      await act(async () => {
        resolveBan!({ banned: true });
        await mutatePromise!;
      });

      expect(result.current.banUserMut.isLoading).toBe(false);
    });

    it("should set error on banUserMut failure", async () => {
      mockCallTool.mockResolvedValueOnce("users");
      mockCallTool.mockResolvedValueOnce("stats");
      mockCallTool.mockRejectedValue(new Error("Ban failed"));

      const { result } = renderHook(() => useSpikeAdminMcp());

      await waitFor(() => {
        expect(result.current.usersQuery.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.banUserMut.mutateAsync({ userId: "u1" });
        } catch {
          // expected
        }
      });

      expect(result.current.banUserMut.error).toBeDefined();
    });

    it("should reset banUserMut state", async () => {
      mockCallTool.mockResolvedValueOnce("users");
      mockCallTool.mockResolvedValueOnce("stats");
      mockCallTool.mockResolvedValue({ banned: true });

      const { result } = renderHook(() => useSpikeAdminMcp());

      await waitFor(() => {
        expect(result.current.usersQuery.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.banUserMut.mutate({ userId: "u1" });
      });

      expect(result.current.banUserMut.data).toBeDefined();

      act(() => {
        result.current.banUserMut.reset();
      });

      expect(result.current.banUserMut.data).toBeUndefined();
      expect(result.current.banUserMut.error).toBeUndefined();
      expect(result.current.banUserMut.isLoading).toBe(false);
    });
  });

  describe("hook structure", () => {
    it("should return all expected keys", () => {
      mockCallTool.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useSpikeAdminMcp());

      expect(result.current).toHaveProperty("usersQuery");
      expect(result.current).toHaveProperty("banUserMut");
      expect(result.current).toHaveProperty("statsQuery");
    });
  });
});
