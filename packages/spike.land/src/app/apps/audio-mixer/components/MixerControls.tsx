"use client";

import { Download, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

interface MixerControlsProps {
  masterVolume: number;
  onMasterVolumeChange: (vol: number) => void;
  hasProject: boolean;
}

export function MixerControls({
  masterVolume,
  onMasterVolumeChange,
  hasProject,
}: MixerControlsProps) {
  const volumePercent = Math.round(masterVolume * 100);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-emerald-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Master
        </span>
      </div>

      {/* Master Volume Fader */}
      <div className="flex flex-col items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-4">
        {/* Volume level indicator */}
        <div className="relative w-full h-32 flex justify-center">
          <div className="relative w-6 h-full rounded-full bg-white/5 overflow-hidden">
            {/* Fill bar */}
            <div
              className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-100"
              style={{
                height: `${volumePercent}%`,
                background: `linear-gradient(to top, #10b981, #06b6d4, #8b5cf6)`,
                boxShadow: "0 0 12px rgba(16, 185, 129, 0.3)",
              }}
            />
            {/* Level markers */}
            {[0, 25, 50, 75, 100].map(level => (
              <div
                key={level}
                className="absolute left-0 right-0 h-px bg-white/10"
                style={{ bottom: `${level}%` }}
              />
            ))}
          </div>
          {/* dB scale */}
          <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[9px] font-mono text-zinc-600 pr-1">
            <span>+6</span>
            <span>0</span>
            <span>-6</span>
            <span>-12</span>
            <span>-∞</span>
          </div>
        </div>

        {/* Volume slider */}
        <Slider
          orientation="horizontal"
          min={0}
          max={200}
          step={1}
          value={[volumePercent]}
          onValueChange={val => onMasterVolumeChange(val[0]! / 100)}
          className="w-full"
          id="master-volume-slider"
        />

        {/* Volume readout */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono font-bold text-white tabular-nums">
            {volumePercent}%
          </span>
          <span className="text-[10px] text-zinc-500">
            ({volumePercent > 100 ? "+" : ""}
            {Math.round((masterVolume - 1) * 6)}dB)
          </span>
        </div>
      </div>

      <Separator className="bg-white/5" />

      {/* Export */}
      <Button
        variant="outline"
        className="w-full border-white/10 bg-white/5 text-white hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/30 gap-2"
        disabled={!hasProject}
        id="export-mix-btn"
      >
        <Download className="h-4 w-4" />
        Export Mix
      </Button>
    </div>
  );
}
