import { type FC } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { SPRING_CONFIGS, TYPOGRAPHY } from "../../../core-logic/constants";
import { ELVIS_BPM, ELVIS_COLORS, getPersonasByGroup } from "../../../core-logic/elvis-constants";
import { kickScale, springScale, typewriter } from "../../lib/animations";
import { DrumCircleVisualizer } from "../../components/elvis/DrumCircleVisualizer";
import { PersonaCard } from "../../components/elvis/PersonaCard";

const hosts = getPersonasByGroup("host");

export const Scene02_WhoIsElvis: FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── "Who is Elvis?" title (frames 0-200) ─────────────────────────────
  const titleScale = springScale(frame, fps, SPRING_CONFIGS.snappy, 10);
  const titleOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Waveform bars: 40 bars (frames 0-200) ────────────────────────────
  const barBeatScale = kickScale(frame, fps, ELVIS_BPM, 1, 0.25);

  // ── "He speaks French." typewriter (frames 200-320) ──────────────────
  const speaksFrench = typewriter(frame, fps, "He speaks French.", 20, 200);

  // ── "He drums like crazy." typewriter (frames 320-460) ───────────────
  const drumsLikeCrazy = typewriter(frame, fps, "He drums like crazy.", 20, 320);

  // ── Host A card (frames 500-750) ─────────────────────────────────────
  const hostAOpacity = interpolate(frame, [500, 520], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Crossfade host A out as host B comes in
  const hostAFadeOut = interpolate(frame, [730, 780], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const hostAFinal = frame < 730 ? hostAOpacity : hostAFadeOut;

  // ── Host B card (frames 750-1000) ────────────────────────────────────
  const hostBOpacity = interpolate(frame, [750, 780], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const hostBFadeOut = interpolate(frame, [980, 1000], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const hostBFinal = frame < 980 ? hostBOpacity : hostBFadeOut;

  // ── "Let's hear from everyone." (frames 1000-1350) ───────────────────
  const ctaScale = springScale(frame, fps, SPRING_CONFIGS.gentle, 1010);
  const ctaOpacity = interpolate(frame, [1010, 1060], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Bottom-right DrumCircle: activatedCount 0->2 (frames 0-780) ──────
  const drumActivated = Math.floor(
    interpolate(frame, [500, 780], [0, 2], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  // ── Waveform opacity (fade out at frame 180) ──────────────────────────
  const waveformOpacity = interpolate(frame, [170, 200], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Text overlay fade out (frames 480-500) ───────────────────────────
  const textOverlayOpacity = interpolate(frame, [470, 500], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const hostA = hosts[0];
  const hostB = hosts[1];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: ELVIS_COLORS.bgDeep,
        fontFamily: TYPOGRAPHY.fontFamily.sans,
        overflow: "hidden",
      }}
    >
      {/* ── Title: "Who is Elvis?" (frames 0-200) ──────────────────────────── */}
      {frame < 500 && (
        <div
          style={{
            position: "absolute",
            top: 80,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: Math.max(0, titleOpacity),
            transform: `scale(${Math.max(0, titleScale)})`,
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: ELVIS_COLORS.gold,
              letterSpacing: "0.06em",
              fontFamily: TYPOGRAPHY.fontFamily.sans,
              textShadow: `0 0 30px ${ELVIS_COLORS.gold}50`,
            }}
          >
            Who is Elvis?
          </div>
        </div>
      )}

      {/* ── Waveform: 40 bars (frames 0-200) ─────────────────────────────── */}
      {frame < 200 && (
        <div
          style={{
            position: "absolute",
            bottom: 160,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            gap: 10,
            opacity: waveformOpacity,
          }}
        >
          {Array.from({ length: 40 }, (_, barIndex) => {
            const sineHeight = (Math.sin(frame * 0.15 + barIndex * 0.5) + 1) / 2;
            const barHeight = 20 + sineHeight * 80 * barBeatScale;
            return (
              <div
                key={barIndex}
                style={{
                  width: 14,
                  height: barHeight,
                  backgroundColor: `${ELVIS_COLORS.cyan}99`,
                  borderRadius: 3,
                  flexShrink: 0,
                }}
              />
            );
          })}
        </div>
      )}

      {/* ── Text overlays: "He speaks French." + "He drums like crazy." (200-500) ── */}
      {frame >= 200 && frame < 500 && (
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 32,
            opacity: textOverlayOpacity,
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontWeight: 400,
              color: ELVIS_COLORS.white,
              fontFamily: TYPOGRAPHY.fontFamily.sans,
              letterSpacing: "0.04em",
              minHeight: 44,
            }}
          >
            {speaksFrench}
            {speaksFrench.length < "He speaks French.".length && frame >= 200 && (
              <span style={{ opacity: frame % 16 < 8 ? 1 : 0 }}>|</span>
            )}
          </div>

          {frame >= 320 && (
            <div
              style={{
                fontSize: 32,
                fontWeight: 600,
                color: ELVIS_COLORS.gold,
                fontFamily: TYPOGRAPHY.fontFamily.sans,
                letterSpacing: "0.04em",
                textShadow: `0 0 20px ${ELVIS_COLORS.gold}40`,
                minHeight: 44,
              }}
            >
              {drumsLikeCrazy}
              {drumsLikeCrazy.length < "He drums like crazy.".length && frame >= 320 && (
                <span style={{ opacity: frame % 16 < 8 ? 1 : 0 }}>|</span>
              )}
            </div>
          )}
        </AbsoluteFill>
      )}

      {/* ── Host A PersonaCard (frames 500-780) ──────────────────────────── */}
      {frame >= 500 && frame < 800 && hostA !== undefined && (
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: hostAFinal,
          }}
        >
          <PersonaCard persona={hostA} delay={500} variant="full" beatSync />
        </AbsoluteFill>
      )}

      {/* ── Host B PersonaCard (frames 750-1000) ─────────────────────────── */}
      {frame >= 750 && frame < 1020 && hostB !== undefined && (
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: hostBFinal,
          }}
        >
          <PersonaCard persona={hostB} delay={750} variant="full" beatSync />
        </AbsoluteFill>
      )}

      {/* ── "Let's hear from everyone." CTA (frames 1000-1350) ───────────── */}
      {frame >= 1000 && (
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 42,
              fontWeight: 700,
              color: ELVIS_COLORS.gold,
              letterSpacing: "0.05em",
              fontFamily: TYPOGRAPHY.fontFamily.sans,
              textAlign: "center",
              opacity: Math.max(0, ctaOpacity),
              transform: `scale(${Math.max(0, ctaScale)})`,
              textShadow: `0 0 40px ${ELVIS_COLORS.gold}50, 0 0 80px ${ELVIS_COLORS.gold}20`,
            }}
          >
            Let&apos;s hear from everyone.
          </div>
        </AbsoluteFill>
      )}

      {/* ── DrumCircleVisualizer: bottom-right corner (all frames) ─────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 30,
          right: 30,
        }}
      >
        <DrumCircleVisualizer activatedCount={drumActivated} size={200} />
      </div>
    </AbsoluteFill>
  );
};
