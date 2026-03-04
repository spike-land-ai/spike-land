// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createMemoryAdapter, defineBlock, defineTable, t } from "@spike-land-ai/block-sdk";
import { createBlockClient, createBlockHooks } from "@spike-land-ai/block-sdk/react";
import { z } from "zod";

const testBlock = defineBlock({
  name: "react-test",
  version: "1.0.0",
  storage: {
    items: defineTable("items", {
      id: t.string().primaryKey(),
      label: t.string(),
      done: t.boolean(),
    }),
  },
  procedures: (ctx) => ({
    addItem: ctx.procedure
      .tool("add_item", "Add item", { label: z.string() })
      .handler(async ({ input, ctx: blockCtx }) => {
        const id = blockCtx.nanoid(8);
        await blockCtx.storage.sql.execute(
          "INSERT INTO items (id, label, done) VALUES (?, ?, ?)",
          [id, input.label, 0],
        );
        return { content: [{ type: "text", text: JSON.stringify({ id, label: input.label }) }] };
      }),
    toggleItem: ctx.procedure
      .tool("toggle_item", "Toggle done", { id: z.string() })
      .handler(async ({ input, ctx: blockCtx }) => {
        await blockCtx.storage.sql.execute(
          "UPDATE items SET done = ? WHERE id = ?",
          [1, input.id],
        );
        return { content: [{ type: "text", text: JSON.stringify({ toggled: true }) }] };
      }),
  }),
  tools: "auto",
});

describe("createBlockClient", () => {
  it("creates a client with call and query methods", async () => {
    const storage = createMemoryAdapter();
    await testBlock.initialize(storage);

    const client = createBlockClient(testBlock, storage, { userId: "user-1" });
    expect(typeof client.call).toBe("function");
    expect(typeof client.query).toBe("function");
    expect(typeof client.subscribe).toBe("function");
    expect(client.storage).toBe(storage);
  });

  it("call executes procedures", async () => {
    const storage = createMemoryAdapter();
    await testBlock.initialize(storage);

    const client = createBlockClient(testBlock, storage, { userId: "user-1" });
    const result = await client.call("addItem", { label: "test" });
    expect(result.isError).toBeUndefined();

    const data = JSON.parse(result.content[0]!.text!);
    expect(data.label).toBe("test");
  });

  it("call throws on unknown procedure", async () => {
    const storage = createMemoryAdapter();
    await testBlock.initialize(storage);

    const client = createBlockClient(testBlock, storage, { userId: "user-1" });
    await expect(
      client.call("nonExistent" as never, {}),
    ).rejects.toThrow("Unknown procedure");
  });

  it("query reads from storage", async () => {
    const storage = createMemoryAdapter();
    await testBlock.initialize(storage);

    const client = createBlockClient(testBlock, storage, { userId: "user-1" });

    // Add some items
    await client.call("addItem", { label: "alpha" });
    await client.call("addItem", { label: "beta" });

    const items = await client.query("items");
    expect(items).toHaveLength(2);
    expect(items.map((i: Record<string, unknown>) => i.label).sort()).toEqual(["alpha", "beta"]);
  });

  it("query filters with partial match", async () => {
    const storage = createMemoryAdapter();
    await testBlock.initialize(storage);

    const client = createBlockClient(testBlock, storage, { userId: "user-1" });
    await client.call("addItem", { label: "a" });
    await client.call("addItem", { label: "b" });

    // Toggle second item to done
    const all = await client.query("items");
    const second = all[1] as { id: string };
    await client.call("toggleItem", { id: second.id });

    const doneItems = await client.query("items", { done: 1 });
    expect(doneItems).toHaveLength(1);
  });

  describe("subscribe", () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

    it("returns a subscription handle", async () => {
      const storage = createMemoryAdapter();
      await testBlock.initialize(storage);

      const client = createBlockClient(testBlock, storage, {
        userId: "user-1",
        pollInterval: 100,
      });

      const sub = client.subscribe("items");
      expect(typeof sub.getSnapshot).toBe("function");
      expect(typeof sub.subscribe).toBe("function");
    });

    it("snapshot starts empty", async () => {
      const storage = createMemoryAdapter();
      await testBlock.initialize(storage);

      const client = createBlockClient(testBlock, storage, {
        userId: "user-1",
        pollInterval: 100,
      });

      const sub = client.subscribe("items");
      expect(sub.getSnapshot()).toEqual([]);
    });

    it("notifies listeners on data change", async () => {
      const storage = createMemoryAdapter();
      await testBlock.initialize(storage);

      const client = createBlockClient(testBlock, storage, {
        userId: "user-1",
        pollInterval: 50,
      });

      const sub = client.subscribe("items");
      const listener = vi.fn();

      const unsub = sub.subscribe(listener);

      // Wait for initial poll
      await vi.advanceTimersByTimeAsync(10);

      // Add an item
      await client.call("addItem", { label: "live-item" });

      // Advance past poll interval
      await vi.advanceTimersByTimeAsync(100);

      // Listener should have been called
      expect(listener).toHaveBeenCalled();
      expect(sub.getSnapshot()).toHaveLength(1);

      unsub();
    });

    it("stops polling on unsubscribe", async () => {
      const storage = createMemoryAdapter();
      await testBlock.initialize(storage);

      const client = createBlockClient(testBlock, storage, {
        userId: "user-1",
        pollInterval: 50,
      });

      const sub = client.subscribe("items");
      const listener = vi.fn();
      const unsub = sub.subscribe(listener);

      await vi.advanceTimersByTimeAsync(10);
      unsub();

      // Reset call count
      listener.mockClear();

      // Add item and advance — listener should NOT be called
      await client.call("addItem", { label: "after-unsub" });
      await vi.advanceTimersByTimeAsync(200);

      expect(listener).not.toHaveBeenCalled();
    });

    it("subscribe with filter builds WHERE clause", async () => {
      const storage = createMemoryAdapter();
      await testBlock.initialize(storage);

      const client = createBlockClient(testBlock, storage, {
        userId: "user-1",
        pollInterval: 50,
      });

      // Add items
      await client.call("addItem", { label: "x" });
      await client.call("addItem", { label: "y" });

      // Toggle first item
      const all = await client.query("items");
      const first = all[0] as { id: string };
      await client.call("toggleItem", { id: first.id });

      // Subscribe with filter — only done items
      const sub = client.subscribe("items", { done: 1 });
      const listener = vi.fn();
      const unsub = sub.subscribe(listener);

      await vi.advanceTimersByTimeAsync(100);

      // Snapshot should contain only the done item
      const snapshot = sub.getSnapshot();
      expect(snapshot).toHaveLength(1);

      unsub();
    });

    it("subscribe without filter returns all rows", async () => {
      const storage = createMemoryAdapter();
      await testBlock.initialize(storage);

      const client = createBlockClient(testBlock, storage, {
        userId: "user-1",
        pollInterval: 50,
      });

      await client.call("addItem", { label: "a" });
      await client.call("addItem", { label: "b" });
      await client.call("addItem", { label: "c" });

      const sub = client.subscribe("items", {});
      const listener = vi.fn();
      const unsub = sub.subscribe(listener);

      await vi.advanceTimersByTimeAsync(100);

      expect(sub.getSnapshot()).toHaveLength(3);
      unsub();
    });
  });
});

