import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

// ── Mocks ─────────────────────────────────────────────────────────────────

const mockCallTool = vi.fn();

vi.mock("@/lib/mcp/client/mcp-client", () => ({
  callTool: (...args: unknown[]) => mockCallTool(...args),
}));

// ── Tests ─────────────────────────────────────────────────────────────────

describe("useStateMachineMcp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initialises without fetching (listQuery disabled by default)", async () => {
    const { useStateMachineMcp } = await import("./useStateMachineMcp");
    const { result } = renderHook(() => useStateMachineMcp());

    expect(mockCallTool).not.toHaveBeenCalled();
    expect(result.current.listQuery.isLoading).toBe(false);
  });

  it("createMut calls sm_create with correct args", async () => {
    mockCallTool.mockResolvedValueOnce("- **ID:** `abc-123`\n- **Name:** My Machine");

    const { useStateMachineMcp } = await import("./useStateMachineMcp");
    const { result } = renderHook(() => useStateMachineMcp());

    let response: string | undefined;
    await act(async () => {
      response = await result.current.createMut.mutateAsync({
        name: "My Machine",
        initial_state: "idle",
      });
    });

    expect(mockCallTool).toHaveBeenCalledWith("sm_create", {
      name: "My Machine",
      initial_state: "idle",
    });
    expect(response).toBe("- **ID:** `abc-123`\n- **Name:** My Machine");
  });

  it("addStateMut calls sm_add_state", async () => {
    mockCallTool.mockResolvedValueOnce("State added");

    const { useStateMachineMcp } = await import("./useStateMachineMcp");
    const { result } = renderHook(() => useStateMachineMcp());

    await act(async () => {
      await result.current.addStateMut.mutateAsync({
        machine_id: "abc-123",
        state_id: "active",
        type: "atomic",
      });
    });

    expect(mockCallTool).toHaveBeenCalledWith("sm_add_state", {
      machine_id: "abc-123",
      state_id: "active",
      type: "atomic",
    });
  });

  it("removeStateMut calls sm_remove_state", async () => {
    mockCallTool.mockResolvedValueOnce("State removed");

    const { useStateMachineMcp } = await import("./useStateMachineMcp");
    const { result } = renderHook(() => useStateMachineMcp());

    await act(async () => {
      await result.current.removeStateMut.mutateAsync({
        machine_id: "abc-123",
        state_id: "active",
      });
    });

    expect(mockCallTool).toHaveBeenCalledWith("sm_remove_state", {
      machine_id: "abc-123",
      state_id: "active",
    });
  });

  it("addTransitionMut calls sm_add_transition", async () => {
    mockCallTool.mockResolvedValueOnce("Transition added");

    const { useStateMachineMcp } = await import("./useStateMachineMcp");
    const { result } = renderHook(() => useStateMachineMcp());

    await act(async () => {
      await result.current.addTransitionMut.mutateAsync({
        machine_id: "abc-123",
        source: "idle",
        target: "active",
        event: "ACTIVATE",
      });
    });

    expect(mockCallTool).toHaveBeenCalledWith("sm_add_transition", {
      machine_id: "abc-123",
      source: "idle",
      target: "active",
      event: "ACTIVATE",
    });
  });

  it("removeTransitionMut calls sm_remove_transition", async () => {
    mockCallTool.mockResolvedValueOnce("Transition removed");

    const { useStateMachineMcp } = await import("./useStateMachineMcp");
    const { result } = renderHook(() => useStateMachineMcp());

    await act(async () => {
      await result.current.removeTransitionMut.mutateAsync({
        machine_id: "abc-123",
        transition_id: "t-1",
      });
    });

    expect(mockCallTool).toHaveBeenCalledWith("sm_remove_transition", {
      machine_id: "abc-123",
      transition_id: "t-1",
    });
  });

  it("sendEventMut calls sm_send_event", async () => {
    mockCallTool.mockResolvedValueOnce("Event sent");

    const { useStateMachineMcp } = await import("./useStateMachineMcp");
    const { result } = renderHook(() => useStateMachineMcp());

    await act(async () => {
      await result.current.sendEventMut.mutateAsync({
        machine_id: "abc-123",
        event: "ACTIVATE",
      });
    });

    expect(mockCallTool).toHaveBeenCalledWith("sm_send_event", {
      machine_id: "abc-123",
      event: "ACTIVATE",
    });
  });

  it("resetMut calls sm_reset", async () => {
    mockCallTool.mockResolvedValueOnce("Machine reset");

    const { useStateMachineMcp } = await import("./useStateMachineMcp");
    const { result } = renderHook(() => useStateMachineMcp());

    await act(async () => {
      await result.current.resetMut.mutateAsync({ machine_id: "abc-123" });
    });

    expect(mockCallTool).toHaveBeenCalledWith("sm_reset", {
      machine_id: "abc-123",
    });
  });

  it("validateMut calls sm_validate", async () => {
    mockCallTool.mockResolvedValueOnce("Machine is valid");

    const { useStateMachineMcp } = await import("./useStateMachineMcp");
    const { result } = renderHook(() => useStateMachineMcp());

    await act(async () => {
      await result.current.validateMut.mutateAsync({ machine_id: "abc-123" });
    });

    expect(mockCallTool).toHaveBeenCalledWith("sm_validate", {
      machine_id: "abc-123",
    });
  });

  it("exportMut calls sm_export", async () => {
    const exportText = "```json\n{\"definition\": {}}\n```";
    mockCallTool.mockResolvedValueOnce(exportText);

    const { useStateMachineMcp } = await import("./useStateMachineMcp");
    const { result } = renderHook(() => useStateMachineMcp());

    let response: string | undefined;
    await act(async () => {
      response = await result.current.exportMut.mutateAsync({
        machine_id: "abc-123",
      });
    });

    expect(mockCallTool).toHaveBeenCalledWith("sm_export", {
      machine_id: "abc-123",
    });
    expect(response).toBe(exportText);
  });

  it("shareMut calls sm_share", async () => {
    mockCallTool.mockResolvedValueOnce(
      "- **Token:** `tok-abc`\n- **Link:** [https://spike.land/share/tok-abc]",
    );

    const { useStateMachineMcp } = await import("./useStateMachineMcp");
    const { result } = renderHook(() => useStateMachineMcp());

    await act(async () => {
      await result.current.shareMut.mutateAsync({ machine_id: "abc-123" });
    });

    expect(mockCallTool).toHaveBeenCalledWith("sm_share", {
      machine_id: "abc-123",
    });
  });

  it("setContextMut calls sm_set_context", async () => {
    mockCallTool.mockResolvedValueOnce("Context updated");

    const { useStateMachineMcp } = await import("./useStateMachineMcp");
    const { result } = renderHook(() => useStateMachineMcp());

    await act(async () => {
      await result.current.setContextMut.mutateAsync({
        machine_id: "abc-123",
        context: { count: 0 },
      });
    });

    expect(mockCallTool).toHaveBeenCalledWith("sm_set_context", {
      machine_id: "abc-123",
      context: { count: 0 },
    });
  });

  it("chatMut calls chat_send_message for AI generation", async () => {
    const aiResponse =
      "{\"name\": \"Test Machine\", \"initialState\": \"idle\", \"states\": [], \"transitions\": []}";
    mockCallTool.mockResolvedValueOnce(aiResponse);

    const { useStateMachineMcp } = await import("./useStateMachineMcp");
    const { result } = renderHook(() => useStateMachineMcp());

    let response: string | undefined;
    await act(async () => {
      response = await result.current.chatMut.mutateAsync({
        message: "Generate a simple traffic light machine",
      });
    });

    expect(mockCallTool).toHaveBeenCalledWith("chat_send_message", {
      message: "Generate a simple traffic light machine",
    });
    expect(response).toBe(aiResponse);
  });

  it("exposes isLoading state on mutations", async () => {
    let resolveFn!: (value: string) => void;
    const pending = new Promise<string>(res => {
      resolveFn = res;
    });
    mockCallTool.mockReturnValueOnce(pending);

    const { useStateMachineMcp } = await import("./useStateMachineMcp");
    const { result } = renderHook(() => useStateMachineMcp());

    expect(result.current.createMut.isLoading).toBe(false);

    act(() => {
      void result.current.createMut.mutate({ name: "Loading Test" });
    });

    expect(result.current.createMut.isLoading).toBe(true);

    await act(async () => {
      resolveFn("done");
      await pending;
    });

    expect(result.current.createMut.isLoading).toBe(false);
  });

  it("sets error when mutation fails", async () => {
    mockCallTool.mockRejectedValueOnce(new Error("Network error"));

    const { useStateMachineMcp } = await import("./useStateMachineMcp");
    const { result } = renderHook(() => useStateMachineMcp());

    await act(async () => {
      try {
        await result.current.createMut.mutateAsync({ name: "Fail Test" });
      } catch {
        // expected
      }
    });

    expect(result.current.createMut.error?.message).toBe("Network error");
  });
});
