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

/**
 * Delete specific notes by IDs (used by Auto-Dream consolidation for absorbed/pruned notes).
 */
export async function deleteNotesByIds(
  db: D1Database,
  userId: string,
  noteIds: string[],
): Promise<void> {
  if (noteIds.length === 0) return;

  // D1 doesn't support array bindings, so batch individual deletes
  const stmt = db.prepare("DELETE FROM aether_notes WHERE id = ? AND user_id = ?");
  const batch = noteIds.map((id) => stmt.bind(id, userId));
  await db.batch(batch);
}

/**
 * Batch update note confidence/helpCount (used by Auto-Dream consolidation for merged notes).
 */
export async function batchUpdateNotes(
  db: D1Database,
  userId: string,
  updates: Array<{ id: string; confidence: number; helpCount: number }>,
): Promise<void> {
  if (updates.length === 0) return;

  const stmt = db.prepare(
    "UPDATE aether_notes SET confidence = ?, help_count = ? WHERE id = ? AND user_id = ?",
  );
  const batch = updates.map((u) => stmt.bind(u.confidence, u.helpCount, u.id, userId));
  await db.batch(batch);
}

/**
 * Update a single note's confidence and help count (used by execution feedback loop).
 */
export async function updateNoteConfidenceInDb(
  db: D1Database,
  userId: string,
  noteId: string,
  confidence: number,
  helpCount: number,
): Promise<void> {
  await db
    .prepare(
      "UPDATE aether_notes SET confidence = ?, help_count = ?, last_used_at = ? WHERE id = ? AND user_id = ?",
    )
    .bind(confidence, helpCount, Date.now(), noteId, userId)
    .run();
}
