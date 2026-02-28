import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

const mockMutateAsync = vi.hoisted(() => vi.fn());
const mockReset = vi.hoisted(() => vi.fn());

vi.mock("@/lib/mcp/client/hooks/use-mcp-mutation", () => ({
  useMcpMutation: vi.fn().mockReturnValue({
    mutate: vi.fn(),
    mutateAsync: mockMutateAsync,
    data: undefined,
    error: undefined,
    isLoading: false,
    reset: mockReset,
  }),
}));

import { useMcpExplorerMcp } from "./useMcpExplorerMcp";

describe("useMcpExplorerMcp", () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockReset.mockReset();
  });

  describe("initial state", () => {
    it("returns executeTool, isLoading, and reset", () => {
      const { result } = renderHook(() => useMcpExplorerMcp());

      expect(typeof result.current.executeTool).toBe("function");
      expect(result.current.isLoading).toBe(false);
      expect(typeof result.current.reset).toBe("function");
    });
  });

  describe("executeTool - success", () => {
    it("calls onResult with isExecuting=true then the response", async () => {
      const responseData = { content: "hello" };
      mockMutateAsync.mockResolvedValue(responseData);

      const { result } = renderHook(() => useMcpExplorerMcp());
      const onResult = vi.fn();

      await act(async () => {
        await result.current.executeTool("test_tool", { key: "val" }, onResult);
      });

      expect(onResult).toHaveBeenCalledTimes(2);
      expect(onResult).toHaveBeenNthCalledWith(1, {
        response: null,
        error: null,
        isExecuting: true,
        toolName: "test_tool",
      });
      expect(onResult).toHaveBeenNthCalledWith(2, {
        response: responseData,
        error: null,
        isExecuting: false,
        toolName: "test_tool",
      });
    });

    it("calls onSuccess option on success", async () => {
      const responseData = { result: 42 };
      mockMutateAsync.mockResolvedValue(responseData);

      const onSuccess = vi.fn();
      const { result } = renderHook(() => useMcpExplorerMcp({ onSuccess }));
      const onResult = vi.fn();

      await act(async () => {
        await result.current.executeTool("my_tool", {}, onResult);
      });

      expect(onSuccess).toHaveBeenCalledWith({
        response: responseData,
        error: null,
        isExecuting: false,
        toolName: "my_tool",
      });
    });

    it("passes tool name and params to mutateAsync", async () => {
      mockMutateAsync.mockResolvedValue("ok");

      const { result } = renderHook(() => useMcpExplorerMcp());
      const onResult = vi.fn();

      await act(async () => {
        await result.current.executeTool("chess_tool", { foo: "bar" }, onResult);
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        tool: "chess_tool",
        params: { foo: "bar" },
      });
    });
  });

  describe("executeTool - error handling", () => {
    it("calls onResult with error on failure", async () => {
      mockMutateAsync.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useMcpExplorerMcp());
      const onResult = vi.fn();

      await act(async () => {
        await result.current.executeTool("fail_tool", {}, onResult);
      });

      expect(onResult).toHaveBeenLastCalledWith({
        response: null,
        error: "Network error",
        isExecuting: false,
        toolName: "fail_tool",
      });
    });

    it("wraps non-Error thrown values as 'Unknown error'", async () => {
      mockMutateAsync.mockRejectedValue("something bad");

      const { result } = renderHook(() => useMcpExplorerMcp());
      const onResult = vi.fn();

      await act(async () => {
        await result.current.executeTool("fail_tool", {}, onResult);
      });

      expect(onResult).toHaveBeenLastCalledWith(
        expect.objectContaining({ error: "Unknown error" }),
      );
    });

    it("calls onError option on failure", async () => {
      mockMutateAsync.mockRejectedValue(new Error("boom"));

      const onError = vi.fn();
      const { result } = renderHook(() => useMcpExplorerMcp({ onError }));
      const onResult = vi.fn();

      await act(async () => {
        await result.current.executeTool("bad_tool", {}, onResult);
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ error: "boom", toolName: "bad_tool" }),
      );
    });
  });

  describe("abort signal", () => {
    it("does not call onResult when signal is already aborted", async () => {
      mockMutateAsync.mockResolvedValue("data");

      const { result } = renderHook(() => useMcpExplorerMcp());
      const onResult = vi.fn();
      const controller = new AbortController();
      controller.abort();

      await act(async () => {
        await result.current.executeTool("tool", {}, onResult, controller.signal);
      });

      expect(onResult).not.toHaveBeenCalled();
    });
  });

  describe("reset", () => {
    it("delegates reset to mutation", () => {
      const { result } = renderHook(() => useMcpExplorerMcp());

      act(() => {
        result.current.reset();
      });

      expect(mockReset).toHaveBeenCalled();
    });
  });
});
