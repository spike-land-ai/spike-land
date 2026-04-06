import { type DrizzleD1Database } from "drizzle-orm/d1";
import { eq, like, desc, sql, and, gt, count, or } from "drizzle-orm";
import * as schema from "../db/schema";

type DB = DrizzleD1Database<typeof schema>;

interface PaginationOpts {
  page?: number;
  limit?: number;
}

interface UserListOpts extends PaginationOpts {
  search?: string;
  role?: string;
}

interface AuditLogOpts extends PaginationOpts {
  action?: string;
}

export async function getOverviewStats(db: DB) {
  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
  const todayStart = now - (now % 86400);

  const [totalUsers] = await db.select({ count: count() }).from(schema.user);
  const [activeSessions] = await db
    .select({ count: count() })
    .from(schema.session)
    .where(gt(schema.session.expiresAt, new Date(now * 1000)));
  const [signupsToday] = await db
    .select({ count: count() })
    .from(schema.user)
    .where(gt(schema.user.createdAt, new Date(todayStart * 1000)));

  // Provider breakdown
  const providers = await db
    .select({
      providerId: schema.account.providerId,
      count: count(),
    })
    .from(schema.account)
    .groupBy(schema.account.providerId);

  // Role distribution
  const roles = await db
    .select({
      role: schema.user.role,
      count: count(),
    })
    .from(schema.user)
    .groupBy(schema.user.role);

  // Signups per day (last 30 days) - use raw SQL for date grouping
  const signupsByDay = await db.all(sql`
    SELECT date(createdAt, 'unixepoch') as day, COUNT(*) as signups
    FROM user
    WHERE createdAt > ${thirtyDaysAgo}
    GROUP BY day
    ORDER BY day ASC
  `);

  return {
    totalUsers: totalUsers?.count ?? 0,
    activeSessions: activeSessions?.count ?? 0,
    signupsToday: signupsToday?.count ?? 0,
    providers,
    roles,
    signupsByDay,
  };
}

export async function getUsers(db: DB, opts: UserListOpts) {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 25;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (opts.search) {
    const term = `%${opts.search}%`;
    conditions.push(or(like(schema.user.name, term), like(schema.user.email, term)));
  }
  if (opts.role) {
    conditions.push(eq(schema.user.role, opts.role));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const users = await db
    .select()
    .from(schema.user)
    .where(where)
    .orderBy(desc(schema.user.createdAt))
    .limit(limit)
    .offset(offset);

  const [total] = await db.select({ count: count() }).from(schema.user).where(where);

  return { users, total: total?.count ?? 0, page, limit };
}

export async function getUserDetail(db: DB, id: string) {
  const u = await db.query.user.findFirst({
    where: eq(schema.user.id, id),
  });
  if (!u) return null;

  const sessions = await db
    .select()
    .from(schema.session)
    .where(eq(schema.session.userId, id))
    .orderBy(desc(schema.session.createdAt));

  const accounts = await db
    .select({
      id: schema.account.id,
      providerId: schema.account.providerId,
      accountId: schema.account.accountId,
      createdAt: schema.account.createdAt,
    })
    .from(schema.account)
    .where(eq(schema.account.userId, id));

  const memberships = await db
    .select({
      orgId: schema.orgMember.orgId,
      role: schema.orgMember.role,
      orgName: schema.organization.name,
      orgSlug: schema.organization.slug,
    })
    .from(schema.orgMember)
    .leftJoin(schema.organization, eq(schema.orgMember.orgId, schema.organization.id))
    .where(eq(schema.orgMember.userId, id));

  return { user: u, sessions, accounts, memberships };
}

export async function updateUser(
  db: DB,
  id: string,
  patch: { role?: string | undefined; emailVerified?: boolean | undefined },
) {
  const values: Record<string, unknown> = {
    updatedAt: new Date(),
  };
  if (patch.role !== undefined) values.role = patch.role;
  if (patch.emailVerified !== undefined) values.emailVerified = patch.emailVerified;

  await db.update(schema.user).set(values).where(eq(schema.user.id, id));

  return db.query.user.findFirst({ where: eq(schema.user.id, id) });
}

export async function bulkUpdateUsers(
  db: DB,
  ids: string[],
  patch: { role?: string | undefined; emailVerified?: boolean | undefined },
) {
  const values: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.role !== undefined) values.role = patch.role;
  if (patch.emailVerified !== undefined) values.emailVerified = patch.emailVerified;

  let updated = 0;
  for (const id of ids) {
    await db.update(schema.user).set(values).where(eq(schema.user.id, id));
    updated++;
  }
  return { updated };
}

