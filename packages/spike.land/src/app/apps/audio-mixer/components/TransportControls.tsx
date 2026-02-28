"use client";

import {
  Pause,
  Play,
  Repeat,
  SkipBack,
  SkipForward,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PlaybackState } from "../hooks/useAudioStudio";

interface TransportControlsProps {
  playbackState: PlaybackState;
  currentTime: number;
  totalDuration: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${m}:${s.toString().padStart(2, "0")}.${ms}`;
}

export function TransportControls({
  playbackState,
  currentTime,
  totalDuration,
  onPlay,
  onPause,
  onStop,
  onSeek,
}: TransportControlsProps) {
  const isPlaying = playbackState === "playing";

  return (
    <TooltipProvider>
      <div className="flex items-center gap-4">
        {/* Time display */}
        <div className="flex items-baseline gap-1 tabular-nums min-w-[120px]">
          <span className="text-lg font-mono font-bold text-white">
            {formatTime(currentTime)}
          </span>
          <span className="text-xs text-zinc-500 font-mono">
            / {formatTime(totalDuration)}
          </span>
        </div>

        {/* Transport buttons */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-zinc-400 hover:text-white"
                onClick={() => onSeek(0)}
                id="transport-skip-back"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Go to Start</TooltipContent>
          </Tooltip>

          <Button
            size="icon"
            className={`h-10 w-10 rounded-full transition-all ${
              isPlaying
                ? "bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/20"
                : "bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/30"
            }`}
            onClick={isPlaying ? onPause : onPlay}
            id="transport-play-pause"
          >
            {isPlaying
              ? <Pause className="h-4 w-4" />
              : <Play className="h-4 w-4 ml-0.5" />}
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-zinc-400 hover:text-white"
                onClick={onStop}
                id="transport-stop"
              >
                <Square className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Stop</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-zinc-400 hover:text-white"
                onClick={() => onSeek(totalDuration)}
                id="transport-skip-forward"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Go to End</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-zinc-400 hover:text-emerald-400"
                id="transport-loop"
              >
                <Repeat className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Loop</TooltipContent>
          </Tooltip>
        </div>

        {/* Seek slider */}
        <div className="flex-1">
          <Slider
            min={0}
            max={Math.max(1, totalDuration * 10)}
            step={1}
            value={[currentTime * 10]}
            onValueChange={val => onSeek(val[0]! / 10)}
            className="cursor-pointer"
            id="transport-seek-slider"
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
