import { type FC, type ReactNode } from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { TYPOGRAPHY } from "../../../core-logic/constants";
import {
  ELVIS_AUDIO_AVAILABLE,
  ELVIS_COLORS,
  ELVIS_DURATIONS,
  ELVIS_TIMING,
} from "../../../core-logic/elvis-constants";
import { musicVolumeAtFrame } from "../../lib/audio-helpers";
import { getElvisVoiceActiveFrames } from "../../../core-logic/elvis-narration";

import { Scene01_Overture } from "./Scene01_Overture";
import { Scene02_WhoIsElvis } from "./Scene02_WhoIsElvis";
import { Scene03_Philosophers } from "./Scene03_Philosophers";
import { Scene04_PublicAndTech } from "./Scene04_PublicAndTech";
import { Scene05_QARapidFire } from "./Scene05_QARapidFire";
import { Scene06_CrowdChant } from "./Scene06_CrowdChant";
import { Scene07_Finale } from "./Scene07_Finale";

const SCENES = [
  { component: Scene01_Overture, duration: ELVIS_DURATIONS.overture },
  { component: Scene02_WhoIsElvis, duration: ELVIS_DURATIONS.whoIsElvis },
  { component: Scene03_Philosophers, duration: ELVIS_DURATIONS.philosophers },
  { component: Scene04_PublicAndTech, duration: ELVIS_DURATIONS.publicAndTech },
  { component: Scene05_QARapidFire, duration: ELVIS_DURATIONS.qaRapidFire },
  { component: Scene06_CrowdChant, duration: ELVIS_DURATIONS.crowdChant },
  { component: Scene07_Finale, duration: ELVIS_DURATIONS.finale },
] as const;

/** Map percussion stems to scene frame ranges */
const PERCUSSION_ACTS: {
  audioKey: string;
  file: string;
  startFrame: number;
  durationFrames: number;
}[] = [
  {
    audioKey: "perc-act1",
    file: "audio/elvis-perc-act1.mp3",
    startFrame: 0,
    durationFrames: ELVIS_DURATIONS.overture,
  },
  {
    audioKey: "perc-act2",
    file: "audio/elvis-perc-act2.mp3",
    startFrame: ELVIS_DURATIONS.overture,
    durationFrames: ELVIS_DURATIONS.whoIsElvis + ELVIS_DURATIONS.philosophers,
  },
  {
    audioKey: "perc-act3",
    file: "audio/elvis-perc-act3.mp3",
    startFrame:
      ELVIS_DURATIONS.overture + ELVIS_DURATIONS.whoIsElvis + ELVIS_DURATIONS.philosophers,
    durationFrames: ELVIS_DURATIONS.publicAndTech,
  },
  {
    audioKey: "perc-act4",
    file: "audio/elvis-perc-act4.mp3",
    startFrame:
      ELVIS_DURATIONS.overture +
      ELVIS_DURATIONS.whoIsElvis +
      ELVIS_DURATIONS.philosophers +
      ELVIS_DURATIONS.publicAndTech,
    durationFrames: ELVIS_DURATIONS.qaRapidFire + ELVIS_DURATIONS.crowdChant,
  },
  {
    audioKey: "perc-act5",
    file: "audio/elvis-perc-act5.mp3",
    startFrame:
      ELVIS_DURATIONS.overture +
      ELVIS_DURATIONS.whoIsElvis +
      ELVIS_DURATIONS.philosophers +
      ELVIS_DURATIONS.publicAndTech +
      ELVIS_DURATIONS.qaRapidFire +
      ELVIS_DURATIONS.crowdChant,
    durationFrames: ELVIS_DURATIONS.finale,
  },
];

const voiceActiveFrames = getElvisVoiceActiveFrames();

export const ElvisEmotion: FC = () => {
  const transitionDuration = ELVIS_TIMING.transitionFrames;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: ELVIS_COLORS.bgDeep,
        fontFamily: TYPOGRAPHY.fontFamily.sans,
      }}
    >
      {/* Percussion stems — one per act, sequenced */}
      {PERCUSSION_ACTS.map(
        (act) =>
          ELVIS_AUDIO_AVAILABLE[act.audioKey] && (
            <Sequence
              key={act.audioKey}
              from={act.startFrame}
              durationInFrames={act.durationFrames}
            >
              <Audio
                src={staticFile(act.file)}
                volume={(f) =>
                  musicVolumeAtFrame(f + act.startFrame, voiceActiveFrames, 0.35, 0.1, 8)
                }
              />
            </Sequence>
          ),
      )}

      {/* Synth pad — full duration, auto-ducked */}
      {ELVIS_AUDIO_AVAILABLE["synth-pad"] && (
        <Audio
          src={staticFile("audio/elvis-synth-pad.mp3")}
          volume={(f) => musicVolumeAtFrame(f, voiceActiveFrames, 0.25, 0.08, 8)}
        />
      )}

      {/* Vocoder hook — triggered at specific moments */}
      {ELVIS_AUDIO_AVAILABLE["vocoder-hook"] && (
        <>
          <Sequence from={450} durationInFrames={120}>
            <Audio src={staticFile("audio/elvis-vocoder-hook.mp3")} volume={0.7} />
          </Sequence>
          <Sequence from={8550} durationInFrames={120}>
            <Audio src={staticFile("audio/elvis-vocoder-hook.mp3")} volume={0.7} />
          </Sequence>
        </>
      )}

      {/* Visual scenes with fade transitions */}
      <TransitionSeries>
        {SCENES.flatMap((scene, index) => {
          const SceneComponent = scene.component;
          const elements: ReactNode[] = [
            <TransitionSeries.Sequence key={`s-${index}`} durationInFrames={scene.duration}>
              <SceneComponent />
            </TransitionSeries.Sequence>,
          ];
          if (index < SCENES.length - 1) {
            elements.push(
              <TransitionSeries.Transition
                key={`t-${index}`}
                presentation={fade()}
                timing={linearTiming({
                  durationInFrames: transitionDuration,
                })}
              />,
            );
          }
          return elements;
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
