// Schema
export {
  defineDatabase,
  defineReducer,
  defineTable,
  t,
} from "./schema/index.js";
export type {
  ColumnType,
  DatabaseSchema,
  IndexDef,
  Migration,
  MigrationKind,
  ReducerDefinition,
  ReducerHandler,
  TableDefinition,
} from "./schema/types.js";
export {
  generateAllTables,
  generateCreateIndexes,
  generateCreateTable,
} from "./schema/sql-gen.js";
export { diffSchemas, generateMigrationSql } from "./schema/migrations.js";

// Protocol
export {
  ClientMessage,
  DeltaSchema,
  parseClientMessage,
  parseServerMessage,
  serialize,
  ServerMessage,
} from "./protocol/messages.js";
export type { Delta } from "./protocol/messages.js";

// Server
export { TableHandle } from "./server/table-handle.js";
export type { SqlResult, SqlStorage } from "./server/table-handle.js";
export { executeReducer } from "./server/reducer-engine.js";
export type { ReducerContext, ReducerResult } from "./server/reducer-engine.js";
export { SubscriptionManager } from "./server/subscription-engine.js";
export { generateIdentity, signToken, verifyToken } from "./server/identity.js";
export { SpikeDatabase } from "./server/database-do.js";
export {
  ensureSchedulerTable,
  processAlarm,
  scheduleReducer,
} from "./server/scheduler.js";

// Client
export { SpikeDbClient } from "./client/index.js";
export type { SpikeDbClientOptions } from "./client/index.js";
export { ClientTable, TableCache } from "./client/cache.js";
export { SubscriptionBuilder } from "./client/subscription.js";
export type { SubscriptionHandle } from "./client/subscription.js";
export { Connection } from "./client/connection.js";
export type { ConnectionOptions } from "./client/connection.js";

// Worker
export type { Env } from "./worker/env.js";

// Platform
export { platformDatabase } from "./platform-schema.js";
export { PlatformClient } from "./platform-client.js";
export type {
  AgentMessageRow,
  AgentRow,
  AlbumImageRow,
  AlbumRow,
  AppMessageRow,
  AppRow,
  AppVersionRow,
  CodeSessionRow,
  CreditsRow,
  DirectMessageRow,
  EnhancementJobRow,
  GenerationJobRow,
  HealthCheckRow,
  ImageRow,
  McpTaskRow,
  OauthLinkRow,
  PageBlockRow,
  PageRow,
  PipelineRow,
  PlatformEventRow,
  RegisteredToolRow,
  SubjectRow,
  ToolUsageRow,
  UserRow,
  UserToolPreferenceRow,
} from "./platform-client.js";
