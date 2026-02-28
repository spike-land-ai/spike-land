"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Circle, Download, Pause, Play, Square } from "lucide-react";
import type { PlaybackState } from "../types";

interface TransportBarProps {
  playbackState: PlaybackState;
  bpm: number;
  timeSignature: [number, number];
  isExporting: boolean;
  onPlay: () => void;
  onStop: () => void;
  onPause: () => void;
  onBpmChange: (bpm: number) => void;
  onTimeSignatureChange: (sig: [number, number]) => void;
  onExport: () => void;
}

const TIME_SIGNATURES: Array<[number, number]> = [
  [4, 4],
  [3, 4],
  [6, 8],
  [5, 4],
  [7, 8],
];

export function TransportBar({
  playbackState,
  bpm,
  timeSignature,
  isExporting,
  onPlay,
  onStop,
  onPause,
  onBpmChange,
  onTimeSignatureChange,
  onExport,
}: TransportBarProps) {
  const isPlaying = playbackState === "playing";
  const isPaused = playbackState === "paused";

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* Transport buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
          onClick={onStop}
          aria-label="Stop"
        >
          <Square className="h-4 w-4 fill-current" />
        </Button>

        {isPlaying
          ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full border-2 border-amber-500/60 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300"
              onClick={onPause}
              aria-label="Pause"
            >
              <Pause className="h-5 w-5 fill-current" />
            </Button>
          )
          : (
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full border-2 border-emerald-500/60 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
              onClick={onPlay}
              aria-label="Play"
            >
              <Play className="h-5 w-5 fill-current ml-0.5" />
            </Button>
          )}

        {/* Record button (visual only) */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full border border-white/10 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/40"
          aria-label="Record"
        >
          <Circle className="h-4 w-4 fill-rose-500/30 stroke-rose-400" />
        </Button>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2 min-w-[80px]">
        <div
          className={`h-2 w-2 rounded-full ${
            isPlaying
              ? "bg-emerald-400 animate-pulse"
              : isPaused
              ? "bg-amber-400"
              : "bg-zinc-600"
          }`}
        />
        <span className="text-xs text-zinc-400 uppercase tracking-wider font-mono">
          {isPlaying ? "Playing" : isPaused ? "Paused" : "Stopped"}
        </span>
      </div>

      <div className="h-6 w-px bg-white/10" />

      {/* BPM */}
      <div className="flex items-center gap-2">
        <Label className="text-xs text-zinc-500 uppercase tracking-wider">BPM</Label>
        <Input
          type="number"
          min={40}
          max={300}
          value={bpm}
          onChange={e => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val) && val >= 40 && val <= 300) {
              onBpmChange(val);
            }
          }}
          className="w-16 h-8 bg-white/5 border-white/10 text-white text-center text-sm font-mono focus:border-violet-500/60"
        />
      </div>

      {/* Time signature */}
      <div className="flex items-center gap-2">
        <Label className="text-xs text-zinc-500 uppercase tracking-wider">Time</Label>
        <Select
          value={timeSignature.join("/")}
          onValueChange={val => {
            const [beats, noteVal] = val.split("/").map(Number);
            if (beats !== undefined && noteVal !== undefined) {
              onTimeSignatureChange([beats, noteVal]);
            }
          }}
        >
          <SelectTrigger className="w-20 h-8 bg-white/5 border-white/10 text-white text-sm font-mono">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-white/10">
            {TIME_SIGNATURES.map(sig => (
              <SelectItem
                key={sig.join("/")}
                value={sig.join("/")}
                className="text-zinc-200 focus:bg-white/10 font-mono"
              >
                {sig[0]}/{sig[1]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="ml-auto">
        <Button
          size="sm"
          variant="outline"
          onClick={onExport}
          disabled={isExporting}
          className="border-violet-500/40 text-violet-300 hover:bg-violet-500/10 hover:text-violet-200 gap-2"
        >
          <Download className="h-3.5 w-3.5" />
          {isExporting ? "Exporting…" : "Export"}
        </Button>
      </div>
    </div>
  );
}
