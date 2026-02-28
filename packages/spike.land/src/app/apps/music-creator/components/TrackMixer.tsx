"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Trash2, Volume2, VolumeX } from "lucide-react";
import type { Track } from "../types";
import { INSTRUMENTS } from "./InstrumentSidebar";

interface TrackMixerProps {
  tracks: Track[];
  onVolumeChange: (trackId: string, volume: number) => void;
  onPanChange: (trackId: string, pan: number) => void;
  onMuteToggle: (trackId: string) => void;
  onRemoveTrack: (trackId: string) => void;
}

export function TrackMixer({
  tracks,
  onVolumeChange,
  onPanChange,
  onMuteToggle,
  onRemoveTrack,
}: TrackMixerProps) {
  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
        <Volume2 className="h-8 w-8 text-zinc-700" />
        <p className="text-sm text-zinc-600">Add tracks to mix them here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {tracks.map(track => {
        const inst = INSTRUMENTS.find(i => i.id === track.instrument);
        return (
          <div
            key={track.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group"
          >
            {/* Color indicator */}
            <div className={`h-8 w-1.5 rounded-full flex-shrink-0 ${track.color}`} />

            {/* Track name + instrument */}
            <div className="flex flex-col min-w-0 w-28 flex-shrink-0">
              <span className="text-xs font-medium text-zinc-200 truncate">{track.name}</span>
              <span className="text-[10px] text-zinc-500">{inst?.icon} {inst?.label}</span>
            </div>

            {/* Mute button */}
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 flex-shrink-0 ${
                track.muted
                  ? "text-rose-400 hover:text-rose-300"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              onClick={() => onMuteToggle(track.id)}
              aria-label={track.muted ? `Unmute ${track.name}` : `Mute ${track.name}`}
            >
              {track.muted
                ? <VolumeX className="h-3.5 w-3.5" />
                : <Volume2 className="h-3.5 w-3.5" />}
            </Button>

            {/* Volume slider */}
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Label className="text-[10px] text-zinc-600 w-6 flex-shrink-0">Vol</Label>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[track.volume]}
                  onValueChange={([val]) => val !== undefined && onVolumeChange(track.id, val)}
                  className="flex-1"
                  aria-label={`Volume for ${track.name}`}
                />
                <span className="text-[10px] text-zinc-500 w-7 text-right font-mono">
                  {track.volume}
                </span>
              </div>

              {/* Pan slider */}
              <div className="flex items-center gap-2">
                <Label className="text-[10px] text-zinc-600 w-6 flex-shrink-0">Pan</Label>
                <Slider
                  min={-100}
                  max={100}
                  step={1}
                  value={[track.pan]}
                  onValueChange={([val]) => val !== undefined && onPanChange(track.id, val)}
                  className="flex-1"
                  aria-label={`Pan for ${track.name}`}
                />
                <span className="text-[10px] text-zinc-500 w-7 text-right font-mono">
                  {track.pan > 0
                    ? `R${track.pan}`
                    : track.pan < 0
                    ? `L${Math.abs(track.pan)}`
                    : "C"}
                </span>
              </div>
            </div>

            {/* Delete button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0 text-zinc-700 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemoveTrack(track.id)}
              aria-label={`Remove track ${track.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
