import type { AetherNote } from "./types.js";

const DEMOTE_THRESHOLD = 0.3;
const PROMOTE_THRESHOLD = 0.6;
const PROMOTE_HELP_MIN = 3;
const MAX_DYNAMIC_TOKENS = 800;
const AVG_CHARS_PER_TOKEN = 4;
const MAX_DYNAMIC_CHARS = MAX_DYNAMIC_TOKENS * AVG_CHARS_PER_TOKEN;

/**
 * Select the most relevant notes that fit within the token budget.
 * Sorted by confidence x recency, packed greedily.
 */
export function selectNotes(notes: AetherNote[], maxTokens = MAX_DYNAMIC_TOKENS): AetherNote[] {
  const maxChars = maxTokens * AVG_CHARS_PER_TOKEN;
  const now = Date.now();

  const scored = notes
    .filter((n) => n.confidence >= DEMOTE_THRESHOLD)
    .map((n) => {
      const daysSinceUsed = (now - n.lastUsedAt) / (1000 * 60 * 60 * 24);
      const recencyFactor = 1 / (1 + daysSinceUsed * 0.1);
      return { note: n, score: n.confidence * recencyFactor };
    })
    .sort((a, b) => b.score - a.score);

  const selected: AetherNote[] = [];
  let charBudget = maxChars;

  for (const { note } of scored) {
    const noteChars = note.trigger.length + note.lesson.length + 30; // overhead
    if (noteChars > charBudget) continue;
    selected.push(note);
    charBudget -= noteChars;
  }

  return selected;
}

/**
 * Update note confidence using a simple Bayesian-inspired rule.
 * If the note helped: confidence moves toward 1.
 * If not: confidence moves toward 0.
 */
export function updateNoteConfidence(note: AetherNote, helped: boolean): AetherNote {
  const alpha = helped ? 0.15 : -0.1;
  const newConfidence = Math.max(0, Math.min(1, note.confidence + alpha));
  const newHelpCount = helped ? note.helpCount + 1 : note.helpCount;

  // Promote high-performing notes
  const promoted =
    newConfidence >= PROMOTE_THRESHOLD && newHelpCount >= PROMOTE_HELP_MIN
      ? Math.min(1, newConfidence + 0.05)
      : newConfidence;

  return {
    ...note,
    confidence: promoted,
    helpCount: newHelpCount,
    lastUsedAt: Date.now(),
  };
}

/**
 * Prune notes below the demote threshold. Returns only surviving notes.
 */
export function pruneNotes(notes: AetherNote[]): AetherNote[] {
  return notes.filter((n) => n.confidence >= DEMOTE_THRESHOLD);
}

/**
 * Try to extract a note from a user/assistant exchange.
 * Returns null if extraction fails or response is "null".
 */
export function parseExtractedNote(
  rawResponse: string,
): Pick<AetherNote, "trigger" | "lesson" | "confidence"> | null {
  const trimmed = rawResponse.trim();
  if (trimmed === "null" || !trimmed.startsWith("{")) return null;

  try {
    const parsed = JSON.parse(trimmed) as {
      trigger?: string;
      lesson?: string;
      confidence?: number;
    };
    if (!parsed.trigger || !parsed.lesson || typeof parsed.confidence !== "number") {
      return null;
    }
    return {
      trigger: parsed.trigger,
      lesson: parsed.lesson,
      confidence: Math.max(0.3, Math.min(0.7, parsed.confidence)),
    };
  } catch {
    return null;
  }
}

/**
 * Auto-Dream: Background note consolidation.
 * Inspired by Claude Code's Auto-Dream subsystem (CCU).
 *
 * Runs three passes over the note set:
 * 1. Decay — notes not used in 30+ days get a confidence penalty
 * 2. Merge — notes with similar triggers/lessons are consolidated
 * 3. Prune — notes below the demote threshold are removed
 *
 * Returns the consolidated note set and IDs of notes to delete.
 */
export interface ConsolidationResult {
  surviving: AetherNote[];
  merged: Array<{ kept: string; absorbed: string }>;
  decayed: string[];
  pruned: string[];
}

const DECAY_DAYS = 30;
const DECAY_PENALTY = 0.08;
const SIMILARITY_THRESHOLD = 0.6;

/**
 * Simple word-overlap similarity between two strings.
 * Returns a score between 0 and 1.
 */
function wordOverlapSimilarity(a: string, b: string): number {
  const wordsA = new Set(
    a
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
  const wordsB = new Set(
    b
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let overlap = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) overlap++;
  }

  return (2 * overlap) / (wordsA.size + wordsB.size);
}

export function consolidateNotes(notes: AetherNote[]): ConsolidationResult {
  const now = Date.now();
  const decayed: string[] = [];
  const merged: Array<{ kept: string; absorbed: string }> = [];
  const absorbedIds = new Set<string>();

  // Pass 1: Decay stale notes
  const afterDecay = notes.map((note) => {
    const daysSinceUsed = (now - note.lastUsedAt) / (1000 * 60 * 60 * 24);
    if (daysSinceUsed > DECAY_DAYS) {
      decayed.push(note.id);
      return {
        ...note,
        confidence: Math.max(0, note.confidence - DECAY_PENALTY),
      };
    }
    return note;
  });

  // Pass 2: Merge similar notes (keep the one with higher confidence)
  for (let i = 0; i < afterDecay.length; i++) {
    const noteI = afterDecay[i];
    if (!noteI || absorbedIds.has(noteI.id)) continue;

    for (let j = i + 1; j < afterDecay.length; j++) {
      const noteJ = afterDecay[j];
      if (!noteJ || absorbedIds.has(noteJ.id)) continue;

      const triggerSim = wordOverlapSimilarity(noteI.trigger, noteJ.trigger);
      const lessonSim = wordOverlapSimilarity(noteI.lesson, noteJ.lesson);
      const combinedSim = triggerSim * 0.4 + lessonSim * 0.6;

      if (combinedSim >= SIMILARITY_THRESHOLD) {
        // Keep the stronger note, absorb the weaker
        const keeper = noteI.confidence >= noteJ.confidence ? noteI : noteJ;
        const absorbed = noteI.confidence >= noteJ.confidence ? noteJ : noteI;

        // Boost the keeper with a portion of the absorbed note's confidence
        keeper.confidence = Math.min(1, keeper.confidence + absorbed.confidence * 0.1);
        keeper.helpCount = keeper.helpCount + absorbed.helpCount;
        absorbedIds.add(absorbed.id);
        merged.push({ kept: keeper.id, absorbed: absorbed.id });
      }
    }
  }

  // Pass 3: Filter out absorbed and pruned notes
  const surviving: AetherNote[] = [];
  const pruned: string[] = [];

  for (const note of afterDecay) {
    if (absorbedIds.has(note.id)) continue;
    if (note.confidence < DEMOTE_THRESHOLD) {
      pruned.push(note.id);
      continue;
    }
    surviving.push(note);
  }

  return { surviving, merged, decayed, pruned };
}

export { MAX_DYNAMIC_CHARS, DEMOTE_THRESHOLD };
