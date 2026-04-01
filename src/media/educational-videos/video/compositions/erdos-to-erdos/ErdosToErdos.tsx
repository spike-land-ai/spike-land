import { type FC, type ReactNode } from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { TYPOGRAPHY } from "../../../core-logic/constants";
import { ERDOS_COLORS, ERDOS_DURATIONS, ERDOS_TIMING } from "../../../core-logic/erdos-constants";

import { Scene01_ErdosOpening } from "./Scene01_ErdosOpening";
import { Scene02_ErdosNumber } from "./Scene02_ErdosNumber";
import { Scene03_TheBook } from "./Scene03_TheBook";
import { Scene04_StrangeLoopConnection } from "./Scene04_StrangeLoopConnection";
import { Scene05_SixteenMathematicians } from "./Scene05_SixteenMathematicians";
import { Scene06_MobiusStrip } from "./Scene06_MobiusStrip";
import { Scene07_EndCard } from "./Scene07_EndCard";

const SCENES = [
  {
    component: Scene01_ErdosOpening,
    duration: ERDOS_DURATIONS.erdosOpening,
    audioId: "erdosOpening",
  },
  { component: Scene02_ErdosNumber, duration: ERDOS_DURATIONS.erdosNumber, audioId: "erdosNumber" },
  { component: Scene03_TheBook, duration: ERDOS_DURATIONS.theBook, audioId: "theBook" },
  {
    component: Scene04_StrangeLoopConnection,
    duration: ERDOS_DURATIONS.strangeLoop,
    audioId: "strangeLoop",
  },
  {
    component: Scene05_SixteenMathematicians,
    duration: ERDOS_DURATIONS.sixteenMathematicians,
    audioId: "sixteenMathematicians",
  },
  { component: Scene06_MobiusStrip, duration: ERDOS_DURATIONS.mobiusStrip, audioId: "mobiusStrip" },
  { component: Scene07_EndCard, duration: ERDOS_DURATIONS.endCard, audioId: "endCard" },
] as const;

// Cumulative start frames for audio sequencing
const sceneStartFrames: number[] = [];
let cumFrame = 0;
for (const scene of SCENES) {
  sceneStartFrames.push(cumFrame);
  cumFrame += scene.duration - ERDOS_TIMING.transitionFrames;
}

export const ErdosToErdos: FC = () => {
  const transitionDuration = ERDOS_TIMING.transitionFrames;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: ERDOS_COLORS.blackboard,
        fontFamily: TYPOGRAPHY.fontFamily.sans,
      }}
    >
      {/* Per-scene voiceover — 2s (60f) silence before each clip starts */}
      {SCENES.map((scene, i) => (
        <Sequence
          key={scene.audioId}
          from={(sceneStartFrames[i] ?? 0) + 60}
          durationInFrames={scene.duration - 60}
        >
          <Audio src={staticFile(`audio/erdos-${scene.audioId}.mp3`)} volume={1.0} />
        </Sequence>
      ))}

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
