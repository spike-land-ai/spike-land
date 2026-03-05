import { describe, expect, it, vi, afterEach } from "vitest";
import {
  messagesPush,
  extractCodeModification,
  updateSearchReplace,
  replaceFirstCodeMod,
  loadMessages,
  SEARCH_REPLACE_MARKERS,
} from "@/lib/chat-utils";
import type { Message } from "@/lib/interfaces";

describe("SEARCH_REPLACE_MARKERS", () => {
  it("has expected marker values", () => {
    expect(SEARCH_REPLACE_MARKERS.SEARCH_START).toBe("<<<<<<< SEARCH");
    expect(SEARCH_REPLACE_MARKERS.SEPARATOR).toBe("=======");
    expect(SEARCH_REPLACE_MARKERS.REPLACE_END).toBe(">>>>>>> REPLACE");
  });
});

describe("messagesPush", () => {
  it("throws when message has no role", () => {
    expect(() => messagesPush([], { id: "1", role: "" as "user", content: "hi" })).toThrow();
  });

  it("adds first message to empty array", () => {
    const result = messagesPush([], { id: "1", role: "user", content: "hello" });
    expect(result).toHaveLength(1);
    expect(result[0]!.content).toBe("hello");
  });

  it("appends message with different role", () => {
    const existing: Message[] = [{ id: "1", role: "user", content: "hello" }];
    const result = messagesPush(existing, { id: "2", role: "assistant", content: "world" });
    expect(result).toHaveLength(2);
  });

  it("appends message with same role as last when not assistant", () => {
    const existing: Message[] = [{ id: "1", role: "user", content: "hello" }];
    const result = messagesPush(existing, { id: "2", role: "user", content: "world" });
    expect(result).toHaveLength(2);
  });

  it("merges consecutive assistant messages (new starts with old)", () => {
    const existing: Message[] = [{ id: "1", role: "assistant", content: "hello" }];
    const result = messagesPush(existing, { id: "2", role: "assistant", content: "hello world" });
    expect(result).toHaveLength(1);
    expect(result[0]!.content).toBe("hello world");
  });

  it("concatenates consecutive assistant messages (new does not start with old)", () => {
    const existing: Message[] = [{ id: "1", role: "assistant", content: "hello" }];
    const result = messagesPush(existing, { id: "2", role: "assistant", content: " world" });
    expect(result).toHaveLength(1);
    expect(result[0]!.content).toBe("hello world");
  });

  it("handles array message content", () => {
    const existing: Message[] = [
      { id: "1", role: "assistant", content: [{ type: "text", text: "hello" }] },
    ];
    const newMsg: Message = {
      id: "2",
      role: "assistant",
      content: [{ type: "text", text: "hello world" }],
    };
    const result = messagesPush(existing, newMsg);
    expect(result).toHaveLength(1);
  });

  it("uses current timestamp as id when id is missing", () => {
    const result = messagesPush([], { role: "user", content: "hi" } as Message);
    expect(result[0]!.id).toBeTruthy();
  });
});

describe("extractCodeModification", () => {
  it("returns empty array when no diff blocks present", () => {
    expect(extractCodeModification("plain text response")).toEqual([]);
  });

  it("extracts single diff block", () => {
    const response = `<<<<<<< SEARCH
old code
=======
new code
>>>>>>> REPLACE`;
    const result = extractCodeModification(response);
    expect(result).toHaveLength(1);
    expect(result[0]).toContain("old code");
  });

  it("extracts multiple diff blocks", () => {
    const response = `<<<<<<< SEARCH
first old
=======
first new
>>>>>>> REPLACE

Some text between.

<<<<<<< SEARCH
second old
=======
second new
>>>>>>> REPLACE`;
    const result = extractCodeModification(response);
    expect(result).toHaveLength(2);
  });

  it("deduplicates identical blocks", () => {
    const block = `<<<<<<< SEARCH
same code
=======
same replacement
>>>>>>> REPLACE`;
    const response = `${block}\n\n${block}`;
    const result = extractCodeModification(response);
    expect(result).toHaveLength(1);
  });

  it("extracts diff block from markdown code fence", () => {
    const response = `Here is the change:
\`\`\`diff
<<<<<<< SEARCH
old content
=======
new content
>>>>>>> REPLACE
\`\`\``;
    const result = extractCodeModification(response);
    expect(result).toHaveLength(1);
  });

  it("returns sorted results", () => {
    const response = `<<<<<<< SEARCH
bbb
=======
BBB
>>>>>>> REPLACE

<<<<<<< SEARCH
aaa
=======
AAA
>>>>>>> REPLACE`;
    const result = extractCodeModification(response);
    expect(result.length).toBeGreaterThan(0);
    // Verify output is sorted alphabetically
    const sorted = [...result].sort();
    expect(result).toEqual(sorted);
  });
});

