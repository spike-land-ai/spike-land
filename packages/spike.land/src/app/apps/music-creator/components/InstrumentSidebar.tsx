"use client";

import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import type { Instrument, InstrumentId, Track } from "../types";

export const INSTRUMENTS: Instrument[] = [
  { id: "piano", label: "Piano", color: "bg-violet-500", icon: "🎹" },
  { id: "drums", label: "Drums", color: "bg-rose-500", icon: "🥁" },
  { id: "synth", label: "Synth", color: "bg-cyan-500", icon: "🎛️" },
  { id: "bass", label: "Bass", color: "bg-amber-500", icon: "🎸" },
  { id: "guitar", label: "Guitar", color: "bg-emerald-500", icon: "🎵" },
  { id: "strings", label: "Strings", color: "bg-pink-500", icon: "🎻" },
  { id: "brass", label: "Brass", color: "bg-orange-500", icon: "🎺" },
  { id: "pads", label: "Pads", color: "bg-indigo-500", icon: "✨" },
];

interface InstrumentSidebarProps {
  tracks: Track[];
  selectedTrackId: string | null;
  onAddTrack: (instrument: InstrumentId) => void;
  onSelectTrack: (trackId: string) => void;
}

export function InstrumentSidebar({
  tracks,
  selectedTrackId,
  onAddTrack,
  onSelectTrack,
}: InstrumentSidebarProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold px-1">
        Instruments
      </p>

      <div className="grid grid-cols-2 gap-1.5">
        {INSTRUMENTS.map(inst => {
          const trackCount = tracks.filter(t => t.instrument === inst.id).length;
          return (
            <button
              key={inst.id}
              onClick={() => onAddTrack(inst.id)}
              className={`
                flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-all text-left
                border-white/5 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/15
                group cursor-pointer
              `}
              aria-label={`Add ${inst.label} track`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-lg">{inst.icon}</span>
                {trackCount > 0 && (
                  <Badge
                    className={`text-[9px] h-4 px-1 ${inst.color} text-white border-0`}
                  >
                    {trackCount}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-zinc-300 font-medium w-full truncate">
                {inst.label}
              </span>
              <div
                className={`h-0.5 w-full rounded-full opacity-50 ${inst.color}`}
              />
            </button>
          );
        })}
      </div>

      {tracks.length > 0 && (
        <>
          <div className="h-px bg-white/5 my-1" />
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold px-1">
            Tracks ({tracks.length})
          </p>
          <div className="flex flex-col gap-1">
            {tracks.map(track => {
              const inst = INSTRUMENTS.find(i => i.id === track.instrument);
              const isSelected = track.id === selectedTrackId;
              return (
                <button
                  key={track.id}
                  onClick={() => onSelectTrack(track.id)}
                  className={`
                    flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-all text-left cursor-pointer
                    ${
                    isSelected
                      ? "bg-white/10 border-white/20"
                      : "bg-white/[0.02] border-transparent hover:bg-white/[0.05] hover:border-white/10"
                  }
                  `}
                  aria-label={`Select track ${track.name}`}
                  aria-pressed={isSelected}
                >
                  <div className={`h-3 w-1.5 rounded-full ${track.color}`} />
                  <span className="text-xs text-zinc-300 truncate flex-1">{track.name}</span>
                  <span className="text-[10px] text-zinc-600">{inst?.icon}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {tracks.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
          <Plus className="h-6 w-6 text-zinc-600" />
          <p className="text-xs text-zinc-600">Click an instrument to add a track</p>
        </div>
      )}
    </div>
  );
}
