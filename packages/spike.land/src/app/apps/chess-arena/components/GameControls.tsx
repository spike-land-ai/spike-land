"use client";

import { Button } from "@/components/ui/button";
import type { ChessColor } from "@/lib/chess/types";
import type { ChessTheme } from "../themes";
import { formatClockTime } from "../themes";

interface GameControlsProps {
  clocks: { w: number; b: number; };
  turn: ChessColor;
  timeControl: string;
  drawOffer: ChessColor | null;
  theme: ChessTheme;
  onResign: () => void;
  onOfferDraw: () => void;
  onAcceptDraw: () => void;
  onDeclineDraw: () => void;
  onFlipBoard: () => void;
}

function Clock({
  time,
  isActive,
  label,
  theme,
  isUnlimited,
}: {
  time: number;
  isActive: boolean;
  label: string;
  theme: ChessTheme;
  isUnlimited: boolean;
}) {
  const isLow = time < 10_000 && !isUnlimited;

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg px-4 py-2 min-w-[100px] transition-colors ${
        isLow && isActive ? "animate-pulse" : ""
      }`}
      style={{
        backgroundColor: isActive ? theme.activeClockBg : theme.inactiveClockBg,
      }}
    >
      <span className="text-xs opacity-70" style={{ color: theme.clockText }}>
        {label}
      </span>
      <span
        className="text-2xl font-mono font-bold"
        style={{ color: isLow ? theme.clockLowText : theme.clockText }}
      >
        {isUnlimited ? "\u221E" : formatClockTime(time)}
      </span>
    </div>
  );
}

export function GameControls({
  clocks,
  turn,
  timeControl,
  drawOffer,
  theme,
  onResign,
  onOfferDraw,
  onAcceptDraw,
  onDeclineDraw,
  onFlipBoard,
}: GameControlsProps) {
  const isUnlimited = timeControl === "UNLIMITED";

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex justify-between gap-3">
        <Clock
          time={clocks.b}
          isActive={turn === "b"}
          label="Black"
          theme={theme}
          isUnlimited={isUnlimited}
        />
        <Clock
          time={clocks.w}
          isActive={turn === "w"}
          label="White"
          theme={theme}
          isUnlimited={isUnlimited}
        />
      </div>

      <div className="flex gap-2 justify-center flex-wrap">
        {drawOffer && drawOffer !== turn
          ? (
            <>
              <Button size="sm" variant="outline" onClick={onAcceptDraw}>
                Accept Draw
              </Button>
              <Button size="sm" variant="outline" onClick={onDeclineDraw}>
                Decline
              </Button>
            </>
          )
          : (
            <>
              <Button size="sm" variant="outline" onClick={onResign}>
                Resign
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onOfferDraw}
                disabled={!!drawOffer}
              >
                Draw
              </Button>
            </>
          )}
        <Button size="sm" variant="outline" onClick={onFlipBoard}>
          Flip
        </Button>
      </div>
    </div>
  );
}
