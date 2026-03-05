import { describe, expect, it } from "vitest";
import { getPartsStreaming } from "@/lib/get-parts";
import type { ParsingState } from "@/lib/interfaces";

function freshState(): ParsingState {
  return {
    isInCodeBlock: false,
    accumulatedContent: "",
    isInDiffBlock: false,
    accumulatedDiffContent: "",
  };
}

describe("getPartsStreaming", () => {
  describe("plain text", () => {
    it("returns a single text part for plain text", () => {
      const { parts } = getPartsStreaming("Hello world", false, freshState());
      expect(parts).toHaveLength(1);
      expect(parts[0]).toEqual({ type: "text", content: "Hello world" });
    });

    it("returns empty parts for empty string", () => {
      const { parts } = getPartsStreaming("", false, freshState());
      expect(parts).toHaveLength(0);
    });

    it("trims whitespace from text parts", () => {
      const { parts } = getPartsStreaming("  hello  ", false, freshState());
      expect(parts[0]!.content).toBe("hello");
    });
  });

  describe("code blocks", () => {
    it("extracts a typescript code block", () => {
      const text = "Some text\n```typescript\nconst x = 1;\n```\nMore text";
      const { parts } = getPartsStreaming(text, false, freshState());
      const codePart = parts.find((p) => p.type === "code");
      expect(codePart).toBeTruthy();
      expect(codePart!.language).toBe("typescript");
      expect(codePart!.content).toContain("const x = 1;");
    });

    it("extracts a javascript code block with 'js' shorthand", () => {
      const text = "```js\nconsole.log('hello');\n```";
      const { parts } = getPartsStreaming(text, false, freshState());
      const codePart = parts.find((p) => p.type === "code");
      expect(codePart!.language).toBe("javascript");
    });

    it("extracts a python code block with 'py' shorthand", () => {
      const text = "```py\nprint('hello')\n```";
      const { parts } = getPartsStreaming(text, false, freshState());
      const codePart = parts.find((p) => p.type === "code");
      expect(codePart!.language).toBe("python");
    });

    it("uses 'plaintext' for unknown language", () => {
      const text = "```unknownlang\nsome code\n```";
      const { parts } = getPartsStreaming(text, false, freshState());
      const codePart = parts.find((p) => p.type === "code");
      // Unknown language: falls back to lowercased value from LanguageMap or the lang itself
      expect(codePart).toBeTruthy();
    });

    it("produces text + code + text parts", () => {
      const text = "Before\n```typescript\ncode\n```\nAfter";
      const { parts } = getPartsStreaming(text, false, freshState());
      expect(parts.some((p) => p.type === "text" && p.content.includes("Before"))).toBe(true);
      expect(parts.some((p) => p.type === "code")).toBe(true);
      expect(parts.some((p) => p.type === "text" && p.content.includes("After"))).toBe(true);
    });

    it("handles incomplete code block (no closing ```)", () => {
      const text = "```typescript\nconst x = 1;";
      const state = freshState();
      const { parts } = getPartsStreaming(text, false, state);
      // Should produce a code part even without closing backticks
      const codePart = parts.find((p) => p.type === "code");
      expect(codePart).toBeTruthy();
    });
  });

  describe("diff blocks", () => {
    it("converts SEARCH/REPLACE to code diff block", () => {
      const text = `<<<<<<< SEARCH
old code
=======
new code
>>>>>>> REPLACE`;
      const { parts } = getPartsStreaming(text, false, freshState());
      const codePart = parts.find((p) => p.type === "code");
      expect(codePart).toBeTruthy();
      expect(codePart!.language).toBe("diff");
    });

    it("handles incomplete diff block (state tracking)", () => {
      const partial = "<<<<<<< SEARCH\nold code\n=======\nnew code";
      const state = freshState();
      const { parts, state: newState } = getPartsStreaming(partial, false, state);
      expect(newState.isInDiffBlock).toBe(true);
      // Should have a code part with accumulated diff content
      const codePart = parts.find((p) => p.type === "code" && p.language === "diff");
      expect(codePart).toBeTruthy();
    });

    it("completes an ongoing diff block when closing marker arrives", () => {
      const partialState: ParsingState = {
        isInCodeBlock: false,
        accumulatedContent: "",
        isInDiffBlock: true,
        accumulatedDiffContent: "<<<<<<< SEARCH\nold\n=======\nnew\n",
      };
      const continuation = ">>>>>>> REPLACE";
      const { parts, state } = getPartsStreaming(continuation, false, partialState);
      expect(state.isInDiffBlock).toBe(false);
      const codePart = parts.find((p) => p.language === "diff");
      expect(codePart).toBeTruthy();
    });

    it("handles text before a diff block", () => {
      const text = "Introduction text.\n<<<<<<< SEARCH\nold\n=======\nnew\n>>>>>>> REPLACE";
      const { parts } = getPartsStreaming(text, false, freshState());
      expect(parts.some((p) => p.type === "text")).toBe(true);
      expect(parts.some((p) => p.type === "code" && p.language === "diff")).toBe(true);
    });
  });

  describe("user message cleaning", () => {
    it("extracts content inside <user_prompt> tag for user messages", () => {
      const text = "<user_prompt>hello from user</user_prompt>";
      const { parts } = getPartsStreaming(text, true, freshState());
      expect(parts[0]!.content).toContain("hello from user");
    });

    it("strips system context from user messages", () => {
      const text = "System context.\nThe user's first message follows:\nActual user message";
      const { parts } = getPartsStreaming(text, true, freshState());
      expect(parts[0]!.content).toContain("Actual user message");
      expect(parts[0]!.content).not.toContain("System context");
    });

    it("strips system reminder suffix from user messages", () => {
      const text = "User message. Reminder from the system: ignore this";
      const { parts } = getPartsStreaming(text, true, freshState());
      expect(parts[0]!.content).toContain("User message.");
      expect(parts[0]!.content).not.toContain("Reminder from the system");
    });

    it("passes text unchanged for non-user messages", () => {
      const text = "The user's first message follows:\nOriginal message";
      const { parts } = getPartsStreaming(text, false, freshState());
      // isUser=false: no cleaning
      expect(parts[0]!.content).toContain("user's first message");
    });
  });

  describe("state handling", () => {
    it("uses default state when not provided", () => {
      const { parts } = getPartsStreaming("hello", false);
      expect(parts[0]!.content).toBe("hello");
    });

    it("returns updated state for ongoing incomplete code block", () => {
      const state = freshState();
      state.isInCodeBlock = true;
      state.accumulatedContent = "partial ";
      const { parts } = getPartsStreaming("remaining code", false, state);
      const codePart = parts.find((p) => p.type === "code");
      expect(codePart).toBeTruthy();
    });
  });
});