export async function getActiveSessions(db: DB, opts: PaginationOpts) {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 25;
  const offset = (page - 1) * limit;
  const now = new Date();

  const sessions = await db
    .select({
      id: schema.session.id,
      token: schema.session.token,
      ipAddress: schema.session.ipAddress,
      userAgent: schema.session.userAgent,
      createdAt: schema.session.createdAt,
      expiresAt: schema.session.expiresAt,
      userId: schema.session.userId,
      userName: schema.user.name,
      userEmail: schema.user.email,
    })
    .from(schema.session)
    .leftJoin(schema.user, eq(schema.session.userId, schema.user.id))
    .where(gt(schema.session.expiresAt, now))
    .orderBy(desc(schema.session.createdAt))
    .limit(limit)
    .offset(offset);

  const [total] = await db
    .select({ count: count() })
    .from(schema.session)
    .where(gt(schema.session.expiresAt, now));

  return { sessions, total: total?.count ?? 0, page, limit };
}

export async function revokeSession(db: DB, id: string) {
  await db.delete(schema.session).where(eq(schema.session.id, id));
}

export async function bulkRevokeSessions(db: DB, ids: string[]) {
  let revoked = 0;
  for (const id of ids) {
    await db.delete(schema.session).where(eq(schema.session.id, id));
    revoked++;
  }
  return { revoked };
}

export async function getOrganizations(db: DB, opts: PaginationOpts) {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 25;
  const offset = (page - 1) * limit;

  const orgs = await db
    .select()
    .from(schema.organization)
    .orderBy(desc(schema.organization.createdAt))
    .limit(limit)
    .offset(offset);

  const orgsWithCounts = await Promise.all(
    orgs.map(async (org) => {
      const [members] = await db
        .select({ count: count() })
        .from(schema.orgMember)
        .where(eq(schema.orgMember.orgId, org.id));
      const [invites] = await db
        .select({ count: count() })
        .from(schema.orgInvite)
        .where(eq(schema.orgInvite.orgId, org.id));
      return {
        ...org,
        memberCount: members?.count ?? 0,
        inviteCount: invites?.count ?? 0,
      };
    }),
  );

  const [total] = await db.select({ count: count() }).from(schema.organization);
  return { organizations: orgsWithCounts, total: total?.count ?? 0, page, limit };
}

export async function getOrgDetail(db: DB, id: string) {
  const org = await db.query.organization.findFirst({
    where: eq(schema.organization.id, id),
  });
  if (!org) return null;

  const members = await db
    .select({
      id: schema.orgMember.id,
      role: schema.orgMember.role,
      userId: schema.orgMember.userId,
      userName: schema.user.name,
      userEmail: schema.user.email,
      createdAt: schema.orgMember.createdAt,
    })
    .from(schema.orgMember)
    .leftJoin(schema.user, eq(schema.orgMember.userId, schema.user.id))
    .where(eq(schema.orgMember.orgId, id));

  const invites = await db.select().from(schema.orgInvite).where(eq(schema.orgInvite.orgId, id));

  return { organization: org, members, invites };
}

