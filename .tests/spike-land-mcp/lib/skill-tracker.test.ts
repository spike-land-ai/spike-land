/**
 * Tests for lib/skill-tracker.ts
 */
import { describe, expect, it, vi } from "vitest";
import { recordSkillCall } from "../../../src/spike-land-mcp/lib/skill-tracker";

function createMockD1WithCapture() {
  const batches: unknown[][] = [];

  const db = {
    prepare: (sql: string) => {
      let boundValues: unknown[] = [];
      const stmt = {
        bind: (...values: unknown[]) => {
          boundValues = values;
          return stmt;
        },
        all: async () => ({ results: [], success: true, meta: {} }),
        run: async () => ({ results: [], success: true, meta: {} }),
        first: async () => null,
        raw: async () => [],
        _sql: sql,
        get _boundValues() { return boundValues; },
      };
      return stmt;
    },
    batch: async (stmts: unknown[]) => {
      batches.push(stmts);
      return stmts.map(() => ({ results: [], success: true, meta: {} }));
    },
    dump: async () => new ArrayBuffer(0),
    exec: async () => ({ count: 0, duration: 0 }),
  } as unknown as D1Database;

  return { db, batches };
}

describe("recordSkillCall", () => {
  it("calls db.batch with 3 statements for a successful call", async () => {
    const { db, batches } = createMockD1WithCapture();

    await recordSkillCall(db, {
      userId: "user-1",
      toolName: "search_tools",
      serverName: "spike-land-mcp",
      outcome: "success",
      durationMs: 123,
      category: "gateway-meta",
    });

    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(3);
  });

  it("calls db.batch with 3 statements for an error outcome", async () => {
    const { db, batches } = createMockD1WithCapture();

    await recordSkillCall(db, {
      userId: "user-2",
      toolName: "list_files",
      serverName: "spike-land-mcp",
      outcome: "error",
      durationMs: 55,
      errorMessage: "Permission denied",
    });

    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(3);
  });

  it("works without optional category and errorMessage", async () => {
    const { db, batches } = createMockD1WithCapture();

    await recordSkillCall(db, {
      userId: "user-3",
      toolName: "get_status",
      serverName: "spike-land-mcp",
      outcome: "success",
      durationMs: 10,
    });

    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(3);
  });

  it("does not throw when batch fails", async () => {
    const db = {
      prepare: () => ({
        bind: () => ({}),
      }),
      batch: vi.fn().mockRejectedValue(new Error("D1 error")),
    } as unknown as D1Database;

    await expect(
      recordSkillCall(db, {
        userId: "user-4",
        toolName: "tool",
        serverName: "server",
        outcome: "success",
        durationMs: 0,
      }),
    ).rejects.toThrow("D1 error");
  });
});
