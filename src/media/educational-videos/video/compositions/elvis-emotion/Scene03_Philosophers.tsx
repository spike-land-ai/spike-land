import { type FC } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { TYPOGRAPHY } from "../../../core-logic/constants";
import {
  ELVIS_BPM,
  ELVIS_COLORS,
  ELVIS_DURATIONS,
  type ElvisPersona,
  getPersonasByGroup,
} from "../../../core-logic/elvis-constants";
import { beatPulse, kickScale } from "../../lib/animations";
import { DrumCircleVisualizer } from "../../components/elvis/DrumCircleVisualizer";
import { PersonaCard } from "../../components/elvis/PersonaCard";

const TOTAL_FRAMES = ELVIS_DURATIONS.philosophers; // 2700
const PHILOSOPHER_COUNT = 12;
const SLOT_FRAMES = Math.floor(TOTAL_FRAMES / PHILOSOPHER_COUNT); // 225
const FADE_IN_FRAMES = 15;
const FADE_OUT_START = SLOT_FRAMES - 30; // 195
// Offset: 2 hosts came before Scene03
const HOST_OFFSET = 2;
// Skip rendering personas whose slot is more than this many frames away
const RENDER_WINDOW = 250;

export const Scene03_Philosophers: FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const philosophers = getPersonasByGroup("philosopher");

  // Current persona index (0-based within philosophers array)
  const currentPersonaIndex = Math.min(Math.floor(frame / SLOT_FRAMES), PHILOSOPHER_COUNT - 1);

  // How many philosopher slots have started (for DrumCircleVisualizer)
  const activatedPhilosophers = Math.min(
    philosophers.filter((_, i) => i * SLOT_FRAMES <= frame).length,
    PHILOSOPHER_COUNT,
  );

  // Total activated dots = hosts (2) + activated philosophers
  const activatedCount = HOST_OFFSET + activatedPhilosophers;

  // Current highlight index on the circle = current philosopher + offset
  const highlightIndex = currentPersonaIndex + HOST_OFFSET;

  // Background beat pulse for subtle radial overlay
  const bp = beatPulse(frame, fps, ELVIS_BPM, 1);
  const centerScale = kickScale(frame, fps, ELVIS_BPM, 1, 0.015);

  const currentPersona: ElvisPersona | undefined = philosophers[currentPersonaIndex];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: ELVIS_COLORS.bgDeep,
        fontFamily: TYPOGRAPHY.fontFamily.sans,
        overflow: "hidden",
      }}
    >
      {/* Per-persona accent radial gradient overlay */}
      {currentPersona && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse 80% 60% at 50% 50%, ${currentPersona.accentColor}0d 0%, transparent 70%)`,
            pointerEvents: "none",
            transition: "background 0.3s",
          }}
        />
      )}

      {/* Beat-driven subtle vignette pulse */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 100% 100% at 50% 50%, transparent 60%, ${ELVIS_COLORS.bgDeep}${Math.round(
            bp * 40,
          )
            .toString(16)
            .padStart(2, "0")} 100%)`,
          pointerEvents: "none",
        }}
      />

      {/* Scene label — top left */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 60,
          fontFamily: TYPOGRAPHY.fontFamily.mono,
          fontSize: 13,
          color: `${ELVIS_COLORS.white}40`,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        Philosophers
      </div>

      {/* Progress indicator — top right */}
      <div
        style={{
          position: "absolute",
          top: 40,
          right: 60,
          fontFamily: TYPOGRAPHY.fontFamily.mono,
          fontSize: 13,
          color: `${ELVIS_COLORS.white}40`,
          letterSpacing: "0.15em",
        }}
      >
        {currentPersonaIndex + 1} / {PHILOSOPHER_COUNT}
      </div>

      {/* Persona cards — center stage */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 120px 160px",
        }}
      >
        {philosophers.map((persona, i) => {
          const slotStart = i * SLOT_FRAMES;
          const slotEnd = slotStart + SLOT_FRAMES;

          // Skip rendering if this slot is far from the current frame
          if (Math.abs(frame - slotStart) > RENDER_WINDOW && frame > slotEnd) {
            return null;
          }
          if (slotStart > frame + RENDER_WINDOW) {
            return null;
          }

          const fadeInOpacity = interpolate(
            frame,
            [slotStart, slotStart + FADE_IN_FRAMES],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );

          const fadeOutOpacity = interpolate(frame, [slotStart + FADE_OUT_START, slotEnd], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          // Combined opacity: fade in wins early, fade out wins late
          const opacity = frame < slotStart + FADE_OUT_START ? fadeInOpacity : fadeOutOpacity;

          // Don't render invisible cards
          if (opacity <= 0) return null;

          return (
            <div
              key={persona.id}
              style={{
                position: "absolute",
                opacity,
                width: "100%",
                maxWidth: 960,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PersonaCard
                persona={persona}
                delay={slotStart}
                variant="full"
                beatSync={i === currentPersonaIndex}
              />
            </div>
          );
        })}
      </div>

      {/* DrumCircleVisualizer — bottom right */}
      <div
        style={{
          position: "absolute",
          bottom: 32,
          right: 40,
          transform: `scale(${centerScale})`,
          transformOrigin: "bottom right",
        }}
      >
        <DrumCircleVisualizer
          activatedCount={activatedCount}
          highlightIndex={highlightIndex}
          size={220}
        />
      </div>

      {/* Bottom bar: philosopher name and beat counter */}
      <div
        style={{
          position: "absolute",
          bottom: 44,
          left: 60,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {currentPersona && (
          <div
            style={{
              fontFamily: TYPOGRAPHY.fontFamily.mono,
              fontSize: 15,
              color: currentPersona.accentColor,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              opacity: 0.8,
            }}
          >
            {currentPersona.name}
          </div>
        )}
        {currentPersona && (
          <div
            style={{
              fontFamily: TYPOGRAPHY.fontFamily.sans,
              fontSize: 13,
              color: `${ELVIS_COLORS.white}50`,
              fontStyle: "italic",
            }}
          >
            {currentPersona.hook}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
