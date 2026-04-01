import { type FC, type ReactNode } from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { COLORS, TYPOGRAPHY } from "../../../core-logic/constants";
import { N404_DURATIONS, N404_TIMING } from "../../../core-logic/n404-constants";
import { getN404SceneAudioEntries } from "../../../core-logic/n404-narration";

import { Scene01_Hook } from "./Scene01_Hook";
import { Scene02_Platform } from "./Scene02_Problem";
import { Scene03_Codespace } from "./Scene03_Pipeline";
import { Scene04_LearnIT } from "./Scene04_Reviewers";
import { Scene05_Generate } from "./Scene05_Demo";
import { Scene07_BAZDMEG } from "./Scene07_Flywheel";
import { Scene08_Breakthrough } from "./Scene08_EndCard";
import { Scene09_Agents } from "./Scene09_Agents";
import { Scene10_EndCard } from "./Scene10_EndCard";

const SCENES = [
  { component: Scene01_Hook, duration: N404_DURATIONS.hook },
  { component: Scene02_Platform, duration: N404_DURATIONS.platform },
  { component: Scene03_Codespace, duration: N404_DURATIONS.codespace },
  { component: Scene04_LearnIT, duration: N404_DURATIONS.learnit },
  { component: Scene05_Generate, duration: N404_DURATIONS.generate },
  { component: Scene07_BAZDMEG, duration: N404_DURATIONS.bazdmeg },
  { component: Scene08_Breakthrough, duration: N404_DURATIONS.breakthrough },
  { component: Scene09_Agents, duration: N404_DURATIONS.agents },
  { component: Scene10_EndCard, duration: N404_DURATIONS.endCard },
] as const;

const sceneAudioEntries = getN404SceneAudioEntries();

export const NoMore404s: FC = () => {
  const transitionDuration = N404_TIMING.transitionFrames;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.darkBg,
        fontFamily: TYPOGRAPHY.fontFamily.sans,
      }}
    >
      {/* Per-scene voiceover audio */}
      {sceneAudioEntries.map(({ sceneId, startFrame }) => (
        <Sequence
          key={sceneId}
          from={startFrame}
          durationInFrames={N404_DURATIONS[sceneId as keyof typeof N404_DURATIONS]}
        >
          <Audio src={staticFile(`audio/n404-${sceneId}.mp3`)} volume={1.0} />
        </Sequence>
      ))}

      {/* Visual scenes */}
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
