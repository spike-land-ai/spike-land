import { describe, expect, it } from "vitest";
import {
  createMemoryAdapter,
  defineBlock,
  defineTable,
  t,
} from "@spike-land-ai/block-sdk";
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
    const added = JSON.parse(addResult.content[0]!.text!);
    expect(added.name).toBe("widget");
    expect(added.id).toBeTruthy();

    // List items
    const listResult = await procs.listItems.handler({});
    const items = JSON.parse(listResult.content[0]!.text!);
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
});
