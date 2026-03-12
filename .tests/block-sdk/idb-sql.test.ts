// @vitest-environment node
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

/**
 * Tests for the sql.js-backed IDB SQL adapter.
 *
 * Uses Node.js environment with WASM loaded from local file.
 * Tests sql.js SQL execution: ORDER BY, LIMIT, WHERE OR, column SELECT.
 * Full IDB integration testing requires a browser environment.
 */

const _require = createRequire(import.meta.url);
const sqlJsDir = path.dirname(_require.resolve("sql.js"));
const wasmBinary = fs.readFileSync(path.join(sqlJsDir, "sql-wasm.wasm"));

describe("sql.js SQL execution (unit tests)", () => {
  let db: import("sql.js").Database;

  beforeEach(async () => {
    const initSqlJs = (await import("sql.js")).default;
    const SQL = await initSqlJs({ wasmBinary });
    db = new SQL.Database();
    db.run(`
      CREATE TABLE tasks (
        id TEXT PRIMARY KEY,
        title TEXT,
        status TEXT,
        priority INTEGER
      )
    `);
    const stmt = db.prepare("INSERT INTO tasks (id, title, status, priority) VALUES (?, ?, ?, ?)");
    stmt.run(["t1", "Write docs", "done", 1]);
    stmt.run(["t2", "Fix bug", "open", 3]);
    stmt.run(["t3", "Add feature", "open", 2]);
    stmt.run(["t4", "Review PR", "done", 2]);
    stmt.run(["t5", "Deploy", "blocked", 5]);
    stmt.free();
  });

  afterEach(() => {
    db.close();
  });

  it("ORDER BY queries work correctly", () => {
    const result = db.exec("SELECT * FROM tasks ORDER BY priority ASC");
    expect(result).toHaveLength(1);
    const priorities = result[0]?.values.map((r) => r[3]);
    expect(priorities).toEqual([1, 2, 2, 3, 5]);
  });

  it("ORDER BY DESC works", () => {
    const result = db.exec("SELECT * FROM tasks ORDER BY priority DESC");
    const priorities = result[0]?.values.map((r) => r[3]);
    expect(priorities).toEqual([5, 3, 2, 2, 1]);
  });

  it("LIMIT queries work", () => {
    const result = db.exec("SELECT * FROM tasks ORDER BY priority DESC LIMIT 2");
    expect(result[0]?.values).toHaveLength(2);
    expect(result[0]?.values[0]?.[3]).toBe(5);
  });

  it("WHERE with OR conditions", () => {
    const result = db.exec("SELECT * FROM tasks WHERE status = ? OR status = ?", [
      "open",
      "blocked",
    ]);
    expect(result[0]?.values).toHaveLength(3);
    const statuses = result[0]?.values.map((r) => r[2]);
    expect(statuses).toContain("open");
    expect(statuses).toContain("blocked");
  });

  it("column-specific SELECT (not just SELECT *)", () => {
    const result = db.exec("SELECT id, title FROM tasks WHERE status = ?", ["done"]);
    expect(result[0]?.columns).toEqual(["id", "title"]);
    expect(result[0]?.values).toHaveLength(2);
    expect(result[0]?.values[0]).toHaveLength(2);
  });

  it("INSERT + SELECT round-trip", () => {
    db.run("INSERT INTO tasks (id, title, status, priority) VALUES (?, ?, ?, ?)", [
      "t6",
      "New task",
      "open",
      10,
    ]);
    const result = db.exec("SELECT * FROM tasks WHERE id = ?", ["t6"]);
    expect(result[0]?.values).toHaveLength(1);
    expect(result[0]?.values[0]?.[1]).toBe("New task");
  });

  it("CREATE TABLE IF NOT EXISTS is idempotent", () => {
    expect(() => {
      db.run("CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, title TEXT)");
    }).not.toThrow();
    const result = db.exec("SELECT COUNT(*) FROM tasks");
    expect(result[0]?.values[0]?.[0]).toBe(5);
  });

  it("UPDATE modifies rows and returns affected count", () => {
    db.run("UPDATE tasks SET status = ? WHERE status = ?", ["closed", "done"]);
    const affected = db.getRowsModified();
    expect(affected).toBe(2);
    const result = db.exec("SELECT * FROM tasks WHERE status = ?", ["closed"]);
    expect(result[0]?.values).toHaveLength(2);
  });

  it("DELETE removes rows", () => {
    db.run("DELETE FROM tasks WHERE status = ?", ["blocked"]);
    const affected = db.getRowsModified();
    expect(affected).toBe(1);
    const result = db.exec("SELECT COUNT(*) FROM tasks");
    expect(result[0]?.values[0]?.[0]).toBe(4);
  });

  it("complex query: WHERE + ORDER BY + LIMIT", () => {
    const result = db.exec(
      "SELECT id, title FROM tasks WHERE status = ? ORDER BY priority DESC LIMIT 1",
      ["open"],
    );
    expect(result[0]?.values).toHaveLength(1);
    expect(result[0]?.values[0]?.[0]).toBe("t2");
  });
});