export async function getSecurityEvents(db: DB) {
  const now = new Date();

  // Users with sessions from multiple IPs
  const multiIpSessions = await db.all(sql`
    SELECT s.userId, u.name, u.email, COUNT(DISTINCT s.ipAddress) as ip_count,
           GROUP_CONCAT(DISTINCT s.ipAddress) as ips
    FROM session s
    JOIN user u ON s.userId = u.id
    WHERE s.expiresAt > ${now.getTime() / 1000}
    GROUP BY s.userId
    HAVING ip_count > 2
    ORDER BY ip_count DESC
    LIMIT 20
  `);

  // Unverified accounts with active sessions
  const unverifiedActive = await db.all(sql`
    SELECT u.id, u.name, u.email, u.createdAt, COUNT(s.id) as session_count
    FROM user u
    JOIN session s ON u.id = s.userId
    WHERE u.emailVerified = 0 AND s.expiresAt > ${now.getTime() / 1000}
    GROUP BY u.id
    ORDER BY session_count DESC
    LIMIT 20
  `);

  // Stale sessions (expired but not cleaned up)
  const [staleSessions] = await db
    .select({ count: count() })
    .from(schema.session)
    .where(sql`${schema.session.expiresAt} < ${now}`);

  return {
    multiIpSessions,
    unverifiedActive,
    staleSessions: staleSessions?.count ?? 0,
  };
}

export async function getAuditLog(db: DB, opts: AuditLogOpts) {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 50;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (opts.action) {
    conditions.push(eq(schema.auditLog.action, opts.action));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const entries = await db
    .select({
      id: schema.auditLog.id,
      actorId: schema.auditLog.actorId,
      action: schema.auditLog.action,
      targetType: schema.auditLog.targetType,
      targetId: schema.auditLog.targetId,
      details: schema.auditLog.details,
      ipAddress: schema.auditLog.ipAddress,
      createdAt: schema.auditLog.createdAt,
      actorName: schema.user.name,
      actorEmail: schema.user.email,
    })
    .from(schema.auditLog)
    .leftJoin(schema.user, eq(schema.auditLog.actorId, schema.user.id))
    .where(where)
    .orderBy(desc(schema.auditLog.createdAt))
    .limit(limit)
    .offset(offset);

  const [total] = await db.select({ count: count() }).from(schema.auditLog).where(where);

  return { entries, total: total?.count ?? 0, page, limit };
}

export async function getSystemHealth(statusDb: D1Database, authDb: D1Database) {
  let d1Status = "ok";
  try {
    await authDb.prepare("SELECT 1").first();
  } catch {
    d1Status = "degraded";
  }

  // Table row counts
  const tables = [
    "user",
    "session",
    "account",
    "verification",
    "organization",
    "org_member",
    "org_invite",
    "audit_log",
  ];
  const tableCounts: Record<string, number> = {};
  for (const table of tables) {
    try {
      const result = await authDb
        .prepare(`SELECT COUNT(*) as c FROM ${table}`)
        .first<{ c: number }>();
      tableCounts[table] = result?.c ?? 0;
    } catch {
      tableCounts[table] = -1;
    }
  }

  // Service metrics from STATUS_DB
  let serviceMetrics: unknown[] = [];
  try {
    const result = await statusDb
      .prepare(
        `SELECT service, avg_latency_ms, request_count, error_count, recorded_at
         FROM service_request_metrics
         WHERE recorded_at > datetime('now', '-1 hour')
         ORDER BY recorded_at DESC
         LIMIT 50`,
      )
      .all();
    serviceMetrics = result.results ?? [];
  } catch {
    // STATUS_DB may not have this table
  }

  return {
    d1Status,
    tableCounts,
    serviceMetrics,
    timestamp: new Date().toISOString(),
  };
}

export async function exportUsers(
  db: DB,
  opts: { role?: string | undefined; search?: string | undefined },
) {
  const conditions = [];
  if (opts.search) {
    const term = `%${opts.search}%`;
    conditions.push(or(like(schema.user.name, term), like(schema.user.email, term)));
  }
  if (opts.role) {
    conditions.push(eq(schema.user.role, opts.role));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  return db.select().from(schema.user).where(where).orderBy(desc(schema.user.createdAt));
}
