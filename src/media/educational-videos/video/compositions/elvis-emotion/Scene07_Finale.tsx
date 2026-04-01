import { type FC } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SPRING_CONFIGS, TYPOGRAPHY } from "../../../core-logic/constants";
import { ELVIS_BPM, ELVIS_COLORS, ELVIS_PERSONA_COUNT } from "../../../core-logic/elvis-constants";
import { fadeOut, pulse, springScale } from "../../lib/animations";
import { DrumCircleVisualizer } from "../../components/elvis/DrumCircleVisualizer";

export const Scene07_Finale: FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── "Just drum." spring entry (frame 15) ─────────────────────────────
  const justDrumScale = springScale(frame, fps, SPRING_CONFIGS.snappy, 15);
  const justDrumOpacity = interpolate(frame, [15, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── "We'll find you." spring entry (frame 50) ─────────────────────────
  const wellFindScale = springScale(frame, fps, SPRING_CONFIGS.snappy, 50);
  const wellFindOpacity = interpolate(frame, [50, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Beat pulse for text breathing (frames 100-200) ────────────────────
  const beatBreath = pulse(frame, fps, ELVIS_BPM / 60);
  const breathScale = 1 + beatBreath * 0.015;

  // ── French message fade in (frames 200-260) ───────────────────────────
  const frenchOpacity = interpolate(frame, [200, 260], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const frenchTranslate = interpolate(
    spring({ frame: frame - 200, fps, config: SPRING_CONFIGS.gentle }),
    [0, 1],
    [30, 0],
  );

  // ── English message fade in (frames 230-290) ─────────────────────────
  const englishOpacity = interpolate(frame, [230, 290], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const englishTranslate = interpolate(
    spring({ frame: frame - 230, fps, config: SPRING_CONFIGS.gentle }),
    [0, 1],
    [30, 0],
  );

  // ── DrumCircle fade in (frames 200-260) ──────────────────────────────
  const drumOpacity = interpolate(frame, [200, 260], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── spike.land logo fade in (frames 350-410) ─────────────────────────
  const logoOpacity = interpolate(frame, [350, 410], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Global fade to black (frames 390-450) ─────────────────────────────
  const globalFadeOut = fadeOut(frame, fps, 390, 2);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: ELVIS_COLORS.bgDeep,
        fontFamily: TYPOGRAPHY.fontFamily.sans,
        overflow: "hidden",
        opacity: globalFadeOut,
      }}
    >
      {/* ── Main text block: "Just drum." + "We'll find you." ─────────────── */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
          paddingBottom: 200,
        }}
      >
        {/* "Just drum." */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: ELVIS_COLORS.gold,
            letterSpacing: "0.04em",
            fontFamily: TYPOGRAPHY.fontFamily.sans,
            opacity: Math.max(0, justDrumOpacity),
            transform: `scale(${Math.max(0, justDrumScale) * breathScale})`,
            textShadow: `0 0 40px ${ELVIS_COLORS.gold}60, 0 0 80px ${ELVIS_COLORS.gold}20`,
          }}
        >
          Just drum.
        </div>

        {/* "We'll find you." */}
        <div
          style={{
            fontSize: 42,
            fontWeight: 400,
            color: ELVIS_COLORS.white,
            letterSpacing: "0.06em",
            fontFamily: TYPOGRAPHY.fontFamily.sans,
            opacity: Math.max(0, wellFindOpacity),
            transform: `scale(${Math.max(0, wellFindScale) * breathScale})`,
          }}
        >
          We&apos;ll find you.
        </div>
      </AbsoluteFill>

      {/* ── French + English message block (frames 200-350) ──────────────── */}
      {frame >= 200 && (
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingBottom: 220,
            gap: 16,
          }}
        >
          {/* French */}
          <div
            style={{
              fontSize: 36,
              fontStyle: "italic",
              color: ELVIS_COLORS.gold,
              fontFamily: TYPOGRAPHY.fontFamily.sans,
              opacity: frenchOpacity,
              transform: `translateY(${frenchTranslate}px)`,
              textAlign: "center",
              textShadow: `0 0 20px ${ELVIS_COLORS.gold}40`,
            }}
          >
            Elvis, on t&apos;aime. Continue à jouer.
          </div>

          {/* English */}
          <div
            style={{
              fontSize: 28,
              color: ELVIS_COLORS.white,
              fontFamily: TYPOGRAPHY.fontFamily.sans,
              opacity: englishOpacity * 0.8,
              transform: `translateY(${englishTranslate}px)`,
              textAlign: "center",
            }}
          >
            Elvis, we love you. Keep playing.
          </div>
        </AbsoluteFill>
      )}

      {/* ── DrumCircleVisualizer: all dots lit (frames 200-450) ──────────── */}
      {frame >= 200 && (
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            paddingBottom: 40,
            opacity: drumOpacity,
          }}
        >
          <DrumCircleVisualizer activatedCount={ELVIS_PERSONA_COUNT} size={400} />
        </AbsoluteFill>
      )}

      {/* ── spike.land logo (frames 350-450) ─────────────────────────────── */}
      {frame >= 350 && (
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            paddingBottom: 24,
            opacity: logoOpacity * 0.5,
          }}
        >
          <span
            style={{
              fontSize: 16,
              color: ELVIS_COLORS.white,
              fontFamily: TYPOGRAPHY.fontFamily.mono,
              letterSpacing: "0.2em",
              textTransform: "lowercase",
            }}
          >
            spike.land
          </span>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
