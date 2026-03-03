import { beforeEach, describe, expect, it, vi } from "vitest";

const mockStream = vi.hoisted(() => vi.fn());

vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = { stream: mockStream };
    constructor() {}
  },
}));

import { ChatClient } from "../../chat/client.js";

describe("ChatClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStream.mockReturnValue({ on: vi.fn(), finalMessage: vi.fn() });
  });

  it("creates with default model", () => {
    const client = new ChatClient({ authToken: "test-token" });
    expect(client.model).toBe("claude-sonnet-4-6");
  });

  it("accepts custom model", () => {
    const client = new ChatClient({
      authToken: "tok",
      model: "claude-opus-4-6",
    });
    expect(client.model).toBe("claude-opus-4-6");
  });

  it("stores system prompt", () => {
    const client = new ChatClient({
      authToken: "tok",
      systemPrompt: "Be helpful",
    });
    expect(client.systemPrompt).toBe("Be helpful");
  });

  it("calls messages.stream with correct params", () => {
    const client = new ChatClient({ authToken: "tok" });
    const messages = [{ role: "user" as const, content: "hello" }];
    const tools = [
      {
        name: "test_tool",
        description: "A test",
        input_schema: { type: "object" as const, properties: {} },
      },
    ];

    client.createStream(messages, tools);

    expect(mockStream).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-sonnet-4-6",
        max_tokens: 16384,
        messages,
        tools,
        stream: true,
      }),
    );
  });

  it("includes system prompt when provided", () => {
    const client = new ChatClient({
      authToken: "tok",
      systemPrompt: "You are a pirate",
    });
    client.createStream([{ role: "user", content: "hi" }]);

    expect(mockStream).toHaveBeenCalledWith(
      expect.objectContaining({
        system: "You are a pirate",
      }),
    );
  });

  it("omits tools when empty array", () => {
    const client = new ChatClient({ authToken: "tok" });
    client.createStream([{ role: "user", content: "hi" }], []);

    const args = mockStream.mock.calls[0][0];
    expect(args.tools).toBeUndefined();
  });
});
