import { type FC } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { TYPOGRAPHY } from "../../../core-logic/constants";
import {
  ELVIS_BPM,
  ELVIS_COLORS,
  ELVIS_PERSONA_COUNT,
  getPersonasByGroup,
} from "../../../core-logic/elvis-constants";
import { beatPulse, fadeIn, slideIn } from "../../lib/animations";
import { DrumCircleVisualizer } from "../../components/elvis/DrumCircleVisualizer";

// Activated count coming into this scene (all groups before crowd)
const ACTIVATED_BEFORE_CROWD = 43;

// Each line appears this many frames apart
const LINE_INTERVAL = 55;

// Font size starts at 28, grows by 4 per line
const BASE_FONT_SIZE = 28;
const FONT_SIZE_STEP = 4;

// Slide-in distance in pixels
const SLIDE_DISTANCE = 200;

export const Scene06_CrowdChant: FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const crowdPersonas = getPersonasByGroup("crowd"); // 7 entries

  // ── Collective beat pulse for text container (after frame 385) ─────────
  const allLinesVisible = frame > 385;
  const containerPulse = allLinesVisible ? beatPulse(frame, fps, ELVIS_BPM, 0.04) : 0;
  const containerScale = 1 + containerPulse;

  // ── DrumCircle activated count ─────────────────────────────────────────
  // Before last line (frame 330): 43 + number of crowd lines visible so far
  // At frame 330 (last line): jumps to full ELVIS_PERSONA_COUNT
  const crowdLinesVisible = crowdPersonas.filter((_, i) => frame >= i * LINE_INTERVAL).length;
  const activatedCount =
    frame >= 330 ? ELVIS_PERSONA_COUNT : ACTIVATED_BEFORE_CROWD + crowdLinesVisible;

  // ── Background DrumCircle opacity ─────────────────────────────────────
  const drumOpacity = interpolate(frame, [0, 20], [0, 0.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: ELVIS_COLORS.bgDeep,
        fontFamily: TYPOGRAPHY.fontFamily.sans,
        overflow: "hidden",
      }}
    >
      {/* ── DrumCircleVisualizer — centered behind text ───────────────────── */}
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: drumOpacity,
        }}
      >
        <DrumCircleVisualizer activatedCount={activatedCount} size={500} />
      </AbsoluteFill>

      {/* ── Stacked crowd lines ───────────────────────────────────────────── */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            transform: `scale(${containerScale})`,
          }}
        >
          {crowdPersonas.map((persona, i) => {
            const startFrame = i * LINE_INTERVAL;
            const isVisible = frame >= startFrame;

            if (!isVisible) return null;

            const isEven = i % 2 === 0;
            const direction = isEven ? "left" : "right";
            const translateX = slideIn(frame, fps, direction, SLIDE_DISTANCE, 0.5, startFrame);
            const opacity = fadeIn(frame, fps, 0.4, startFrame);
            const fontSize = BASE_FONT_SIZE + i * FONT_SIZE_STEP;

            return (
              <div
                key={persona.id}
                style={{
                  fontSize,
                  fontWeight: 700,
                  color: ELVIS_COLORS.gold,
                  textAlign: "center",
                  fontFamily: TYPOGRAPHY.fontFamily.sans,
                  letterSpacing: "0.03em",
                  opacity: Math.max(0, opacity),
                  transform: `translateX(${translateX}px)`,
                  textShadow: `0 0 ${fontSize * 0.6}px ${ELVIS_COLORS.gold}80, 0 0 ${fontSize * 1.2}px ${ELVIS_COLORS.gold}30`,
                  lineHeight: 1.3,
                  whiteSpace: "nowrap",
                }}
              >
                {persona.line}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
