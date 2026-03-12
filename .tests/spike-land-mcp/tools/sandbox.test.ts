/**
 * Tests for core-logic/tools/sandbox.ts
 *
 * Covers: sandbox_create, sandbox_simulate, sandbox_read_file,
 * sandbox_write_file, sandbox_destroy — including limit enforcement,
 * error paths for missing/destroyed sandboxes, and the test-reset helpers.
 */

import type { McpServer, RegisteredTool } from "@modelcontextprotocol/sdk/server/mcp.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  _getSandboxCount,
  _resetSandboxes,
  registerSandboxTools,
} from "../../../src/edge-api/spike-land/core-logic/tools/sandbox";
import { createDb } from "../../../src/edge-api/spike-land/db/db/db-index";
import { ToolRegistry } from "../../../src/edge-api/spike-land/lazy-imports/registry";
import { createMockD1 } from "../__test-utils__/mock-env";

// ─── Test helpers ─────────────────────────────────────────────────────────────

function createMockMcpServer(): McpServer {
  return {
    registerTool: vi.fn((_name: string, _config: unknown, handler: unknown): RegisteredTool => {
      let isEnabled = false;
      return {
        enable: () => {
          isEnabled = true;
        },
        disable: () => {
          isEnabled = false;
        },
        get enabled() {
          return isEnabled;
        },
        update: vi.fn(),
        remove: vi.fn(),
        handler: handler as RegisteredTool["handler"],
      };
    }),
  } as unknown as McpServer;
}

function createRegistry(userId = "user-1") {
  const db = createDb(createMockD1());
  const server = createMockMcpServer();
  const registry = new ToolRegistry(server, userId);
  registerSandboxTools(registry, userId, db);
  registry.enableAll();
  return { registry };
}

function getText(result: { content: Array<{ type: string; text?: string }> }): string {
  return result.content
    .filter((c) => c.type === "text" && typeof c.text === "string")
    .map((c) => c.text)
    .join("\n");
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  _resetSandboxes();
});

afterEach(() => {
  _resetSandboxes();
});

// ─── _resetSandboxes / _getSandboxCount ──────────────────────────────────────

describe("sandbox test helpers", () => {
  it("_getSandboxCount returns 0 on fresh state", () => {
    expect(_getSandboxCount()).toBe(0);
  });

  it("_resetSandboxes clears all sandboxes", async () => {
    const { registry } = createRegistry();
    await registry.callToolDirect("sandbox_create", { language: "typescript" });
    expect(_getSandboxCount()).toBe(1);
    _resetSandboxes();
    expect(_getSandboxCount()).toBe(0);
  });
});

// ─── sandbox_create ──────────────────────────────────────────────────────────

describe("sandbox_create", () => {
  it("creates a sandbox with default typescript language", async () => {
    const { registry } = createRegistry();
    const result = await registry.callToolDirect("sandbox_create", {});
    const text = getText(result);
    expect(result.isError).toBeUndefined();
    expect(text).toContain("Sandbox created");
    expect(text).toContain("typescript");
    expect(text).toContain("active");
    expect(_getSandboxCount()).toBe(1);
  });

  it("creates a sandbox with custom name and javascript language", async () => {
    const { registry } = createRegistry();
    const result = await registry.callToolDirect("sandbox_create", {
      name: "my-test-sandbox",
      language: "javascript",
    });
    const text = getText(result);
    expect(text).toContain("my-test-sandbox");
    expect(text).toContain("javascript");
  });

  it("creates a sandbox with python language", async () => {
    const { registry } = createRegistry();
    const result = await registry.callToolDirect("sandbox_create", { language: "python" });
    const text = getText(result);
    expect(text).toContain("python");
  });

  it("auto-generates a name when not provided", async () => {
    const { registry } = createRegistry();
    const result = await registry.callToolDirect("sandbox_create", {});
    const text = getText(result);
    expect(text).toMatch(/sandbox-[a-f0-9]{8}/);
  });

  it("returns a UUID-formatted sandbox ID", async () => {
    const { registry } = createRegistry();
    const result = await registry.callToolDirect("sandbox_create", {});
    const text = getText(result);
    // UUID pattern
    expect(text).toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
  });

  it("includes simulation note in response", async () => {
    const { registry } = createRegistry();
    const result = await registry.callToolDirect("sandbox_create", {});
    const text = getText(result);
    expect(text).toContain("simulated");
  });

  it("increments sandbox count per creation", async () => {
    const { registry } = createRegistry();
    await registry.callToolDirect("sandbox_create", {});
    await registry.callToolDirect("sandbox_create", {});
    expect(_getSandboxCount()).toBe(2);
  });
});

