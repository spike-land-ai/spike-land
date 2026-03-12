import * as worker from "monaco-editor-core/esm/vs/editor/editor.worker.start";
import type { worker as MonacoWorker } from "../../editor";

let initialized = false;

export function isWorkerInitialized(): boolean {
  return initialized;
}

/**
 * Bootstraps a Monaco web worker by wiring the global `onmessage` handler to
 * `worker.start` and delegating construction to the provided factory callback.
 *
 * @typeParam THost       - The type of the main-thread host proxy exposed via
 *                          `ctx.host`. Defaults to `object` (no host methods).
 * @typeParam TCreateData - The worker-specific initialization payload sent from
 *                          the main thread. Defaults to `unknown` so call sites
 *                          must narrow to a concrete `ICreateData` interface.
 * @typeParam TWorker     - The worker service instance returned by the factory.
 *                          Inferred from the callback return type.
 *
 * @param callback - Factory that receives the Monaco worker context and the
 *                   initialization data carried in the first `MessageEvent`,
 *                   and returns a fully constructed worker service instance.
 */
export function initialize<
  THost extends object = object,
  TCreateData = unknown,
  TWorker extends object = object,
>(
  callback: (
    ctx: MonacoWorker.IWorkerContext<THost>,
    createData: TCreateData,
  ) => TWorker,
): void {
  initialized = true;
  self.onmessage = (m: MessageEvent<unknown>) => {
    worker.start((ctx: MonacoWorker.IWorkerContext<THost>) => {
      return callback(ctx, m.data as TCreateData);
    });
  };
}
