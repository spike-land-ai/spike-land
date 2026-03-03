import { describe, expect, it } from "vitest";
import { createMemoryAdapter } from "@spike-land-ai/block-sdk/storage";

describe("createMemoryAdapter", () => {
  describe("KV", () => {
    it("returns null for missing keys", async () => {
      const adapter = createMemoryAdapter();
      expect(await adapter.kv.get("nope")).toBeNull();
    });

    it("puts and gets values", async () => {
      const adapter = createMemoryAdapter();
      await adapter.kv.put("key1", { name: "alice" });
      expect(await adapter.kv.get("key1")).toEqual({ name: "alice" });
    });

    it("deletes keys", async () => {
      const adapter = createMemoryAdapter();
      await adapter.kv.put("key1", "value");
      expect(await adapter.kv.delete("key1")).toBe(true);
      expect(await adapter.kv.get("key1")).toBeNull();
    });

    it("lists with prefix filter", async () => {
      const adapter = createMemoryAdapter();
      await adapter.kv.put("user:1", "alice");
      await adapter.kv.put("user:2", "bob");
      await adapter.kv.put("task:1", "cleanup");

      const users = await adapter.kv.list("user:");
      expect(users).toHaveLength(2);
      expect(users.map((e) => e.key).sort()).toEqual(["user:1", "user:2"]);
    });

    it("lists all when no prefix", async () => {
      const adapter = createMemoryAdapter();
      await adapter.kv.put("a", 1);
      await adapter.kv.put("b", 2);
      const all = await adapter.kv.list();
      expect(all).toHaveLength(2);
    });
  });

  describe("SQL", () => {
    it("creates tables", async () => {
      const adapter = createMemoryAdapter();
      const result = await adapter.sql.execute(
        "CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, title TEXT NOT NULL)",
      );
      expect(result.rowsAffected).toBe(0);
    });

    it("inserts and selects rows", async () => {
      const adapter = createMemoryAdapter();
      await adapter.sql.execute("CREATE TABLE tasks (id TEXT PRIMARY KEY, title TEXT)");
      await adapter.sql.execute(
        "INSERT INTO tasks (id, title) VALUES (?, ?)",
        ["1", "Buy milk"],
      );
      const result = await adapter.sql.execute("SELECT * FROM tasks");
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual({ id: "1", title: "Buy milk" });
    });

    it("filters with WHERE clause", async () => {
      const adapter = createMemoryAdapter();
      await adapter.sql.execute("CREATE TABLE tasks (id TEXT, status TEXT)");
      await adapter.sql.execute("INSERT INTO tasks (id, status) VALUES (?, ?)", ["1", "pending"]);
      await adapter.sql.execute("INSERT INTO tasks (id, status) VALUES (?, ?)", ["2", "done"]);

      const result = await adapter.sql.execute(
        "SELECT * FROM tasks WHERE status = ?",
        ["pending"],
      );
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual({ id: "1", status: "pending" });
    });

    it("updates rows with WHERE conditions", async () => {
      const adapter = createMemoryAdapter();
      await adapter.sql.execute("CREATE TABLE tasks (id TEXT, status TEXT, assignee TEXT)");
      await adapter.sql.execute(
        "INSERT INTO tasks (id, status, assignee) VALUES (?, ?, ?)",
        ["1", "pending", ""],
      );

      const result = await adapter.sql.execute(
        "UPDATE tasks SET status = ?, assignee = ? WHERE id = ? AND status = ?",
        ["claimed", "alice", "1", "pending"],
      );
      expect(result.rowsAffected).toBe(1);

      const check = await adapter.sql.execute("SELECT * FROM tasks WHERE id = ?", ["1"]);
      expect(check.rows[0]).toEqual({ id: "1", status: "claimed", assignee: "alice" });
    });

    it("returns 0 rows affected when no match for UPDATE", async () => {
      const adapter = createMemoryAdapter();
      await adapter.sql.execute("CREATE TABLE tasks (id TEXT, status TEXT)");
      await adapter.sql.execute("INSERT INTO tasks (id, status) VALUES (?, ?)", ["1", "done"]);

      const result = await adapter.sql.execute(
        "UPDATE tasks SET status = ? WHERE id = ? AND status = ?",
        ["claimed", "1", "pending"],
      );
      expect(result.rowsAffected).toBe(0);
    });

    it("deletes rows", async () => {
      const adapter = createMemoryAdapter();
      await adapter.sql.execute("CREATE TABLE tasks (id TEXT, title TEXT)");
      await adapter.sql.execute("INSERT INTO tasks (id, title) VALUES (?, ?)", ["1", "A"]);
      await adapter.sql.execute("INSERT INTO tasks (id, title) VALUES (?, ?)", ["2", "B"]);

      const result = await adapter.sql.execute("DELETE FROM tasks WHERE id = ?", ["1"]);
      expect(result.rowsAffected).toBe(1);

      const remaining = await adapter.sql.execute("SELECT * FROM tasks");
      expect(remaining.rows).toHaveLength(1);
      expect(remaining.rows[0]).toEqual({ id: "2", title: "B" });
    });

    it("batch executes multiple queries", async () => {
      const adapter = createMemoryAdapter();
      await adapter.sql.execute("CREATE TABLE items (id TEXT, name TEXT)");

      const results = await adapter.sql.batch([
        { query: "INSERT INTO items (id, name) VALUES (?, ?)", params: ["1", "apple"] },
        { query: "INSERT INTO items (id, name) VALUES (?, ?)", params: ["2", "banana"] },
      ]);
      expect(results).toHaveLength(2);
      expect(results[0]!.rowsAffected).toBe(1);

      const all = await adapter.sql.execute("SELECT * FROM items");
      expect(all.rows).toHaveLength(2);
    });

    it("throws on unsupported SQL", async () => {
      const adapter = createMemoryAdapter();
      await expect(
        adapter.sql.execute("ALTER TABLE foo ADD COLUMN bar TEXT"),
      ).rejects.toThrow("Unsupported SQL statement");
    });

    it("drops tables", async () => {
      const adapter = createMemoryAdapter();
      await adapter.sql.execute("CREATE TABLE temp (id TEXT)");
      await adapter.sql.execute("INSERT INTO temp (id) VALUES (?)", ["1"]);
      await adapter.sql.execute("DROP TABLE IF EXISTS temp");

      // Table should be gone — re-select returns empty (new table)
      await adapter.sql.execute("CREATE TABLE temp (id TEXT)");
      const result = await adapter.sql.execute("SELECT * FROM temp");
      expect(result.rows).toHaveLength(0);
    });
  });

  describe("Blobs", () => {
    it("puts and gets ArrayBuffer", async () => {
      const adapter = createMemoryAdapter();
      const data = new TextEncoder().encode("hello").buffer;
      await adapter.blobs!.put("file1", data);
      const result = await adapter.blobs!.get("file1");
      expect(new TextDecoder().decode(result!)).toBe("hello");
    });

    it("puts Uint8Array", async () => {
      const adapter = createMemoryAdapter();
      const data = new TextEncoder().encode("world");
      await adapter.blobs!.put("file2", data);
      const result = await adapter.blobs!.get("file2");
      expect(result).not.toBeNull();
      expect(new TextDecoder().decode(result!)).toBe("world");
    });

    it("returns null for missing blobs", async () => {
      const adapter = createMemoryAdapter();
      expect(await adapter.blobs!.get("nope")).toBeNull();
    });

    it("deletes blobs", async () => {
      const adapter = createMemoryAdapter();
      await adapter.blobs!.put("f", new Uint8Array([1, 2, 3]));
      expect(await adapter.blobs!.delete("f")).toBe(true);
      expect(await adapter.blobs!.get("f")).toBeNull();
    });

    it("lists blobs with prefix", async () => {
      const adapter = createMemoryAdapter();
      await adapter.blobs!.put("img/1.png", new Uint8Array([1]));
      await adapter.blobs!.put("img/2.png", new Uint8Array([2]));
      await adapter.blobs!.put("doc/1.pdf", new Uint8Array([3]));

      const imgs = await adapter.blobs!.list("img/");
      expect(imgs.sort()).toEqual(["img/1.png", "img/2.png"]);
    });
  });
});
