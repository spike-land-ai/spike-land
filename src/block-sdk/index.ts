/**
 * @spike-land-ai/block-sdk
 *
 * Full-stack block SDK — defineBlock(), StorageAdapter, React bindings, MCP integration.
 *
 * A "block" packages storage schema + business logic + UI components + MCP tools
 * into a single composable unit that deploys to CF Workers OR bundles into a
 * self-contained HTML file with IndexedDB.
 */

// Core
export { defineBlock } from "./define-block.js";
export type { Block, BlockComponents, BlockContext, BlockDefinition, BlockProcedureContext } from "./define-block.js";

// Schema DSL
export { defineTable, schemaToSQL, schemaTableNames, t, tableToSQL } from "./schema/types.js";
export type { ColumnBuilder, ColumnDef, ColumnType, IndexDef, SchemaDef, TableDef } from "./schema/types.js";

// Storage interfaces
export type {
  BlobAdapter,
  KVAdapter,
  QueryResult,
  Row,
  SQLAdapter,
  StorageAdapter,
  StorageAdapterConfig,
} from "./storage/types.js";

// Memory adapter (testing)
export { createMemoryAdapter } from "./storage/memory.js";
