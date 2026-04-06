/**
 * IndexedDB StorageAdapter — Browser target.
 *
 * Provides KV via IDB object stores and SQL via sql.js (in-memory SQLite).
 * IDB is the durable persistence layer; sql.js provides full SQL query support.
 * Blob storage uses IDB with large value support.
 */

import type { Database } from "sql.js";

import type {
  BlobAdapter,
  KVAdapter,
  QueryResult,
  Row,
  SQLAdapter,
  StorageAdapter,
} from "../core-logic/types-block-sdk.js";
import { getSqlJs } from "./sql-js-loader.js";

/** Options for the IndexedDB adapter */
export interface IDBAdapterOptions {
  /** Database name (defaults to "block-store") */
  dbName?: string;
  /** Database version (defaults to 1) */
  version?: number;
  /** Table names to create as object stores */
  tables?: string[];
}

/** Wrap an IDBRequest in a Promise */
function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
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

  return {
    async get<T = unknown>(key: string): Promise<T | null> {
      const store = await tx("readonly");
      const result = await idbRequest(store.get(key));
      return (result ?? null) as T | null;
    },
    async put<T = unknown>(key: string, value: T): Promise<void> {
      const store = await tx("readwrite");
      await idbRequest(store.put(value, key));
    },
    async delete(key: string): Promise<boolean> {
      const store = await tx("readwrite");
      await idbRequest(store.delete(key));
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
 * SQL adapter using sql.js (in-memory SQLite) with IDB persistence.
 *
 * - IDB is the durable storage layer (source of truth across page loads)
 * - sql.js provides full SQL query support (ORDER BY, LIMIT, JOIN, OR, etc.)
 * - On first execute(), sql.js WASM is lazy-loaded and hydrated from IDB
 * - Writes go to both sql.js and IDB; reads query sql.js only
 */
function createIDBSQL(dbPromise: Promise<IDBDatabase>): SQLAdapter {
  let sqliteDb: Database | null = null;
  let initPromise: Promise<void> | null = null;

  async function getStore(table: string, mode: IDBTransactionMode): Promise<IDBObjectStore> {
    const db = await dbPromise;
    return db.transaction(table, mode).objectStore(table);
  }

  function getAllRows(store: IDBObjectStore): Promise<Row[]> {
    return idbRequest(store.getAll()) as Promise<Row[]>;
  }

  async function ensureInitialized(): Promise<Database> {
    if (sqliteDb) return sqliteDb;
    if (!initPromise) {
      initPromise = (async () => {
        const SQL = await getSqlJs();
        sqliteDb = new SQL.Database();

        // Hydrate from IDB: for each object store (table), load rows into SQLite
        const idb = await dbPromise;
        const storeNames = Array.from(idb.objectStoreNames).filter(
          (name) => name !== "__kv__" && name !== "__blobs__",
        );

        for (const storeName of storeNames) {
          const store = idb.transaction(storeName, "readonly").objectStore(storeName);
          const rows = await getAllRows(store);
          if (rows.length === 0) continue;

          // Infer schema from first row
          const firstRow = rows[0];
          if (!firstRow) continue;
          const cols = Object.keys(firstRow);
          const colDefs = cols.map((c) => `"${c}" TEXT`).join(", ");
          sqliteDb?.run(`CREATE TABLE IF NOT EXISTS "${storeName}" (${colDefs})`);

          // Insert all rows
          const placeholders = cols.map(() => "?").join(", ");
          const colNames = cols.map((c) => `"${c}"`).join(", ");
          const stmt = sqliteDb?.prepare(
            `INSERT INTO "${storeName}" (${colNames}) VALUES (${placeholders})`,
          );
          if (stmt) {
            for (const row of rows) {
              stmt.run(cols.map((c) => row[c] as string | number | null));
            }
            stmt.free();
          }
        }
      })();
    }
    await initPromise;
    if (!sqliteDb) throw new Error("sql.js failed to initialize");
    return sqliteDb;
  }

  /** Determine the operation type from a SQL statement */
  function getOperation(
    sql: string,
  ): "create" | "insert" | "select" | "update" | "delete" | "other" {
    const trimmed = sql.trim().toUpperCase();
    if (trimmed.startsWith("CREATE")) return "create";
    if (trimmed.startsWith("INSERT")) return "insert";
    if (trimmed.startsWith("SELECT")) return "select";
    if (trimmed.startsWith("UPDATE")) return "update";
    if (trimmed.startsWith("DELETE")) return "delete";
    return "other";
  }

  /** Extract table name from a SQL statement */
  function extractTableName(sql: string): string | null {
    const match = sql.match(
      /(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM|CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?)\s+"?(\w+)"?/i,
    );
    return match?.[1] ?? null;
  }

  async function syncInsertToIDB(table: string, db: Database): Promise<void> {
    // Get the last inserted row by rowid
    const result = db.exec(`SELECT * FROM "${table}" WHERE rowid = last_insert_rowid()`);
    const firstResult = result[0];
    if (result.length > 0 && firstResult && firstResult.values.length > 0) {
      const cols = firstResult.columns;
      const vals = firstResult.values[0];
      const row: Row = {};
      if (vals) {
        for (let i = 0; i < cols.length; i++) {
          const colName = cols[i];
          if (colName) row[colName] = vals[i];
        }
      }
      // Only write to IDB if row has an id (IDB store uses keyPath: "id")
      if (row["id"] !== undefined) {
        const store = await getStore(table, "readwrite");
        await idbRequest(store.put(row));
      }
    }
  }

  async function syncDeleteToIDB(table: string, sql: string, params: unknown[]): Promise<void> {
    // For simple WHERE id = ? deletes
    const whereMatch = sql.match(/WHERE\s+"?id"?\s*=\s*\?/i);
    if (whereMatch && params.length > 0) {
      const store = await getStore(table, "readwrite");
      await idbRequest(store.delete(params[params.length - 1] as IDBValidKey));
      return;
    }
    // For DELETE without WHERE (clear all), clear the store
    if (!/WHERE/i.test(sql)) {
      const store = await getStore(table, "readwrite");
      await idbRequest(store.clear());
    }
  }

  async function syncUpdateToIDB(
    table: string,
    db: Database,
    sql: string,
    params: unknown[],
  ): Promise<void> {
    // Re-read updated rows from SQLite and sync to IDB
    // Extract WHERE clause to find which rows were updated
    const whereMatch = sql.match(/WHERE\s+(.+)$/i);
    if (!whereMatch) return;

    // Count SET params to know where WHERE params start
    const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i);
    if (!setMatch) return;
    const setCount = setMatch[1]?.split(",").length ?? 0;
    const whereParams = params.slice(setCount);

    const selectSql = `SELECT * FROM "${table}" WHERE ${whereMatch[1]}`;
    const result = db.exec(selectSql, whereParams as (string | number | null)[]);
    const updateResult = result[0];
    if (result.length > 0 && updateResult) {
      for (const vals of updateResult.values) {
        const row: Row = {};
        for (let i = 0; i < updateResult.columns.length; i++) {
          const colName = updateResult.columns[i];
          if (colName) row[colName] = vals[i];
        }
        if (row["id"] !== undefined) {
          const store = await getStore(table, "readwrite");
          await idbRequest(store.put(row));
        }
      }
    }
  }

  async function executeOne<T extends Row>(
    query: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    const db = await ensureInitialized();
    const op = getOperation(query);
    const sqlParams = (params ?? []) as (string | number | null)[];

    if (op === "create") {
      // Run CREATE TABLE on sql.js (IDB tables created during DB open)
      db.run(query);
      return { rows: [] as T[], rowsAffected: 0 };
    }

    if (op === "select") {
      const result = db.exec(query, sqlParams);
      if (result.length === 0) {
        return { rows: [] as T[], rowsAffected: 0 };
      }
      const selectResult = result[0];
      if (!selectResult) return { rows: [] as T[], rowsAffected: 0 };
      const cols = selectResult.columns;
      const rows: T[] = selectResult.values.map((vals) => {
        const row: Row = {};
        for (let i = 0; i < cols.length; i++) {
          const colName = cols[i];
          if (colName) row[colName] = vals[i];
        }
        return row as T;
      });
      return { rows, rowsAffected: 0 };
    }

    // Write operations: execute on sql.js, then sync to IDB
    db.run(query, sqlParams);
    const rowsAffected = db.getRowsModified();
    const table = extractTableName(query);

    if (table) {
      if (op === "insert") {
        await syncInsertToIDB(table, db);
      } else if (op === "delete") {
        await syncDeleteToIDB(table, query, params ?? []);
      } else if (op === "update") {
        await syncUpdateToIDB(table, db, query, params ?? []);
      }
    }

    return { rows: [] as T[], rowsAffected };
  }

  return {
    async execute<T extends Row>(query: string, params?: unknown[]): Promise<QueryResult<T>> {
      return executeOne<T>(query, params);
    },
    async batch(queries: Array<{ query: string; params?: unknown[] }>): Promise<QueryResult[]> {
      await ensureInitialized();
      const results: QueryResult[] = [];
      for (const q of queries) {
        results.push(await executeOne(q.query, q.params));
      }
      return results;
    },
  };
}

function createIDBBlobs(dbPromise: Promise<IDBDatabase>): BlobAdapter {
  return {
    async put(key: string, data: ArrayBuffer | Uint8Array | ReadableStream): Promise<void> {
      const db = await dbPromise;
      const store = db.transaction("__blobs__", "readwrite").objectStore("__blobs__");
      let buffer: ArrayBuffer;
      if (data instanceof ArrayBuffer) {
        buffer = data;
      } else if (data instanceof Uint8Array) {
        buffer = (data.buffer as ArrayBuffer).slice(
          data.byteOffset,
          data.byteOffset + data.byteLength,
        );
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
      await idbRequest(store.put(buffer, key));
    },
    async get(key: string): Promise<ArrayBuffer | null> {
      const db = await dbPromise;
      const store = db.transaction("__blobs__", "readonly").objectStore("__blobs__");
      const result = await idbRequest(store.get(key));
      return (result as ArrayBuffer) ?? null;
    },
    async delete(key: string): Promise<boolean> {
      const db = await dbPromise;
      const store = db.transaction("__blobs__", "readwrite").objectStore("__blobs__");
      await idbRequest(store.delete(key));
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
