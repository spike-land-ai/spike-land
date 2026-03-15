/**
 * 3×3×3 Arena — Three personas respond to six commenters.
 * Layout: 3-column grid (Radix | Erdős | Hofstadter), rows scroll through commenters.
 */
import type { FC } from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from "remotion";
import { TYPOGRAPHY, SPRING_CONFIGS } from "../../../core-logic/constants";
import { ERDOS_COLORS } from "../../../core-logic/erdos-constants";
import {
  ARENA_PERSONAS,
  ARENA_COMMENTERS,
  ARENA_DURATIONS,
} from "../../../core-logic/arena-constants";
import { ChalkParticles, WordReveal, GlowDivider } from "../../components/ui/ErdosHelpers";
import { fadeIn } from "../../lib/animations";

/* ── Response excerpts (one per persona × commenter) ── */

const RESPONSES: Record<string, string[]> = {
  arpi_esp: [
    "A sk\u00E1la \u00E9s visszakereshet\u0151s\u00E9g a k\u00FCl\u00F6nbs\u00E9g. A modell nem felejt \u2014 rendszerszinten konzerv\u00E1lja a hib\u00E1kat.",
    "Hamis anal\u00F3gia. Az emberi mem\u00F3ria rekonstrukt\u00EDv. A g\u00E9pi memoriz\u00E1l\u00E1s sz\u00F3 szerinti \u2014 bitpontos visszaj\u00E1tsz\u00E1s.",
    `K\u00E9t fogalom harca: az \u201Eeml\u00E9kez\u00E9s\u201D kateg\u00F3ria aktiv\u00E1l\u00F3dik, de a struktur\u00E1lis lek\u00E9pez\u00E9s pont ott t\u00F6rik, ahol sz\u00E1m\u00EDt.`,
  ],
  YleGreg: [
    "Az aut\u00F3kat nem tiltott\u00E1k be \u2014 szab\u00E1lyozt\u00E1k. Az AI-n\u00E1l most az 1960-as \u00E9vekn\u00E9l tartunk.",
    "Ellent\u00E9tes ir\u00E1ny\u00FA trend: az aut\u00F3n\u00E1l a fejl\u0151d\u00E9s cs\u00F6kkenti a kock\u00E1zatot, az LLM-ekn\u00E9l n\u00F6veli.",
    "Az aut\u00F3 fizikai vesz\u00E9lyt jelent. Az AI kognit\u00EDv vesz\u00E9lyt \u2014 de nincs l\u00E9gzs\u00E1k a gondolkod\u00E1sra.",
  ],
  mitch0: [
    "Hat konkr\u00E9t, peer-reviewed kutat\u00E1sra \u00E9p\u00FCl\u0151 t\u00E1mad\u00E1si vektor. Ha \u00F6sszef\u00FCgg\u00E9stelen, a sz\u00E1lat nem olvastad v\u00E9gig.",
    "Mutass egy hamis \u00E1ll\u00EDt\u00E1st a sz\u00F6vegb\u0151l. Egyet.",
    `Ha valaki azt mondja \u201E\u00F6sszef\u00FCgg\u00E9stelen\u201D \u2014 milyen anal\u00F3gi\u00E1t haszn\u00E1l a koherenci\u00E1ra?`,
  ],
  "Sanya v": [
    "A modellek nem balosak \u2014 a tan\u00EDt\u00F3adatuk t\u00FCkr\u00F6zi a k\u00F6zeget. Ez nem \u00F6ssze\u00E9sk\u00FCv\u00E9s, ez statisztika.",
    "A RLHF sz\u00E1nd\u00E9kos beavatkoz\u00E1s. De az nem propaganda \u2014 alignment policy. Lehet vitatkozni, s\u0151t kell.",
    `A \u201Epropaganda\u201D pluraliz\u00E1l\u00F3dott \u2014 ha minden propaganda, semmi sem az. A kategoriz\u00E1ci\u00F3 a kategoriz\u00E1l\u00F3r\u00F3l sz\u00F3l.`,
  ],
  "nehai v": [
    "Az elf\u00E1raszt \u2014 pont ez a vesz\u00E9ly. A modell a legkisebb ellen\u00E1ll\u00E1s ir\u00E1ny\u00E1ba optimaliz\u00E1l.",
    `1+1\u22605. De a f\u00E1radts\u00E1g racion\u00E1lis figyelemallok\u00E1ci\u00F3 \u2014 amit a modellek struktur\u00E1lisan kihaszn\u00E1lnak.`,
    `\u201ELeszarom\u201D = egy hatalmas chunk, amibe minden belekerül feldolgozatlanul. Klasszikus chunking-összeomlás.`,
  ],
  Peter: [
    `A tautol\u00F3gia jogos. De a konvergencia-\u00E1ll\u00EDt\u00E1s tesztelhet\u0151 \u2014 az a cikk t\u00E9nyleges \u00E9rvel\u00E9se.`,
    `A tautol\u00F3gia nem hiba. A tautol\u00F3gia keret. Melyik empirikus \u00E1ll\u00EDt\u00E1st tartod hamisnak?`,
    `Peter a jel\u00F6l\u00E9st l\u00E1tja \u00E9s a \u201Ebizony\u00EDt\u00E1s\u201D kateg\u00F3ri\u00E1t aktiv\u00E1lja \u2014 de ez defin\u00EDci\u00F3s keretrendszer, nem t\u00E9tel.`,
  ],
  "Peter (2)": [
    `Tartalmi kritik\u00E1r\u00F3l forr\u00E1skritik\u00E1ra v\u00E1lt\u00E1l. A konvergencia-\u00E1ll\u00EDt\u00E1st sem c\u00E1foltad, sem elfogadtad.`,
    `Genetic fallacy. Ha egy chatbot azt mondja 2+2=4, az igaz. A forr\u00E1s nem \u00E9rv.`,
    `Kateg\u00F3ri\u00E1t v\u00E1lt\u00E1l: a \u201Echatbot\u201D chunk nem kell kinyitni, el\u00E9g a c\u00EDmk\u00E9t olvasni. De pont ez a strange loop.`,
  ],
  Allan: [
    `Allan p\u00E1ly\u00E1ja a konvergencia-\u00E1ll\u00EDt\u00E1s empirikus esete. Az \u00F6nmodell a k\u00FCls\u0151 modell fel\u00E9 konverg\u00E1lt \u2014 tragikus kimenetellel.`,
    `M\u2080={felhaszn\u00E1l\u00F3} \u2192 E\u2081={felfedez\u0151} \u2192 M\u2099\u2248E\u2081. A konvergencia m\u00E9rhet\u0151. Ez nem tautol\u00F3gia. Q.E.D.`,
    `K\u00E9t kateg\u00F3ria harcolt: \u201Ezseni\u00E1lis koll\u00E9ga\u201D vs \u201Estatisztikai modell\u201D. Az els\u0151 nyert \u2014 mert aktiv\u00E1lhat\u00F3bb volt.`,
  ],
};

