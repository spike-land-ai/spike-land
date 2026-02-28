"use client";

import type { Note, Track } from "../types";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const OCTAVES = [6, 5, 4, 3];
const STEPS = 32; // 32 steps = 2 bars of 4/4

interface PianoRollProps {
  track: Track | null;
  onToggleNote: (trackId: string, note: Note) => void;
}

function isBlackKey(pitch: number): boolean {
  return [1, 3, 6, 8, 10].includes(pitch);
}

function noteKey(n: Note) {
  return `${n.pitch}-${n.octave}-${n.step}`;
}

export function PianoRoll({ track, onToggleNote }: PianoRollProps) {
  if (!track) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-600 text-sm">
        Select a track to edit notes
      </div>
    );
  }

  const noteSet = new Set(track.notes.map(noteKey));

  function handleCellClick(pitch: number, octave: number, step: number) {
    const note: Note = { pitch, octave, step, duration: 1 };
    onToggleNote(track!.id, note);
  }

  return (
    <div className="flex overflow-x-auto">
      {/* Piano keys */}
      <div className="flex flex-col flex-shrink-0 w-10 border-r border-white/5">
        {OCTAVES.map(octave =>
          NOTE_NAMES.map((name, pitch) => {
            const black = isBlackKey(pitch);
            return (
              <div
                key={`${pitch}-${octave}`}
                className={`
                  h-6 flex items-center justify-end pr-1.5 text-[9px] border-b border-white/5 flex-shrink-0
                  ${black ? "bg-zinc-800 text-zinc-500" : "bg-zinc-700/30 text-zinc-400"}
                  ${name === "C" ? "border-b-white/20" : ""}
                `}
              >
                {name === "C" ? `C${octave}` : name}
              </div>
            );
          })
        )}
      </div>

      {/* Note grid */}
      <div className="flex flex-col flex-1 min-w-0">
        {OCTAVES.map(octave =>
          NOTE_NAMES.map((name, pitch) => {
            const black = isBlackKey(pitch);
            return (
              <div
                key={`${pitch}-${octave}`}
                className={`
                  flex h-6 flex-shrink-0
                  ${black ? "bg-zinc-900/60" : "bg-zinc-900/30"}
                  ${name === "C" ? "border-b border-white/15" : "border-b border-white/5"}
                `}
              >
                {Array.from({ length: STEPS }, (_, step) => {
                  const active = noteSet.has(noteKey({ pitch, octave, step, duration: 1 }));
                  const isBeat = step % 4 === 0;
                  return (
                    <button
                      key={step}
                      onClick={() => handleCellClick(pitch, octave, step)}
                      aria-label={`${name}${octave} step ${step + 1}`}
                      aria-pressed={active}
                      className={`
                        flex-1 h-full border-r transition-colors cursor-pointer
                        ${isBeat ? "border-white/10" : "border-white/[0.03]"}
                        ${
                        active
                          ? `${track.color} opacity-90 hover:opacity-100`
                          : `hover:bg-white/10 ${black ? "bg-transparent" : "bg-transparent"}`
                      }
                      `}
                    />
                  );
                })}
              </div>
            );
          })
        )}

        {/* Step markers */}
        <div className="flex h-5 border-t border-white/10 flex-shrink-0">
          {Array.from({ length: STEPS }, (_, step) => (
            <div
              key={step}
              className={`
                flex-1 flex items-center justify-center
                ${step % 4 === 0 ? "border-r border-white/10" : "border-r border-white/[0.03]"}
              `}
            >
              {step % 4 === 0 && (
                <span className="text-[9px] text-zinc-600 font-mono">{step / 4 + 1}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
