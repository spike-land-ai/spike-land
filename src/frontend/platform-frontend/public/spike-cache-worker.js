const DEFAULT_POLICY_URL = "/service-worker/cache-policy.json";
const CONTROL_PLANE_CACHE = "spike-cache-control-plane";
const CONTROL_PLANE_KEY = "spike-cache-policy";
const DEFAULT_CACHE_NAMESPACE = "spike-cache";
const DEFAULT_MANIFEST_TTL_MS = 5 * 60 * 1000;

const workerUrl = new URL(self.location.href);
const configuredManifestUrl = workerUrl.searchParams.get("manifest") || DEFAULT_POLICY_URL;

let policyEnvelope = null;
let policySyncPromise = null;

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error ?? "Unknown service worker error");
}

function logWorkerError(scope, error, context) {
  try {
    console.error("[spike-cache-worker]", scope, {
      message: getErrorMessage(error),
      ...(context && typeof context === "object" ? context : {}),
    });
  } catch {
    return;
  }
}

async function safelyRun(scope, work, fallback) {
  try {
    return await work();
  } catch (error) {
    logWorkerError(scope, error);
    return fallback;
  }
}

self.addEventListener("error", (event) => {
  logWorkerError("error", event.error || event.message || "Unhandled service worker error");
});

self.addEventListener("unhandledrejection", (event) => {
  logWorkerError("unhandledrejection", event.reason);
  if (typeof event.preventDefault === "function") {
    event.preventDefault();
  }
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    safelyRun("install", async () => {
      await syncPolicy({ force: true });
      await self.skipWaiting();
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    safelyRun("activate", async () => {
      await syncPolicy({ force: false });
      await self.clients.claim();
    }),
  );
});

self.addEventListener("message", (event) => {
  event.waitUntil(handleMessageEvent(event));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(handleFetchEvent(event));
});

function sanitizeKeyPart(value, fallback) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

function normalizePolicy(rawPolicy, updatedAt) {
  const policy = rawPolicy && typeof rawPolicy === "object" ? rawPolicy : {};
  const version = sanitizeKeyPart(policy.version || "v1", "v1");
  const cacheNamespace = sanitizeKeyPart(
    policy.cacheNamespace || DEFAULT_CACHE_NAMESPACE,
    DEFAULT_CACHE_NAMESPACE,
  );
  const manifestTtlSeconds =
    typeof policy.manifestTtlSeconds === "number" && Number.isFinite(policy.manifestTtlSeconds)
      ? Math.max(30, Math.floor(policy.manifestTtlSeconds))
      : DEFAULT_MANIFEST_TTL_MS / 1000;
  return {
    version,
    cacheNamespace,
    manifestTtlSeconds,
    clearOnVersionChange: policy.clearOnVersionChange !== false,
    precache: Array.isArray(policy.precache) ? policy.precache : [],
    runtime: Array.isArray(policy.runtime) ? policy.runtime : [],
    updatedAt,
  };
}

async function getControlPlaneCache() {
  return caches.open(CONTROL_PLANE_CACHE);
}

async function writePolicyEnvelope(envelope) {
  const cache = await getControlPlaneCache();
  await cache.put(
    new Request(CONTROL_PLANE_KEY),
    new Response(JSON.stringify(envelope), {
      headers: { "Content-Type": "application/json" },
    }),
  );
}

async function loadPolicyEnvelope() {
  if (policyEnvelope) {
    return policyEnvelope;
  }

  const cache = await getControlPlaneCache();
  const response = await cache.match(CONTROL_PLANE_KEY);
  if (!response) {
    return null;
  }

  try {
    const parsed = await response.json();
    if (!parsed || typeof parsed !== "object" || !parsed.policy) {
      return null;
    }

    policyEnvelope = {
      manifestUrl: parsed.manifestUrl || configuredManifestUrl,
      policy: normalizePolicy(parsed.policy, parsed.updatedAt || Date.now()),
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
    };
    return policyEnvelope;
  } catch {
    return null;
  }
}

function getManifestTtlMs(envelope) {
  return (envelope?.policy?.manifestTtlSeconds || DEFAULT_MANIFEST_TTL_MS / 1000) * 1000;
}

function isPolicyStale(envelope) {
  if (!envelope) {
    return true;
  }
  return Date.now() - envelope.updatedAt > getManifestTtlMs(envelope);
}

function getLogicalCacheName(rule) {
  return sanitizeKeyPart(rule && rule.cacheName ? rule.cacheName : "default", "default");
}

function getManagedCacheName(policy, rule) {
  return `${policy.cacheNamespace}-${policy.version}-${getLogicalCacheName(rule)}`;
}

function isCacheableResponse(response) {
  return Boolean(response) && (response.ok || response.type === "opaque");
}

async function cleanupManagedCaches(currentPolicy) {
  if (!currentPolicy) {
    return;
  }

  const activePrefix = `${currentPolicy.cacheNamespace}-${currentPolicy.version}-`;
  const namespacePrefix = `${currentPolicy.cacheNamespace}-`;
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map((cacheName) => {
      if (cacheName === CONTROL_PLANE_CACHE) {
        return Promise.resolve(false);
      }
      if (!cacheName.startsWith(namespacePrefix)) {
        return Promise.resolve(false);
      }
      if (cacheName.startsWith(activePrefix)) {
        return Promise.resolve(false);
      }
      return caches.delete(cacheName);
    }),
  );
}

