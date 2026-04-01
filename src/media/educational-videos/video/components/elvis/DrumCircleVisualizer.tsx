import { type FC } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { ELVIS_BPM, ELVIS_COLORS, ELVIS_PERSONA_COUNT } from "../../../core-logic/elvis-constants";
import { beatPulse, kickScale } from "../../lib/animations";

interface DrumCircleVisualizerProps {
  activatedCount: number;
  highlightIndex?: number;
  delay?: number;
  size?: number;
}

export const DrumCircleVisualizer: FC<DrumCircleVisualizerProps> = ({
  activatedCount,
  highlightIndex = -1,
  delay = 0,
  size = 400,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const adjustedFrame = Math.max(0, frame - delay);

  const totalDots = ELVIS_PERSONA_COUNT;
  const radius = size * 0.42;
  const centerX = size / 2;
  const centerY = size / 2;
  const dotRadius = Math.max(4, size * 0.012);

  const bp = beatPulse(adjustedFrame, fps, ELVIS_BPM, 0.6);
  const centerScale = kickScale(adjustedFrame, fps, ELVIS_BPM, 1, 0.12);

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
      }}
    >
      {/* Center drum icon */}
      <div
        style={{
          position: "absolute",
          left: centerX - 20,
          top: centerY - 20,
          width: 40,
          height: 40,
          borderRadius: "50%",
          backgroundColor: ELVIS_COLORS.gold,
          transform: `scale(${centerScale})`,
          boxShadow: `0 0 ${bp * 25}px ${ELVIS_COLORS.gold}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
        }}
      />

      {/* Dots */}
      {Array.from({ length: totalDots }, (_, i) => {
        const angle = (i / totalDots) * Math.PI * 2 - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius - dotRadius;
        const y = centerY + Math.sin(angle) * radius - dotRadius;

        const isActive = i < activatedCount;
        const isHighlighted = i === highlightIndex;
        const dotScale = isActive ? kickScale(adjustedFrame, fps, ELVIS_BPM, 1, 0.15) : 1;
        const dotGlow = isHighlighted ? bp * 20 : isActive ? bp * 8 : 0;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: dotRadius * 2,
              height: dotRadius * 2,
              borderRadius: "50%",
              backgroundColor: isActive ? ELVIS_COLORS.gold : `${ELVIS_COLORS.white}20`,
              transform: `scale(${dotScale})`,
              boxShadow:
                dotGlow > 0.5
                  ? `0 0 ${dotGlow}px ${isHighlighted ? ELVIS_COLORS.gold : ELVIS_COLORS.gold + "80"}`
                  : undefined,
              opacity: isActive ? 1 : 0.25,
              transition: "background-color 0.3s, opacity 0.3s",
            }}
          />
        );
      })}
    </div>
  );
};