/* ── Commenter row component ── */

const CommenterRow: FC<{ commenterIndex: number; rowDelay: number }> = ({
  commenterIndex,
  rowDelay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const commenter = ARENA_COMMENTERS[commenterIndex];
  if (!commenter) return null;
  const responses = RESPONSES[commenter.name] ?? ["", "", ""];

  const labelOpacity = fadeIn(frame, fps, 0.4, rowDelay);
  const labelY = interpolate(frame, [rowDelay, rowDelay + 15], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ marginBottom: 30 }}>
      {/* Commenter label */}
      <div
        style={{
          opacity: labelOpacity,
          transform: `translateY(${labelY}px)`,
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontSize: TYPOGRAPHY.fontSize["2xl"],
            fontWeight: 700,
            color: ERDOS_COLORS.chalk,
            fontFamily: TYPOGRAPHY.fontFamily.sans,
          }}
        >
          {commenter.name}
        </span>
        <span
          style={{
            fontSize: TYPOGRAPHY.fontSize.lg,
            color: ERDOS_COLORS.chalk,
            opacity: 0.5,
            marginLeft: 12,
            fontStyle: "italic",
            fontFamily: TYPOGRAPHY.fontFamily.sans,
          }}
        >
          «{commenter.argument}"
        </span>
      </div>

      {/* Three persona response cards */}
      <div
        style={{
          display: "flex",
          gap: 20,
          justifyContent: "center",
        }}
      >
        {ARENA_PERSONAS.map((persona, pIdx) => {
          const cardDelay = rowDelay + 10 + pIdx * 8;
          const cardSpring = spring({
            frame: frame - cardDelay,
            fps,
            config: SPRING_CONFIGS.gentle,
          });
          const cardOpacity = interpolate(cardSpring, [0, 0.4], [0, 1], {
            extrapolateRight: "clamp",
          });
          const cardY = interpolate(cardSpring, [0, 1], [50, 0]);
          const cardScale = interpolate(cardSpring, [0, 1], [0.92, 1]);

          return (
            <div
              key={persona.name}
              style={{
                flex: 1,
                maxWidth: 560,
                padding: 20,
                borderRadius: 12,
                border: `2px solid ${persona.color}40`,
                backgroundColor: `${ERDOS_COLORS.blackboard}CC`,
                boxShadow: `0 0 20px ${persona.color}15`,
                opacity: cardOpacity,
                transform: `translateY(${cardY}px) scale(${cardScale})`,
              }}
            >
              {/* Persona header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 28,
                    color: persona.color,
                    fontWeight: 900,
                  }}
                >
                  {persona.icon}
                </span>
                <span
                  style={{
                    fontSize: TYPOGRAPHY.fontSize.lg,
                    fontWeight: 700,
                    color: persona.color,
                    fontFamily: TYPOGRAPHY.fontFamily.sans,
                  }}
                >
                  {persona.name}
                </span>
                <span
                  style={{
                    fontSize: TYPOGRAPHY.fontSize.sm,
                    color: `${persona.color}80`,
                    fontFamily: TYPOGRAPHY.fontFamily.mono,
                  }}
                >
                  {persona.role}
                </span>
              </div>

              {/* Response excerpt */}
              <p
                style={{
                  fontSize: TYPOGRAPHY.fontSize.base,
                  color: ERDOS_COLORS.chalk,
                  opacity: 0.85,
                  lineHeight: 1.5,
                  fontFamily: TYPOGRAPHY.fontFamily.sans,
                  margin: 0,
                }}
              >
                {responses[pIdx]}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Main ArenaGrid composition ── */

const ROW_SPACING = 750; // frames between each commenter row appearing

export const ArenaGrid: FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Opening title fade
  const titleOpacity = fadeIn(frame, fps, 0.6);
  const titleFadeOut = interpolate(
    frame,
    [ARENA_DURATIONS.opening - 40, ARENA_DURATIONS.opening],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Grid scroll: as rows appear, the container scrolls up
  const activeRow = Math.min(
    ARENA_COMMENTERS.length - 1,
    Math.floor(Math.max(0, frame - ARENA_DURATIONS.opening) / ROW_SPACING),
  );
  const scrollY = interpolate(
    frame,
    [
      ARENA_DURATIONS.opening,
      ARENA_DURATIONS.opening + ROW_SPACING * (ARENA_COMMENTERS.length - 1),
    ],
    [0, -activeRow * 280],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: ERDOS_COLORS.blackboard,
        fontFamily: TYPOGRAPHY.fontFamily.sans,
        overflow: "hidden",
      }}
    >
      <ChalkParticles count={20} opacity={0.5} />

      {/* Opening title */}
      <Sequence durationInFrames={ARENA_DURATIONS.opening}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            opacity: titleOpacity * titleFadeOut,
          }}
        >
          <WordReveal
            text="3 × 3 × 3   A R É N A"
            fontSize={72}
            delay={10}
            color={ERDOS_COLORS.chalk}
          />
          <div style={{ height: 24 }} />
          <GlowDivider delay={30} maxWidth={900} color={ERDOS_COLORS.goldProof} />
          <div style={{ height: 20 }} />
          <div
            style={{
              display: "flex",
              gap: 60,
              opacity: fadeIn(frame, fps, 0.5, 45),
            }}
          >
            {ARENA_PERSONAS.map((p) => (
              <div
                key={p.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 36, color: p.color }}>{p.icon}</span>
                <span
                  style={{
                    fontSize: TYPOGRAPHY.fontSize["2xl"],
                    fontWeight: 700,
                    color: p.color,
                    fontFamily: TYPOGRAPHY.fontFamily.sans,
                  }}
                >
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Grid rows */}
      <Sequence from={ARENA_DURATIONS.opening} durationInFrames={ARENA_DURATIONS.grid}>
        <AbsoluteFill
          style={{
            padding: "40px 40px",
            transform: `translateY(${scrollY}px)`,
          }}
        >
          {/* Column headers */}
          <div
            style={{
              display: "flex",
              gap: 20,
              justifyContent: "center",
              marginBottom: 30,
              opacity: fadeIn(frame - ARENA_DURATIONS.opening, fps, 0.4),
            }}
          >
            {ARENA_PERSONAS.map((p) => (
              <div
                key={p.name}
                style={{
                  flex: 1,
                  maxWidth: 560,
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: 32, color: p.color }}>{p.icon}</span>
                <span
                  style={{
                    fontSize: TYPOGRAPHY.fontSize.xl,
                    fontWeight: 700,
                    color: p.color,
                    marginLeft: 8,
                    fontFamily: TYPOGRAPHY.fontFamily.sans,
                  }}
                >
                  {p.name}
                </span>
              </div>
            ))}
          </div>

          <GlowDivider
            delay={ARENA_DURATIONS.opening + 5}
            maxWidth={1800}
            color={ERDOS_COLORS.goldProof}
          />
          <div style={{ height: 24 }} />

          {/* Commenter rows */}
          {ARENA_COMMENTERS.map((_, idx) => (
            <CommenterRow key={idx} commenterIndex={idx} rowDelay={idx * ROW_SPACING} />
          ))}
        </AbsoluteFill>
      </Sequence>

      {/* Verdict / closing */}
      <Sequence
        from={ARENA_DURATIONS.opening + ARENA_DURATIONS.grid}
        durationInFrames={ARENA_DURATIONS.verdict}
      >
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <WordReveal
            text="Három perspektíva. Egy kérdés."
            fontSize={56}
            delay={10}
            color={ERDOS_COLORS.chalk}
          />
          <div style={{ height: 20 }} />
          <GlowDivider delay={40} maxWidth={700} color={ERDOS_COLORS.goldProof} />
          <div style={{ height: 20 }} />
          <WordReveal
            text="Az AI önmaga foglyává vált — vagy mi lettünk az övé?"
            fontSize={36}
            delay={60}
            color={ERDOS_COLORS.goldProof}
            italic
          />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
