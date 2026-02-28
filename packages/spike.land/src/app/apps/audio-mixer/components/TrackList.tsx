"use client";

import { Headphones, Trash2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface Track {
  id: string;
  name: string;
  fileFormat: string;
  duration: number;
  volume: number;
  muted: boolean;
  solo: boolean;
}

interface TrackListProps {
  tracksData: string | undefined;
  isLoading: boolean;
  onUpdateTrack: (
    trackId: string,
    updates: Partial<Pick<Track, "volume" | "muted" | "solo">>,
  ) => Promise<void>;
  onDeleteTrack: (trackId: string) => Promise<void>;
  isUpdating: boolean;
  isDeleting: boolean;
}

function parseTracks(raw: string | undefined): Track[] {
  if (!raw || raw.includes("No tracks") || raw.includes("NOT_FOUND")) return [];
  const lines = raw.split("\n").filter(l => l.startsWith("- **"));
  return lines.map(line => {
    const nameMatch = line.match(/\*\*(.+?)\*\* \((.+?)\)/);
    const formatMatch = line.match(/ — (\w+) — /);
    const durationMatch = line.match(/— (\d+(?:\.\d+)?)s/);
    const volMatch = line.match(/vol:(\d+(?:\.\d+)?)/);
    const mutedMatch = line.match(/muted:(true|false)/);
    const soloMatch = line.match(/solo:(true|false)/);
    return {
      id: nameMatch?.[2] ?? "",
      name: nameMatch?.[1] ?? "Untitled",
      fileFormat: formatMatch?.[1]?.toLowerCase() ?? "wav",
      duration: parseFloat(durationMatch?.[1] ?? "0"),
      volume: parseFloat(volMatch?.[1] ?? "1"),
      muted: mutedMatch?.[1] === "true",
      solo: soloMatch?.[1] === "true",
    };
  }).filter(t => t.id);
}

const FORMAT_COLORS: Record<string, string> = {
  wav: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  mp3: "bg-green-500/20 text-green-300 border-green-500/30",
  ogg: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  flac: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  webm: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  aac: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  m4a: "bg-pink-500/20 text-pink-300 border-pink-500/30",
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TrackList({
  tracksData,
  isLoading,
  onUpdateTrack,
  onDeleteTrack,
  isUpdating,
  isDeleting,
}: TrackListProps) {
  const tracks = parseTracks(tracksData);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg bg-white/5 border border-white/5"
          />
        ))}
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 border border-white/10">
          <Volume2 className="h-6 w-6 text-zinc-500" />
        </div>
        <p className="text-sm text-zinc-500">No tracks yet</p>
        <p className="text-xs text-zinc-600 mt-1">
          Upload audio files to start mixing
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Tracks ({tracks.length})
          </span>
        </div>
        {tracks.map((track, index) => (
          <div key={track.id}>
            <div
              className="group flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2.5 transition-all hover:border-white/10 hover:bg-white/[0.06]"
              id={`track-${track.id}`}
            >
              {/* Track number */}
              <span className="w-5 text-center text-xs font-mono text-zinc-600">
                {index + 1}
              </span>

              {/* Solo / Mute buttons */}
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`h-7 w-7 p-0 text-xs font-bold transition-colors ${
                        track.solo
                          ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                          : "text-zinc-500 hover:text-amber-300 hover:bg-amber-500/10"
                      }`}
                      onClick={() => onUpdateTrack(track.id, { solo: !track.solo })}
                      disabled={isUpdating}
                    >
                      <Headphones className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {track.solo ? "Unsolo" : "Solo"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`h-7 w-7 p-0 text-xs font-bold transition-colors ${
                        track.muted
                          ? "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                          : "text-zinc-500 hover:text-red-300 hover:bg-red-500/10"
                      }`}
                      onClick={() => onUpdateTrack(track.id, { muted: !track.muted })}
                      disabled={isUpdating}
                    >
                      <VolumeX className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {track.muted ? "Unmute" : "Mute"}
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Track name + format */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-white">
                    {track.name}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 h-4 shrink-0 border ${
                      FORMAT_COLORS[track.fileFormat]
                        ?? "bg-zinc-500/20 text-zinc-300 border-zinc-500/30"
                    }`}
                  >
                    {track.fileFormat.toUpperCase()}
                  </Badge>
                </div>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {formatDuration(track.duration)}
                </span>
              </div>

              {/* Volume slider */}
              <div className="flex items-center gap-2 w-28 shrink-0">
                <Volume2 className="h-3 w-3 text-zinc-500 shrink-0" />
                <Slider
                  min={0}
                  max={200}
                  step={1}
                  value={[track.volume * 100]}
                  onValueCommit={val => onUpdateTrack(track.id, { volume: val[0]! / 100 })}
                  className="flex-1"
                />
              </div>

              {/* Delete */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={() => onDeleteTrack(track.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Track</TooltipContent>
              </Tooltip>
            </div>
            {index < tracks.length - 1 && <Separator className="bg-white/5 my-0.5" />}
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