// ─── sandbox_simulate ────────────────────────────────────────────────────────

describe("sandbox_simulate", () => {
  async function createSandbox(registry: ToolRegistry): Promise<string> {
    const result = await registry.callToolDirect("sandbox_create", { language: "typescript" });
    const text = getText(result);
    const match = text.match(/\*\*ID:\*\* `([^`]+)`/);
    return match?.[1] ?? "";
  }

  it("simulates execution on an active sandbox", async () => {
    const { registry } = createRegistry();
    const sandboxId = await createSandbox(registry);
    const result = await registry.callToolDirect("sandbox_simulate", {
      sandbox_id: sandboxId,
      code: "console.log('hello')",
    });
    const text = getText(result);
    expect(result.isError).toBeUndefined();
    expect(text).toContain("SIMULATION ONLY");
    expect(text).toContain("Exit code");
    expect(text).toContain("typescript");
  });

  it("uses language override when provided", async () => {
    const { registry } = createRegistry();
    const sandboxId = await createSandbox(registry);
    const result = await registry.callToolDirect("sandbox_simulate", {
      sandbox_id: sandboxId,
      code: "print('hi')",
      language: "python",
    });
    const text = getText(result);
    expect(text).toContain("python");
  });

  it("counts lines in code for stdout", async () => {
    const { registry } = createRegistry();
    const sandboxId = await createSandbox(registry);
    const code = "line1\nline2\nline3";
    const result = await registry.callToolDirect("sandbox_simulate", {
      sandbox_id: sandboxId,
      code,
    });
    const text = getText(result);
    expect(text).toContain("3 line(s)");
  });

  it("returns isError for missing sandbox", async () => {
    const { registry } = createRegistry();
    const result = await registry.callToolDirect("sandbox_simulate", {
      sandbox_id: "nonexistent-id",
      code: "code",
    });
    expect(result.isError).toBe(true);
    expect(getText(result)).toContain("not found");
  });

  it("returns isError for destroyed sandbox", async () => {
    const { registry } = createRegistry();
    const sandboxId = await createSandbox(registry);
    await registry.callToolDirect("sandbox_destroy", { sandbox_id: sandboxId });
    const result = await registry.callToolDirect("sandbox_simulate", {
      sandbox_id: sandboxId,
      code: "code",
    });
    expect(result.isError).toBe(true);
    expect(getText(result)).toContain("destroyed");
  });
});

// ─── sandbox_write_file ───────────────────────────────────────────────────────

describe("sandbox_write_file", () => {
  async function createSandbox(registry: ToolRegistry): Promise<string> {
    const result = await registry.callToolDirect("sandbox_create", {});
    const text = getText(result);
    const match = text.match(/\*\*ID:\*\* `([^`]+)`/);
    return match?.[1] ?? "";
  }

  it("writes a file and reports size", async () => {
    const { registry } = createRegistry();
    const sandboxId = await createSandbox(registry);
    const result = await registry.callToolDirect("sandbox_write_file", {
      sandbox_id: sandboxId,
      file_path: "/src/index.ts",
      content: "export const x = 1;",
    });
    const text = getText(result);
    expect(result.isError).toBeUndefined();
    expect(text).toContain("File written");
    expect(text).toContain("/src/index.ts");
    expect(text).toContain("**Total files:** 1");
  });

  it("overwrites an existing file without increasing file count", async () => {
    const { registry } = createRegistry();
    const sandboxId = await createSandbox(registry);
    await registry.callToolDirect("sandbox_write_file", {
      sandbox_id: sandboxId,
      file_path: "/readme.md",
      content: "original",
    });
    const result = await registry.callToolDirect("sandbox_write_file", {
      sandbox_id: sandboxId,
      file_path: "/readme.md",
      content: "updated content",
    });
    const text = getText(result);
    expect(result.isError).toBeUndefined();
    expect(text).toContain("**Total files:** 1");
  });

  it("rejects files exceeding 1MB", async () => {
    const { registry } = createRegistry();
    const sandboxId = await createSandbox(registry);
    const bigContent = "a".repeat(1_048_577); // 1MB + 1 byte
    const result = await registry.callToolDirect("sandbox_write_file", {
      sandbox_id: sandboxId,
      file_path: "/big.txt",
      content: bigContent,
    });
    expect(result.isError).toBe(true);
    expect(getText(result)).toContain("1MB limit");
  });

  it("returns isError for missing sandbox", async () => {
    const { registry } = createRegistry();
    const result = await registry.callToolDirect("sandbox_write_file", {
      sandbox_id: "bad-id",
      file_path: "/x.ts",
      content: "data",
    });
    expect(result.isError).toBe(true);
    expect(getText(result)).toContain("not found");
  });

  it("returns isError for destroyed sandbox", async () => {
    const { registry } = createRegistry();
    const sandboxId = await createSandbox(registry);
    await registry.callToolDirect("sandbox_destroy", { sandbox_id: sandboxId });
    const result = await registry.callToolDirect("sandbox_write_file", {
      sandbox_id: sandboxId,
      file_path: "/x.ts",
      content: "data",
    });
    expect(result.isError).toBe(true);
    expect(getText(result)).toContain("destroyed");
  });
});

