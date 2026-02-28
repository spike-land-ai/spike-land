"use client";

import type { Track } from "../types";
import { INSTRUMENTS } from "./InstrumentSidebar";

const STEPS = 32;

interface TrackTimelineProps {
  tracks: Track[];
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string) => void;
}

export function TrackTimeline({
  tracks,
  selectedTrackId,
  onSelectTrack,
}: TrackTimelineProps) {
  if (tracks.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-zinc-600 text-sm border border-white/5 rounded-lg border-dashed">
        No tracks yet — add an instrument to get started
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {/* Beat ruler */}
      <div className="flex ml-28">
        <div className="flex flex-1">
          {Array.from({ length: STEPS }, (_, step) => (
            <div
              key={step}
              className={`flex-1 text-center ${step % 4 === 0 ? "border-l border-white/10" : ""}`}
            >
              {step % 4 === 0 && (
                <span className="text-[9px] text-zinc-600 font-mono">{step / 4 + 1}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tracks */}
      {tracks.map(track => {
        const inst = INSTRUMENTS.find(i => i.id === track.instrument);
        const isSelected = track.id === selectedTrackId;
        const activeSteps = new Set(track.notes.map(n => n.step));

        return (
          <button
            key={track.id}
            onClick={() => onSelectTrack(track.id)}
            className={`
              flex items-center gap-0 w-full text-left cursor-pointer rounded-md overflow-hidden
              transition-all border
              ${
              isSelected
                ? "border-white/20 ring-1 ring-white/10"
                : "border-transparent hover:border-white/10"
            }
            `}
            aria-label={`Select track ${track.name}`}
            aria-pressed={isSelected}
          >
            {/* Track label */}
            <div
              className={`
                w-28 flex-shrink-0 flex items-center gap-2 px-2.5 py-2
                ${isSelected ? "bg-white/10" : "bg-white/[0.03]"}
              `}
            >
              <div className={`h-3 w-1.5 rounded-full flex-shrink-0 ${track.color}`} />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-zinc-200 truncate">{track.name}</span>
                <span className="text-[10px] text-zinc-500">{inst?.icon}</span>
              </div>
              {track.muted && <span className="text-[9px] text-rose-400 ml-auto">M</span>}
            </div>

            {/* Note bars */}
            <div className="flex flex-1 h-10">
              {Array.from({ length: STEPS }, (_, step) => {
                const active = activeSteps.has(step);
                const isBeat = step % 4 === 0;
                return (
                  <div
                    key={step}
                    className={`
                      flex-1 h-full border-r transition-colors
                      ${isBeat ? "border-white/10" : "border-white/[0.02]"}
                      ${active ? `${track.color} opacity-80` : "bg-black/20"}
                    `}
                  />
                );
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
}
