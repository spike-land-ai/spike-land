import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useBrowserBridge } from "@/hooks/useBrowserBridge";
import type { ChatMessage } from "@/hooks/useChat";

function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: "msg-1",
    role: "assistant",
    content: "",
    timestamp: Date.now(),
    browserCommands: [],
    ...overrides,
  };
}

describe("useBrowserBridge", () => {
  const mockRouter = {
    navigate: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockRouter.navigate.mockClear();
  });

  it("navigates internally using router for paths starting with /", () => {
    const onResult = vi.fn();
    const messages = [
      makeMessage({
        browserCommands: [
          { tool: "browser_navigate", args: { url: "/tools" }, requestId: "req-1" },
        ],
      }),
    ];

    renderHook(() =>
      useBrowserBridge({ messages, onResult, router: mockRouter as never }),
    );

    expect(mockRouter.navigate).toHaveBeenCalledWith({ to: "/tools" });
  });

  it("navigates to section name by prepending /", () => {
    const onResult = vi.fn();
    const messages = [
      makeMessage({
        browserCommands: [
          { tool: "browser_navigate", args: { url: "store" }, requestId: "req-2" },
        ],
      }),
    ];

    renderHook(() =>
      useBrowserBridge({ messages, onResult, router: mockRouter as never }),
    );

    expect(mockRouter.navigate).toHaveBeenCalledWith({ to: "/store" });
  });

  it("opens external URLs in new tab", () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    const onResult = vi.fn();
    const messages = [
      makeMessage({
        browserCommands: [
          { tool: "browser_navigate", args: { url: "https://example.com" }, requestId: "req-3" },
        ],
      }),
    ];

    renderHook(() =>
      useBrowserBridge({ messages, onResult, router: mockRouter as never }),
    );

    expect(openSpy).toHaveBeenCalledWith("https://example.com", "_blank");
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it("executes browser_click on matching element", async () => {
    const div = document.createElement("div");
    div.id = "test-btn";
    document.body.appendChild(div);

    const onResult = vi.fn();
    const messages = [
      makeMessage({
        browserCommands: [
          { tool: "browser_click", args: { selector: "#test-btn" }, requestId: "req-4" },
        ],
      }),
    ];

    renderHook(() =>
      useBrowserBridge({ messages, onResult, router: mockRouter as never }),
    );

    await vi.waitFor(() => {
      expect(onResult).toHaveBeenCalled();
    });

    expect(onResult).toHaveBeenCalledWith("req-4", expect.objectContaining({ success: true }));

    document.body.removeChild(div);
  });

  it("returns error for browser_click on missing element", async () => {
    const onResult = vi.fn();
    const messages = [
      makeMessage({
        browserCommands: [
          { tool: "browser_click", args: { selector: "#nonexistent" }, requestId: "req-5" },
        ],
      }),
    ];

    renderHook(() =>
      useBrowserBridge({ messages, onResult, router: mockRouter as never }),
    );

    await vi.waitFor(() => {
      expect(onResult).toHaveBeenCalled();
    });

    expect(onResult).toHaveBeenCalledWith(
      "req-5",
      expect.objectContaining({ success: false, error: expect.stringContaining("#nonexistent") }),
    );
  });

  it("executes browser_read_text on body by default", async () => {
    const onResult = vi.fn();
    const messages = [
      makeMessage({
        browserCommands: [
          { tool: "browser_read_text", args: {}, requestId: "req-7" },
        ],
      }),
    ];

    renderHook(() =>
      useBrowserBridge({ messages, onResult, router: mockRouter as never }),
    );

    await vi.waitFor(() => {
      expect(onResult).toHaveBeenCalled();
    });

    expect(onResult).toHaveBeenCalledWith(
      "req-7",
      expect.objectContaining({ success: true, text: expect.any(String) }),
    );
  });

  it("does not process the same command twice (deduplication)", async () => {
    const onResult = vi.fn();
    const messages = [
      makeMessage({
        browserCommands: [
          { tool: "browser_screenshot", args: {}, requestId: "req-8" },
        ],
      }),
    ];

    const { rerender } = renderHook(
      ({ msgs }) => useBrowserBridge({ messages: msgs, onResult, router: mockRouter as never }),
      { initialProps: { msgs: messages } },
    );

    await vi.waitFor(() => {
      expect(onResult).toHaveBeenCalledTimes(1);
    });

    // Re-render with same messages — should not process again
    rerender({ msgs: [...messages] });

    await new Promise((r) => setTimeout(r, 50));
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  it("returns error for unknown browser tool", async () => {
    const onResult = vi.fn();
    const messages = [
      makeMessage({
        browserCommands: [
          { tool: "browser_unknown", args: {}, requestId: "req-10" },
        ],
      }),
    ];

    renderHook(() =>
      useBrowserBridge({ messages, onResult, router: mockRouter as never }),
    );

    await vi.waitFor(() => {
      expect(onResult).toHaveBeenCalled();
    });

    expect(onResult).toHaveBeenCalledWith(
      "req-10",
      expect.objectContaining({ success: false, error: expect.stringContaining("Unknown browser tool") }),
    );
  });
});
