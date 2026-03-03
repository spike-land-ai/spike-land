/**
 * Browser entry point for the task-queue block.
 *
 * Runs entirely in the browser with IndexedDB storage.
 * Can be embedded in a single HTML file or used as an ESM module.
 */

import { idbAdapter } from "@spike-land-ai/block-sdk/adapters/idb";
import { createBlockClient, createBlockHooks } from "@spike-land-ai/block-sdk/react";
import { taskQueue } from "./index.js";

/** Initialize the task queue block with IndexedDB storage */
export async function initTaskQueue(userId = "local-user") {
  const storage = idbAdapter({
    dbName: "block-task-queue",
    version: 1,
    tables: ["tasks"],
  });

  // Run migrations
  await taskQueue.initialize(storage);

  // Create the client
  const client = createBlockClient(taskQueue, storage, { userId, pollInterval: 500 });

  // Create React hooks
  const hooks = createBlockHooks(client);

  return {
    client,
    ...hooks,
    storage,
    block: taskQueue,
  };
}

// Re-export the block definition and types
export { taskQueue } from "./index.js";
export type { Task, TaskStatus } from "./index.js";
