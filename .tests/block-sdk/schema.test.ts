import { describe, expect, it } from "vitest";
import {
  defineTable,
  schemaTableNames,
  schemaToSQL,
  t,
  tableToSQL,
} from "@spike-land-ai/block-sdk";

describe("Schema DSL", () => {
  describe("defineTable", () => {
    it("creates a table definition from column builders", () => {
      const table = defineTable("users", {
        id: t.string().primaryKey(),
        name: t.string(),
        age: t.number().optional(),
      });

      expect(table.name).toBe("users");
      expect(table.columns.id).toEqual({ type: "string", primary: true, optional: false });
      expect(table.columns.name).toEqual({ type: "string", primary: false, optional: false });
      expect(table.columns.age).toEqual({ type: "number", primary: false, optional: true });
    });

    it("handles enum columns", () => {
      const table = defineTable("tasks", {
        status: t.enum(["pending", "done"]),
      });
      expect(table.columns.status).toEqual({
        type: "string",
        primary: false,
        optional: false,
        enumValues: ["pending", "done"],
      });
    });

    it("handles u64 and boolean types", () => {
      const table = defineTable("events", {
        timestamp: t.u64(),
        active: t.boolean(),
      });
      expect(table.columns.timestamp!.type).toBe("u64");
      expect(table.columns.active!.type).toBe("boolean");
    });
  });

  describe("tableToSQL", () => {
    it("generates CREATE TABLE with correct types", () => {
      const table = defineTable("tasks", {
        id: t.string().primaryKey(),
        title: t.string(),
        count: t.number(),
        active: t.boolean(),
        created: t.u64(),
        notes: t.string().optional(),
      });

      const sql = tableToSQL(table);
      expect(sql).toContain("CREATE TABLE IF NOT EXISTS tasks");
      expect(sql).toContain("id TEXT PRIMARY KEY");
      expect(sql).toContain("title TEXT NOT NULL");
      expect(sql).toContain("count INTEGER NOT NULL");
      expect(sql).toContain("active INTEGER NOT NULL");
      expect(sql).toContain("created INTEGER NOT NULL");
      // Optional columns should NOT have NOT NULL
      expect(sql).toMatch(/notes TEXT(?!\s+NOT NULL)/);
    });
  });

  describe("schemaToSQL", () => {
    it("generates SQL for all tables in schema", () => {
      const schema = {
        users: defineTable("users", { id: t.string().primaryKey() }),
        tasks: defineTable("tasks", { id: t.string().primaryKey(), title: t.string() }),
      };

      const sqls = schemaToSQL(schema);
      expect(sqls).toHaveLength(2);
      expect(sqls[0]).toContain("CREATE TABLE IF NOT EXISTS users");
      expect(sqls[1]).toContain("CREATE TABLE IF NOT EXISTS tasks");
    });
  });

  describe("schemaTableNames", () => {
    it("extracts table names from schema", () => {
      const schema = {
        users: defineTable("users", { id: t.string().primaryKey() }),
        tasks: defineTable("tasks", { id: t.string().primaryKey() }),
      };

      const names = schemaTableNames(schema);
      expect(names).toEqual(["users", "tasks"]);
    });
  });

  describe("toSQLType default branch", () => {
    it("returns TEXT for unknown column type", () => {
      const table = defineTable("test", {
        col: t.string(),
      });
      // Force the type to an unknown value to hit the default branch
      (table.columns["col"] as { type: string }).type = "unknown_type";
      const sql = tableToSQL(table);
      expect(sql).toContain("col TEXT");
    });
  });

  describe("ColumnBuilder chaining", () => {
    it("primaryKey and optional are chainable and state is reflected", () => {
      const col = t.string().primaryKey();
      expect(col._def.primary).toBe(true);
      expect(col._def.optional).toBe(false);

      const col2 = t.number().optional();
      expect(col2._def.optional).toBe(true);
      expect(col2._def.primary).toBe(false);
    });

    it("enum column has enumValues in _def", () => {
      const col = t.enum(["a", "b", "c"]);
      expect(col._def.enumValues).toEqual(["a", "b", "c"]);
      expect(col._def.type).toBe("string");
    });
  });

  describe(".default()", () => {
    it("sets string default value", () => {
      const col = t.string().default("pending");
      expect(col._def.defaultValue).toBe("pending");
    });

    it("sets number default value", () => {
      const col = t.number().default(0);
      expect(col._def.defaultValue).toBe(0);
    });

    it("sets boolean default value", () => {
      const col = t.boolean().default(true);
      expect(col._def.defaultValue).toBe(true);
    });

    it("generates DEFAULT 'value' for string defaults in SQL", () => {
      const table = defineTable("tasks", {
        id: t.string().primaryKey(),
        status: t.string().default("pending"),
      });
      const sql = tableToSQL(table);
      expect(sql).toContain("status TEXT NOT NULL DEFAULT 'pending'");
    });

    it("generates DEFAULT 0 for number defaults in SQL", () => {
      const table = defineTable("counters", {
        id: t.string().primaryKey(),
        count: t.number().default(0),
      });
      const sql = tableToSQL(table);
      expect(sql).toContain("count INTEGER NOT NULL DEFAULT 0");
    });

    it("generates DEFAULT 1 for true and DEFAULT 0 for false in SQL", () => {
      const table = defineTable("flags", {
        id: t.string().primaryKey(),
        active: t.boolean().default(true),
        deleted: t.boolean().default(false),
      });
      const sql = tableToSQL(table);
      expect(sql).toContain("active INTEGER NOT NULL DEFAULT 1");
      expect(sql).toContain("deleted INTEGER NOT NULL DEFAULT 0");
    });
  });

  describe(".references()", () => {
    it("sets foreignKey on column def", () => {
      const col = t.string().references("users", "id");
      expect(col._def.foreignKey).toEqual({ table: "users", column: "id" });
    });

    it("generates REFERENCES clause in SQL", () => {
      const table = defineTable("tasks", {
        id: t.string().primaryKey(),
        user_id: t.string().references("users", "id"),
      });
      const sql = tableToSQL(table);
      expect(sql).toContain("user_id TEXT NOT NULL REFERENCES users(id)");
    });

    it("combines default and references", () => {
      const table = defineTable("tasks", {
        id: t.string().primaryKey(),
        status: t.string().default("open").references("statuses", "name"),
      });
      const sql = tableToSQL(table);
      expect(sql).toContain("status TEXT NOT NULL DEFAULT 'open' REFERENCES statuses(name)");
    });
  });

  describe("indexes", () => {
    it("defineTable accepts indexes option", () => {
      const table = defineTable(
        "tasks",
        { id: t.string().primaryKey(), user_id: t.string() },
        { indexes: [{ name: "idx_tasks_user", columns: ["user_id"] }] },
      );
      expect(table.indexes).toEqual([{ name: "idx_tasks_user", columns: ["user_id"] }]);
    });

    it("defineTable without indexes option has no indexes field", () => {
      const table = defineTable("tasks", { id: t.string().primaryKey() });
      expect(table.indexes).toBeUndefined();
    });

    it("schemaToSQL generates CREATE INDEX statements", () => {
      const schema = {
        tasks: defineTable(
          "tasks",
          { id: t.string().primaryKey(), user_id: t.string(), status: t.string() },
          { indexes: [{ name: "idx_tasks_user", columns: ["user_id"] }] },
        ),
      };
      const sqls = schemaToSQL(schema);
      expect(sqls).toHaveLength(2);
      expect(sqls[1]).toBe("CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id)");
    });

    it("schemaToSQL generates CREATE UNIQUE INDEX for unique indexes", () => {
      const schema = {
        users: defineTable(
          "users",
          { id: t.string().primaryKey(), email: t.string() },
          { indexes: [{ name: "idx_users_email", columns: ["email"], unique: true }] },
        ),
      };
      const sqls = schemaToSQL(schema);
      expect(sqls[1]).toBe("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)");
    });

    it("schemaToSQL generates multi-column index", () => {
      const schema = {
        tasks: defineTable(
          "tasks",
          { id: t.string().primaryKey(), user_id: t.string(), status: t.string() },
          { indexes: [{ name: "idx_tasks_user_status", columns: ["user_id", "status"] }] },
        ),
      };
      const sqls = schemaToSQL(schema);
      expect(sqls[1]).toBe(
        "CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status)",
      );
    });

    it("schemaToSQL generates multiple indexes per table", () => {
      const schema = {
        tasks: defineTable(
          "tasks",
          { id: t.string().primaryKey(), user_id: t.string(), status: t.string() },
          {
            indexes: [
              { name: "idx_tasks_user", columns: ["user_id"] },
              { name: "idx_tasks_status", columns: ["status"], unique: false },
            ],
          },
        ),
      };
      const sqls = schemaToSQL(schema);
      expect(sqls).toHaveLength(3);
      expect(sqls[1]).toContain("idx_tasks_user");
      expect(sqls[2]).toContain("idx_tasks_status");
    });
  });

  describe("combined features", () => {
    it("full table with defaults, references, and indexes", () => {
      const schema = {
        tasks: defineTable(
          "tasks",
          {
            id: t.string().primaryKey(),
            title: t.string(),
            status: t.string().default("pending"),
            user_id: t.string().references("users", "id"),
            priority: t.number().default(0),
          },
          {
            indexes: [
              { name: "idx_tasks_user", columns: ["user_id"] },
              { name: "idx_tasks_status_priority", columns: ["status", "priority"], unique: false },
            ],
          },
        ),
      };

      const sqls = schemaToSQL(schema);
      expect(sqls).toHaveLength(3);

      const createTable = sqls[0];
      expect(createTable).toContain("status TEXT NOT NULL DEFAULT 'pending'");
      expect(createTable).toContain("user_id TEXT NOT NULL REFERENCES users(id)");
      expect(createTable).toContain("priority INTEGER NOT NULL DEFAULT 0");

      expect(sqls[1]).toBe("CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id)");
      expect(sqls[2]).toBe(
        "CREATE INDEX IF NOT EXISTS idx_tasks_status_priority ON tasks(status, priority)",
      );
    });
  });
});
