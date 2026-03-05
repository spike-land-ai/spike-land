/**
 * Schema DSL for defining block storage tables.
 *
 * Generates SQL DDL for D1 and object store configs for IDB.
 */

/** Column type definitions */
export type ColumnType = "string" | "number" | "boolean" | "u64";

/** Column definition builder */
export interface ColumnDef {
  type: ColumnType;
  primary: boolean;
  optional: boolean;
  enumValues?: string[] | undefined;
  defaultValue?: string | number | boolean | undefined;
  foreignKey?: { table: string; column: string } | undefined;
}

/** Fluent column builder */
export interface ColumnBuilder {
  /** Mark this column as the primary key */
  primaryKey(): ColumnBuilder;
  /** Mark this column as optional (nullable) */
  optional(): ColumnBuilder;
  /** Set a default value */
  default(value: string | number | boolean): ColumnBuilder;
  /** Add a foreign key reference */
  references(table: string, column: string): ColumnBuilder;
  /** Get the final column definition */
  _def: ColumnDef;
}

/** Index definition */
export interface IndexDef {
  name: string;
  columns: string[];
  unique?: boolean | undefined;
}

/** Table definition */
export interface TableDef {
  name: string;
  columns: Record<string, ColumnDef>;
  indexes?: IndexDef[];
}

/** Schema definition — a collection of tables */
export type SchemaDef = Record<string, TableDef>;

function createColumnBuilder(type: ColumnType, enumValues?: string[]): ColumnBuilder {
  const def: ColumnDef = { type, primary: false, optional: false, enumValues };
  const builder: ColumnBuilder = {
    primaryKey() {
      def.primary = true;
      return builder;
    },
    optional() {
      def.optional = true;
      return builder;
    },
    default(value: string | number | boolean) {
      def.defaultValue = value;
      return builder;
    },
    references(table: string, column: string) {
      def.foreignKey = { table, column };
      return builder;
    },
    _def: def,
  };
  // Make _def always return current state
  Object.defineProperty(builder, "_def", { get: () => def });
  return builder;
}

/** Column type factories — the `t` namespace passed to defineTable */
export const t = {
  string: () => createColumnBuilder("string"),
  number: () => createColumnBuilder("number"),
  boolean: () => createColumnBuilder("boolean"),
  u64: () => createColumnBuilder("u64"),
  enum: (values: string[]) => createColumnBuilder("string", values),
};

/** Define a table with a name and column schema */
export function defineTable(
  name: string,
  columns: Record<string, ColumnBuilder>,
  options?: { indexes?: IndexDef[] },
): TableDef {
  const resolvedColumns: Record<string, ColumnDef> = {};
  for (const [key, builder] of Object.entries(columns)) {
    resolvedColumns[key] = builder._def;
  }
  const table: TableDef = { name, columns: resolvedColumns };
  if (options?.indexes) {
    table.indexes = options.indexes;
  }
  return table;
}

/** Map ColumnType to SQL type */
function toSQLType(col: ColumnDef): string {
  switch (col.type) {
    case "string":
      return "TEXT";
    case "number":
    case "u64":
      return "INTEGER";
    case "boolean":
      return "INTEGER"; // 0/1
    default:
      return "TEXT";
  }
}

/** Format a default value for SQL */
function formatDefault(value: string | number | boolean): string {
  if (typeof value === "string") return `DEFAULT '${value}'`;
  if (typeof value === "boolean") return `DEFAULT ${value ? 1 : 0}`;
  return `DEFAULT ${value}`;
}

/** Generate CREATE TABLE SQL from a TableDef */
export function tableToSQL(table: TableDef): string {
  const cols: string[] = [];
  for (const [name, def] of Object.entries(table.columns)) {
    let line = `  ${name} ${toSQLType(def)}`;
    if (def.primary) line += " PRIMARY KEY";
    if (!def.optional && !def.primary) line += " NOT NULL";
    if (def.defaultValue !== undefined) line += ` ${formatDefault(def.defaultValue)}`;
    if (def.foreignKey) line += ` REFERENCES ${def.foreignKey.table}(${def.foreignKey.column})`;
    cols.push(line);
  }
  return `CREATE TABLE IF NOT EXISTS ${table.name} (\n${cols.join(",\n")}\n)`;
}

/** Generate all CREATE TABLE and CREATE INDEX statements for a schema */
export function schemaToSQL(schema: SchemaDef): string[] {
  const statements: string[] = [];
  for (const table of Object.values(schema)) {
    statements.push(tableToSQL(table));
    if (table.indexes) {
      for (const idx of table.indexes) {
        const unique = idx.unique ? "UNIQUE " : "";
        statements.push(
          `CREATE ${unique}INDEX IF NOT EXISTS ${idx.name} ON ${table.name}(${idx.columns.join(", ")})`,
        );
      }
    }
  }
  return statements;
}

/** Extract table names from a schema (for IDB object store creation) */
export function schemaTableNames(schema: SchemaDef): string[] {
  return Object.values(schema).map((t) => t.name);
}
