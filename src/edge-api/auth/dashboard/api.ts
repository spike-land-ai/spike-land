import { drizzle } from "drizzle-orm/d1";
import { z } from "zod";
import type { Env } from "../db-auth/auth";
import type { AuthResult } from "./auth-guard";
import { logAudit } from "./audit";
import * as queries from "./queries";
import * as platformQueries from "./platform-queries";
import * as schema from "../db/schema";

// ── Request body schemas ─────────────────────────────────────────────────────
// All inbound JSON is parsed through Zod so that unknown fields are stripped
// and malformed payloads are rejected before reaching the database layer.
// OWASP A03:2021 — Injection / A08:2021 — Software and Data Integrity Failures.

const userPatchSchema = z.object({
  role: z.string().optional(),
  emailVerified: z.boolean().optional(),
});

const bulkUserPatchSchema = z.object({
  ids: z.array(z.string()).min(1),
  patch: userPatchSchema,
});

const exportUsersSchema = z.object({
  role: z.string().optional(),
  search: z.string().optional(),
});

const bulkRevokeSessionsSchema = z.object({
  ids: z.array(z.string()).min(1),
});

const impersonateSchema = z.object({
  userId: z.string().min(1),
});

type Handler = (
  request: Request,
  env: Env,
  auth: AuthResult,
  params: Record<string, string>,
) => Promise<Response>;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

const routes: Array<{ method: string; pattern: RegExp; handler: Handler }> = [];

function route(method: string, path: string, handler: Handler) {
  const pattern = new RegExp("^" + path.replace(/:(\w+)/g, "(?<$1>[^/]+)") + "$");
  routes.push({ method, pattern, handler });
}

// --- Overview ---
route("GET", "/dashboard/api/stats", async (_req, env) => {
  const db = drizzle(env.AUTH_DB, { schema });
  return json(await queries.getOverviewStats(db));
});

// --- Users ---
route("GET", "/dashboard/api/users", async (req, env) => {
  const db = drizzle(env.AUTH_DB, { schema });
  const url = new URL(req.url);
  const opts: Parameters<typeof queries.getUsers>[1] = {
    page: Number(url.searchParams.get("page")) || 1,
    limit: Number(url.searchParams.get("limit")) || 25,
  };
  const search = url.searchParams.get("search");
  if (search) opts.search = search;
  const role = url.searchParams.get("role");
  if (role) opts.role = role;
  return json(await queries.getUsers(db, opts));
});

route("GET", "/dashboard/api/users/:id", async (_req, env, _auth, params) => {
  const db = drizzle(env.AUTH_DB, { schema });
  const id = params["id"];
  if (!id) return json({ error: "Missing id" }, 400);
  const detail = await queries.getUserDetail(db, id);
  if (!detail) return json({ error: "User not found" }, 404);
  return json(detail);
});

route("PATCH", "/dashboard/api/users/:id", async (req, env, auth, params) => {
  const db = drizzle(env.AUTH_DB, { schema });
  const id = params["id"];
  if (!id) return json({ error: "Missing id" }, 400);
  const parsed = userPatchSchema.safeParse(await req.json());
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
  const body = parsed.data;

  const before = await queries.getUserDetail(db, id);
  const updated = await queries.updateUser(db, id, body);

  await logAudit(db, {
    actorId: auth.user.id,
    action: body.role !== undefined ? "user.role_changed" : "user.updated",
    targetType: "user",
    targetId: id,
    details: {
      before: { role: before?.user?.role, emailVerified: before?.user?.emailVerified },
      after: body,
    },
    ipAddress: getIp(req),
  });

  return json(updated);
});

route("POST", "/dashboard/api/users/bulk", async (req, env, auth) => {
  const db = drizzle(env.AUTH_DB, { schema });
  const parsed = bulkUserPatchSchema.safeParse(await req.json());
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
  const body = parsed.data;

  const result = await queries.bulkUpdateUsers(db, body.ids, body.patch);

  await logAudit(db, {
    actorId: auth.user.id,
    action: "user.bulk_updated",
    targetType: "user",
    targetId: body.ids.join(","),
    details: { count: body.ids.length, patch: body.patch },
    ipAddress: getIp(req),
  });

  return json(result);
});

route("POST", "/dashboard/api/users/export", async (req, env) => {
  const db = drizzle(env.AUTH_DB, { schema });
  const parsed = exportUsersSchema.safeParse(await req.json());
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
  const users = await queries.exportUsers(db, parsed.data);
  return json(users);
});

// --- Sessions ---
route("GET", "/dashboard/api/sessions", async (req, env) => {
  const db = drizzle(env.AUTH_DB, { schema });
  const url = new URL(req.url);
  return json(
    await queries.getActiveSessions(db, {
      page: Number(url.searchParams.get("page")) || 1,
      limit: Number(url.searchParams.get("limit")) || 25,
    }),
  );
});

route("DELETE", "/dashboard/api/sessions/:id", async (req, env, auth, params) => {
  const db = drizzle(env.AUTH_DB, { schema });
  const id = params["id"];
  if (!id) return json({ error: "Missing id" }, 400);
  await queries.revokeSession(db, id);

  await logAudit(db, {
    actorId: auth.user.id,
    action: "session.revoked",
    targetType: "session",
    targetId: id,
    ipAddress: getIp(req),
  });

  return json({ ok: true });
});

