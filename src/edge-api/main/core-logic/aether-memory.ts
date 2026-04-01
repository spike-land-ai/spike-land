// Re-export from canonical locations in src/aether/
// Kept for backward compatibility with spike-chat.ts imports
export {
  selectNotes,
  updateNoteConfidence,
  pruneNotes,
  parseExtractedNote,
  consolidateNotes,
  MAX_DYNAMIC_CHARS,
  DEMOTE_THRESHOLD,
} from "../../../aether/core-logic/note-engine.js";
export type { ConsolidationResult } from "../../../aether/core-logic/note-engine.js";
export {
  fetchUserNotes,
  saveNote,
  pruneNotesInDb,
  deleteNotesByIds,
  batchUpdateNotes,
  updateNoteConfidenceInDb,
} from "../../../aether/db/notes.js";
