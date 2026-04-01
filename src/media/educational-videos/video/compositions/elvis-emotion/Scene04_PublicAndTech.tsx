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
import { VocoderText } from "../../components/elvis/VocoderText";

const TOTAL_FRAMES = ELVIS_DURATIONS.publicAndTech; // 2250
const PERSONA_COUNT = 14; // 3 public + 11 tech
// 2250 / 14 = ~160.7 → floor to 160
const SLOT_FRAMES = Math.floor(TOTAL_FRAMES / PERSONA_COUNT); // 160
const FADE_IN_FRAMES = 12;
const FADE_OUT_START = SLOT_FRAMES - 25; // 135
// Offset: hosts (2) + philosophers (12) came before Scene04
const CIRCLE_OFFSET = 14;
// Skip personas whose slot is more than this many frames away
const RENDER_WINDOW = 200;

export const Scene04_PublicAndTech: FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const publicFigures = getPersonasByGroup("public"); // 3
  const techPersonas = getPersonasByGroup("tech"); // 11
  const allPersonas: ElvisPersona[] = [...publicFigures, ...techPersonas]; // 14

  // Current persona index (0-based within allPersonas)
  const currentPersonaIndex = Math.min(Math.floor(frame / SLOT_FRAMES), PERSONA_COUNT - 1);

  const currentPersona: ElvisPersona | undefined = allPersonas[currentPersonaIndex];

  // How many persona slots have started
  const activatedLocal = Math.min(
    allPersonas.filter((_, i) => i * SLOT_FRAMES <= frame).length,
    PERSONA_COUNT,
  );

  // Total activated on circle = prior offset + current scene progress
  const activatedCount = CIRCLE_OFFSET + activatedLocal;

  // Highlight index on circle = prior offset + current index
  const highlightIndex = CIRCLE_OFFSET + currentPersonaIndex;

  const bp = beatPulse(frame, fps, ELVIS_BPM, 1);
  const centerScale = kickScale(frame, fps, ELVIS_BPM, 1, 0.015);

  const isDaftPunk = currentPersona?.id === "daftpunk";
  const isZoltan = currentPersona?.id === "zoltan";

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
            background: isZoltan
              ? `radial-gradient(ellipse 70% 50% at 50% 50%, ${ELVIS_COLORS.cyan}08 0%, transparent 65%)`
              : `radial-gradient(ellipse 80% 60% at 50% 50%, ${currentPersona.accentColor}0d 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Daft Punk flash overlay */}
      {isDaftPunk && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: ELVIS_COLORS.gold,
            opacity: bp * 0.1,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Beat-driven vignette pulse */}
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
        {currentPersonaIndex < publicFigures.length ? "Public Figures" : "Tech & Friends"}
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
        {currentPersonaIndex + 1} / {PERSONA_COUNT}
      </div>

      {/* Center stage */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 120px 160px",
          gap: 28,
        }}
      >
        {allPersonas.map((persona, i) => {
          const slotStart = i * SLOT_FRAMES;
          const slotEnd = slotStart + SLOT_FRAMES;

          // Skip if far from current frame
          if (slotStart > frame + RENDER_WINDOW) return null;
          if (Math.abs(frame - slotStart) > RENDER_WINDOW && frame > slotEnd) return null;

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

          const opacity = frame < slotStart + FADE_OUT_START ? fadeInOpacity : fadeOutOpacity;

          if (opacity <= 0) return null;

          // ── Special: Daft Punk ──────────────────────────────────────────
          if (persona.id === "daftpunk") {
            return (
              <div
                key={persona.id}
                style={{
                  position: "absolute",
                  opacity,
                  width: "100%",
                  maxWidth: 900,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 20,
                }}
              >
                <VocoderText
                  text={persona.line}
                  delay={slotStart}
                  color={ELVIS_COLORS.gold}
                  fontSize={44}
                />
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.fontFamily.mono,
                    fontSize: 24,
                    color: ELVIS_COLORS.cyan,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    opacity: interpolate(frame, [slotStart + 20, slotStart + 40], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }),
                  }}
                >
                  Around the World
                </div>
              </div>
            );
          }

          // ── Special: Zoltan ─────────────────────────────────────────────
          if (persona.id === "zoltan") {
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
                <PersonaCard persona={persona} delay={slotStart} variant="full" beatSync={false} />
              </div>
            );
          }

          // ── Default: compact card ───────────────────────────────────────
          return (
            <div
              key={persona.id}
              style={{
                position: "absolute",
                opacity,
                width: "100%",
                maxWidth: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PersonaCard
                persona={persona}
                delay={slotStart}
                variant="compact"
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

      {/* Bottom bar: persona name and hook */}
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
        {currentPersona && !isDaftPunk && (
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