route("POST", "/dashboard/api/sessions/bulk-revoke", async (req, env, auth) => {
  const db = drizzle(env.AUTH_DB, { schema });
  const parsed = bulkRevokeSessionsSchema.safeParse(await req.json());
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
  const body = parsed.data;

  const result = await queries.bulkRevokeSessions(db, body.ids);

  await logAudit(db, {
    actorId: auth.user.id,
    action: "session.bulk_revoked",
    targetType: "session",
    targetId: body.ids.join(","),
    details: { count: body.ids.length },
    ipAddress: getIp(req),
  });

  return json(result);
});

// --- Organizations ---
route("GET", "/dashboard/api/organizations", async (req, env) => {
  const db = drizzle(env.AUTH_DB, { schema });
  const url = new URL(req.url);
  return json(
    await queries.getOrganizations(db, {
      page: Number(url.searchParams.get("page")) || 1,
      limit: Number(url.searchParams.get("limit")) || 25,
    }),
  );
});

route("GET", "/dashboard/api/organizations/:id", async (_req, env, _auth, params) => {
  const db = drizzle(env.AUTH_DB, { schema });
  const id = params["id"];
  if (!id) return json({ error: "Missing id" }, 400);
  const detail = await queries.getOrgDetail(db, id);
  if (!detail) return json({ error: "Organization not found" }, 404);
  return json(detail);
});

// --- API Keys (PLATFORM_DB) ---
route("GET", "/dashboard/api/api-keys", async (req, env) => {
  const url = new URL(req.url);
  return json(
    await platformQueries.getApiKeys(env.PLATFORM_DB, {
      page: Number(url.searchParams.get("page")) || 1,
      limit: Number(url.searchParams.get("limit")) || 25,
    }),
  );
});

route("DELETE", "/dashboard/api/api-keys/:id", async (req, env, auth, params) => {
  const id = params["id"];
  if (!id) return json({ error: "Missing id" }, 400);
  await platformQueries.revokeApiKey(env.PLATFORM_DB, id);
  const db = drizzle(env.AUTH_DB, { schema });

  await logAudit(db, {
    actorId: auth.user.id,
    action: "api_key.revoked",
    targetType: "api_key",
    targetId: id,
    ipAddress: getIp(req),
  });

  return json({ ok: true });
});

route("GET", "/dashboard/api/oauth-clients", async (_req, env) => {
  return json(await platformQueries.getOAuthClients(env.PLATFORM_DB));
});

route("GET", "/dashboard/api/device-codes", async (req, env) => {
  const url = new URL(req.url);
  return json(
    await platformQueries.getDeviceAuthCodes(env.PLATFORM_DB, {
      page: Number(url.searchParams.get("page")) || 1,
      limit: Number(url.searchParams.get("limit")) || 25,
    }),
  );
});

// --- Audit Log ---
route("GET", "/dashboard/api/audit-log", async (req, env) => {
  const db = drizzle(env.AUTH_DB, { schema });
  const url = new URL(req.url);
  const opts: Parameters<typeof queries.getAuditLog>[1] = {
    page: Number(url.searchParams.get("page")) || 1,
    limit: Number(url.searchParams.get("limit")) || 50,
  };
  const action = url.searchParams.get("action");
  if (action) opts.action = action;
  return json(await queries.getAuditLog(db, opts));
});

// --- Security ---
route("GET", "/dashboard/api/security", async (_req, env) => {
  const db = drizzle(env.AUTH_DB, { schema });
  return json(await queries.getSecurityEvents(db));
});

// --- System ---
route("GET", "/dashboard/api/system", async (_req, env) => {
  return json(await queries.getSystemHealth(env.STATUS_DB, env.AUTH_DB));
});

// --- Impersonation ---
route("POST", "/dashboard/api/impersonate", async (req, env, auth) => {
  const db = drizzle(env.AUTH_DB, { schema });
  const parsed = impersonateSchema.safeParse(await req.json());
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
  const body = parsed.data;

  const target = await queries.getUserDetail(db, body.userId);
  if (!target) return json({ error: "User not found" }, 404);

  await logAudit(db, {
    actorId: auth.user.id,
    action: "user.impersonated",
    targetType: "user",
    targetId: body.userId,
    ipAddress: getIp(req),
  });

  return json({ ok: true, user: target.user });
});

route("POST", "/dashboard/api/stop-impersonate", async () => {
  return json({ ok: true });
});

// --- Dispatcher ---
export async function handleDashboardApi(
  request: Request,
  env: Env,
  auth: AuthResult,
): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  for (const r of routes) {
    if (r.method !== request.method) continue;
    const match = pathname.match(r.pattern);
    if (match) {
      const params = match.groups ?? {};
      try {
        return await r.handler(request, env, auth, params);
      } catch (err) {
        console.error(`[dashboard-api] ${r.method} ${pathname}:`, err);
        return json({ error: err instanceof Error ? err.message : "Internal error" }, 500);
      }
    }
  }

  return json({ error: "Not found" }, 404);
}
