/**
 * Cloudflare Worker entry point for the task-queue block.
 *
 * Exposes block procedures as HTTP endpoints via Hono.
 * Storage: D1 (SQL) + optional KV + R2.
 */

import { d1Adapter } from "@spike-land-ai/block-sdk/adapters/d1";
import type { D1Database, KVNamespace, R2Bucket } from "@spike-land-ai/block-sdk/adapters/d1";
import { taskQueue } from "./index.js";

interface Env {
  DB: D1Database;
  KV?: KVNamespace | undefined;
  BUCKET?: R2Bucket | undefined;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const storage = d1Adapter({ db: env.DB, kv: env.KV, r2: env.BUCKET });

    // Initialize schema on first request (idempotent)
    await taskQueue.initialize(storage);

    const url = new URL(request.url);
    const path = url.pathname;

    // Simple routing: POST /rpc/<tool_name>
    if (request.method === "POST" && path.startsWith("/rpc/")) {
      const toolName = path.slice("/rpc/".length);
      const userId = request.headers.get("x-user-id") ?? "anonymous";
      const tools = taskQueue.getTools(storage, userId);
      const tool = tools.find((t) => t.name === toolName);

      if (!tool) {
        return Response.json({ error: "Tool not found" }, { status: 404 });
      }

      const body = await request.json() as Record<string, unknown>;
      const result = await tool.handler(body as Parameters<typeof tool.handler>[0]);

      return Response.json(result, {
        status: result.isError ? 400 : 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // GET /tools — list available tools
    if (request.method === "GET" && path === "/tools") {
      const toolNames = taskQueue.toolNames;
      return Response.json({ tools: toolNames, block: taskQueue.name, version: taskQueue.version });
    }

    // GET /health
    if (request.method === "GET" && path === "/health") {
      return Response.json({ ok: true, block: taskQueue.name, version: taskQueue.version });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
};
