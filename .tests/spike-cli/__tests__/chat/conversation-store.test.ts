import { afterEach, describe, expect, it, vi } from "vitest";
import {
  saveConversation,
  loadConversation,
  listConversations,
} from "../../../../src/cli/spike-cli/node-sys/conversation-store.js";
import type { Message } from "../../../../src/cli/spike-cli/ai/client.js";

// Mock fs and os modules
vi.mock("node:fs", () => {
  const store = new Map<string, string>();
  return {
    existsSync: vi.fn((path: string) => store.has(path) || path.endsWith("conversations")),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn((path: string) => {
      const content = store.get(path);
      if (!content) throw new Error(`ENOENT: ${path}`);
      return content;
    }),
    writeFileSync: vi.fn((path: string, content: string) => {
      store.set(path, content);
    }),
    readdirSync: vi.fn(() => {
      const files: string[] = [];
      for (const key of store.keys()) {
        if (key.endsWith(".json")) {
          files.push(key.split("/").pop()!);
        }
      }
      return files;
    }),
    __store: store,
  };
});

vi.mock("node:os", () => ({
  homedir: vi.fn(() => "/tmp/test-home"),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("saveConversation", () => {
  it("saves messages and returns metadata", () => {
    const messages: Message[] = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there!" },
    ];

    const meta = saveConversation(messages, "test-id");
    expect(meta.id).toBe("test-id");
    expect(meta.messageCount).toBe(2);
    expect(meta.preview).toBe("Hello");
  });
});

describe("loadConversation", () => {
  it("returns null for nonexistent conversation", () => {
    const result = loadConversation("nonexistent");
    expect(result).toBeNull();
  });
});

describe("listConversations", () => {
  it("returns an array", () => {
    const result = listConversations();
    expect(Array.isArray(result)).toBe(true);
  });
});
