import type { AetherNote } from "../core-logic/types.js";

const DEMOTE_THRESHOLD = 0.3;

export async function fetchUserNotes(db: D1Database, userId: string): Promise<AetherNote[]> {
  const result = await db
    .prepare(
      "SELECT id, user_id, trigger_text, lesson, confidence, help_count, created_at, last_used_at FROM aether_notes WHERE user_id = ? ORDER BY confidence DESC",
    )
    .bind(userId)
    .all<{
      id: string;
      user_id: string;
      trigger_text: string;
      lesson: string;
      confidence: number;
      help_count: number;
      created_at: number;
      last_used_at: number;
    }>();

  return (result.results ?? []).map((row) => ({
    id: row.id,
    trigger: row.trigger_text,
    lesson: row.lesson,
    confidence: row.confidence,
    helpCount: row.help_count,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
  }));
}

export async function saveNote(db: D1Database, userId: string, note: AetherNote): Promise<void> {
  await db
    .prepare(
      `INSERT INTO aether_notes (id, user_id, trigger_text, lesson, confidence, help_count, created_at, last_used_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         confidence = excluded.confidence,
         help_count = excluded.help_count,
         last_used_at = excluded.last_used_at`,
    )
    .bind(
      note.id,
      userId,
      note.trigger,
      note.lesson,
      note.confidence,
      note.helpCount,
      note.createdAt,
      note.lastUsedAt,
    )
    .run();
}

export async function pruneNotesInDb(db: D1Database, userId: string): Promise<void> {
  await db
    .prepare("DELETE FROM aether_notes WHERE user_id = ? AND confidence < ?")
    .bind(userId, DEMOTE_THRESHOLD)
    .run();
}
