import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  shouldCompress,
  templateExtract,
  formatPrdAsMessage,
  compressMessage,
  compressWithModel,
  type CompressedPrd,
  type PrdCompressionConfig,
} from "../../core-logic/prd-compression.js";

describe("shouldCompress", () => {
  it("returns false for short messages", () => {
    expect(shouldCompress("Fix the login button")).toBe(false);
    expect(shouldCompress("Deploy to prod")).toBe(false);
  });

  it("returns false for already-structured messages with markdown headers", () => {
    const structured = `# Build user settings
## Requirements
- Mobile-first
- Use existing design system
## Acceptance criteria
- Settings persist across sessions`;
    expect(shouldCompress(structured)).toBe(false);
  });

  it("returns false for messages with bullet lists", () => {
    const bulleted = `Here is what I need done:
* First do X
* Then do Y
* Finally do Z and make sure it works with the existing system because we had issues before`;
    expect(shouldCompress(bulleted)).toBe(false);
  });

  it("returns true for long rambling messages", () => {
    const rambling =
      "So I was thinking about this thing where we need to build a settings page and it should probably have profile editing and maybe we should also add theme switching and oh yeah the email validation is broken right now too and we need to make sure it works on mobile because last time the layout was all messed up on smaller screens";
    expect(shouldCompress(rambling)).toBe(true);
  });

  it("returns true for verbose unstructured messages over threshold", () => {
    const verbose = "a ".repeat(150); // 300 chars, no structure
    expect(shouldCompress(verbose)).toBe(true);
  });
});

describe("templateExtract", () => {
  it("extracts 'fix' pattern as debugging intent", () => {
    const result = templateExtract("fix the broken authentication flow");
    expect(result).not.toBeNull();
    expect(result?.intent).toBe("debugging");
    expect(result?.task).toContain("fix the broken authentication flow");
  });

  it("extracts 'build' pattern as implementation intent", () => {
    const result = templateExtract("build a user settings page with profile editing");
    expect(result).not.toBeNull();
    expect(result?.intent).toBe("implementation");
  });

  it("extracts 'deploy' pattern as deployment intent", () => {
    const result = templateExtract("deploy the new worker to production");
    expect(result).not.toBeNull();
    expect(result?.intent).toBe("deployment");
  });

  it("extracts 'what is' pattern as query intent", () => {
    const result = templateExtract("what is the MCP registry used for");
    expect(result).not.toBeNull();
    expect(result?.intent).toBe("query");
  });

  it("extracts 'configure' pattern as configuration intent", () => {
    const result = templateExtract("configure the rate limiter for 100 requests per minute");
    expect(result).not.toBeNull();
    expect(result?.intent).toBe("configuration");
  });

  it("extracts 'analyze' pattern as analysis intent", () => {
    const result = templateExtract("analyze the API response times over the past week");
    expect(result).not.toBeNull();
    expect(result?.intent).toBe("analysis");
  });

  it("extracts 'write' pattern as creative intent", () => {
    const result = templateExtract("write a blog post about the new MCP tools");
    expect(result).not.toBeNull();
    expect(result?.intent).toBe("creative");
  });

  it("returns null for unrecognized patterns", () => {
    expect(templateExtract("hello there")).toBeNull();
    expect(templateExtract("I think we should maybe consider")).toBeNull();
  });

  it("defaults to normal priority and empty arrays", () => {
    const result = templateExtract("fix the login bug");
    expect(result).not.toBeNull();
    expect(result?.priority).toBe("normal");
    expect(result?.constraints).toEqual([]);
    expect(result?.acceptance).toEqual([]);
    expect(result?.context).toBe("");
  });
});

describe("formatPrdAsMessage", () => {
  it("formats a minimal PRD", () => {
    const prd: CompressedPrd = {
      intent: "implementation",
      task: "Build user settings page",
      constraints: [],
      acceptance: [],
      context: "",
      priority: "normal",
    };

    const formatted = formatPrdAsMessage(prd);
    expect(formatted).toContain("[PRD] intent=implementation | priority=normal");
    expect(formatted).toContain("Task: Build user settings page");
    expect(formatted).not.toContain("Constraints:");
    expect(formatted).not.toContain("Acceptance:");
    expect(formatted).not.toContain("Context:");
  });

  it("formats a full PRD with all fields", () => {
    const prd: CompressedPrd = {
      intent: "implementation",
      task: "Build user settings page with profile editing",
      constraints: ["Mobile-first", "Use existing design system"],
      acceptance: ["Settings persist across sessions", "Validates email"],
      context: "Existing /settings route returns 404",
      priority: "high",
    };

    const formatted = formatPrdAsMessage(prd);
    expect(formatted).toContain("[PRD] intent=implementation | priority=high");
    expect(formatted).toContain("Task: Build user settings page with profile editing");
    expect(formatted).toContain("Constraints: Mobile-first; Use existing design system");
    expect(formatted).toContain("Acceptance: Settings persist across sessions; Validates email");
    expect(formatted).toContain("Context: Existing /settings route returns 404");
  });

  it("produces fewer tokens than a verbose original message", () => {
    const prd: CompressedPrd = {
      intent: "implementation",
      task: "Build user settings page",
      constraints: ["Mobile-first"],
      acceptance: ["Settings persist"],
      context: "",
      priority: "normal",
    };

    const formatted = formatPrdAsMessage(prd);
    const verboseOriginal =
      "So I was thinking we need to build a user settings page and it should be mobile-first and the settings should persist across sessions and we should use the existing design system";
    expect(formatted.length).toBeLessThan(verboseOriginal.length);
  });
});

