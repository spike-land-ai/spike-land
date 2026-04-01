import { type FC } from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SPRING_CONFIGS, TYPOGRAPHY } from "../../../core-logic/constants";
import { type ElvisPersona, ELVIS_BPM, ELVIS_COLORS } from "../../../core-logic/elvis-constants";
import { beatPulse, typewriter } from "../../lib/animations";

type CardVariant = "full" | "compact" | "mini";

interface PersonaCardProps {
  persona: ElvisPersona;
  delay?: number;
  variant?: CardVariant;
  beatSync?: boolean;
}

/** CSS clip-path for geometric avatar shapes */
function avatarClipPath(shape: ElvisPersona["avatarShape"]): string {
  switch (shape) {
    case "circle":
      return "circle(50% at 50% 50%)";
    case "diamond":
      return "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)";
    case "hexagon":
      return "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";
    case "triangle":
      return "polygon(50% 0%, 100% 100%, 0% 100%)";
    case "star":
      return "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)";
    case "square":
      return "polygon(10% 10%, 90% 10%, 90% 90%, 10% 90%)";
  }
}

function avatarSize(variant: CardVariant): number {
  switch (variant) {
    case "full":
      return 80;
    case "compact":
      return 60;
    case "mini":
      return 48;
  }
}

export const PersonaCard: FC<PersonaCardProps> = ({
  persona,
  delay = 0,
  variant = "full",
  beatSync = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entryProgress = spring({
    frame: frame - delay,
    fps,
    config: SPRING_CONFIGS.snappy,
    durationInFrames: 20,
  });

  const bp = beatSync ? beatPulse(frame, fps, ELVIS_BPM, 0.5) : 0;
  const glowIntensity = bp * 15;
  const size = avatarSize(variant);
  const visibleText =
    variant === "full" ? typewriter(frame, fps, persona.line, 28, delay + 15) : persona.line;

  if (variant === "mini") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          opacity: Math.max(0, entryProgress),
          transform: `scale(${Math.max(0, entryProgress)})`,
        }}
      >
        <div
          style={{
            width: size,
            height: size,
            backgroundColor: persona.accentColor,
            clipPath: avatarClipPath(persona.avatarShape),
            boxShadow:
              glowIntensity > 1 ? `0 0 ${glowIntensity}px ${persona.accentColor}` : undefined,
          }}
        />
        <span
          style={{
            fontFamily: TYPOGRAPHY.fontFamily.mono,
            fontSize: 11,
            color: ELVIS_COLORS.white,
            textAlign: "center",
            maxWidth: 80,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {persona.name}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: variant === "full" ? "row" : "row",
        alignItems: "center",
        gap: variant === "full" ? 24 : 16,
        padding: variant === "full" ? "24px 32px" : "16px 24px",
        backgroundColor: "rgba(20, 20, 40, 0.85)",
        borderRadius: 16,
        border: `2px solid ${persona.accentColor}40`,
        boxShadow:
          glowIntensity > 1
            ? `0 0 ${glowIntensity}px ${persona.accentColor}, inset 0 0 ${glowIntensity * 0.5}px ${persona.accentColor}20`
            : `0 4px 20px rgba(0, 0, 0, 0.4)`,
        opacity: Math.max(0, entryProgress),
        transform: `scale(${Math.max(0, entryProgress)}) translateY(${(1 - Math.max(0, entryProgress)) * 30}px)`,
        maxWidth: variant === "full" ? 900 : 700,
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: size,
          height: size,
          minWidth: size,
          backgroundColor: persona.accentColor,
          clipPath: avatarClipPath(persona.avatarShape),
          filter:
            glowIntensity > 1
              ? `drop-shadow(0 0 ${glowIntensity * 0.5}px ${persona.accentColor})`
              : undefined,
        }}
      />

      {/* Text content */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div
          style={{
            fontFamily: TYPOGRAPHY.fontFamily.mono,
            fontSize: variant === "full" ? 16 : 14,
            color: persona.accentColor,
            marginBottom: variant === "full" ? 8 : 4,
            fontWeight: 600,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          {persona.name}
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.fontFamily.sans,
            fontSize: variant === "full" ? 22 : 18,
            color: ELVIS_COLORS.white,
            lineHeight: 1.5,
          }}
        >
          {visibleText}
          {variant === "full" && visibleText.length < persona.line.length && (
            <span style={{ opacity: frame % 16 < 8 ? 1 : 0 }}>|</span>
          )}
        </div>
        {variant === "full" && (
          <div
            style={{
              fontFamily: TYPOGRAPHY.fontFamily.sans,
              fontSize: 13,
              color: `${ELVIS_COLORS.white}60`,
              marginTop: 6,
              fontStyle: "italic",
            }}
          >
            {persona.hook}
          </div>
        )}
      </div>
    </div>
  );
};
