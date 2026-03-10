import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useChat } from "../ui/hooks/useChat.ts";
import type { ChatMessage, QuickChoice } from "../types.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function lastMessage(messages: ChatMessage[]): ChatMessage {
  const msg = messages[messages.length - 1];
  if (!msg) throw new Error("No messages");
  return msg;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useChat", () => {
  it("starts with empty messages and not loading", () => {
    const { result } = renderHook(() => useChat());

    expect(result.current.messages).toHaveLength(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("initialises with provided messages", () => {
    const seed: ChatMessage[] = [{ id: "1", role: "user", content: "Hello", timestamp: 1000 }];
    const { result } = renderHook(() => useChat({ initialMessages: seed }));

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]?.content).toBe("Hello");
  });

  it("adds user message immediately when sendMessage is called", async () => {
    const { result } = renderHook(() =>
      useChat({
        onSendMessage: async () => "Assistant reply",
      }),
    );

    act(() => {
      void result.current.sendMessage("Hi there");
    });

    // User message appears synchronously (before await)
    expect(result.current.messages.some((m) => m.content === "Hi there")).toBe(true);
    expect(result.current.messages.some((m) => m.role === "user")).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("appends assistant reply after onSendMessage resolves", async () => {
    const { result } = renderHook(() =>
      useChat({
        onSendMessage: async () => "I can help with that.",
      }),
    );

    await act(async () => {
      await result.current.sendMessage("What do I need?");
    });

    expect(result.current.messages).toHaveLength(2);
    expect(lastMessage(result.current.messages).role).toBe("assistant");
    expect(lastMessage(result.current.messages).content).toBe("I can help with that.");
  });

  it("sets isLoading to false after send completes", async () => {
    const { result } = renderHook(() => useChat({ onSendMessage: async () => "Done" }));

    await act(async () => {
      await result.current.sendMessage("Help me");
    });

    expect(result.current.isLoading).toBe(false);
    // Both user and assistant messages should exist
    expect(result.current.messages).toHaveLength(2);
  });

  it("adds a fallback assistant message on error instead of leaving chat hanging", async () => {
    const { result } = renderHook(() =>
      useChat({
        onSendMessage: async () => {
          throw new Error("Network error");
        },
      }),
    );

    await act(async () => {
      await result.current.sendMessage("Hello");
    });

    // Should have user message + fallback assistant message
    expect(result.current.messages).toHaveLength(2);
    expect(lastMessage(result.current.messages).role).toBe("assistant");
    expect(result.current.error).toBe("Network error");
    expect(result.current.isLoading).toBe(false);
  });

  it("clearHistory resets all messages and state", async () => {
    const { result } = renderHook(() => useChat({ onSendMessage: async () => "OK" }));

    await act(async () => {
      await result.current.sendMessage("Hello");
    });

    expect(result.current.messages.length).toBeGreaterThan(0);

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.messages).toHaveLength(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sendQuickChoices joins selected labels and sends as user message", async () => {
    const choices: QuickChoice[] = [
      { id: "a", label: "Option A" },
      { id: "b", label: "Option B" },
      { id: "c", label: "Option C" },
    ];

    const onSend = vi.fn(async (_msg: ChatMessage) => "Got it");

    const { result } = renderHook(() => useChat({ onSendMessage: onSend }));

    await act(async () => {
      await result.current.sendQuickChoices(choices, ["a", "c"]);
    });

    const userMessage = result.current.messages.find((m) => m.role === "user");
    expect(userMessage?.content).toBe("Option A, Option C");
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it("sendQuickChoices with empty selection does nothing", async () => {
    const onSend = vi.fn(async () => "OK");
    const { result } = renderHook(() => useChat({ onSendMessage: onSend }));

    await act(async () => {
      await result.current.sendQuickChoices([], []);
    });

    expect(result.current.messages).toHaveLength(0);
    expect(onSend).not.toHaveBeenCalled();
  });

  it("each message has a unique id", async () => {
    const { result } = renderHook(() => useChat({ onSendMessage: async () => "Reply 1" }));

    await act(async () => {
      await result.current.sendMessage("Message 1");
    });

    await act(async () => {
      await result.current.sendMessage("Message 2");
    });

    const ids = result.current.messages.map((m) => m.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("messages have monotonically increasing timestamps", async () => {
    const { result } = renderHook(() => useChat({ onSendMessage: async () => "Pong" }));

    await act(async () => {
      await result.current.sendMessage("Ping");
    });

    const timestamps = result.current.messages.map((m) => m.timestamp);
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1] as number);
    }
  });
});