async function cacheResponse(policy, rule, request, response) {
  if (!isCacheableResponse(response)) {
    return response;
  }

  const cache = await caches.open(getManagedCacheName(policy, rule));
  await cache.put(request, response.clone());
  return response;
}

async function matchCachedResponse(policy, rule, request) {
  const cache = await caches.open(getManagedCacheName(policy, rule));
  return cache.match(request, { ignoreSearch: rule.ignoreSearch === true });
}

async function fetchAndCache(policy, rule, request) {
  const response = await fetch(request);
  return cacheResponse(policy, rule, request, response);
}

async function applyRuleStrategy(policy, rule, request) {
  const strategy = rule.strategy || "cache-first";
  const cachedResponse = await matchCachedResponse(policy, rule, request);

  if (strategy === "cache-only") {
    return (
      cachedResponse || new Response("Cache miss", { status: 504, statusText: "Gateway Timeout" })
    );
  }

  if (strategy === "network-only") {
    return fetch(request);
  }

  if (strategy === "network-first") {
    try {
      return await fetchAndCache(policy, rule, request);
    } catch {
      if (cachedResponse) {
        return cachedResponse;
      }
      throw new Error(`Network-first request failed for ${request.url}`);
    }
  }

  if (strategy === "stale-while-revalidate") {
    const networkUpdate = fetchAndCache(policy, rule, request).catch(() => null);
    if (cachedResponse) {
      void networkUpdate;
      return cachedResponse;
    }
    const networkResponse = await networkUpdate;
    if (networkResponse) {
      return networkResponse;
    }
    throw new Error(`Stale-while-revalidate request failed for ${request.url}`);
  }

  if (cachedResponse) {
    return cachedResponse;
  }

  return fetchAndCache(policy, rule, request);
}

function normalizeExactUrl(value) {
  return new URL(value, self.location.origin).toString();
}

function matchesExactUrl(rule, requestUrl) {
  if (typeof rule.url === "string") {
    return normalizeExactUrl(rule.url) === requestUrl.toString();
  }

  if (Array.isArray(rule.urls)) {
    return rule.urls.some((entry) => normalizeExactUrl(entry) === requestUrl.toString());
  }

  return false;
}

function matchesRule(rule, request) {
  const requestUrl = new URL(request.url);
  if (matchesExactUrl(rule, requestUrl)) {
    return true;
  }

  const match = rule.match;
  if (!match || typeof match !== "object") {
    return false;
  }

  if (match.sameOrigin === true && requestUrl.origin !== self.location.origin) {
    return false;
  }
  if (typeof match.origin === "string" && requestUrl.origin !== match.origin) {
    return false;
  }
  if (typeof match.pathname === "string" && requestUrl.pathname !== match.pathname) {
    return false;
  }
  if (
    typeof match.pathnamePrefix === "string" &&
    !requestUrl.pathname.startsWith(match.pathnamePrefix)
  ) {
    return false;
  }
  if (typeof match.regex === "string") {
    try {
      if (!new RegExp(match.regex).test(requestUrl.pathname)) {
        return false;
      }
    } catch {
      return false;
    }
  }
  if (typeof match.requestMode === "string" && request.mode !== match.requestMode) {
    return false;
  }
  if (
    typeof match.requestDestination === "string" &&
    request.destination !== match.requestDestination
  ) {
    return false;
  }

  return true;
}

function findMatchingRule(policy, request) {
  const rules = [...policy.precache, ...policy.runtime];
  return (
    rules.find((rule) => rule && typeof rule === "object" && matchesRule(rule, request)) || null
  );
}

async function precachePolicyEntries(policy) {
  const entries = policy.precache.filter((entry) => typeof entry?.url === "string");
  await Promise.all(
    entries.map(async (entry) => {
      const request = new Request(normalizeExactUrl(entry.url), { method: "GET" });
      try {
        await fetchAndCache(policy, entry, request);
      } catch {
        return null;
      }
      return null;
    }),
  );
}

