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
});
