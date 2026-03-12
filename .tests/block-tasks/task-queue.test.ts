import { describe, expect, it } from "vitest";
import { createMemoryAdapter } from "@spike-land-ai/block-sdk";
import { taskQueue } from "@spike-land-ai/block-tasks";
import type { Task } from "@spike-land-ai/block-tasks";

describe("taskQueue block", () => {
  it("has correct name and version", () => {
    expect(taskQueue.name).toBe("task-queue");
    expect(taskQueue.version).toBe("1.0.0");
  });

  it("generates schema migration for tasks table", () => {
    expect(taskQueue.migrations).toHaveLength(1);
    expect(taskQueue.migrations[0]).toContain("CREATE TABLE IF NOT EXISTS tasks");
    expect(taskQueue.migrations[0]).toContain("id TEXT PRIMARY KEY");
    expect(taskQueue.migrations[0]).toContain("title TEXT NOT NULL");
    expect(taskQueue.migrations[0]).toContain("status TEXT NOT NULL");
  });

  it("auto-discovers all 6 tool names", () => {
    expect(taskQueue.toolNames.sort()).toEqual([
      "claim_task",
      "complete_task",
      "create_task",
      "delete_task",
      "get_task",
      "list_tasks",
    ]);
  });

  describe("procedures", () => {
    async function setup() {
      const storage = createMemoryAdapter();
      await taskQueue.initialize(storage);
      const procs = taskQueue.createProcedures(storage, "alice");
      return { storage, procs };
    }

    it("create_task creates a pending task", async () => {
      const { procs } = await setup();
      const result = await procs.createTask.handler({
        title: "Fix bug",
        description: "Fix the login bug",
      });

      expect(result.isError).toBeUndefined();
      const task = JSON.parse(result.content[0]?.text) as Task;
      expect(task.title).toBe("Fix bug");
      expect(task.description).toBe("Fix the login bug");
      expect(task.status).toBe("pending");
      expect(task.assignee).toBe("");
      expect(task.id).toBeTruthy();
      expect(task.created).toBeGreaterThan(0);
    });

    it("list_tasks returns all tasks", async () => {
      const { procs } = await setup();
      await procs.createTask.handler({ title: "Task 1", description: "" });
      await procs.createTask.handler({ title: "Task 2", description: "" });

      const result = await procs.listTasks.handler({});
      const tasks = JSON.parse(result.content[0]?.text) as Task[];
      expect(tasks).toHaveLength(2);
    });

    it("list_tasks filters by status", async () => {
      const { procs } = await setup();
      await procs.createTask.handler({ title: "Pending 1", description: "" });

      const createResult = await procs.createTask.handler({ title: "To Claim", description: "" });
      const task = JSON.parse(createResult.content[0]?.text) as Task;
      await procs.claimTask.handler({ taskId: task.id });

      const pendingResult = await procs.listTasks.handler({ status: "pending" });
      const pending = JSON.parse(pendingResult.content[0]?.text) as Task[];
      expect(pending).toHaveLength(1);
      expect(pending[0]?.title).toBe("Pending 1");

      const claimedResult = await procs.listTasks.handler({ status: "claimed" });
      const claimed = JSON.parse(claimedResult.content[0]?.text) as Task[];
      expect(claimed).toHaveLength(1);
      expect(claimed[0]?.title).toBe("To Claim");
    });

    it("get_task returns a specific task", async () => {
      const { procs } = await setup();
      const createResult = await procs.createTask.handler({
        title: "My Task",
        description: "details",
      });
      const created = JSON.parse(createResult.content[0]?.text) as Task;

      const getResult = await procs.getTask.handler({ taskId: created.id });
      const task = JSON.parse(getResult.content[0]?.text) as Task;
      expect(task.title).toBe("My Task");
      expect(task.description).toBe("details");
    });

    it("get_task returns error for missing task", async () => {
      const { procs } = await setup();
      const result = await procs.getTask.handler({ taskId: "nonexistent" });
      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain("NOT_FOUND");
    });

    it("claim_task claims a pending task", async () => {
      const { procs } = await setup();
      const createResult = await procs.createTask.handler({ title: "Claimable", description: "" });
      const task = JSON.parse(createResult.content[0]?.text) as Task;

      const claimResult = await procs.claimTask.handler({ taskId: task.id });
      expect(claimResult.isError).toBeUndefined();
      const data = JSON.parse(claimResult.content[0]?.text);
      expect(data.claimed).toBe(true);
      expect(data.assignee).toBe("alice");

      // Verify the task is now claimed
      const getResult = await procs.getTask.handler({ taskId: task.id });
      const updated = JSON.parse(getResult.content[0]?.text) as Task;
      expect(updated.status).toBe("claimed");
      expect(updated.assignee).toBe("alice");
    });

    it("claim_task fails if already claimed", async () => {
      const { procs } = await setup();
      const createResult = await procs.createTask.handler({ title: "Race", description: "" });
      const task = JSON.parse(createResult.content[0]?.text) as Task;

      await procs.claimTask.handler({ taskId: task.id });

      // Second claim should fail
      const secondClaim = await procs.claimTask.handler({ taskId: task.id });
      expect(secondClaim.isError).toBe(true);
      expect(secondClaim.content[0]?.text).toContain("ALREADY_CLAIMED");
    });

    it("complete_task marks a claimed task as done", async () => {
      const { procs } = await setup();
      const createResult = await procs.createTask.handler({ title: "Finishable", description: "" });
      const task = JSON.parse(createResult.content[0]?.text) as Task;

      await procs.claimTask.handler({ taskId: task.id });
      const completeResult = await procs.completeTask.handler({ taskId: task.id });
      expect(completeResult.isError).toBeUndefined();
      const data = JSON.parse(completeResult.content[0]?.text);
      expect(data.completed).toBe(true);

      // Verify status
      const getResult = await procs.getTask.handler({ taskId: task.id });
      const updated = JSON.parse(getResult.content[0]?.text) as Task;
      expect(updated.status).toBe("done");
    });

    it("complete_task fails if not claimed by current user", async () => {
      const { storage } = await setup();

      // Create as alice, claim as alice
      const aliceProcs = taskQueue.createProcedures(storage, "alice");
      const createResult = await aliceProcs.createTask.handler({
        title: "Alice's task",
        description: "",
      });
      const task = JSON.parse(createResult.content[0]?.text) as Task;
      await aliceProcs.claimTask.handler({ taskId: task.id });

      // Try to complete as bob
      const bobProcs = taskQueue.createProcedures(storage, "bob");
      const result = await bobProcs.completeTask.handler({ taskId: task.id });
      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain("NOT_CLAIMABLE");
    });

    it("delete_task removes a task", async () => {
      const { procs } = await setup();
      const createResult = await procs.createTask.handler({ title: "Deletable", description: "" });
      const task = JSON.parse(createResult.content[0]?.text) as Task;

      const deleteResult = await procs.deleteTask.handler({ taskId: task.id });
      expect(deleteResult.isError).toBeUndefined();
      const data = JSON.parse(deleteResult.content[0]?.text);
      expect(data.deleted).toBe(true);

      // Verify it's gone
      const getResult = await procs.getTask.handler({ taskId: task.id });
      expect(getResult.isError).toBe(true);
    });

    it("delete_task returns error for missing task", async () => {
      const { procs } = await setup();
      const result = await procs.deleteTask.handler({ taskId: "ghost" });
      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain("NOT_FOUND");
    });
  });

  describe("MCP tools integration", () => {
    it("getTools returns functional BuiltTool array", async () => {
      const storage = createMemoryAdapter();
      await taskQueue.initialize(storage);

      const tools = taskQueue.getTools(storage, "mcp-user");
      expect(tools).toHaveLength(6);

      // Use a tool through getTools
      const createTool = tools.find((t) => t.name === "create_task");
      const result = await createTool.handler({ title: "MCP task", description: "via tools" });
      expect(result.isError).toBeUndefined();

      const listTool = tools.find((t) => t.name === "list_tasks");
      const listResult = await listTool.handler({});
      const items = JSON.parse(listResult.content[0]?.text);
      expect(items).toHaveLength(1);
    });
  });
});