async function syncPolicy({ force }) {
  if (policySyncPromise && !force) {
    return policySyncPromise;
  }

  policySyncPromise = (async () => {
    const previousEnvelope = await loadPolicyEnvelope();
    try {
      const response = await fetch(configuredManifestUrl, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error(`Policy fetch failed with ${response.status}`);
      }

      const rawPolicy = await response.json();
      const updatedAt = Date.now();
      const nextEnvelope = {
        manifestUrl: configuredManifestUrl,
        policy: normalizePolicy(rawPolicy, updatedAt),
        updatedAt,
      };

      policyEnvelope = nextEnvelope;
      await writePolicyEnvelope({
        manifestUrl: configuredManifestUrl,
        policy: rawPolicy,
        updatedAt,
      });

      const versionChanged =
        previousEnvelope &&
        previousEnvelope.policy &&
        previousEnvelope.policy.version !== nextEnvelope.policy.version;
      if (versionChanged && nextEnvelope.policy.clearOnVersionChange) {
        await cleanupManagedCaches(nextEnvelope.policy);
      }

      await precachePolicyEntries(nextEnvelope.policy);
      return nextEnvelope;
    } catch {
      return previousEnvelope;
    } finally {
      policySyncPromise = null;
    }
  })();

  return policySyncPromise;
}

async function getPolicyEnvelope() {
  const currentEnvelope = await loadPolicyEnvelope();
  if (currentEnvelope) {
    return currentEnvelope;
  }
  return syncPolicy({ force: true });
}

async function purgeManagedCaches() {
  const envelope = await loadPolicyEnvelope();
  const cacheNames = await caches.keys();
  const prefixes = envelope
    ? [`${envelope.policy.cacheNamespace}-`]
    : [sanitizeKeyPart(DEFAULT_CACHE_NAMESPACE, DEFAULT_CACHE_NAMESPACE)];
  await Promise.all(
    cacheNames.map((cacheName) => {
      if (cacheName === CONTROL_PLANE_CACHE) {
        return Promise.resolve(false);
      }
      if (!prefixes.some((prefix) => cacheName.startsWith(prefix))) {
        return Promise.resolve(false);
      }
      return caches.delete(cacheName);
    }),
  );

  const controlPlane = await getControlPlaneCache();
  await controlPlane.delete(CONTROL_PLANE_KEY);
  policyEnvelope = null;
}

function buildStatusPayload(envelope, cacheNames) {
  return {
    manifestUrl: envelope?.manifestUrl || configuredManifestUrl,
    version: envelope?.policy?.version || null,
    cacheNamespace: envelope?.policy?.cacheNamespace || null,
    lastUpdatedAt: envelope?.updatedAt || null,
    cacheNames,
  };
}

async function respondToClient(event, message) {
  try {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage(message);
      return;
    }

    if (event.source && typeof event.source.postMessage === "function") {
      event.source.postMessage(message);
    }
  } catch (error) {
    logWorkerError("respond-to-client", error);
  }
}

async function handleMessage(event) {
  const data = event.data;
  if (!data || typeof data !== "object" || typeof data.type !== "string") {
    return;
  }

  if (data.type === "sync-manifest") {
    const envelope = await syncPolicy({ force: true });
    const cacheNames = await caches.keys();
    await respondToClient(event, {
      type: "sw-cache-status",
      payload: buildStatusPayload(envelope, cacheNames),
    });
    return;
  }

  if (data.type === "purge-cache") {
    await purgeManagedCaches();
    const envelope = await syncPolicy({ force: true });
    const cacheNames = await caches.keys();
    await respondToClient(event, {
      type: "sw-cache-status",
      payload: buildStatusPayload(envelope, cacheNames),
    });
    return;
  }

  if (data.type === "get-status") {
    const envelope = await getPolicyEnvelope();
    const cacheNames = await caches.keys();
    await respondToClient(event, {
      type: "sw-cache-status",
      payload: buildStatusPayload(envelope, cacheNames),
    });
  }
}

async function handleMessageEvent(event) {
  try {
    await handleMessage(event);
  } catch (error) {
    logWorkerError("message", error, {
      command: typeof event?.data?.type === "string" ? event.data.type : "unknown",
    });
    await respondToClient(event, {
      type: "sw-cache-error",
      payload: {
        command: typeof event?.data?.type === "string" ? event.data.type : "unknown",
        message: getErrorMessage(error),
      },
    });
  }
}

async function handleFetch(event) {
  const currentEnvelope = await getPolicyEnvelope();
  if (!currentEnvelope) {
    return fetch(event.request);
  }

  if (isPolicyStale(currentEnvelope)) {
    event.waitUntil(
      syncPolicy({ force: true }).catch((error) => {
        logWorkerError("policy-refresh", error, { url: event.request.url });
      }),
    );
  }

  const matchedRule = findMatchingRule(currentEnvelope.policy, event.request);
  if (!matchedRule) {
    return fetch(event.request);
  }

  return applyRuleStrategy(currentEnvelope.policy, matchedRule, event.request);
}

async function handleFetchEvent(event) {
  try {
    return await handleFetch(event);
  } catch (error) {
    logWorkerError("fetch", error, { url: event.request.url });
    try {
      return await fetch(event.request);
    } catch (networkError) {
      logWorkerError("fetch-fallback", networkError, { url: event.request.url });
      return new Response("Service Worker cache failure", {
        status: 503,
        statusText: "Service Unavailable",
      });
    }
  }
}
