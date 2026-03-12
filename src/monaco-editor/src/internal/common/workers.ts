import { editor } from "monaco-editor-core";

/**
 * Subset of the Monaco global environment that host pages may attach to
 * `globalThis.MonacoEnvironment`. Declared here to avoid `as any` casts and
 * to document the expected shape consumed by this module.
 */
interface IMonacoEnvironment {
  createTrustedTypesPolicy?<Options extends TrustedTypePolicyOptions>(
    policyName: string,
    policyOptions?: Options,
  ):
    | undefined
    | Pick<TrustedTypePolicy, "name" | Extract<keyof Options, keyof TrustedTypePolicyOptions>>;
  getWorker?(moduleId: string, label: string): Worker | Promise<Worker>;
  getWorkerUrl?(moduleId: string, label: string): string;
}

/**
 * Extension of the standard `globalThis` type that accounts for the optional
 * properties this module reads from the global scope at runtime.
 *
 * - `MonacoEnvironment` — host-provided configuration object.
 * - `trustedTypes` — the browser Trusted Types API (already in the DOM lib;
 *   re-declared here so non-DOM targets still type-check correctly).
 * - `workerttPolicy` — a pre-created Trusted Types policy forwarded into
 *   dedicated workers from the main thread.
 */
interface MonacoGlobalThis {
  readonly MonacoEnvironment?: IMonacoEnvironment;
  readonly trustedTypes?: { createPolicy: TrustedTypePolicyFactory["createPolicy"] };
  readonly workerttPolicy?: ReturnType<typeof createTrustedTypesPolicy>;
}

/** Typed view of `globalThis` — avoids all `as any` casts in this module. */
const monacoGlobal = globalThis as unknown as MonacoGlobalThis;

function createTrustedTypesPolicy<Options extends TrustedTypePolicyOptions>(
  policyName: string,
  policyOptions?: Options,
):
  | undefined
  | Pick<TrustedTypePolicy, "name" | Extract<keyof Options, keyof TrustedTypePolicyOptions>> {
  if (monacoGlobal.MonacoEnvironment?.createTrustedTypesPolicy) {
    try {
      return monacoGlobal.MonacoEnvironment.createTrustedTypesPolicy(policyName, policyOptions);
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }
  try {
    return monacoGlobal.trustedTypes?.createPolicy(policyName, policyOptions);
  } catch (err) {
    console.error(err);
    return undefined;
  }
}

let ttPolicy: ReturnType<typeof createTrustedTypesPolicy>;
if (
  typeof self === "object" &&
  self.constructor &&
  self.constructor.name === "DedicatedWorkerGlobalScope" &&
  monacoGlobal.workerttPolicy !== undefined
) {
  ttPolicy = monacoGlobal.workerttPolicy;
} else {
  ttPolicy = createTrustedTypesPolicy("defaultWorkerFactory", {
    createScriptURL: (value) => value,
  });
}

function getWorker(descriptor: {
  label: string;
  moduleId: string;
  createWorker?: () => Worker;
}): Worker | Promise<Worker> {
  const label = descriptor.label;
  // Option for hosts to overwrite the worker script (used in the standalone editor)
  const monacoEnvironment = monacoGlobal.MonacoEnvironment;
  if (monacoEnvironment) {
    if (typeof monacoEnvironment.getWorker === "function") {
      return monacoEnvironment.getWorker("workerMain.js", label);
    }
    if (typeof monacoEnvironment.getWorkerUrl === "function") {
      const workerUrl = monacoEnvironment.getWorkerUrl("workerMain.js", label);
      return new Worker(
        ttPolicy ? (ttPolicy.createScriptURL(workerUrl) as unknown as string) : workerUrl,
        { name: label },
      );
    }
  }

  if (descriptor.createWorker) {
    return descriptor.createWorker();
  }

  // const esmWorkerLocation = descriptor.esmModuleLocation;
  // if (esmWorkerLocation) {
  // 	const workerUrl = getWorkerBootstrapUrl(label, esmWorkerLocation.toString(true));
  // 	const worker = new Worker(ttPolicy ? ttPolicy.createScriptURL(workerUrl) as unknown as string : workerUrl, { name: label, type: 'module' });
  // 	return whenESMWorkerReady(worker);
  // }

  throw new Error(
    `You must define a function MonacoEnvironment.getWorkerUrl or MonacoEnvironment.getWorker`,
  );
}

export function createWebWorker<T extends object>(
  opts: IWebWorkerOptions,
): editor.MonacoWebWorker<T> {
  const workerDescriptor: { label: string; moduleId: string; createWorker?: () => Worker } = {
    label: opts.label ?? "monaco-editor-worker",
    moduleId: opts.moduleId,
  };
  if (opts.createWorker !== undefined) {
    workerDescriptor.createWorker = opts.createWorker;
  }
  const worker = Promise.resolve(
    getWorker(workerDescriptor),
  ).then((w) => {
    w.postMessage("ignore");
    w.postMessage(opts.createData);
    return w;
  });
  const webWorkerOpts: { worker: Promise<Worker>; keepIdleModels?: boolean; host?: Record<string, (...args: unknown[]) => unknown> } = {
    worker,
  };
  if (opts.keepIdleModels !== undefined) {
    webWorkerOpts.keepIdleModels = opts.keepIdleModels;
  }
  if (opts.host !== undefined) {
    webWorkerOpts.host = opts.host as Record<string, (...args: unknown[]) => unknown>;
  }
  return editor.createWebWorker<T>(webWorkerOpts as Parameters<typeof editor.createWebWorker<T>>[0]);
}

export interface IWebWorkerOptions {
  /**
   * The AMD moduleId to load.
   * It should export a function `create` that should return the exported proxy.
   */
  moduleId: string;
  createWorker?: () => Worker;
  /**
   * The data to send over when calling create on the module.
   */
  createData?: unknown;
  /**
   * A label to be used to identify the web worker for debugging purposes.
   */
  label?: string;
  /**
   * An object that can be used by the web worker to make calls back to the main thread.
   */
  host?: unknown;
  /**
   * Keep idle models.
   * Defaults to false, which means that idle models will stop syncing after a while.
   */
  keepIdleModels?: boolean;
}
