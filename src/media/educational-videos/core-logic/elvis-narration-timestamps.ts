/**
 * Elvis Emotion — Narration timestamps (placeholder)
 *
 * This file will be auto-generated from ElevenLabs API responses.
 * For now it contains empty structures so the composition compiles.
 */

export interface ElvisNarrationWord {
  word: string;
  start: number; // seconds
  end: number; // seconds
}

export interface ElvisPersonaTimestamps {
  personaId: string;
  words: ElvisNarrationWord[];
  audioDurationSeconds: number;
}

/**
 * Per-persona voice timestamps (populated by audio generation script)
 * Keyed by persona ID (e.g., "socrates", "host-a")
 */
export const ELVIS_PERSONA_TIMESTAMPS: Record<string, ElvisPersonaTimestamps> = {};

/**
 * Check if timestamps exist for a persona
 */
export function hasTimestamps(personaId: string): boolean {
  const ts = ELVIS_PERSONA_TIMESTAMPS[personaId];
  return ts !== undefined && ts.words.length > 0;
}
