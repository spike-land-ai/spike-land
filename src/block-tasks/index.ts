/**
 * @spike-land-ai/block-tasks
 *
 * Proof-of-concept full-stack block — a task queue with:
 *   - CRUD operations (create, list, get, delete)
 *   - Claim workflow (claim → complete)
 *   - React UI components (TaskList, TaskBoard)
 *   - Auto-registered MCP tools
 */

import { defineBlock, defineTable, t } from "@spike-land-ai/block-sdk";
import { z } from "zod";

/** Task status enum values */
export const TASK_STATUSES = ["pending", "claimed", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

/** Task row shape */
export interface Task {
  [key: string]: unknown;
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignee: string;
  created: number;
  updated: number;
}

/** The task queue block definition */
export const taskQueue = defineBlock({
  name: "task-queue",
  version: "1.0.0",

  storage: {
    tasks: defineTable("tasks", {
      id: t.string().primaryKey(),
      title: t.string(),
      description: t.string().default(""),
      status: t.string().default("pending"),
      assignee: t.string().default(""),
      created: t.u64(),
      updated: t.u64(),
    }),
  },

  procedures: (ctx) => ({
    createTask: ctx.procedure
      .tool("create_task", "Create a new task in the queue", {
        title: z.string().min(1).max(200),
        description: z.string().max(2000).default(""),
      })
      .handler(async ({ input, ctx: blockCtx }) => {
        const now = Date.now();
        const task: Task = {
          id: blockCtx.nanoid(12),
          title: input.title,
          description: input.description,
          status: "pending",
          assignee: "",
          created: now,
          updated: now,
        };
        await blockCtx.storage.sql.execute(
          "INSERT INTO tasks (id, title, description, status, assignee, created, updated) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [task.id, task.title, task.description, task.status, task.assignee, task.created, task.updated],
        );
        return {
          content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
        };
      }),

    listTasks: ctx.procedure
      .tool("list_tasks", "List tasks with optional status filter", {
        status: z.enum(TASK_STATUSES).optional(),
      })
      .handler(async ({ input, ctx: blockCtx }) => {
        let result;
        if (input.status) {
          result = await blockCtx.storage.sql.execute<Task>(
            "SELECT * FROM tasks WHERE status = ?",
            [input.status],
          );
        } else {
          result = await blockCtx.storage.sql.execute<Task>("SELECT * FROM tasks");
        }
        return {
          content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }],
        };
      }),

    getTask: ctx.procedure
      .tool("get_task", "Get a single task by ID", {
        taskId: z.string(),
      })
      .handler(async ({ input, ctx: blockCtx }) => {
        const result = await blockCtx.storage.sql.execute<Task>(
          "SELECT * FROM tasks WHERE id = ?",
          [input.taskId],
        );
        if (result.rows.length === 0) {
          return {
            content: [{ type: "text", text: "**Error: NOT_FOUND**\nTask not found\n**Retryable:** false" }],
            isError: true,
          };
        }
        return {
          content: [{ type: "text", text: JSON.stringify(result.rows[0], null, 2) }],
        };
      }),

    claimTask: ctx.procedure
      .tool("claim_task", "Claim a pending task for the current user", {
        taskId: z.string(),
      })
      .handler(async ({ input, ctx: blockCtx }) => {
        const now = Date.now();
        const result = await blockCtx.storage.sql.execute(
          "UPDATE tasks SET status = ?, assignee = ?, updated = ? WHERE id = ? AND status = ?",
          ["claimed", blockCtx.userId, now, input.taskId, "pending"],
        );
        if (result.rowsAffected === 0) {
          return {
            content: [{ type: "text", text: "**Error: ALREADY_CLAIMED**\nTask is not available for claiming\n**Retryable:** false" }],
            isError: true,
          };
        }
        return {
          content: [{ type: "text", text: JSON.stringify({ claimed: true, taskId: input.taskId, assignee: blockCtx.userId }) }],
        };
      }),

    completeTask: ctx.procedure
      .tool("complete_task", "Mark a claimed task as done", {
        taskId: z.string(),
      })
      .handler(async ({ input, ctx: blockCtx }) => {
        const now = Date.now();
        const result = await blockCtx.storage.sql.execute(
          "UPDATE tasks SET status = ?, updated = ? WHERE id = ? AND assignee = ? AND status = ?",
          ["done", now, input.taskId, blockCtx.userId, "claimed"],
        );
        if (result.rowsAffected === 0) {
          return {
            content: [{ type: "text", text: "**Error: NOT_CLAIMABLE**\nTask is not claimed by you or does not exist\n**Retryable:** false" }],
            isError: true,
          };
        }
        return {
          content: [{ type: "text", text: JSON.stringify({ completed: true, taskId: input.taskId }) }],
        };
      }),

    deleteTask: ctx.procedure
      .tool("delete_task", "Delete a task by ID", {
        taskId: z.string(),
      })
      .handler(async ({ input, ctx: blockCtx }) => {
        const result = await blockCtx.storage.sql.execute(
          "DELETE FROM tasks WHERE id = ?",
          [input.taskId],
        );
        if (result.rowsAffected === 0) {
          return {
            content: [{ type: "text", text: "**Error: NOT_FOUND**\nTask not found\n**Retryable:** false" }],
            isError: true,
          };
        }
        return {
          content: [{ type: "text", text: JSON.stringify({ deleted: true, taskId: input.taskId }) }],
        };
      }),
  }),

  tools: "auto",
});

export default taskQueue;
