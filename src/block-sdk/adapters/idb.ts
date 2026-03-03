/**
 * IndexedDB StorageAdapter — Browser target.
 *
 * Provides KV via IDB object stores and SQL via a simple table emulation.
 * Blob storage uses IDB with large value support.
 *
 * For full SQL support, consumers can inject sql.js (not bundled by default
 * to avoid the ~300KB WASM cost).
 */

import type {
  BlobAdapter,
  KVAdapter,
  QueryResult,
  Row,
  SQLAdapter,
  StorageAdapter,
} from "../storage/types.js";

/** Options for the IndexedDB adapter */
export interface IDBAdapterOptions {
  /** Database name (defaults to "block-store") */
  dbName?: string;
  /** Database version (defaults to 1) */
  version?: number;
  /** Table names to create as object stores */
  tables?: string[];
}

function openDB(name: string, version: number, tables: string[]): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onupgradeneeded = () => {
      const db = request.result;
      // Create KV store
      if (!db.objectStoreNames.contains("__kv__")) {
        db.createObjectStore("__kv__");
      }
      // Create blob store
      if (!db.objectStoreNames.contains("__blobs__")) {
        db.createObjectStore("__blobs__");
      }
      // Create table stores
      for (const table of tables) {
        if (!db.objectStoreNames.contains(table)) {
          db.createObjectStore(table, { keyPath: "id" });
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function createIDBKV(dbPromise: Promise<IDBDatabase>): KVAdapter {
  async function tx(mode: IDBTransactionMode): Promise<IDBObjectStore> {
    const db = await dbPromise;
    return db.transaction("__kv__", mode).objectStore("__kv__");
  }

  function req<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  return {
    async get<T = unknown>(key: string): Promise<T | null> {
      const store = await tx("readonly");
      const result = await req(store.get(key));
      return (result ?? null) as T | null;
    },
    async put<T = unknown>(key: string, value: T): Promise<void> {
      const store = await tx("readwrite");
      await req(store.put(value, key));
    },
    async delete(key: string): Promise<boolean> {
      const store = await tx("readwrite");
      await req(store.delete(key));
      return true;
    },
    async list(prefix?: string): Promise<Array<{ key: string; value: unknown }>> {
      const store = await tx("readonly");
      const entries: Array<{ key: string; value: unknown }> = [];
      return new Promise((resolve, reject) => {
        const cursor = store.openCursor();
        cursor.onsuccess = () => {
          const result = cursor.result;
          if (!result) {
            resolve(entries);
            return;
          }
          const key = String(result.key);
          if (!prefix || key.startsWith(prefix)) {
            entries.push({ key, value: result.value });
          }
          result.continue();
        };
        cursor.onerror = () => reject(cursor.error);
      });
    },
  };
}

/**
 * Simple SQL adapter backed by IDB object stores.
 *
 * Supports basic CRUD patterns that defineBlock() generates.
 * Not a full SQL parser — handles the exact patterns from block procedures.
 */
function createIDBSQL(dbPromise: Promise<IDBDatabase>): SQLAdapter {
  async function getStore(
    table: string,
    mode: IDBTransactionMode,
  ): Promise<IDBObjectStore> {
    const db = await dbPromise;
    return db.transaction(table, mode).objectStore(table);
  }

  function req<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function getAllRows<T extends Row>(store: IDBObjectStore): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  async function executeOne<T extends Row>(
    query: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    const trimmed = query.trim();

    // CREATE TABLE — no-op (tables created during DB open)
    if (/^CREATE\s+TABLE/i.test(trimmed)) {
      return { rows: [] as T[], rowsAffected: 0 };
    }

    // INSERT INTO table (cols) VALUES (?)
    const insertMatch = trimmed.match(
      /^INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i,
    );
    if (insertMatch) {
      const tableName = insertMatch[1]!;
      const cols = insertMatch[2]!.split(",").map((c) => c.trim());
      const row: Row = {};
      for (let i = 0; i < cols.length; i++) {
        row[cols[i]!] = params?.[i] ?? null;
      }
      const store = await getStore(tableName, "readwrite");
      await req(store.put(row));
      return { rows: [row] as T[], rowsAffected: 1 };
    }

    // SELECT * FROM table WHERE ...
    const selectMatch = trimmed.match(/^SELECT\s+\*\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?/i);
    if (selectMatch) {
      const tableName = selectMatch[1]!;
      const store = await getStore(tableName, "readonly");
      const allRows = await getAllRows<T>(store);

      if (!selectMatch[2]) return { rows: allRows, rowsAffected: 0 };

      const conditions = selectMatch[2].split(/\s+AND\s+/i).map((c) => c.trim());
      let paramIdx = 0;
      const filtered = allRows.filter((row) =>
        conditions.every((cond) => {
          const [col] = cond.split(/\s*=\s*/);
          return row[col!.trim()] === params?.[paramIdx++];
        }),
      );
      return { rows: filtered, rowsAffected: 0 };
    }

    // UPDATE table SET col = ? WHERE ...
    const updateMatch = trimmed.match(/^UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE\s+(.+)/i);
    if (updateMatch) {
      const tableName = updateMatch[1]!;
      const setClauses = updateMatch[2]!.split(",").map((s) => s.trim());
      const whereClauses = updateMatch[3]!.split(/\s+AND\s+/i).map((w) => w.trim());
      const store = await getStore(tableName, "readwrite");
      const allRows = await getAllRows(store);
      const setColCount = setClauses.length;
      let rowsAffected = 0;

      for (const row of allRows) {
        let whereIdx = setColCount;
        const matches = whereClauses.every((cond) => {
          const [col] = cond.split(/\s*=\s*/);
          return row[col!.trim()] === params?.[whereIdx++];
        });
        if (matches) {
          for (let i = 0; i < setClauses.length; i++) {
            const [col] = setClauses[i]!.split(/\s*=\s*/);
            row[col!.trim()] = params?.[i] ?? null;
          }
          // Re-read store for this put (transaction might have closed)
          const writeStore = await getStore(tableName, "readwrite");
          await req(writeStore.put(row));
          rowsAffected++;
        }
      }
      return { rows: [] as T[], rowsAffected };
    }

    // DELETE FROM table WHERE ...
    const deleteMatch = trimmed.match(/^DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?/i);
    if (deleteMatch) {
      const tableName = deleteMatch[1]!;
      const store = await getStore(tableName, "readwrite");
      const allRows = await getAllRows(store);

      if (!deleteMatch[2]) {
        for (const row of allRows) {
          await req(store.delete(row.id as IDBValidKey));
        }
        return { rows: [] as T[], rowsAffected: allRows.length };
      }

      const conditions = deleteMatch[2].split(/\s+AND\s+/i).map((c) => c.trim());
      let rowsAffected = 0;
      let paramIdx = 0;
      for (const row of allRows) {
        const localIdx = paramIdx;
        paramIdx = localIdx;
        const matches = conditions.every((cond) => {
          const [col] = cond.split(/\s*=\s*/);
          return row[col!.trim()] === params?.[paramIdx++];
        });
        if (matches) {
          await req(store.delete(row.id as IDBValidKey));
          rowsAffected++;
        }
      }
      return { rows: [] as T[], rowsAffected };
    }

    throw new Error(`IDB SQL adapter: unsupported statement: ${trimmed.slice(0, 80)}`);
  }

  return {
    async execute<T extends Row>(query: string, params?: unknown[]): Promise<QueryResult<T>> {
      return executeOne<T>(query, params);
    },
    async batch(queries: Array<{ query: string; params?: unknown[] }>): Promise<QueryResult[]> {
      const results: QueryResult[] = [];
      for (const q of queries) {
        results.push(await executeOne(q.query, q.params));
      }
      return results;
    },
  };
}

function createIDBBlobs(dbPromise: Promise<IDBDatabase>): BlobAdapter {
  function req<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  return {
    async put(
      key: string,
      data: ArrayBuffer | Uint8Array | ReadableStream,
    ): Promise<void> {
      const db = await dbPromise;
      const store = db.transaction("__blobs__", "readwrite").objectStore("__blobs__");
      let buffer: ArrayBuffer;
      if (data instanceof ArrayBuffer) {
        buffer = data;
      } else if (data instanceof Uint8Array) {
        buffer = (data.buffer as ArrayBuffer).slice(data.byteOffset, data.byteOffset + data.byteLength);
      } else {
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
        buffer = buf.buffer;
      }
      await req(store.put(buffer, key));
    },
    async get(key: string): Promise<ArrayBuffer | null> {
      const db = await dbPromise;
      const store = db.transaction("__blobs__", "readonly").objectStore("__blobs__");
      const result = await req(store.get(key));
      return (result as ArrayBuffer) ?? null;
    },
    async delete(key: string): Promise<boolean> {
      const db = await dbPromise;
      const store = db.transaction("__blobs__", "readwrite").objectStore("__blobs__");
      await req(store.delete(key));
      return true;
    },
    async list(prefix?: string): Promise<string[]> {
      const db = await dbPromise;
      const store = db.transaction("__blobs__", "readonly").objectStore("__blobs__");
      return new Promise((resolve, reject) => {
        const keys: string[] = [];
        const cursor = store.openCursor();
        cursor.onsuccess = () => {
          const result = cursor.result;
          if (!result) {
            resolve(keys);
            return;
          }
          const key = String(result.key);
          if (!prefix || key.startsWith(prefix)) keys.push(key);
          result.continue();
        };
        cursor.onerror = () => reject(cursor.error);
      });
    },
  };
}

/** Create a StorageAdapter backed by IndexedDB */
export function idbAdapter(options?: IDBAdapterOptions): StorageAdapter {
  const dbName = options?.dbName ?? "block-store";
  const version = options?.version ?? 1;
  const tables = options?.tables ?? [];

  const dbPromise = openDB(dbName, version, tables);

  return {
    kv: createIDBKV(dbPromise),
    sql: createIDBSQL(dbPromise),
    blobs: createIDBBlobs(dbPromise),
  };
}
