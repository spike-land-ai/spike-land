/**
 * SQLite StorageAdapter — Node.js target via better-sqlite3.
 *
 * Provides a synchronous SQLite-backed implementation of the universal StorageAdapter.
 * Uses WAL mode for concurrent reads and foreign keys for referential integrity.
 */

import Database from "better-sqlite3";
import type {
  BlobAdapter,
  KVAdapter,
  QueryResult,
  Row,
  SQLAdapter,
  StorageAdapter,
} from "../storage/types.js";

export interface SqliteAdapterOptions {
  /** Path to SQLite database file. Defaults to ":memory:" */
  path?: string;
}

function createSqliteKV(db: InstanceType<typeof Database>): KVAdapter {
  db.exec("CREATE TABLE IF NOT EXISTS __kv__ (key TEXT PRIMARY KEY, value TEXT NOT NULL)");

  return {
    async get<T = unknown>(key: string): Promise<T | null> {
      const row = db.prepare("SELECT value FROM __kv__ WHERE key = ?").get(key) as
        | { value: string }
        | undefined;
      return row ? (JSON.parse(row.value) as T) : null;
    },
    async put<T = unknown>(key: string, value: T): Promise<void> {
      db.prepare("INSERT OR REPLACE INTO __kv__ (key, value) VALUES (?, ?)").run(
        key,
        JSON.stringify(value),
      );
    },
    async delete(key: string): Promise<boolean> {
      const result = db.prepare("DELETE FROM __kv__ WHERE key = ?").run(key);
      return result.changes > 0;
    },
    async list(prefix?: string): Promise<Array<{ key: string; value: unknown }>> {
      const rows = prefix
        ? (db.prepare("SELECT key, value FROM __kv__ WHERE key LIKE ?").all(prefix + "%") as Array<{
            key: string;
            value: string;
          }>)
        : (db.prepare("SELECT key, value FROM __kv__").all() as Array<{
            key: string;
            value: string;
          }>);
      return rows.map((r) => ({ key: r.key, value: JSON.parse(r.value) }));
    },
  };
}

function createSqliteSQL(db: InstanceType<typeof Database>): SQLAdapter {
  return {
    async execute<T extends Row = Row>(
      query: string,
      params?: unknown[],
    ): Promise<QueryResult<T>> {
      const trimmed = query.trim().toUpperCase();
      const isSelect =
        trimmed.startsWith("SELECT") ||
        trimmed.startsWith("WITH") ||
        trimmed.startsWith("PRAGMA");

      if (isSelect) {
        const rows = db.prepare(query).all(...(params || [])) as T[];
        return { rows, rowsAffected: 0 };
      }

      const result = db.prepare(query).run(...(params || []));
      return { rows: [] as T[], rowsAffected: result.changes };
    },

    async batch(
      queries: Array<{ query: string; params?: unknown[] }>,
    ): Promise<QueryResult[]> {
      const results: QueryResult[] = [];
      const txn = db.transaction(() => {
        for (const q of queries) {
          const trimmed = q.query.trim().toUpperCase();
          const isSelect =
            trimmed.startsWith("SELECT") ||
            trimmed.startsWith("WITH") ||
            trimmed.startsWith("PRAGMA");

          if (isSelect) {
            const rows = db.prepare(q.query).all(...(q.params || [])) as Row[];
            results.push({ rows, rowsAffected: 0 });
          } else {
            const result = db.prepare(q.query).run(...(q.params || []));
            results.push({ rows: [], rowsAffected: result.changes });
          }
        }
      });
      txn();
      return results;
    },
  };
}

function createSqliteBlobs(db: InstanceType<typeof Database>): BlobAdapter {
  db.exec(
    "CREATE TABLE IF NOT EXISTS __blobs__ (key TEXT PRIMARY KEY, data BLOB NOT NULL)",
  );

  return {
    async put(
      key: string,
      data: ArrayBuffer | Uint8Array | ReadableStream,
    ): Promise<void> {
      let buffer: Buffer;
      if (data instanceof ArrayBuffer) {
        buffer = Buffer.from(data);
      } else if (data instanceof Uint8Array) {
        buffer = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
      } else {
        // ReadableStream — collect chunks
        const reader = (data as ReadableStream).getReader();
        const chunks: Uint8Array[] = [];
        let done = false;
        while (!done) {
          const result = await reader.read();
          done = result.done;
          if (result.value) chunks.push(result.value as Uint8Array);
        }
        const total = chunks.reduce((n, c) => n + c.byteLength, 0);
        buffer = Buffer.alloc(total);
        let offset = 0;
        for (const chunk of chunks) {
          buffer.set(chunk, offset);
          offset += chunk.byteLength;
        }
      }
      db.prepare("INSERT OR REPLACE INTO __blobs__ (key, data) VALUES (?, ?)").run(
        key,
        buffer,
      );
    },
    async get(key: string): Promise<ArrayBuffer | null> {
      const row = db.prepare("SELECT data FROM __blobs__ WHERE key = ?").get(key) as
        | { data: Buffer }
        | undefined;
      if (!row) return null;
      const buf = row.data;
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    },
    async delete(key: string): Promise<boolean> {
      const result = db.prepare("DELETE FROM __blobs__ WHERE key = ?").run(key);
      return result.changes > 0;
    },
    async list(prefix?: string): Promise<string[]> {
      const rows = prefix
        ? (db.prepare("SELECT key FROM __blobs__ WHERE key LIKE ?").all(prefix + "%") as Array<{
            key: string;
          }>)
        : (db.prepare("SELECT key FROM __blobs__").all() as Array<{ key: string }>);
      return rows.map((r) => r.key);
    },
  };
}

/** Create a StorageAdapter backed by better-sqlite3 */
export function sqliteAdapter(options?: SqliteAdapterOptions): StorageAdapter {
  const db = new Database(options?.path ?? ":memory:");
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  return {
    kv: createSqliteKV(db),
    sql: createSqliteSQL(db),
    blobs: createSqliteBlobs(db),
  };
}