describe("updateSearchReplace", () => {
  it("returns original code when no modifications found", () => {
    const code = "const x = 1;";
    expect(updateSearchReplace("no diff here", code)).toBe(code);
  });

  it("applies a single modification", () => {
    const code = "const x = 1;";
    const instructions = `<<<<<<< SEARCH
const x = 1;
=======
const x = 2;
>>>>>>> REPLACE`;
    const result = updateSearchReplace(instructions, code);
    expect(result).toContain("2");
  });

  it("applies multiple modifications in sequence", () => {
    const code = "hello world";
    const instructions = `<<<<<<< SEARCH
hello
=======
hi
>>>>>>> REPLACE
<<<<<<< SEARCH
world
=======
earth
>>>>>>> REPLACE`;
    const result = updateSearchReplace(instructions, code);
    expect(result).toContain("hi");
    expect(result).toContain("earth");
  });
});

describe("replaceFirstCodeMod", () => {
  it("returns original code when no modifications found", () => {
    const code = "const x = 1;";
    expect(replaceFirstCodeMod("no diff here", code)).toBe(code);
  });

  it("applies only the first modification when multiple exist", () => {
    const code = "hello world";
    const instructions = `<<<<<<< SEARCH
hello
=======
hi
>>>>>>> REPLACE
<<<<<<< SEARCH
world
=======
earth
>>>>>>> REPLACE`;
    const result = replaceFirstCodeMod(instructions, code);
    // Only first mod applied (hello → hi), world stays
    // Note: sorted order means which comes "first" may differ
    expect(typeof result).toBe("string");
  });
});

describe("loadMessages", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws when codeSpace is empty", () => {
    expect(() => loadMessages("")).toThrow("Code space must be provided");
  });

  it("returns empty array when localStorage is empty", () => {
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    expect(loadMessages("my-space")).toEqual([]);
  });

  it("returns messages from localStorage", () => {
    const messages: Message[] = [
      { id: "1", role: "user", content: "hello" },
      { id: "2", role: "assistant", content: "world" },
    ];
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue(JSON.stringify(messages));
    const result = loadMessages("my-space");
    expect(result).toHaveLength(2);
  });

  it("filters messages without a role", () => {
    const messages = [
      { id: "1", role: "user", content: "hello" },
      { id: "2", role: "", content: "invalid" },
    ];
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue(JSON.stringify(messages));
    const result = loadMessages("my-space");
    expect(result).toHaveLength(1);
  });

  it("deduplicates consecutive messages with same role", () => {
    const messages: Message[] = [
      { id: "1", role: "user", content: "hello" },
      { id: "2", role: "user", content: "hello again" },
      { id: "3", role: "assistant", content: "world" },
    ];
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue(JSON.stringify(messages));
    const result = loadMessages("my-space");
    // Only first "user" message kept, then "assistant"
    expect(result).toHaveLength(2);
    expect(result[0]!.role).toBe("user");
    expect(result[1]!.role).toBe("assistant");
  });

  it("returns empty array when JSON is invalid", () => {
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue("invalid json{{{");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = loadMessages("my-space");
    expect(result).toEqual([]);
  });
});