describe("createBlockHooks", () => {
  it("returns useBlock and useSubscription hooks", async () => {
    const storage = createMemoryAdapter();
    await testBlock.initialize(storage);

    const client = createBlockClient(testBlock, storage, { userId: "user-1" });
    const hooks = createBlockHooks(client);

    expect(typeof hooks.useBlock).toBe("function");
    expect(typeof hooks.useSubscription).toBe("function");
  });

  it("useBlock returns the client", async () => {
    const storage = createMemoryAdapter();
    await testBlock.initialize(storage);

    const client = createBlockClient(testBlock, storage, { userId: "user-1" });
    const { useBlock } = createBlockHooks(client);

    expect(useBlock()).toBe(client);
  });

  it("useSubscription returns snapshot", async () => {
    const { renderHook } = await import("@testing-library/react");
    const storage = createMemoryAdapter();
    await testBlock.initialize(storage);

    const client = createBlockClient(testBlock, storage, { userId: "user-1" });
    const { useSubscription } = createBlockHooks(client);

    // Initially empty
    const { result } = renderHook(() => useSubscription("items"));
    expect(result.current).toEqual([]);
  });

  it("getOrCreateSub caches subscription on repeated calls", async () => {
    const { renderHook } = await import("@testing-library/react");
    const storage = createMemoryAdapter();
    await testBlock.initialize(storage);

    const client = createBlockClient(testBlock, storage, { userId: "user-1" });
    const { useSubscription } = createBlockHooks(client);

    // Call useSubscription twice for same table/filter - should return same cached sub
    const { result: r1 } = renderHook(() => useSubscription("items"));
    const { result: r2 } = renderHook(() => useSubscription("items"));
    expect(r1.current).toEqual(r2.current);
  });
});

describe("subscribe - multiple listeners", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("multiple listeners on same subscription all get notified", async () => {
    const storage = createMemoryAdapter();
    await testBlock.initialize(storage);

    const client = createBlockClient(testBlock, storage, {
      userId: "user-1",
      pollInterval: 50,
    });

    const sub = client.subscribe("items");
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    const unsub1 = sub.subscribe(listener1);
    // Second subscribe after first — should not restart polling
    const unsub2 = sub.subscribe(listener2);

    await client.call("addItem", { label: "shared" });
    await vi.advanceTimersByTimeAsync(100);

    expect(listener1).toHaveBeenCalled();
    expect(listener2).toHaveBeenCalled();

    unsub1();
    // Timer still running (listener2 active)
    listener1.mockClear();
    listener2.mockClear();

    await client.call("addItem", { label: "another" });
    await vi.advanceTimersByTimeAsync(100);

    // listener1 unsubscribed, should not receive
    expect(listener1).not.toHaveBeenCalled();
    // listener2 still active
    expect(listener2).toHaveBeenCalled();

    unsub2();
  });
});
