import { type FC } from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SPRING_CONFIGS, TYPOGRAPHY } from "../../../core-logic/constants";
import { ELVIS_COLORS } from "../../../core-logic/elvis-constants";
import { glitchOffset } from "../../lib/animations";

interface VocoderTextProps {
  text: string;
  delay?: number;
  color?: string;
  fontSize?: number;
}

/**
 * Daft Punk-style chromatic text with RGB split, flicker, and glow.
 */
export const VocoderText: FC<VocoderTextProps> = ({
  text,
  delay = 0,
  color = ELVIS_COLORS.gold,
  fontSize = 48,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const chars = text.split("");

  // Subtle flicker: on rare frames, opacity dips
  const flickerNoise = glitchOffset(frame, 1, 42);
  const flicker = Math.abs(flickerNoise) > 0.85 ? 0.7 : 1;

  // RGB split offset (subtle chromatic aberration)
  const splitX = glitchOffset(frame, 2, 7);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 2,
        opacity: flicker,
        position: "relative",
      }}
    >
      {/* Red channel (offset left) */}
      <div
        style={{
          position: "absolute",
          display: "flex",
          gap: 2,
          transform: `translateX(${-Math.abs(splitX)}px)`,
          opacity: 0.3,
          mixBlendMode: "screen",
        }}
      >
        {chars.map((char, i) => {
          const charIn = spring({
            frame: frame - delay - i * 2,
            fps,
            config: SPRING_CONFIGS.snappy,
            durationInFrames: 15,
          });
          return (
            <span
              key={`r-${i}`}
              style={{
                fontFamily: TYPOGRAPHY.fontFamily.mono,
                fontSize,
                fontWeight: 800,
                color: "#ff0040",
                opacity: Math.max(0, charIn),
                transform: `translateY(${(1 - Math.max(0, charIn)) * 20}px)`,
                display: "inline-block",
              }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          );
        })}
      </div>

      {/* Blue channel (offset right) */}
      <div
        style={{
          position: "absolute",
          display: "flex",
          gap: 2,
          transform: `translateX(${Math.abs(splitX)}px)`,
          opacity: 0.3,
          mixBlendMode: "screen",
        }}
      >
        {chars.map((char, i) => {
          const charIn = spring({
            frame: frame - delay - i * 2,
            fps,
            config: SPRING_CONFIGS.snappy,
            durationInFrames: 15,
          });
          return (
            <span
              key={`b-${i}`}
              style={{
                fontFamily: TYPOGRAPHY.fontFamily.mono,
                fontSize,
                fontWeight: 800,
                color: "#0040ff",
                opacity: Math.max(0, charIn),
                transform: `translateY(${(1 - Math.max(0, charIn)) * 20}px)`,
                display: "inline-block",
              }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          );
        })}
      </div>

      {/* Main text (center) */}
      <div style={{ display: "flex", gap: 2, position: "relative", zIndex: 1 }}>
        {chars.map((char, i) => {
          const charIn = spring({
            frame: frame - delay - i * 2,
            fps,
            config: SPRING_CONFIGS.snappy,
            durationInFrames: 15,
          });
          return (
            <span
              key={`m-${i}`}
              style={{
                fontFamily: TYPOGRAPHY.fontFamily.mono,
                fontSize,
                fontWeight: 800,
                color,
                opacity: Math.max(0, charIn),
                transform: `translateY(${(1 - Math.max(0, charIn)) * 20}px)`,
                display: "inline-block",
                textShadow: `0 0 20px ${color}, 0 0 40px ${color}60, 0 0 80px ${color}30`,
              }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          );
        })}
      </div>
    </div>
  );
};
