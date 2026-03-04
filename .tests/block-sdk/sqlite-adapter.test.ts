import { describe, expect, it, beforeEach } from "vitest";
import { sqliteAdapter } from "../../src/block-sdk/adapters/sqlite.js";
import type { StorageAdapter } from "../../src/block-sdk/storage/types.js";

describe("SQLite StorageAdapter", () => {
  let adapter: StorageAdapter;

  beforeEach(() => {
    adapter = sqliteAdapter(); // in-memory
  });

  describe("WAL mode", () => {
    it("should have WAL journal mode active for file-based databases", async () => {
      const os = await import("node:os");
      const path = await import("node:path");
      const fs = await import("node:fs");
      const dbPath = path.join(os.tmpdir(), `test-wal-${Date.now()}.db`);
      try {
        const fileAdapter = sqliteAdapter({ path: dbPath });
        const result = await fileAdapter.sql.execute<{ journal_mode: string }>(
          "PRAGMA journal_mode",
        );
        expect(result.rows[0]!.journal_mode).toBe("wal");
      } finally {
        // Clean up temp files
        for (const suffix of ["", "-wal", "-shm"]) {
          try { fs.unlinkSync(dbPath + suffix); } catch {}
        }
      }
    });

    it("should report memory journal mode for in-memory databases", async () => {
      const result = await adapter.sql.execute<{ journal_mode: string }>(
        "PRAGMA journal_mode",
      );
      expect(result.rows[0]!.journal_mode).toBe("memory");
    });
  });

  describe("KV adapter", () => {
    it("should return null for missing key", async () => {
      expect(await adapter.kv.get("missing")).toBeNull();
    });

    it("should put and get a value", async () => {
      await adapter.kv.put("key1", { hello: "world" });
      expect(await adapter.kv.get("key1")).toEqual({ hello: "world" });
    });

    it("should overwrite existing key", async () => {
      await adapter.kv.put("key1", "v1");
      await adapter.kv.put("key1", "v2");
      expect(await adapter.kv.get("key1")).toBe("v2");
    });

    it("should delete a key and return true", async () => {
      await adapter.kv.put("key1", "val");
      expect(await adapter.kv.delete("key1")).toBe(true);
      expect(await adapter.kv.get("key1")).toBeNull();
    });

    it("should return false when deleting non-existent key", async () => {
      expect(await adapter.kv.delete("nope")).toBe(false);
    });

    it("should list all keys", async () => {
      await adapter.kv.put("a:1", 1);
      await adapter.kv.put("a:2", 2);
      await adapter.kv.put("b:1", 3);
      const all = await adapter.kv.list();
      expect(all).toHaveLength(3);
    });

    it("should list keys with prefix", async () => {
      await adapter.kv.put("user:1", { name: "Alice" });
      await adapter.kv.put("user:2", { name: "Bob" });
      await adapter.kv.put("post:1", { title: "Hello" });
      const users = await adapter.kv.list("user:");
      expect(users).toHaveLength(2);
      expect(users.map((e) => e.key)).toEqual(["user:1", "user:2"]);
    });
  });

  describe("SQL adapter", () => {
    it("should execute CREATE TABLE and INSERT", async () => {
      await adapter.sql.execute(
        "CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT NOT NULL)",
      );
      const result = await adapter.sql.execute(
        "INSERT INTO items (id, name) VALUES (?, ?)",
        [1, "foo"],
      );
      expect(result.rowsAffected).toBe(1);
    });

    it("should execute SELECT", async () => {
      await adapter.sql.execute(
        "CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT)",
      );
      await adapter.sql.execute("INSERT INTO items (id, name) VALUES (?, ?)", [
        1,
        "foo",
      ]);
      await adapter.sql.execute("INSERT INTO items (id, name) VALUES (?, ?)", [
        2,
        "bar",
      ]);
      const result = await adapter.sql.execute<{ id: number; name: string }>(
        "SELECT * FROM items",
      );
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]!.name).toBe("foo");
    });

    it("should execute UPDATE", async () => {
      await adapter.sql.execute("CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT)");
      await adapter.sql.execute("INSERT INTO items (id, name) VALUES (?, ?)", [1, "foo"]);
      const result = await adapter.sql.execute(
        "UPDATE items SET name = ? WHERE id = ?",
        ["bar", 1],
      );
      expect(result.rowsAffected).toBe(1);
      const check = await adapter.sql.execute<{ name: string }>(
        "SELECT name FROM items WHERE id = ?",
        [1],
      );
      expect(check.rows[0]!.name).toBe("bar");
    });

    it("should execute DELETE", async () => {
      await adapter.sql.execute("CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT)");
      await adapter.sql.execute("INSERT INTO items (id, name) VALUES (?, ?)", [1, "foo"]);
      const result = await adapter.sql.execute("DELETE FROM items WHERE id = ?", [1]);
      expect(result.rowsAffected).toBe(1);
    });

    it("should support ORDER BY and LIMIT", async () => {
      await adapter.sql.execute("CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT)");
      await adapter.sql.execute("INSERT INTO items (id, name) VALUES (?, ?)", [1, "c"]);
      await adapter.sql.execute("INSERT INTO items (id, name) VALUES (?, ?)", [2, "a"]);
      await adapter.sql.execute("INSERT INTO items (id, name) VALUES (?, ?)", [3, "b"]);

      const result = await adapter.sql.execute<{ name: string }>(
        "SELECT name FROM items ORDER BY name ASC LIMIT 2",
      );
      expect(result.rows.map((r) => r.name)).toEqual(["a", "b"]);
    });

    it("should enforce foreign key constraints", async () => {
      await adapter.sql.execute(
        "CREATE TABLE parents (id INTEGER PRIMARY KEY, name TEXT NOT NULL)",
      );
      await adapter.sql.execute(
        "CREATE TABLE children (id INTEGER PRIMARY KEY, parent_id INTEGER NOT NULL REFERENCES parents(id))",
      );

      await expect(
        adapter.sql.execute("INSERT INTO children (id, parent_id) VALUES (?, ?)", [1, 999]),
      ).rejects.toThrow();
    });

    it("should batch queries in a transaction", async () => {
      await adapter.sql.execute("CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT)");

      const results = await adapter.sql.batch([
        { query: "INSERT INTO items (id, name) VALUES (?, ?)", params: [1, "a"] },
        { query: "INSERT INTO items (id, name) VALUES (?, ?)", params: [2, "b"] },
        { query: "SELECT * FROM items" },
      ]);

      expect(results).toHaveLength(3);
      expect(results[0]!.rowsAffected).toBe(1);
      expect(results[1]!.rowsAffected).toBe(1);
      expect(results[2]!.rows).toHaveLength(2);
    });
  });

  describe("Blob adapter", () => {
    it("should return null for missing blob", async () => {
      expect(await adapter.blobs!.get("missing")).toBeNull();
    });

    it("should put and get ArrayBuffer", async () => {
      const data = new Uint8Array([1, 2, 3, 4]).buffer;
      await adapter.blobs!.put("blob1", data as ArrayBuffer);
      const result = await adapter.blobs!.get("blob1");
      expect(result).not.toBeNull();
      expect(new Uint8Array(result!)).toEqual(new Uint8Array([1, 2, 3, 4]));
    });

    it("should put and get Uint8Array", async () => {
      const data = new Uint8Array([10, 20, 30]);
      await adapter.blobs!.put("blob2", data);
      const result = await adapter.blobs!.get("blob2");
      expect(new Uint8Array(result!)).toEqual(new Uint8Array([10, 20, 30]));
    });

    it("should delete a blob and return true", async () => {
      await adapter.blobs!.put("blob1", new Uint8Array([1]));
      expect(await adapter.blobs!.delete("blob1")).toBe(true);
      expect(await adapter.blobs!.get("blob1")).toBeNull();
    });

    it("should return false when deleting non-existent blob", async () => {
      expect(await adapter.blobs!.delete("nope")).toBe(false);
    });

    it("should list blobs with prefix", async () => {
      await adapter.blobs!.put("img:1", new Uint8Array([1]));
      await adapter.blobs!.put("img:2", new Uint8Array([2]));
      await adapter.blobs!.put("doc:1", new Uint8Array([3]));

      const imgs = await adapter.blobs!.list("img:");
      expect(imgs).toEqual(["img:1", "img:2"]);

      const all = await adapter.blobs!.list();
      expect(all).toHaveLength(3);
    });
  });
});
