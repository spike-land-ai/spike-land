import { type FC } from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SPRING_CONFIGS, TYPOGRAPHY } from "../../../core-logic/constants";
import { ELVIS_BPM, ELVIS_COLORS, getPersonasByGroup } from "../../../core-logic/elvis-constants";
import { beatPulse, fadeIn, kickScale } from "../../lib/animations";
import { PersonaCard } from "../../components/elvis/PersonaCard";
import { DrumCircleVisualizer } from "../../components/elvis/DrumCircleVisualizer";

// Personas that were activated before this scene: hosts(2) + philosophers(12) + public(3) + tech(11)
const ACTIVATED_BEFORE = 28;

export const Scene05_QARapidFire: FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const qaPersonas = getPersonasByGroup("qa"); // 15 entries

  // ── Cell sizing ───────────────────────────────────────────────────────
  const cellWidth = 200;
  const cellHeight = 120;
  const gap = 16;
  const cols = 4;
  const rows = 4; // 4x4 = 16 cells; 15 personas + 1 Elvis spot

  const gridWidth = cols * cellWidth + (cols - 1) * gap;
  const gridHeight = rows * cellHeight + (rows - 1) * gap;

  // ── Elvis spot pulse ──────────────────────────────────────────────────
  const elvisSpotScale = kickScale(frame, fps, ELVIS_BPM, 1, 0.12);
  const elvisSpotGlow = beatPulse(frame, fps, ELVIS_BPM, 1);

  // ── Collective beat pulse for all cards (after frame 240) ─────────────
  const collectivePulse = frame > 240 ? beatPulse(frame, fps, ELVIS_BPM, 0.06) : 0;
  const collectiveScale = 1 + collectivePulse;

  // ── DrumCircle activated count ────────────────────────────────────────
  // Starts at 28, increases by 1 each time a new QA persona card appears
  const personasVisible = qaPersonas.filter((_, i) => frame >= i * 16).length;
  const activatedCount = ACTIVATED_BEFORE + personasVisible;

  // ── Text overlay (frames 700-900) ─────────────────────────────────────
  const textSpring = spring({
    frame: frame - 700,
    fps,
    config: SPRING_CONFIGS.snappy,
    durationInFrames: 30,
  });
  const textOpacity = fadeIn(frame, fps, 0.5, 700);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: ELVIS_COLORS.bgDeep,
        fontFamily: TYPOGRAPHY.fontFamily.sans,
        overflow: "hidden",
      }}
    >
      {/* ── 4x4 persona grid ─────────────────────────────────────────────── */}
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: gridWidth,
            height: gridHeight,
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, ${cellWidth}px)`,
            gridTemplateRows: `repeat(${rows}, ${cellHeight}px)`,
            gap,
            transform: `scale(${collectiveScale})`,
          }}
        >
          {/* 15 persona cells */}
          {qaPersonas.map((persona, i) => {
            const delay = i * 16;
            const cardVisible = frame >= delay;

            return (
              <div
                key={persona.id}
                style={{
                  width: cellWidth,
                  height: cellHeight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: cardVisible ? 1 : 0,
                }}
              >
                {cardVisible && (
                  <PersonaCard
                    persona={persona}
                    delay={delay}
                    variant="mini"
                    beatSync={frame > 240}
                  />
                )}
              </div>
            );
          })}

          {/* 16th cell — Elvis's spot (bottom-right) */}
          <div
            style={{
              width: cellWidth,
              height: cellHeight,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                backgroundColor: ELVIS_COLORS.gold,
                transform: `scale(${elvisSpotScale})`,
                boxShadow: `0 0 ${elvisSpotGlow * 24}px ${ELVIS_COLORS.gold}, 0 0 ${elvisSpotGlow * 48}px ${ELVIS_COLORS.gold}60`,
              }}
            />
            <span
              style={{
                fontFamily: TYPOGRAPHY.fontFamily.mono,
                fontSize: 11,
                color: ELVIS_COLORS.gold,
                textAlign: "center",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Elvis
            </span>
          </div>
        </div>
      </AbsoluteFill>

      {/* ── DrumCircleVisualizer — bottom-right corner ───────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
        }}
      >
        <DrumCircleVisualizer activatedCount={activatedCount} size={180} />
      </div>

      {/* ── Text overlay: "15 voices. 30 seconds." (frames 700-900) ─────── */}
      {frame >= 700 && (
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: ELVIS_COLORS.white,
              textAlign: "center",
              fontFamily: TYPOGRAPHY.fontFamily.sans,
              letterSpacing: "0.04em",
              opacity: Math.max(0, textOpacity),
              transform: `scale(${Math.max(0, textSpring)})`,
              textShadow: `0 0 40px ${ELVIS_COLORS.gold}60`,
              backgroundColor: "rgba(10, 10, 26, 0.6)",
              padding: "20px 40px",
              borderRadius: 12,
              border: `1px solid ${ELVIS_COLORS.gold}30`,
            }}
          >
            15 voices. 30 seconds.
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
