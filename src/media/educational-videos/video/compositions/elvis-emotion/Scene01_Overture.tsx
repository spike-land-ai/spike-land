import { type FC } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, SPRING_CONFIGS, TYPOGRAPHY } from "../../../core-logic/constants";
import { ELVIS_BPM, ELVIS_COLORS } from "../../../core-logic/elvis-constants";
import { fadeIn, kickScale, springScale } from "../../lib/animations";
import { DrumCircleVisualizer } from "../../components/elvis/DrumCircleVisualizer";
import { VocoderText } from "../../components/elvis/VocoderText";

export const Scene01_Overture: FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Dot spring (frames 0-60) ──────────────────────────────────────────
  const dotScale = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.gentle,
    durationInFrames: 60,
  });

  // ── "ELVIS" title spring entry (frames 60-120) ────────────────────────
  const elvisTitleScale = springScale(frame, fps, SPRING_CONFIGS.snappy, 60);
  const elvisfadeIn = fadeIn(frame, fps, 1, 60);

  // ── Subtitle spring (frames 90-160) ──────────────────────────────────
  const subtitleScale = springScale(frame, fps, SPRING_CONFIGS.gentle, 100);
  const subtitleFadeIn = fadeIn(frame, fps, 1, 100);

  // ── Beat pulse on dot (frames 60-300) ────────────────────────────────
  const dotBeatScale = frame >= 60 ? kickScale(frame, fps, ELVIS_BPM, 1, 0.08) : dotScale;

  // ── DrumCircle fade in (frames 450-510) ──────────────────────────────
  const drumCircleOpacity = interpolate(frame, [450, 510], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Activated count tease (frames 500-850) ───────────────────────────
  const activatedCount = Math.floor(
    interpolate(frame, [500, 850], [0, 10], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  // ── Title/dot scale down once DrumCircle appears (frames 450-510) ────
  const titleShrink = interpolate(frame, [450, 510], [1, 0.8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── VocoderText visibility (frames 300-450) ──────────────────────────
  const vocoderOpacity = interpolate(frame, [300, 330], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const vocoderExitOpacity = interpolate(frame, [420, 450], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const vocoderFinalOpacity = frame < 420 ? vocoderOpacity : vocoderExitOpacity;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: ELVIS_COLORS.bgDeep,
        fontFamily: TYPOGRAPHY.fontFamily.sans,
        overflow: "hidden",
      }}
    >
      {/* ── Center stage: dot + ELVIS title + subtitle ─────────────────── */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
        }}
      >
        {/* Gold dot */}
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            backgroundColor: ELVIS_COLORS.gold,
            transform: `scale(${frame < 60 ? dotScale : dotBeatScale} ) scaleX(${titleShrink}) scaleY(${titleShrink})`,
            boxShadow: `0 0 ${(frame < 60 ? dotScale : dotBeatScale) * 20}px ${ELVIS_COLORS.gold}`,
            marginBottom: frame < 60 ? 0 : 24,
          }}
        />

        {/* "ELVIS" heading */}
        {frame >= 60 && (
          <div
            style={{
              fontSize: 120,
              fontWeight: 900,
              color: ELVIS_COLORS.gold,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontFamily: TYPOGRAPHY.fontFamily.sans,
              opacity: Math.max(0, elvisfadeIn),
              transform: `scale(${Math.max(0, elvisTitleScale) * titleShrink})`,
              lineHeight: 1,
              textShadow: `0 0 60px ${ELVIS_COLORS.gold}80, 0 0 120px ${ELVIS_COLORS.gold}30`,
            }}
          >
            ELVIS
          </div>
        )}

        {/* Subtitle */}
        {frame >= 100 && (
          <div
            style={{
              fontSize: 22,
              fontWeight: 400,
              color: COLORS.textPrimary,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontFamily: TYPOGRAPHY.fontFamily.sans,
              opacity: Math.max(0, subtitleFadeIn) * titleShrink,
              transform: `scale(${Math.max(0, subtitleScale)})`,
              marginTop: 16,
            }}
          >
            a drum circle from spike.land
          </div>
        )}
      </AbsoluteFill>

      {/* ── VocoderText: "Elvis, on t'aime" (frames 300-450) ─────────────── */}
      {frame >= 300 && frame < 450 && (
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: vocoderFinalOpacity,
          }}
        >
          <VocoderText
            text="Elvis, on t'aime"
            delay={320}
            color={ELVIS_COLORS.gold}
            fontSize={56}
          />
        </AbsoluteFill>
      )}

      {/* ── DrumCircleVisualizer (frames 450-900) ────────────────────────── */}
      {frame >= 450 && (
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: drumCircleOpacity,
            paddingTop: 80,
          }}
        >
          <DrumCircleVisualizer activatedCount={activatedCount} size={400} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
