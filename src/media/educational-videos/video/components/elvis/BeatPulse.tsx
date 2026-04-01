import { type FC, type ReactNode } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { beatPulse, kickScale } from "../../lib/animations";
import { ELVIS_BPM, ELVIS_COLORS } from "../../../core-logic/elvis-constants";

interface BeatPulseProps {
  children: ReactNode;
  bpm?: number;
  intensity?: number;
  glowColor?: string;
  delay?: number;
}

export const BeatPulse: FC<BeatPulseProps> = ({
  children,
  bpm = ELVIS_BPM,
  intensity = 1,
  glowColor = ELVIS_COLORS.gold,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const adjustedFrame = Math.max(0, frame - delay);

  const scale = kickScale(adjustedFrame, fps, bpm, 1, 0.06 * intensity);
  const glow = beatPulse(adjustedFrame, fps, bpm, intensity);
  const glowPx = glow * 20;

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        filter: glowPx > 0.5 ? `drop-shadow(0 0 ${glowPx}px ${glowColor})` : undefined,
        transition: "filter 0.05s",
      }}
    >
      {children}
    </div>
  );
};
