/**
 * D1 StorageAdapter — Cloudflare Workers target.
 *
 * Wraps D1Database, KVNamespace, and R2Bucket into the universal StorageAdapter.
 */

import type {
  BlobAdapter,
  KVAdapter,
  QueryResult,
  Row,
  SQLAdapter,
  StorageAdapter,
} from "../storage/types.js";

/** D1Database interface (Cloudflare Workers runtime) */
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
  exec(query: string): Promise<D1ExecResult>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
  first<T = Record<string, unknown>>(column?: string): Promise<T | null>;
}

interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: { changes: number; last_row_id: number; rows_read: number; rows_written: number };
}

interface D1ExecResult {
  count: number;
  duration: number;
}

/** KVNamespace interface (Cloudflare Workers runtime) */
export interface KVNamespace {
  get(key: string, options?: { type?: string }): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string }): Promise<{ keys: Array<{ name: string }> }>;
}

/** R2Bucket interface (Cloudflare Workers runtime) */
export interface R2Bucket {
  put(key: string, value: ArrayBuffer | ReadableStream): Promise<unknown>;
  get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer> } | null>;
  delete(key: string | string[]): Promise<void>;
  list(options?: { prefix?: string }): Promise<{ objects: Array<{ key: string }> }>;
}

/** Options for creating the D1 storage adapter */
export interface D1AdapterOptions {
  db: D1Database;
  kv?: KVNamespace | undefined;
  r2?: R2Bucket | undefined;
}

function createD1KV(kvNs?: KVNamespace): KVAdapter {
  // If no KV namespace, fall back to a simple Map (dev mode)
  if (!kvNs) {
    const fallback = new Map<string, string>();
    return {
      async get<T = unknown>(key: string): Promise<T | null> {
        const raw = fallback.get(key);
        return raw ? (JSON.parse(raw) as T) : null;
      },
      async put<T = unknown>(key: string, value: T): Promise<void> {
        fallback.set(key, JSON.stringify(value));
      },
      async delete(key: string): Promise<boolean> {
        return fallback.delete(key);
      },
      async list(prefix?: string): Promise<Array<{ key: string; value: unknown }>> {
        const entries: Array<{ key: string; value: unknown }> = [];
        for (const [k, v] of fallback) {
          if (!prefix || k.startsWith(prefix)) {
            entries.push({ key: k, value: JSON.parse(v) });
          }
        }
        return entries;
      },
    };
  }

  return {
    async get<T = unknown>(key: string): Promise<T | null> {
      const raw = await kvNs.get(key, { type: "text" });
      return raw ? (JSON.parse(raw) as T) : null;
    },
    async put<T = unknown>(key: string, value: T): Promise<void> {
      await kvNs.put(key, JSON.stringify(value));
    },
    async delete(key: string): Promise<boolean> {
      await kvNs.delete(key);
      return true; // KV delete doesn't return status
    },
    async list(prefix?: string): Promise<Array<{ key: string; value: unknown }>> {
      const result = await kvNs.list(prefix ? { prefix } : undefined);
      const entries: Array<{ key: string; value: unknown }> = [];
      for (const { name } of result.keys) {
        const value = await kvNs.get(name, { type: "text" });
        entries.push({ key: name, value: value ? JSON.parse(value) : null });
      }
      return entries;
    },
  };
}

function createD1SQL(db: D1Database): SQLAdapter {
  return {
    async execute<T extends Row = Row>(
      query: string,
      params?: unknown[],
    ): Promise<QueryResult<T>> {
      const stmt = db.prepare(query);
      const bound = params && params.length > 0 ? stmt.bind(...params) : stmt;

      const trimmed = query.trim().toUpperCase();
      if (trimmed.startsWith("SELECT") || trimmed.startsWith("WITH")) {
        const result = await bound.all<T>();
        return { rows: result.results, rowsAffected: 0 };
      }

      const result = await bound.run();
      return { rows: [] as T[], rowsAffected: result.meta.changes };
    },

    async batch(
      queries: Array<{ query: string; params?: unknown[] }>,
    ): Promise<QueryResult[]> {
      const stmts = queries.map((q) => {
        const stmt = db.prepare(q.query);
        return q.params && q.params.length > 0 ? stmt.bind(...q.params) : stmt;
      });
      const results = await db.batch(stmts);
      return results.map((r) => ({
        rows: r.results as Row[],
        rowsAffected: r.meta.changes,
      }));
    },
  };
}

function createD1Blobs(r2?: R2Bucket): BlobAdapter | undefined {
  if (!r2) return undefined;

  return {
    async put(
      key: string,
      data: ArrayBuffer | Uint8Array | ReadableStream,
    ): Promise<void> {
      if (data instanceof Uint8Array) {
        await r2.put(key, (data.buffer as ArrayBuffer).slice(data.byteOffset, data.byteOffset + data.byteLength));
      } else {
        await r2.put(key, data as ArrayBuffer | ReadableStream);
      }
    },
    async get(key: string): Promise<ArrayBuffer | null> {
      const obj = await r2.get(key);
      return obj ? obj.arrayBuffer() : null;
    },
    async delete(key: string): Promise<boolean> {
      await r2.delete(key);
      return true;
    },
    async list(prefix?: string): Promise<string[]> {
      const result = await r2.list(prefix ? { prefix } : undefined);
      return result.objects.map((o) => o.key);
    },
  };
}

/** Create a StorageAdapter backed by Cloudflare D1 + optional KV + R2 */
export function d1Adapter(options: D1AdapterOptions): StorageAdapter {
  return {
    kv: createD1KV(options.kv),
    sql: createD1SQL(options.db),
    blobs: createD1Blobs(options.r2),
  };
}
