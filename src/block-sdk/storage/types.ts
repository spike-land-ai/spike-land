/**
 * StorageAdapter — universal storage interface for full-stack blocks.
 *
 * Implementations:
 *   - D1 adapter (Cloudflare Workers)
 *   - IDB adapter (Browser / IndexedDB + sql.js)
 *   - SQLite adapter (Node.js / better-sqlite3)
 */

/** A single row from a SQL query result */
export type Row = Record<string, unknown>;

/** Result of a SQL query */
export interface QueryResult<T extends Row = Row> {
  rows: T[];
  rowsAffected: number;
}

/** Key-value storage interface (maps to KV in Workers, object store in IDB) */
export interface KVAdapter {
  get<T = unknown>(key: string): Promise<T | null>;
  put<T = unknown>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
  list(prefix?: string): Promise<Array<{ key: string; value: unknown }>>;
}

/** SQL storage interface (maps to D1 in Workers, sql.js/wa-sqlite in browser) */
export interface SQLAdapter {
  execute<T extends Row = Row>(query: string, params?: unknown[]): Promise<QueryResult<T>>;
  batch(queries: Array<{ query: string; params?: unknown[] }>): Promise<QueryResult[]>;
}

/** Blob storage interface (maps to R2 in Workers, OPFS in browser) */
export interface BlobAdapter {
  put(key: string, data: ArrayBuffer | Uint8Array | ReadableStream): Promise<void>;
  get(key: string): Promise<ArrayBuffer | null>;
  delete(key: string): Promise<boolean>;
  list(prefix?: string): Promise<string[]>;
}

/** The universal storage adapter that blocks interact with */
export interface StorageAdapter {
  kv: KVAdapter;
  sql: SQLAdapter;
  blobs?: BlobAdapter | undefined;
}

/** Configuration for creating a storage adapter */
export interface StorageAdapterConfig {
  /** Adapter type identifier */
  type: "d1" | "idb" | "sqlite" | "memory";
}
