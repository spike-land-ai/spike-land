import { describe, it, expect } from "vitest";
import {
  selectNotes,
  updateNoteConfidence,
  pruneNotes,
  parseExtractedNote,
  DEMOTE_THRESHOLD,
} from "../core-logic/note-engine.js";
import type { AetherNote } from "../core-logic/types.js";

function makeNote(overrides: Partial<AetherNote> = {}): AetherNote {
  return {
    id: crypto.randomUUID(),
    trigger: "test trigger",
    lesson: "test lesson",
    confidence: 0.5,
    helpCount: 0,
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
    ...overrides,
  };
}

describe("selectNotes", () => {
  it("filters out notes below demote threshold", () => {
    const notes = [makeNote({ confidence: 0.1 }), makeNote({ confidence: 0.5 })];
    const selected = selectNotes(notes);
    expect(selected).toHaveLength(1);
    expect(selected[0].confidence).toBe(0.5);
  });

  it("sorts by confidence × recency", () => {
    const now = Date.now();
    const old = makeNote({ confidence: 0.9, lastUsedAt: now - 30 * 86400000 });
    const recent = makeNote({ confidence: 0.7, lastUsedAt: now });
    const selected = selectNotes([old, recent]);
    // Recent high-confidence should rank first due to recency factor
    expect(selected[0].confidence).toBe(0.7);
  });

  it("respects token budget", () => {
    const notes = Array.from({ length: 100 }, (_, i) =>
      makeNote({
        trigger: "a".repeat(50),
        lesson: "b".repeat(50),
        confidence: 0.5 + i * 0.001,
      }),
    );
    const selected = selectNotes(notes, 200);
    // 200 tokens × 4 chars = 800 chars budget
    // Each note ~130 chars, so ~6 notes
    expect(selected.length).toBeLessThan(10);
    expect(selected.length).toBeGreaterThan(0);
  });

  it("returns empty for empty input", () => {
    expect(selectNotes([])).toEqual([]);
  });
});

describe("updateNoteConfidence", () => {
  it("increases confidence when helped", () => {
    const note = makeNote({ confidence: 0.5 });
    const updated = updateNoteConfidence(note, true);
    expect(updated.confidence).toBeGreaterThan(0.5);
    expect(updated.helpCount).toBe(1);
  });

  it("decreases confidence when not helped", () => {
    const note = makeNote({ confidence: 0.5 });
    const updated = updateNoteConfidence(note, false);
    expect(updated.confidence).toBeLessThan(0.5);
    expect(updated.helpCount).toBe(0);
  });

  it("promotes high-performing notes", () => {
    const note = makeNote({ confidence: 0.65, helpCount: 3 });
    const updated = updateNoteConfidence(note, true);
    // Should get +0.15 + 0.05 promotion bonus
    expect(updated.confidence).toBeGreaterThan(0.8);
  });

  it("clamps confidence to [0, 1]", () => {
    const low = makeNote({ confidence: 0.05 });
    expect(updateNoteConfidence(low, false).confidence).toBeGreaterThanOrEqual(0);

    const high = makeNote({ confidence: 0.95, helpCount: 5 });
    expect(updateNoteConfidence(high, true).confidence).toBeLessThanOrEqual(1);
  });
});

describe("pruneNotes", () => {
  it("removes notes below demote threshold", () => {
    const notes = [
      makeNote({ confidence: 0.1 }),
      makeNote({ confidence: 0.5 }),
      makeNote({ confidence: DEMOTE_THRESHOLD }),
    ];
    const pruned = pruneNotes(notes);
    expect(pruned).toHaveLength(2);
  });
});

describe("parseExtractedNote", () => {
  it("parses valid JSON", () => {
    const result = parseExtractedNote(
      JSON.stringify({ trigger: "when X", lesson: "do Y", confidence: 0.5 }),
    );
    expect(result).toEqual({ trigger: "when X", lesson: "do Y", confidence: 0.5 });
  });

  it("returns null for 'null' string", () => {
    expect(parseExtractedNote("null")).toBeNull();
  });

  it("returns null for non-JSON", () => {
    expect(parseExtractedNote("not json")).toBeNull();
  });

  it("returns null for missing fields", () => {
    expect(parseExtractedNote(JSON.stringify({ trigger: "x" }))).toBeNull();
  });

  it("clamps confidence to [0.3, 0.7]", () => {
    const high = parseExtractedNote(
      JSON.stringify({ trigger: "x", lesson: "y", confidence: 0.99 }),
    );
    expect(high?.confidence).toBe(0.7);

    const low = parseExtractedNote(JSON.stringify({ trigger: "x", lesson: "y", confidence: 0.1 }));
    expect(low?.confidence).toBe(0.3);
  });
});
