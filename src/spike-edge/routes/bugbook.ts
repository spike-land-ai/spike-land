import { Hono } from "hono";
import type { Env } from "../env.js";
import { authMiddleware } from "../middleware/auth.js";
import { calculateBugEloChange } from "../lib/elo.js";
import { ensureUserElo, getUserElo, recordEloEvent } from "../lib/elo-service.js";

const bugbook = new Hono<{ Bindings: Env }>();

// ── Public Endpoints ──

/** GET /bugbook — list bugs, paginated + filterable. */
bugbook.get("/bugbook", async (c) => {
  const status = c.req.query("status");
  const category = c.req.query("category");
  const sort = c.req.query("sort") ?? "elo";
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50", 10), 200);
  const offset = parseInt(c.req.query("offset") ?? "0", 10);

  let query = "SELECT id, title, category, status, severity, elo, report_count, first_seen_at, last_seen_at FROM bugs WHERE 1=1";
  const params: (string | number)[] = [];

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }
  if (category) {
    query += " AND category = ?";
    params.push(category);
  }

  const orderCol = sort === "recent" ? "last_seen_at" : "elo";
  query += ` ORDER BY ${orderCol} DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const result = await c.env.DB.prepare(query).bind(...params).all();

  // Get total count for pagination
  let countQuery = "SELECT COUNT(*) as total FROM bugs WHERE 1=1";
  const countParams: (string | number)[] = [];
  if (status) {
    countQuery += " AND status = ?";
    countParams.push(status);
  }
  if (category) {
    countQuery += " AND category = ?";
    countParams.push(category);
  }

  const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first<{ total: number }>();

  return c.json({
    bugs: result.results,
    total: countResult?.total ?? 0,
    limit,
    offset,
  });
});

/** GET /bugbook/leaderboard — bugs ranked by ELO. */
bugbook.get("/bugbook/leaderboard", async (c) => {
  const limit = Math.min(parseInt(c.req.query("limit") ?? "25", 10), 100);

  const [bugs, reporters] = await Promise.all([
    c.env.DB.prepare(
      "SELECT id, title, category, status, severity, elo, report_count FROM bugs WHERE status IN ('CANDIDATE', 'ACTIVE') ORDER BY elo DESC LIMIT ?",
    ).bind(limit).all(),
    c.env.DB.prepare(
      "SELECT user_id, elo, tier, event_count FROM user_elo ORDER BY elo DESC LIMIT ?",
    ).bind(limit).all(),
  ]);

  return c.json({
    topBugs: bugs.results,
    topReporters: reporters.results,
  });
});

/** GET /bugbook/reporters — top bug reporters by user ELO. */
bugbook.get("/bugbook/reporters", async (c) => {
  const limit = Math.min(parseInt(c.req.query("limit") ?? "25", 10), 100);
  const result = await c.env.DB.prepare(
    "SELECT user_id, elo, tier, event_count FROM user_elo ORDER BY elo DESC LIMIT ?",
  ).bind(limit).all();
  return c.json(result.results);
});

/** GET /bugbook/:id — single bug detail with report history. */
bugbook.get("/bugbook/:id", async (c) => {
  const bugId = c.req.param("id");

  const [bug, reports, eloHistory] = await Promise.all([
    c.env.DB.prepare("SELECT * FROM bugs WHERE id = ?").bind(bugId).first(),
    c.env.DB.prepare(
      "SELECT id, reporter_id, service_name, description, severity, created_at FROM bug_reports WHERE bug_id = ? ORDER BY created_at DESC LIMIT 50",
    ).bind(bugId).all(),
    c.env.DB.prepare(
      "SELECT old_elo, new_elo, change_amount, reason, created_at FROM bug_elo_history WHERE bug_id = ? ORDER BY created_at DESC LIMIT 20",
    ).bind(bugId).all(),
  ]);

  if (!bug) {
    return c.json({ error: "Bug not found" }, 404);
  }

  return c.json({
    bug,
    reports: reports.results,
    eloHistory: eloHistory.results,
  });
});

// ── Authenticated Endpoints ──

/** POST /bugbook/report — submit a bug report. */
bugbook.post("/bugbook/report", authMiddleware, async (c) => {
  const userId = c.get("userId" as never) as string;

  const body = await c.req.json<{
    title: string;
    description: string;
    service_name: string;
    severity?: string;
    reproduction_steps?: string;
    error_code?: string;
    metadata?: Record<string, unknown>;
  }>();

  if (!body.title || !body.description || !body.service_name) {
    return c.json({ error: "title, description, and service_name are required" }, 400);
  }

  const severity = ["low", "medium", "high", "critical"].includes(body.severity ?? "")
    ? body.severity!
    : "medium";

  const now = Date.now();

  // Try to match existing bug by error_code+service_name or exact title
  let existingBug: Record<string, unknown> | null = null;

  if (body.error_code) {
    const metadataLike = `%"error_code":"${body.error_code}"%`;
    existingBug = await c.env.DB.prepare(
      "SELECT * FROM bugs WHERE category = ? AND metadata LIKE ? AND status != 'DEPRECATED' LIMIT 1",
    ).bind(body.service_name, metadataLike).first();
  }

  if (!existingBug) {
    existingBug = await c.env.DB.prepare(
      "SELECT * FROM bugs WHERE title = ? AND category = ? AND status != 'DEPRECATED' LIMIT 1",
    ).bind(body.title, body.service_name).first();
  }

  let bugId: string;
  let isNewBug: boolean;

  if (existingBug) {
    bugId = existingBug.id as string;
    isNewBug = false;

    // Update existing bug
    await c.env.DB.prepare(
      "UPDATE bugs SET report_count = report_count + 1, last_seen_at = ?, status = CASE WHEN report_count >= 2 AND status = 'CANDIDATE' THEN 'ACTIVE' ELSE status END WHERE id = ?",
    ).bind(now, bugId).run();
  } else {
    // Create new bug
    const result = await c.env.DB.prepare(
      "INSERT INTO bugs (title, description, category, severity, metadata) VALUES (?, ?, ?, ?, ?) RETURNING id",
    ).bind(
      body.title,
      body.description,
      body.service_name,
      severity,
      body.error_code ? JSON.stringify({ error_code: body.error_code }) : "{}",
    ).first<{ id: string }>();

    bugId = result!.id;
    isNewBug = true;
  }

  // Insert bug report
  await c.env.DB.prepare(
    "INSERT INTO bug_reports (bug_id, reporter_id, service_name, description, reproduction_steps, severity, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).bind(
    bugId,
    userId,
    body.service_name,
    body.description,
    body.reproduction_steps ?? null,
    severity,
    body.metadata ? JSON.stringify(body.metadata) : "{}",
  ).run();

  // Bug-vs-Bug ELO: pick a random same-category competitor
  const competitor = await c.env.DB.prepare(
    "SELECT id, elo, report_count FROM bugs WHERE category = ? AND id != ? AND status IN ('CANDIDATE', 'ACTIVE') ORDER BY RANDOM() LIMIT 1",
  ).bind(body.service_name, bugId).first<{ id: string; elo: number; report_count: number }>();

  if (competitor) {
    const currentBug = await c.env.DB.prepare(
      "SELECT elo, report_count FROM bugs WHERE id = ?",
    ).bind(bugId).first<{ elo: number; report_count: number }>();

    if (currentBug) {
      const eloResult = calculateBugEloChange(
        currentBug.elo,
        competitor.elo,
        currentBug.report_count,
        competitor.report_count,
      );

      await c.env.DB.batch([
        c.env.DB.prepare("UPDATE bugs SET elo = ? WHERE id = ?").bind(eloResult.winnerNewElo, bugId),
        c.env.DB.prepare("UPDATE bugs SET elo = ? WHERE id = ?").bind(eloResult.loserNewElo, competitor.id),
        c.env.DB.prepare(
          "INSERT INTO bug_elo_history (bug_id, old_elo, new_elo, change_amount, reason, opponent_bug_id) VALUES (?, ?, ?, ?, 'new_report', ?)",
        ).bind(bugId, currentBug.elo, eloResult.winnerNewElo, eloResult.winnerChange, competitor.id),
        c.env.DB.prepare(
          "INSERT INTO bug_elo_history (bug_id, old_elo, new_elo, change_amount, reason, opponent_bug_id) VALUES (?, ?, ?, ?, 'competitor_loss', ?)",
        ).bind(competitor.id, competitor.elo, eloResult.loserNewElo, eloResult.loserChange, bugId),
      ]);
    }
  }

  // User ELO: reward for reporting
  const eloEvent = isNewBug ? "report_valid_bug" : "bug_confirmed";
  const eloResult = await recordEloEvent(c.env.DB, userId, eloEvent as "report_valid_bug" | "bug_confirmed", bugId);

  return c.json({
    bugId,
    isNewBug,
    status: isNewBug ? "CANDIDATE" : (existingBug?.status ?? "ACTIVE"),
    userElo: { newElo: eloResult.newElo, delta: eloResult.delta, tier: eloResult.tier },
  }, 201);
});

/** POST /bugbook/:id/confirm — confirm an existing bug. */
bugbook.post("/bugbook/:id/confirm", authMiddleware, async (c) => {
  const userId = c.get("userId" as never) as string;
  const bugId = c.req.param("id");

  const bug = await c.env.DB.prepare("SELECT * FROM bugs WHERE id = ?").bind(bugId).first();
  if (!bug) {
    return c.json({ error: "Bug not found" }, 404);
  }

  // Check if user already reported this bug
  const existing = await c.env.DB.prepare(
    "SELECT id FROM bug_reports WHERE bug_id = ? AND reporter_id = ? LIMIT 1",
  ).bind(bugId, userId).first();

  if (existing) {
    return c.json({ error: "You have already reported this bug" }, 409);
  }

  const now = Date.now();
  await c.env.DB.batch([
    c.env.DB.prepare(
      "UPDATE bugs SET report_count = report_count + 1, last_seen_at = ?, status = CASE WHEN report_count >= 2 AND status = 'CANDIDATE' THEN 'ACTIVE' ELSE status END WHERE id = ?",
    ).bind(now, bugId),
    c.env.DB.prepare(
      "INSERT INTO bug_reports (bug_id, reporter_id, service_name, description, severity) VALUES (?, ?, ?, 'Confirmed by user', ?)",
    ).bind(bugId, userId, bug.category as string, bug.severity as string),
  ]);

  const eloResult = await recordEloEvent(c.env.DB, userId, "bug_confirmed", bugId);

  return c.json({
    bugId,
    userElo: { newElo: eloResult.newElo, delta: eloResult.delta, tier: eloResult.tier },
  });
});

/** PATCH /bugbook/:id/fix — mark bug as fixed (admin only for now). */
bugbook.patch("/bugbook/:id/fix", authMiddleware, async (c) => {
  const bugId = c.req.param("id");
  const now = Date.now();

  const bug = await c.env.DB.prepare("SELECT * FROM bugs WHERE id = ?").bind(bugId).first();
  if (!bug) {
    return c.json({ error: "Bug not found" }, 404);
  }

  await c.env.DB.prepare(
    "UPDATE bugs SET status = 'FIXED', fixed_at = ? WHERE id = ?",
  ).bind(now, bugId).run();

  return c.json({ bugId, status: "FIXED" });
});

/** GET /bugbook/my-reports — user's own reports. */
bugbook.get("/bugbook/my-reports", authMiddleware, async (c) => {
  const userId = c.get("userId" as never) as string;
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50", 10), 200);

  const [reports, userElo] = await Promise.all([
    c.env.DB.prepare(
      `SELECT br.id, br.bug_id, br.description, br.severity, br.created_at,
              b.title as bug_title, b.status as bug_status, b.elo as bug_elo
       FROM bug_reports br JOIN bugs b ON br.bug_id = b.id
       WHERE br.reporter_id = ? ORDER BY br.created_at DESC LIMIT ?`,
    ).bind(userId, limit).all(),
    getUserElo(c.env.DB, userId),
  ]);

  return c.json({
    reports: reports.results,
    userElo: userElo ?? { elo: 1200, tier: "pro" },
  });
});

// ── Internal Endpoints (protected by x-internal-secret) ──

/** GET /internal/elo/:userId — get user ELO + tier. */
bugbook.get("/internal/elo/:userId", async (c) => {
  const secret = c.req.header("x-internal-secret");
  if (!secret || !c.env.INTERNAL_SERVICE_SECRET || secret !== c.env.INTERNAL_SERVICE_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const userId = c.req.param("userId");
  const user = await ensureUserElo(c.env.DB, userId);
  return c.json({ elo: user.elo, tier: user.tier, eventCount: user.eventCount });
});

/** POST /internal/elo/event — record an ELO event. */
bugbook.post("/internal/elo/event", async (c) => {
  const secret = c.req.header("x-internal-secret");
  if (!secret || !c.env.INTERNAL_SERVICE_SECRET || secret !== c.env.INTERNAL_SERVICE_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const body = await c.req.json<{
    userId: string;
    eventType: string;
    referenceId?: string;
  }>();

  if (!body.userId || !body.eventType) {
    return c.json({ error: "userId and eventType are required" }, 400);
  }

  const validTypes = new Set([
    "report_valid_bug", "bug_confirmed", "successful_tool_use",
    "false_bug_report", "rate_limit_hit", "abuse_flag",
  ]);

  if (!validTypes.has(body.eventType)) {
    return c.json({ error: "Invalid event type" }, 400);
  }

  const result = await recordEloEvent(
    c.env.DB,
    body.userId,
    body.eventType as "report_valid_bug",
    body.referenceId,
  );

  return c.json(result);
});

export { bugbook };
