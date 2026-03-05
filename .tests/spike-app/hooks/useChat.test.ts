import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChat } from "@/hooks/useChat";

// Mock apiUrl
vi.mock("@/lib/api", () => ({
  apiUrl: (path: string) => `/api${path}`,
}));

function makeSSEResponse(events: string[]) {
  const body = events.map((e) => `data: ${e}`).join("\n") + "\ndata: [DONE]\n";
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

describe("useChat", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("starts with empty messages and no error", () => {
    const { result } = renderHook(() => useChat());
    expect(result.current.messages).toEqual([]);
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("restores messages from localStorage on mount", () => {
    const stored = [
      { id: "msg-1", role: "user", content: "Hello", timestamp: 1000 },
    ];
    localStorage.setItem("spike-chat-messages", JSON.stringify(stored));

    const { result } = renderHook(() => useChat());
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe("Hello");
  });

  it("handles malformed localStorage gracefully", () => {
    localStorage.setItem("spike-chat-messages", "not-json");
    const { result } = renderHook(() => useChat());
    expect(result.current.messages).toEqual([]);
  });

  it("sends message and parses text_delta events", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      makeSSEResponse([
        JSON.stringify({ type: "text_delta", text: "Hello " }),
        JSON.stringify({ type: "text_delta", text: "world" }),
      ]),
    );

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage("Hi");
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/chat");
    expect(opts?.credentials).toBe("include");

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].role).toBe("user");
    expect(result.current.messages[0].content).toBe("Hi");
    expect(result.current.messages[1].role).toBe("assistant");
    expect(result.current.messages[1].content).toBe("Hello world");
  });

  it("parses tool_call_start and tool_call_end events", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      makeSSEResponse([
        JSON.stringify({ type: "tool_call_start", name: "search_tools", args: { q: "test" } }),
        JSON.stringify({ type: "tool_call_end", name: "search_tools", result: "Found 3 results" }),
      ]),
    );

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage("Search");
    });

    const assistantMsg = result.current.messages[1];
    expect(assistantMsg.toolCalls).toHaveLength(1);
    expect(assistantMsg.toolCalls![0].name).toBe("search_tools");
    expect(assistantMsg.toolCalls![0].status).toBe("done");
    expect(assistantMsg.toolCalls![0].result).toBe("Found 3 results");
  });

  it("parses browser_command events", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      makeSSEResponse([
        JSON.stringify({
          type: "browser_command",
          tool: "browser_navigate",
          args: { url: "/tools" },
          requestId: "req-123",
        }),
      ]),
    );

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage("Go to tools");
    });

    const assistantMsg = result.current.messages[1];
    expect(assistantMsg.browserCommands).toHaveLength(1);
    expect(assistantMsg.browserCommands![0].tool).toBe("browser_navigate");
    expect(assistantMsg.browserCommands![0].requestId).toBe("req-123");
  });

  it("sets error on error event", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      makeSSEResponse([
        JSON.stringify({ type: "error", error: "Rate limited" }),
      ]),
    );

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage("Hi");
    });

    expect(result.current.error).toBe("Rate limited");
  });

  it("sets error on HTTP failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Unauthorized", { status: 401 }),
    );

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage("Hi");
    });

    expect(result.current.error).toBe("Unauthorized");
    expect(result.current.messages[1].content).toBe(
      "Sorry, something went wrong. Please try again.",
    );
  });

  it("clearMessages removes all messages and localStorage", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      makeSSEResponse([JSON.stringify({ type: "text_delta", text: "Hi" })]),
    );

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage("Hello");
    });

    expect(result.current.messages).toHaveLength(2);

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toEqual([]);
    // localStorage may have "[]" due to useEffect re-persisting empty array,
    // or null if removeItem was called — either indicates messages were cleared
    const stored = localStorage.getItem("spike-chat-messages");
    expect(stored === null || stored === "[]").toBe(true);
  });

  it("clearError clears the error state", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      makeSSEResponse([JSON.stringify({ type: "error", error: "Oops" })]),
    );

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage("Hi");
    });

    expect(result.current.error).toBe("Oops");

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it("does not send empty or whitespace-only messages", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage("");
      await result.current.sendMessage("   ");
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("skips malformed SSE data gracefully", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      makeSSEResponse([
        "not-json",
        JSON.stringify({ type: "text_delta", text: "Valid" }),
      ]),
    );

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage("Hi");
    });

    expect(result.current.messages[1].content).toBe("Valid");
    expect(result.current.error).toBeNull();
  });
});
