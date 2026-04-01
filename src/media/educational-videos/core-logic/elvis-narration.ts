/**
 * Elvis Emotion — Narration helpers for audio ducking and scene audio entries
 */
import {
  ELVIS_DURATIONS,
  ELVIS_PERSONAS,
  type PersonaGroup,
  SCENE_GROUPS,
} from "./elvis-constants";
import { ELVIS_PERSONA_TIMESTAMPS } from "./elvis-narration-timestamps";

type SceneKey = keyof typeof ELVIS_DURATIONS;

/** Cumulative start frame for each scene */
function getSceneStartFrames(): Record<SceneKey, number> {
  const keys = Object.keys(ELVIS_DURATIONS) as SceneKey[];
  const starts: Partial<Record<SceneKey, number>> = {};
  let cumulative = 0;
  for (const key of keys) {
    starts[key] = cumulative;
    cumulative += ELVIS_DURATIONS[key];
  }
  return starts as Record<SceneKey, number>;
}

const SCENE_STARTS = getSceneStartFrames();

/**
 * Get per-persona voice active frame ranges for music ducking.
 * Uses real timestamps when available, falls back to even spacing.
 */
export function getElvisVoiceActiveFrames(): [number, number][] {
  const ranges: [number, number][] = [];
  const fps = 30;

  for (const [sceneKey, groups] of Object.entries(SCENE_GROUPS) as [SceneKey, PersonaGroup[]][]) {
    if (groups.length === 0) continue;

    const sceneStart = SCENE_STARTS[sceneKey];
    const sceneDuration = ELVIS_DURATIONS[sceneKey];
    const personas = ELVIS_PERSONAS.filter((p) => groups.includes(p.group));

    if (personas.length === 0) continue;

    const perPersonaFrames = Math.floor(sceneDuration / personas.length);

    for (let i = 0; i < personas.length; i++) {
      const persona = personas[i];
      if (!persona) continue;
      const ts = ELVIS_PERSONA_TIMESTAMPS[persona.id];

      if (ts && ts.words.length > 0) {
        // Use real timestamps
        const firstWord = ts.words[0];
        if (!firstWord) continue;
        const voiceStart = sceneStart + i * perPersonaFrames + Math.floor(firstWord.start * fps);
        const voiceEnd =
          sceneStart + i * perPersonaFrames + Math.ceil(ts.audioDurationSeconds * fps);
        ranges.push([voiceStart, voiceEnd]);
      } else {
        // Placeholder: assume voice fills 70% of the persona's slot
        const slotStart = sceneStart + i * perPersonaFrames;
        const voiceFrames = Math.floor(perPersonaFrames * 0.7);
        const padding = Math.floor((perPersonaFrames - voiceFrames) / 2);
        ranges.push([slotStart + padding, slotStart + padding + voiceFrames]);
      }
    }
  }

  return ranges.sort((a, b) => a[0] - b[0]);
}

/**
 * Scene-level audio entries for per-scene audio tracks
 */
export function getElvisSceneAudioEntries(): { sceneId: SceneKey; startFrame: number }[] {
  return (Object.keys(ELVIS_DURATIONS) as SceneKey[]).map((key) => ({
    sceneId: key,
    startFrame: SCENE_STARTS[key],
  }));
}

/**
 * Get individual persona audio entries within a scene
 */
export function getElvisPersonaEntries(sceneKey: SceneKey): {
  personaId: string;
  startFrame: number;
  durationFrames: number;
}[] {
  const groups = SCENE_GROUPS[sceneKey];
  if (groups.length === 0) return [];

  const sceneStart = SCENE_STARTS[sceneKey];
  const sceneDuration = ELVIS_DURATIONS[sceneKey];
  const personas = ELVIS_PERSONAS.filter((p) => groups.includes(p.group));

  if (personas.length === 0) return [];
  const perPersona = Math.floor(sceneDuration / personas.length);

  return personas.map((p, i) => ({
    personaId: p.id,
    startFrame: sceneStart + i * perPersona,
    durationFrames: perPersona,
  }));
}
