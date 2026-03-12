export type ServiceWorkerCacheCommandType = "get-status" | "purge-cache" | "sync-manifest";

export interface ServiceWorkerCacheCommand {
  type: ServiceWorkerCacheCommandType;
}

export interface ServiceWorkerCacheStatus {
  manifestUrl: string;
  version: string | null;
  cacheNamespace: string | null;
  lastUpdatedAt: number | null;
  cacheNames: string[];
}

export interface RegisterServiceWorkerCacheControllerOptions {
  enabled?: boolean;
  enableInDev?: boolean;
  isDev?: boolean;
  manifestUrl?: string;
  scope?: string;
  scriptPath?: string;
  syncOnStart?: boolean;
}

export interface DisableServiceWorkerCacheControllerOptions {
  clearManagedCaches?: boolean;
  scope?: string;
}

const DEFAULT_MANIFEST_URL = "/service-worker/cache-policy.json";
const DEFAULT_SCOPE = "/";
const DEFAULT_SCRIPT_PATH = "/spike-cache-worker.js";
const CONTROL_PLANE_CACHE = "spike-cache-control-plane";
const MANAGED_CACHE_PREFIX = "spike-cache-";
const STATUS_RESPONSE_TIMEOUT_MS = 2_000;

function resolveManifestUrl(manifestUrl = DEFAULT_MANIFEST_URL): string {
  return new URL(manifestUrl, window.location.origin).toString();
}

function buildMessageTarget(
  registration: ServiceWorkerRegistration | undefined,
  container: ServiceWorkerContainer,
): ServiceWorker | null {
  return (
    container.controller ??
    registration?.active ??
    registration?.waiting ??
    registration?.installing ??
    null
  );
}

export function shouldEnableServiceWorkerCacheController(
  options: Pick<
    RegisterServiceWorkerCacheControllerOptions,
    "enabled" | "enableInDev" | "isDev"
  > = {},
): boolean {
  if (options.enabled === false) return false;
  if (options.enabled === true) return true;
  return options.isDev ? options.enableInDev === true : true;
}

export function buildServiceWorkerScriptUrl(
  options: Pick<RegisterServiceWorkerCacheControllerOptions, "manifestUrl" | "scriptPath"> = {},
): string {
  const scriptUrl = new URL(options.scriptPath ?? DEFAULT_SCRIPT_PATH, window.location.origin);
  scriptUrl.searchParams.set("manifest", resolveManifestUrl(options.manifestUrl));
  return `${scriptUrl.pathname}${scriptUrl.search}`;
}

export async function registerServiceWorkerCacheController(
  options: RegisterServiceWorkerCacheControllerOptions = {},
): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  const enabled = shouldEnableServiceWorkerCacheController({
    enabled: options.enabled,
    enableInDev: options.enableInDev,
    isDev: options.isDev,
  });
  if (!enabled) {
    return null;
  }

  const registration = await navigator.serviceWorker.register(
    buildServiceWorkerScriptUrl(options),
    {
      scope: options.scope ?? DEFAULT_SCOPE,
    },
  );

  if (options.syncOnStart !== false) {
    await syncServiceWorkerCacheManifest(options.scope);
  }

  return registration;
}

function shouldDeleteManagedCache(cacheName: string): boolean {
  return cacheName === CONTROL_PLANE_CACHE || cacheName.startsWith(MANAGED_CACHE_PREFIX);
}

async function clearManagedServiceWorkerCaches(): Promise<void> {
  if (typeof window === "undefined" || !("caches" in window)) {
    return;
  }

  const cacheNames = await window.caches.keys();
  await Promise.all(
    cacheNames.filter(shouldDeleteManagedCache).map(async (cacheName) => {
      try {
        await window.caches.delete(cacheName);
      } catch {
        return false;
      }
      return true;
    }),
  );
}

export async function disableServiceWorkerCacheController(
  options: DisableServiceWorkerCacheControllerOptions = {},
): Promise<number> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return 0;
  }

  const targetScope = options.scope
    ? new URL(options.scope, window.location.origin).toString()
    : null;
  const registrations = await navigator.serviceWorker.getRegistrations();
  const matchingRegistrations = targetScope
    ? registrations.filter((registration) => registration.scope === targetScope)
    : registrations;

  const settled = await Promise.allSettled(
    matchingRegistrations.map(async (registration) => {
      try {
        return await registration.unregister();
      } catch {
        return false;
      }
    }),
  );

  if (options.clearManagedCaches !== false) {
    await clearManagedServiceWorkerCaches();
  }

  return settled.reduce((count, result) => {
    if (result.status === "fulfilled" && result.value) {
      return count + 1;
    }
    return count;
  }, 0);
}

export async function sendServiceWorkerCacheCommand(
  command: ServiceWorkerCacheCommand,
  scope = DEFAULT_SCOPE,
): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }

  const registration = await navigator.serviceWorker.getRegistration(scope);
  const target = buildMessageTarget(registration, navigator.serviceWorker);
  if (!target) {
    return false;
  }

  try {
    target.postMessage(command);
    return true;
  } catch {
    return false;
  }
}

export async function syncServiceWorkerCacheManifest(scope = DEFAULT_SCOPE): Promise<boolean> {
  return sendServiceWorkerCacheCommand({ type: "sync-manifest" }, scope);
}

export async function purgeServiceWorkerCaches(scope = DEFAULT_SCOPE): Promise<boolean> {
  return sendServiceWorkerCacheCommand({ type: "purge-cache" }, scope);
}

export async function getServiceWorkerCacheStatus(
  scope = DEFAULT_SCOPE,
  timeoutMs = STATUS_RESPONSE_TIMEOUT_MS,
): Promise<ServiceWorkerCacheStatus | null> {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    typeof MessageChannel === "undefined"
  ) {
    return null;
  }

  const registration = await navigator.serviceWorker.getRegistration(scope);
  const target = buildMessageTarget(registration, navigator.serviceWorker);
  if (!target) {
    return null;
  }

  return new Promise<ServiceWorkerCacheStatus | null>((resolve) => {
    const channel = new MessageChannel();
    const timer = window.setTimeout(() => {
      channel.port1.onmessage = null;
      resolve(null);
    }, timeoutMs);

    channel.port1.onmessage = (event: MessageEvent<unknown>) => {
      window.clearTimeout(timer);
      const payload = event.data;
      if (
        !payload ||
        typeof payload !== "object" ||
        !("type" in payload) ||
        payload.type !== "sw-cache-status"
      ) {
        resolve(null);
        return;
      }

      if (!("payload" in payload) || !payload.payload || typeof payload.payload !== "object") {
        resolve(null);
        return;
      }

      resolve(payload.payload as ServiceWorkerCacheStatus);
    };

    try {
      target.postMessage({ type: "get-status" }, [channel.port2]);
    } catch {
      window.clearTimeout(timer);
      channel.port1.onmessage = null;
      resolve(null);
    }
  });
}