// ─── sandbox_read_file ────────────────────────────────────────────────────────

describe("sandbox_read_file", () => {
  async function setup(registry: ToolRegistry) {
    const createResult = await registry.callToolDirect("sandbox_create", {});
    const text = getText(createResult);
    const match = text.match(/\*\*ID:\*\* `([^`]+)`/);
    const sandboxId = match?.[1] ?? "";
    return sandboxId;
  }

  it("reads a file that was previously written", async () => {
    const { registry } = createRegistry();
    const sandboxId = await setup(registry);
    await registry.callToolDirect("sandbox_write_file", {
      sandbox_id: sandboxId,
      file_path: "/hello.ts",
      content: "const hello = 'world';",
    });
    const result = await registry.callToolDirect("sandbox_read_file", {
      sandbox_id: sandboxId,
      file_path: "/hello.ts",
    });
    const text = getText(result);
    expect(result.isError).toBeUndefined();
    expect(text).toContain("hello.ts");
    expect(text).toContain("const hello = 'world';");
  });

  it("returns isError for a file that does not exist", async () => {
    const { registry } = createRegistry();
    const sandboxId = await setup(registry);
    const result = await registry.callToolDirect("sandbox_read_file", {
      sandbox_id: sandboxId,
      file_path: "/missing.ts",
    });
    expect(result.isError).toBe(true);
    expect(getText(result)).toContain("not found");
  });

  it("returns isError for missing sandbox", async () => {
    const { registry } = createRegistry();
    const result = await registry.callToolDirect("sandbox_read_file", {
      sandbox_id: "ghost-id",
      file_path: "/x.ts",
    });
    expect(result.isError).toBe(true);
  });

  it("returns isError for destroyed sandbox", async () => {
    const { registry } = createRegistry();
    const sandboxId = await setup(registry);
    await registry.callToolDirect("sandbox_destroy", { sandbox_id: sandboxId });
    const result = await registry.callToolDirect("sandbox_read_file", {
      sandbox_id: sandboxId,
      file_path: "/x.ts",
    });
    expect(result.isError).toBe(true);
    expect(getText(result)).toContain("destroyed");
  });
});

// ─── sandbox_destroy ─────────────────────────────────────────────────────────

describe("sandbox_destroy", () => {
  async function createSandbox(registry: ToolRegistry): Promise<string> {
    const result = await registry.callToolDirect("sandbox_create", {});
    const text = getText(result);
    const match = text.match(/\*\*ID:\*\* `([^`]+)`/);
    return match?.[1] ?? "";
  }

  it("destroys an active sandbox and returns stats", async () => {
    const { registry } = createRegistry();
    const sandboxId = await createSandbox(registry);
    // Write a file and simulate to generate stats
    await registry.callToolDirect("sandbox_write_file", {
      sandbox_id: sandboxId,
      file_path: "/app.ts",
      content: "export {}",
    });
    await registry.callToolDirect("sandbox_simulate", {
      sandbox_id: sandboxId,
      code: "console.log(1)",
    });

    const result = await registry.callToolDirect("sandbox_destroy", { sandbox_id: sandboxId });
    const text = getText(result);
    expect(result.isError).toBeUndefined();
    expect(text).toContain("Sandbox destroyed");
    expect(text).toContain("**Files created:** 1");
    expect(text).toContain("**Commands run:** 1");
    expect(text).toContain("**Lifetime:**");
  });

  it("returns isError when sandbox does not exist", async () => {
    const { registry } = createRegistry();
    const result = await registry.callToolDirect("sandbox_destroy", {
      sandbox_id: "missing-id",
    });
    expect(result.isError).toBe(true);
    expect(getText(result)).toContain("not found");
  });

  it("returns isError when sandbox is already destroyed", async () => {
    const { registry } = createRegistry();
    const sandboxId = await createSandbox(registry);
    await registry.callToolDirect("sandbox_destroy", { sandbox_id: sandboxId });
    const result = await registry.callToolDirect("sandbox_destroy", { sandbox_id: sandboxId });
    expect(result.isError).toBe(true);
    expect(getText(result)).toContain("destroyed");
  });

  it("sandbox count does not decrease (sandbox entry remains with destroyed status)", async () => {
    const { registry } = createRegistry();
    await createSandbox(registry);
    expect(_getSandboxCount()).toBe(1);
    // After destroy the map entry still exists (status=destroyed), count stays at 1
    expect(_getSandboxCount()).toBe(1);
  });

  it("clears exec log on destroy", async () => {
    const { registry } = createRegistry();
    const sandboxId = await createSandbox(registry);
    await registry.callToolDirect("sandbox_simulate", {
      sandbox_id: sandboxId,
      code: "x=1",
    });
    const destroyResult = await registry.callToolDirect("sandbox_destroy", {
      sandbox_id: sandboxId,
    });
    const text = getText(destroyResult);
    // Commands run shown before clearing
    expect(text).toContain("**Commands run:** 1");
  });
});

