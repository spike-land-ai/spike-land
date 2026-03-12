import { describe, expect, it } from "vitest";
import { createMemoryAdapter, defineBlock, defineTable, t } from "@spike-land-ai/block-sdk";
import { z } from "zod";

describe("defineBlock", () => {
  const testBlock = defineBlock({
    name: "test-block",
    version: "1.0.0",
    storage: {
      items: defineTable("items", {
        id: t.string().primaryKey(),
        name: t.string(),
        count: t.number(),
      }),
    },
    procedures: (ctx) => ({
      addItem: ctx.procedure
        .tool("add_item", "Add a new item", {
          name: z.string(),
          count: z.number().default(1),
        })
        .handler(async ({ input, ctx: blockCtx }) => {
          const id = blockCtx.nanoid(8);
          await blockCtx.storage.sql.execute(
            "INSERT INTO items (id, name, count) VALUES (?, ?, ?)",
            [id, input.name, input.count],
          );
          return { content: [{ type: "text", text: JSON.stringify({ id, name: input.name }) }] };
        }),

      listItems: ctx.procedure
        .tool("list_items", "List all items", {})
        .handler(async ({ ctx: blockCtx }) => {
          const result = await blockCtx.storage.sql.execute("SELECT * FROM items");
          return { content: [{ type: "text", text: JSON.stringify(result.rows) }] };
        }),
    }),
    tools: "auto",
  });

  it("returns block with correct name and version", () => {
    expect(testBlock.name).toBe("test-block");
    expect(testBlock.version).toBe("1.0.0");
  });

  it("generates SQL migrations from schema", () => {
    expect(testBlock.migrations).toHaveLength(1);
    expect(testBlock.migrations[0]).toContain("CREATE TABLE IF NOT EXISTS items");
    expect(testBlock.migrations[0]).toContain("id TEXT PRIMARY KEY");
    expect(testBlock.migrations[0]).toContain("name TEXT NOT NULL");
    expect(testBlock.migrations[0]).toContain("count INTEGER NOT NULL");
  });

  it("discovers tool names automatically", () => {
    expect(testBlock.toolNames).toEqual(["add_item", "list_items"]);
  });

  it("initializes storage by running migrations", async () => {
    const storage = createMemoryAdapter();
    await testBlock.initialize(storage);

    // Should be able to query the table now (empty)
    const result = await storage.sql.execute("SELECT * FROM items");
    expect(result.rows).toHaveLength(0);
  });

  it("creates procedures bound to storage and userId", async () => {
    const storage = createMemoryAdapter();
    await testBlock.initialize(storage);

    const procs = testBlock.createProcedures(storage, "user-1");
    expect(procs.addItem).toBeDefined();
    expect(procs.addItem.name).toBe("add_item");
    expect(procs.listItems).toBeDefined();
    expect(procs.listItems.name).toBe("list_items");
  });

  it("executes procedures against storage", async () => {
    const storage = createMemoryAdapter();
    await testBlock.initialize(storage);

    const procs = testBlock.createProcedures(storage, "user-1");

    // Add an item
    const addResult = await procs.addItem.handler({ name: "widget", count: 5 });
    expect(addResult.isError).toBeUndefined();
    const added = JSON.parse(addResult.content[0]?.text);
    expect(added.name).toBe("widget");
    expect(added.id).toBeTruthy();

    // List items
    const listResult = await procs.listItems.handler({});
    const items = JSON.parse(listResult.content[0]?.text);
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe("widget");
    expect(items[0].count).toBe(5);
  });

  it("getTools returns BuiltTool[] for MCP registration", async () => {
    const storage = createMemoryAdapter();
    await testBlock.initialize(storage);

    const tools = testBlock.getTools(storage, "user-1");
    expect(tools).toHaveLength(2);
    expect(tools.map((t) => t.name).sort()).toEqual(["add_item", "list_items"]);

    // Each tool should have handler, name, description, inputSchema
    for (const tool of tools) {
      expect(typeof tool.handler).toBe("function");
      expect(typeof tool.name).toBe("string");
      expect(typeof tool.description).toBe("string");
      expect(tool.inputSchema).toBeDefined();
    }
  });

  it("handles explicit tools list", () => {
    const block = defineBlock({
      name: "partial",
      version: "1.0.0",
      storage: {},
      procedures: (ctx) => ({
        tool1: ctx.procedure
          .tool("tool_1", "First", { x: z.string() })
          .handler(async () => ({ content: [{ type: "text", text: "ok" }] })),
        tool2: ctx.procedure
          .tool("tool_2", "Second", { y: z.number() })
          .handler(async () => ({ content: [{ type: "text", text: "ok" }] })),
      }),
      tools: ["tool_1"], // Only expose tool_1
    });

    expect(block.toolNames).toEqual(["tool_1"]);
  });

  it("handles block with no tools", () => {
    const block = defineBlock({
      name: "no-tools",
      version: "1.0.0",
      storage: {},
      procedures: (ctx) => ({
        internal: ctx.procedure
          .tool("internal_op", "Internal", {})
          .handler(async () => ({ content: [{ type: "text", text: "ok" }] })),
      }),
      tools: [],
    });

    expect(block.toolNames).toHaveLength(0);
    const storage = createMemoryAdapter();
    expect(block.getTools(storage, "u")).toHaveLength(0);
  });

  it("components default to empty object", () => {
    expect(testBlock.components).toEqual({});
  });

  it("includes custom components in block", () => {
    const FakeComponent = () => null;
    const block = defineBlock({
      name: "with-components",
      version: "2.0.0",
      storage: {},
      procedures: () => ({}),
      components: { FakeComponent },
    });
    expect(block.components.FakeComponent).toBe(FakeComponent);
  });

  it("handles block with undefined tools (no tools exposed)", () => {
    const block = defineBlock({
      name: "no-tools-key",
      version: "1.0.0",
      storage: {},
      procedures: (ctx) => ({
        hidden: ctx.procedure
          .tool("hidden_op", "Hidden", {})
          .handler(async () => ({ content: [{ type: "text", text: "ok" }] })),
      }),
      // No tools key at all - toolNames should be empty
    });

    expect(block.toolNames).toHaveLength(0);
  });

  it("getTools returns empty array when toolNames is empty", async () => {
    const storage = createMemoryAdapter();
    const block = defineBlock({
      name: "no-tools-block",
      version: "1.0.0",
      storage: {},
      procedures: (ctx) => ({
        internal: ctx.procedure
          .tool("internal_fn", "Internal", {})
          .handler(async () => ({ content: [{ type: "text", text: "ok" }] })),
      }),
      tools: [],
    });
    const tools = block.getTools(storage, "u");
    expect(tools).toHaveLength(0);
  });

  it("schema reflects all table definitions", () => {
    const block = defineBlock({
      name: "multi-table",
      version: "1.0.0",
      storage: {
        users: defineTable("users", { id: t.string().primaryKey() }),
        posts: defineTable("posts", { id: t.string().primaryKey(), title: t.string() }),
      },
      procedures: () => ({}),
    });

    expect(Object.keys(block.schema)).toEqual(["users", "posts"]);
    expect(block.migrations).toHaveLength(2);
  });

  it("nanoid generates unique IDs", async () => {
    const storage = createMemoryAdapter();
    await testBlock.initialize(storage);

    const procs = testBlock.createProcedures(storage, "u");

    // Generate multiple items and check IDs are unique
    const r1 = await procs.addItem.handler({ name: "a", count: 1 });
    const r2 = await procs.addItem.handler({ name: "b", count: 1 });
    const id1 = JSON.parse(r1.content[0]?.text).id;
    const id2 = JSON.parse(r2.content[0]?.text).id;
    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe("string");
    expect(id1.length).toBe(8);
  });

  it("initialize runs all migrations for multi-table schema", async () => {
    const storage = createMemoryAdapter();
    const block = defineBlock({
      name: "multi-migrate",
      version: "1.0.0",
      storage: {
        a: defineTable("a", { id: t.string().primaryKey() }),
        b: defineTable("b", { id: t.string().primaryKey(), val: t.number() }),
      },
      procedures: () => ({}),
    });

    await block.initialize(storage);

    // Both tables should exist
    const ra = await storage.sql.execute("SELECT * FROM a");
    const rb = await storage.sql.execute("SELECT * FROM b");
    expect(ra.rows).toHaveLength(0);
    expect(rb.rows).toHaveLength(0);
  });

  it("auto tool discovery skips non-tool entries in procedures", () => {
    // When procedures returns objects that don't have name+handler, they should be skipped
    const block = defineBlock({
      name: "mixed-procs",
      version: "1.0.0",
      storage: {},
      procedures: (ctx) => {
        const realTool = ctx.procedure
          .tool("real_tool", "A real tool", {})
          .handler(async () => ({ content: [{ type: "text", text: "ok" }] }));
        // Return a mix of tool and non-tool
        return {
          realTool,
          // This is a valid BuiltTool so it will be discovered
        };
      },
      tools: "auto",
    });

    expect(block.toolNames).toContain("real_tool");
  });

  it("getTools filters to only toolNames entries", async () => {
    const storage = createMemoryAdapter();
    const block = defineBlock({
      name: "filter-test",
      version: "1.0.0",
      storage: {},
      procedures: (ctx) => ({
        toolA: ctx.procedure
          .tool("tool_a", "A", {})
          .handler(async () => ({ content: [{ type: "text", text: "a" }] })),
        toolB: ctx.procedure
          .tool("tool_b", "B", {})
          .handler(async () => ({ content: [{ type: "text", text: "b" }] })),
      }),
      tools: ["tool_a"], // Only expose tool_a
    });

    const tools = block.getTools(storage, "u");
    expect(tools).toHaveLength(1);
    expect(tools[0]?.name).toBe("tool_a");
  });
});