describe("compressMessage", () => {
  it("returns passthrough when mode is 'never'", async () => {
    const config: PrdCompressionConfig = { mode: "never" };
    const result = await compressMessage("fix the broken authentication flow", config);

    expect(result.compressed).toBe(false);
    expect(result.tier).toBe("passthrough");
    expect(result.prd).toBeNull();
    expect(result.formattedMessage).toBe("fix the broken authentication flow");
  });

  it("returns passthrough for short messages in auto mode", async () => {
    const config: PrdCompressionConfig = { mode: "auto" };
    const result = await compressMessage("fix the login bug", config);

    expect(result.compressed).toBe(false);
    expect(result.tier).toBe("passthrough");
  });

  it("uses template extraction in auto mode for matching patterns", async () => {
    const config: PrdCompressionConfig = { mode: "auto" };
    const longMessage =
      "build a comprehensive user settings page with profile editing capabilities and theme switching and notification preferences and all the things a modern settings page needs plus we should probably also add dark mode support and maybe some accessibility features too";
    const result = await compressMessage(longMessage, config);

    expect(result.compressed).toBe(true);
    expect(result.tier).toBe("template");
    expect(result.prd).not.toBeNull();
    expect(result.prd?.intent).toBe("implementation");
  });

  it("uses template extraction in always mode even for short messages", async () => {
    const config: PrdCompressionConfig = { mode: "always" };
    const result = await compressMessage("fix the login bug", config);

    expect(result.compressed).toBe(true);
    expect(result.tier).toBe("template");
    expect(result.prd?.intent).toBe("debugging");
  });

  it("falls through to passthrough when no template matches and no API key", async () => {
    const config: PrdCompressionConfig = { mode: "always" };
    const result = await compressMessage(
      "I think we should reconsider the whole approach to this because reasons",
      config,
    );

    expect(result.compressed).toBe(false);
    expect(result.tier).toBe("passthrough");
  });
});

describe("compressWithModel (Tier 3)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a CompressedPrd on successful Gemini response", async () => {
    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  intent: "implementation",
                  task: "Build user settings page",
                  constraints: ["Mobile-first"],
                  acceptance: ["Settings persist"],
                  context: "Route returns 404",
                  priority: "high",
                }),
              },
            ],
          },
        },
      ],
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), { status: 200 }),
    );

    const result = await compressWithModel("some long message", "fake-key");
    expect(result).not.toBeNull();
    expect(result?.intent).toBe("implementation");
    expect(result?.task).toBe("Build user settings page");
    expect(result?.priority).toBe("high");
  });

  it("returns null on API error (500)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Internal Server Error", { status: 500 }),
    );

    const result = await compressWithModel("some message", "fake-key");
    expect(result).toBeNull();
  });

  it("returns null on malformed JSON response", async () => {
    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [{ text: "This is not JSON at all" }],
          },
        },
      ],
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), { status: 200 }),
    );

    const result = await compressWithModel("some message", "fake-key");
    expect(result).toBeNull();
  });

  it("returns null on network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));

    const result = await compressWithModel("some message", "fake-key");
    expect(result).toBeNull();
  });

  it("handles markdown-wrapped JSON response", async () => {
    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text:
                  "```json\n" +
                  JSON.stringify({
                    intent: "debugging",
                    task: "Fix login flow",
                    constraints: [],
                    acceptance: [],
                    context: "",
                    priority: "critical",
                  }) +
                  "\n```",
              },
            ],
          },
        },
      ],
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), { status: 200 }),
    );

    const result = await compressWithModel("some message", "fake-key");
    expect(result).not.toBeNull();
    expect(result?.intent).toBe("debugging");
    expect(result?.priority).toBe("critical");
  });
});