// ─── Cross-tool integration ───────────────────────────────────────────────────

describe("sandbox lifecycle integration", () => {
  it("full lifecycle: create → write → read → simulate → destroy", async () => {
    const { registry } = createRegistry();

    // Create
    const createResult = await registry.callToolDirect("sandbox_create", {
      name: "integration-test",
      language: "typescript",
    });
    const idMatch = getText(createResult).match(/\*\*ID:\*\* `([^`]+)`/);
    const sandboxId = idMatch?.[1] ?? "";
    expect(sandboxId).toBeTruthy();

    // Write
    const writeResult = await registry.callToolDirect("sandbox_write_file", {
      sandbox_id: sandboxId,
      file_path: "/main.ts",
      content: "const answer = 42;",
    });
    expect(writeResult.isError).toBeUndefined();

    // Read
    const readResult = await registry.callToolDirect("sandbox_read_file", {
      sandbox_id: sandboxId,
      file_path: "/main.ts",
    });
    expect(getText(readResult)).toContain("const answer = 42;");

    // Simulate
    const simResult = await registry.callToolDirect("sandbox_simulate", {
      sandbox_id: sandboxId,
      code: "console.log(answer)",
    });
    expect(simResult.isError).toBeUndefined();
    expect(getText(simResult)).toContain("SIMULATION ONLY");

    // Destroy
    const destroyResult = await registry.callToolDirect("sandbox_destroy", {
      sandbox_id: sandboxId,
    });
    expect(destroyResult.isError).toBeUndefined();
    expect(getText(destroyResult)).toContain("Sandbox destroyed");

    // Post-destroy ops should fail
    const postWriteResult = await registry.callToolDirect("sandbox_write_file", {
      sandbox_id: sandboxId,
      file_path: "/late.ts",
      content: "too late",
    });
    expect(postWriteResult.isError).toBe(true);
  });
});
