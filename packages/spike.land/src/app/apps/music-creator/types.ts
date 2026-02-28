export type InstrumentId =
  | "piano"
  | "drums"
  | "synth"
  | "bass"
  | "guitar"
  | "strings"
  | "brass"
  | "pads";

export interface Instrument {
  id: InstrumentId;
  label: string;
  color: string;
  icon: string;
}

export interface Note {
  pitch: number; // 0–11 (C=0, C#=1, …, B=11)
  octave: number; // 3–6
  step: number; // 0-based column in piano roll
  duration: number; // in steps
}

export interface Track {
  id: string;
  name: string;
  instrument: InstrumentId;
  volume: number; // 0–100
  pan: number; // -100 to 100
  muted: boolean;
  notes: Note[];
  color: string;
}

export type PlaybackState = "stopped" | "playing" | "paused";

export interface MusicProject {
  id: string;
  name: string;
  bpm: number;
  timeSignature: [number, number]; // [beats, noteValue]
  tracks: Track[];
}
