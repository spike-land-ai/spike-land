/**
 * In-memory StorageAdapter — for testing and development.
 *
 * Provides a simple Map-backed implementation of all storage interfaces.
 * No persistence — data lives only in process memory.
 */

import type {
  BlobAdapter,
  KVAdapter,
  QueryResult,
  Row,
  SQLAdapter,
  StorageAdapter,
} from "./types-block-sdk.js";

/** Simple in-memory KV store */
function createMemoryKV(): KVAdapter {
  const store = new Map<string, unknown>();

  return {
    async get<T = unknown>(key: string): Promise<T | null> {
      const value = store.get(key);
      return (value ?? null) as T | null;
    },
    async put<T = unknown>(key: string, value: T): Promise<void> {
      store.set(key, value);
    },
    async delete(key: string): Promise<boolean> {
      return store.delete(key);
    },
    async list(prefix?: string): Promise<Array<{ key: string; value: unknown }>> {
      const entries: Array<{ key: string; value: unknown }> = [];
      for (const [key, value] of store) {
        if (!prefix || key.startsWith(prefix)) {
          entries.push({ key, value });
        }
      }
      return entries;
    },
  };
}

/**
 * Simple in-memory SQL store backed by a Map of tables.
 *
 * Supports basic INSERT INTO, SELECT, UPDATE, DELETE statements.
 * Not a full SQL engine — covers the patterns used by defineBlock() schemas.
 */
function createMemorySQL(): SQLAdapter {
  const tables = new Map<string, Row[]>();

  function getTable(name: string): Row[] {
    if (!tables.has(name)) {
      tables.set(name, []);
    }
    return tables.get(name);
  }

  function executeOne<T extends Row>(query: string, params?: unknown[]): QueryResult<T> {
    const trimmed = query.trim();

    // CREATE TABLE — just ensure table exists
    const createMatch = trimmed.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i);
    if (createMatch) {
      const tableName = createMatch[1];
      getTable(tableName);
      return { rows: [] as T[], rowsAffected: 0 };
    }

    // INSERT INTO table (cols) VALUES (?)
    const insertMatch = trimmed.match(
      /^INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i,
    );
    if (insertMatch) {
      const tableName = insertMatch[1];
      const cols = insertMatch[2]?.split(",").map((c) => c.trim());
      const table = getTable(tableName);
      const row: Row = {};
      for (let i = 0; i < cols.length; i++) {
        row[cols[i]] = params?.[i] ?? null;
      }
      table.push(row);
      return { rows: [row] as T[], rowsAffected: 1 };
    }

    // SELECT * FROM table WHERE col = ? AND col2 = ?
    const selectMatch = trimmed.match(/^SELECT\s+\*\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?/i);
    if (selectMatch) {
      const tableName = selectMatch[1];
      const table = getTable(tableName);
      if (!selectMatch[2]) {
        return { rows: [...table] as T[], rowsAffected: 0 };
      }
      const conditions = selectMatch[2].split(/\s+AND\s+/i).map((c) => c.trim());
      const filtered = table.filter((row) => {
        let paramIdx = 0;
        return conditions.every((cond) => {
          const [col] = cond.split(/\s*=\s*/);
          const value = params?.[paramIdx++];
          return row[col?.trim()] === value;
        });
      });
      return { rows: filtered as T[], rowsAffected: 0 };
    }

    // UPDATE table SET col = ? WHERE col2 = ? AND col3 = ?
    const updateMatch = trimmed.match(/^UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE\s+(.+)/i);
    if (updateMatch) {
      const tableName = updateMatch[1];
      const setClauses = updateMatch[2]?.split(",").map((s) => s.trim());
      const whereClauses = updateMatch[3]?.split(/\s+AND\s+/i).map((w) => w.trim());
      const table = getTable(tableName);

      const setColCount = setClauses.length;
      let rowsAffected = 0;

      for (const row of table) {
        let whereIdx = setColCount;
        const matches = whereClauses.every((cond) => {
          const [col] = cond.split(/\s*=\s*/);
          return row[col?.trim()] === params?.[whereIdx++];
        });
        if (matches) {
          for (let i = 0; i < setClauses.length; i++) {
            const [col] = setClauses[i]?.split(/\s*=\s*/);
            row[col?.trim()] = params?.[i] ?? null;
          }
          rowsAffected++;
        }
      }

      return { rows: [] as T[], rowsAffected };
    }

    // DELETE FROM table WHERE col = ?
    const deleteMatch = trimmed.match(/^DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?/i);
    if (deleteMatch) {
      const tableName = deleteMatch[1];
      const table = getTable(tableName);
      if (!deleteMatch[2]) {
        const count = table.length;
        tables.set(tableName, []);
        return { rows: [] as T[], rowsAffected: count };
      }
      const conditions = deleteMatch[2].split(/\s+AND\s+/i).map((c) => c.trim());
      const before = table.length;
      const remaining = table.filter((row) => {
        let paramIdx = 0;
        return !conditions.every((cond) => {
          const [col] = cond.split(/\s*=\s*/);
          return row[col?.trim()] === params?.[paramIdx++];
        });
      });
      tables.set(tableName, remaining);
      return { rows: [] as T[], rowsAffected: before - remaining.length };
    }

    // DROP TABLE
    const dropMatch = trimmed.match(/^DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(\w+)/i);
    if (dropMatch) {
      tables.delete(dropMatch[1]);
      return { rows: [] as T[], rowsAffected: 0 };
    }

    throw new Error(`Unsupported SQL statement: ${trimmed.slice(0, 80)}`);
  }

  return {
    async execute<T extends Row>(query: string, params?: unknown[]): Promise<QueryResult<T>> {
      return executeOne<T>(query, params);
    },
    async batch(queries: Array<{ query: string; params?: unknown[] }>): Promise<QueryResult[]> {
      return queries.map((q) => executeOne(q.query, q.params));
    },
  };
}

/** Simple in-memory blob store */
function createMemoryBlobs(): BlobAdapter {
  const store = new Map<string, ArrayBuffer>();

  return {
    async put(key: string, data: ArrayBuffer | Uint8Array | ReadableStream): Promise<void> {
      if (data instanceof ArrayBuffer) {
        store.set(key, data);
      } else if (data instanceof Uint8Array) {
        store.set(
          key,
          (data.buffer as ArrayBuffer).slice(data.byteOffset, data.byteOffset + data.byteLength),
        );
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
        const buf = new Uint8Array(total);
        let offset = 0;
        for (const chunk of chunks) {
          buf.set(chunk, offset);
          offset += chunk.byteLength;
        }
        store.set(key, buf.buffer);
      }
    },
    async get(key: string): Promise<ArrayBuffer | null> {
      return store.get(key) ?? null;
    },
    async delete(key: string): Promise<boolean> {
      return store.delete(key);
    },
    async list(prefix?: string): Promise<string[]> {
      const keys: string[] = [];
      for (const key of store.keys()) {
        if (!prefix || key.startsWith(prefix)) keys.push(key);
      }
      return keys;
    },
  };
}

/** Create an in-memory StorageAdapter for testing */
export function createMemoryAdapter(): StorageAdapter {
  return {
    kv: createMemoryKV(),
    sql: createMemorySQL(),
    blobs: createMemoryBlobs(),
  };
}
