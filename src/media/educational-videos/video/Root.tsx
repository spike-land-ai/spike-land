import { type FC, type ReactNode } from "react";
import { AbsoluteFill, Composition, Folder } from "remotion";
import {
  Scene01_Hook,
  Scene02_PhysicsOfAttention,
  Scene03_BeforeState,
  Scene04_FiveLayerStack,
  Scene05_FixLoop,
  Scene06_AgentMemory,
  Scene07_SkillMatching,
  Scene08_MetaBuild,
  Scene09_Results,
  Scene10_EndCard,
  VibeCodingParadox,
} from "../core-logic/vibe-coding-paradox-index.ts";
import {
  COLORS,
  TYPOGRAPHY,
  VCP_DURATIONS,
  VCP_TIMING,
  VIDEO_CONFIG,
} from "../core-logic/constants";
import { N404_DURATIONS, N404_TIMING } from "../core-logic/n404-constants";
import { ERDOS_DURATIONS, ERDOS_TIMING } from "../core-logic/erdos-constants";
import {
  ErdosToErdos,
  Scene01_ErdosOpening,
  Scene02_ErdosNumber,
  Scene03_TheBook,
  Scene04_StrangeLoopConnection,
  Scene05_SixteenMathematicians,
  Scene06_MobiusStrip,
  Scene07_EndCard as Erdos_Scene07_EndCard,
} from "../core-logic/erdos-index.ts";
import {
  VERITASIUM_SCENE_DURATION,
  VeritasiumPitch,
} from "./compositions/veritasium/VeritasiumPitch";
import { ArenaGrid } from "./compositions/arena/ArenaGrid";
import { ARENA_TIMING } from "../core-logic/arena-constants";
import { NewcombParadox } from "./compositions/newcomb/NewcombParadox";
import { NEWCOMB_TIMING, NEWCOMB_DURATIONS } from "../core-logic/newcomb-constants";
import {
  ElvisEmotion,
  Scene01_Overture as Elvis_Scene01,
  Scene02_WhoIsElvis as Elvis_Scene02,
  Scene03_Philosophers as Elvis_Scene03,
  Scene04_PublicAndTech as Elvis_Scene04,
  Scene05_QARapidFire as Elvis_Scene05,
  Scene06_CrowdChant as Elvis_Scene06,
  Scene07_Finale as Elvis_Scene07,
} from "../core-logic/elvis-index.ts";
import { ELVIS_DURATIONS, ELVIS_TIMING } from "../core-logic/elvis-constants";
import { MATH_ARENA_TOTAL_FRAMES, MATH_ARENA_FPS } from "../core-logic/math-arena-index";
import { Scene01_Hook as Newcomb_Scene01_Hook } from "./compositions/newcomb/Scene01_Hook";
import { Scene02_TwoBoxArgument as Newcomb_Scene02 } from "./compositions/newcomb/Scene02_TwoBoxArgument";
import { Scene03_OneBoxArgument as Newcomb_Scene03 } from "./compositions/newcomb/Scene03_OneBoxArgument";
import { Scene04_InvisibleGraph as Newcomb_Scene04 } from "./compositions/newcomb/Scene04_InvisibleGraph";
import { Scene05_GPChemist as Newcomb_Scene05 } from "./compositions/newcomb/Scene05_GPChemist";
import { Scene06_CancerCure as Newcomb_Scene06 } from "./compositions/newcomb/Scene06_CancerCure";
import { Scene07_TimeTraversal as Newcomb_Scene07 } from "./compositions/newcomb/Scene07_TimeTraversal";
import { Scene08_EndCard as Newcomb_Scene08 } from "./compositions/newcomb/Scene08_EndCard";
import {
  NoMore404s,
  Scene01_Hook as N404_Scene01_Hook,
  Scene02_Platform as N404_Scene02_Platform,
  Scene03_Codespace as N404_Scene03_Codespace,
  Scene04_LearnIT as N404_Scene04_LearnIT,
  Scene05_Generate as N404_Scene05_Generate,
  Scene07_BAZDMEG as N404_Scene07_BAZDMEG,
  Scene08_Breakthrough as N404_Scene08_Breakthrough,
  Scene09_Agents as N404_Scene09_Agents,
  Scene10_EndCard as N404_Scene10_EndCard,
} from "../core-logic/no-more-404s-index.ts";

// Math Arena placeholder (composition scenes to be built)
const MathArenaPlaceholder: FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#1a2a1a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: TYPOGRAPHY.fontFamily.sans,
    }}
  >
    <div style={{ fontSize: 72, color: "#DAA520", fontWeight: 900 }}>42 Rounds to The Book</div>
    <div style={{ fontSize: 36, color: "#F5F5DC", marginTop: 20, display: "flex", gap: 40 }}>
      <span style={{ color: "#00E5FF" }}>√ Radix</span>
      <span style={{ color: "#DAA520" }}>∮ Erdos</span>
      <span style={{ color: "#4A9EFF" }}>◊ Zoltan</span>
    </div>
    <div style={{ fontSize: 24, color: "#F5F5DC80", marginTop: 40 }}>
      7 domains x 6 levels = 42 rounds | Docker BuildKit parallel execution
    </div>
  </AbsoluteFill>
);

// Component imports for preview compositions
import { TokenVisualization } from "./components/animations/TokenVisualization";
import { SoftmaxEquation } from "./components/ui/SoftmaxEquation";
import { FiveLayerStack } from "./components/diagrams/FiveLayerStack";
import { DarwinianTree } from "./components/animations/DarwinianTree";
import { PetriDishAnimation } from "./components/animations/PetriDishAnimation";
import { RecursiveZoom } from "./components/animations/RecursiveZoom";
import { AttentionSpotlight } from "./components/animations/AttentionSpotlight";
import { SkillMatchingDiagram } from "./components/diagrams/SkillMatchingDiagram";
import { TakeawayCards } from "./components/ui/TakeawayCards";

// Wrapper for component previews
const PreviewWrapper: FC<{ children: ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      backgroundColor: COLORS.darkBg,
      fontFamily: TYPOGRAPHY.fontFamily.sans,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {children}
  </AbsoluteFill>
);

// Component preview compositions
const TokenVisualizationPreview: FC = () => (
  <TokenVisualization text="The quick brown fox jumps over the lazy dog" delay={5} />
);

const SoftmaxEquationPreview: FC = () => (
  <PreviewWrapper>
    <SoftmaxEquation variant="softmax" delay={5} />
  </PreviewWrapper>
);

const FiveLayerStackPreview: FC = () => (
  <PreviewWrapper>
    <FiveLayerStack revealCount={5} delay={5} />
  </PreviewWrapper>
);

const DarwinianTreePreview: FC = () => <DarwinianTree generations={3} delay={5} />;

const PetriDishPreview: FC = () => (
  <PetriDishAnimation
    organisms={[
      { label: "Import fix", status: "active", confidence: 0.85 },
      { label: "ESM pattern", status: "active", confidence: 0.7 },
      { label: "Wrong approach", status: "deprecated", confidence: 0.2 },
      { label: "New pattern", status: "candidate", confidence: 0.5 },
    ]}
    delay={5}
  />
);

const RecursiveZoomPreview: FC = () => <RecursiveZoom depth={5} delay={5} />;

const AttentionSpotlightPreview: FC = () => <AttentionSpotlight tokenCount={12} delay={5} />;

const SkillMatchingPreview: FC = () => (
  <PreviewWrapper>
    <SkillMatchingDiagram url="spike.land/create/games/tetris" delay={5} />
  </PreviewWrapper>
);

const TakeawayCardsPreview: FC = () => (
  <PreviewWrapper>
    <TakeawayCards delay={5} />
  </PreviewWrapper>
);

const PREVIEW_DURATION = 300;

export const RemotionRoot = () => {
  return (
    <>
      {/* Main 11-minute composition */}
      <Composition
        id="VibeCodingParadox"
        component={VibeCodingParadox}
        durationInFrames={VCP_TIMING.totalFrames}
        fps={VCP_TIMING.fps}
        width={VIDEO_CONFIG.width}
        height={VIDEO_CONFIG.height}
      />

      <Composition
        id="VeritasiumPitch"
        component={VeritasiumPitch}
        durationInFrames={VERITASIUM_SCENE_DURATION * 7}
        fps={VCP_TIMING.fps}
        width={VIDEO_CONFIG.width}
        height={VIDEO_CONFIG.height}
      />

      {/* From Paul Erdős to Zoltan Erdős — ~4min landscape */}
      <Composition
        id="ErdosToErdos"
        component={ErdosToErdos}
        durationInFrames={ERDOS_TIMING.totalFrames}
        fps={ERDOS_TIMING.fps}
        width={VIDEO_CONFIG.width}
        height={VIDEO_CONFIG.height}
      />

      {/* No More 404s — 5m30s portrait composition */}
      <Composition
        id="NoMore404s"
        component={NoMore404s}
        durationInFrames={N404_TIMING.totalFrames}
        fps={N404_TIMING.fps}
        width={1080}
        height={1920}
      />

      {/* 3×3×3 Arena — hup.hu/node/189552 */}
      <Composition
        id="ArenaGrid"
        component={ArenaGrid}
        durationInFrames={ARENA_TIMING.totalFrames}
        fps={ARENA_TIMING.fps}
        width={VIDEO_CONFIG.width}
        height={VIDEO_CONFIG.height}
      />

      {/* Newcomb's Paradox — The Invisible Graph (~3m50s) */}
      <Composition
        id="NewcombParadox"
        component={NewcombParadox}
        durationInFrames={NEWCOMB_TIMING.totalFrames}
        fps={NEWCOMB_TIMING.fps}
        width={VIDEO_CONFIG.width}
        height={VIDEO_CONFIG.height}
      />

      {/* Elvis Emotion — "Elvis, We Love You" drum circle (~5min) */}
      <Composition
        id="ElvisEmotion"
        component={ElvisEmotion}
        durationInFrames={ELVIS_TIMING.totalFrames}
        fps={ELVIS_TIMING.fps}
        width={VIDEO_CONFIG.width}
        height={VIDEO_CONFIG.height}
      />

      {/* Math Arena — 42 Rounds to The Book (~36min full, preview mode) */}
      <Composition
        id="MathArena"
        component={MathArenaPlaceholder}
        durationInFrames={MATH_ARENA_TOTAL_FRAMES}
        fps={MATH_ARENA_FPS}
        width={VIDEO_CONFIG.width}
        height={VIDEO_CONFIG.height}
      />

      {/* Individual scenes for preview */}
      <Folder name="Scenes">
        <Composition
          id="VCP-Scene01-Hook"
          component={Scene01_Hook}
          durationInFrames={VCP_DURATIONS.hook}
          fps={VCP_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="VCP-Scene02-PhysicsOfAttention"
          component={Scene02_PhysicsOfAttention}
          durationInFrames={VCP_DURATIONS.physicsOfAttention}
          fps={VCP_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="VCP-Scene03-BeforeState"
          component={Scene03_BeforeState}
          durationInFrames={VCP_DURATIONS.beforeState}
          fps={VCP_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="VCP-Scene04-FiveLayerStack"
          component={Scene04_FiveLayerStack}
          durationInFrames={VCP_DURATIONS.fiveLayerStack}
          fps={VCP_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="VCP-Scene05-FixLoop"
          component={Scene05_FixLoop}
          durationInFrames={VCP_DURATIONS.fixLoop}
          fps={VCP_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="VCP-Scene06-AgentMemory"
          component={Scene06_AgentMemory}
          durationInFrames={VCP_DURATIONS.agentMemory}
          fps={VCP_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="VCP-Scene07-SkillMatching"
          component={Scene07_SkillMatching}
          durationInFrames={VCP_DURATIONS.skillMatching}
          fps={VCP_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="VCP-Scene08-MetaBuild"
          component={Scene08_MetaBuild}
          durationInFrames={VCP_DURATIONS.metaBuild}
          fps={VCP_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="VCP-Scene09-Results"
          component={Scene09_Results}
          durationInFrames={VCP_DURATIONS.results}
          fps={VCP_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="VCP-Scene10-EndCard"
          component={Scene10_EndCard}
          durationInFrames={VCP_DURATIONS.endCard}
          fps={VCP_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
      </Folder>

      {/* N404 individual scenes for preview (portrait 1080×1920) */}
      <Folder name="N404-Scenes">
        <Composition
          id="N404-Scene01-Hook"
          component={N404_Scene01_Hook}
          durationInFrames={N404_DURATIONS.hook}
          fps={N404_TIMING.fps}
          width={1080}
          height={1920}
        />
        <Composition
          id="N404-Scene02-Platform"
          component={N404_Scene02_Platform}
          durationInFrames={N404_DURATIONS.platform}
          fps={N404_TIMING.fps}
          width={1080}
          height={1920}
        />
        <Composition
          id="N404-Scene03-Codespace"
          component={N404_Scene03_Codespace}
          durationInFrames={N404_DURATIONS.codespace}
          fps={N404_TIMING.fps}
          width={1080}
          height={1920}
        />
        <Composition
          id="N404-Scene04-LearnIT"
          component={N404_Scene04_LearnIT}
          durationInFrames={N404_DURATIONS.learnit}
          fps={N404_TIMING.fps}
          width={1080}
          height={1920}
        />
        <Composition
          id="N404-Scene05-Generate"
          component={N404_Scene05_Generate}
          durationInFrames={N404_DURATIONS.generate}
          fps={N404_TIMING.fps}
          width={1080}
          height={1920}
        />
        <Composition
          id="N404-Scene07-BAZDMEG"
          component={N404_Scene07_BAZDMEG}
          durationInFrames={N404_DURATIONS.bazdmeg}
          fps={N404_TIMING.fps}
          width={1080}
          height={1920}
        />
        <Composition
          id="N404-Scene08-Breakthrough"
          component={N404_Scene08_Breakthrough}
          durationInFrames={N404_DURATIONS.breakthrough}
          fps={N404_TIMING.fps}
          width={1080}
          height={1920}
        />
        <Composition
          id="N404-Scene09-Agents"
          component={N404_Scene09_Agents}
          durationInFrames={N404_DURATIONS.agents}
          fps={N404_TIMING.fps}
          width={1080}
          height={1920}
        />
        <Composition
          id="N404-Scene10-EndCard"
          component={N404_Scene10_EndCard}
          durationInFrames={N404_DURATIONS.endCard}
          fps={N404_TIMING.fps}
          width={1080}
          height={1920}
        />
      </Folder>

      {/* Erdős individual scenes for preview */}
      <Folder name="Erdos-Scenes">
        <Composition
          id="Erdos-Scene01-Opening"
          component={Scene01_ErdosOpening}
          durationInFrames={ERDOS_DURATIONS.erdosOpening}
          fps={ERDOS_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Erdos-Scene02-ErdosNumber"
          component={Scene02_ErdosNumber}
          durationInFrames={ERDOS_DURATIONS.erdosNumber}
          fps={ERDOS_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Erdos-Scene03-TheBook"
          component={Scene03_TheBook}
          durationInFrames={ERDOS_DURATIONS.theBook}
          fps={ERDOS_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Erdos-Scene04-StrangeLoop"
          component={Scene04_StrangeLoopConnection}
          durationInFrames={ERDOS_DURATIONS.strangeLoop}
          fps={ERDOS_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Erdos-Scene05-SixteenMathematicians"
          component={Scene05_SixteenMathematicians}
          durationInFrames={ERDOS_DURATIONS.sixteenMathematicians}
          fps={ERDOS_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Erdos-Scene06-MobiusStrip"
          component={Scene06_MobiusStrip}
          durationInFrames={ERDOS_DURATIONS.mobiusStrip}
          fps={ERDOS_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Erdos-Scene07-EndCard"
          component={Erdos_Scene07_EndCard}
          durationInFrames={ERDOS_DURATIONS.endCard}
          fps={ERDOS_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
      </Folder>

      {/* Newcomb individual scenes for preview */}
      <Folder name="Newcomb-Scenes">
        <Composition
          id="Newcomb-Scene01-Hook"
          component={Newcomb_Scene01_Hook}
          durationInFrames={NEWCOMB_DURATIONS.hook}
          fps={NEWCOMB_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Newcomb-Scene02-TwoBox"
          component={Newcomb_Scene02}
          durationInFrames={NEWCOMB_DURATIONS.twoBoxArgument}
          fps={NEWCOMB_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Newcomb-Scene03-OneBox"
          component={Newcomb_Scene03}
          durationInFrames={NEWCOMB_DURATIONS.oneBoxArgument}
          fps={NEWCOMB_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Newcomb-Scene04-InvisibleGraph"
          component={Newcomb_Scene04}
          durationInFrames={NEWCOMB_DURATIONS.invisibleGraph}
          fps={NEWCOMB_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Newcomb-Scene05-GPChemist"
          component={Newcomb_Scene05}
          durationInFrames={NEWCOMB_DURATIONS.gpChemist}
          fps={NEWCOMB_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Newcomb-Scene06-CancerCure"
          component={Newcomb_Scene06}
          durationInFrames={NEWCOMB_DURATIONS.cancerCure}
          fps={NEWCOMB_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Newcomb-Scene07-TimeTraversal"
          component={Newcomb_Scene07}
          durationInFrames={NEWCOMB_DURATIONS.timeTraversal}
          fps={NEWCOMB_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Newcomb-Scene08-EndCard"
          component={Newcomb_Scene08}
          durationInFrames={NEWCOMB_DURATIONS.endCard}
          fps={NEWCOMB_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
      </Folder>

      {/* Elvis individual scenes for preview */}
      <Folder name="Elvis-Scenes">
        <Composition
          id="Elvis-Scene01-Overture"
          component={Elvis_Scene01}
          durationInFrames={ELVIS_DURATIONS.overture}
          fps={ELVIS_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Elvis-Scene02-WhoIsElvis"
          component={Elvis_Scene02}
          durationInFrames={ELVIS_DURATIONS.whoIsElvis}
          fps={ELVIS_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Elvis-Scene03-Philosophers"
          component={Elvis_Scene03}
          durationInFrames={ELVIS_DURATIONS.philosophers}
          fps={ELVIS_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Elvis-Scene04-PublicAndTech"
          component={Elvis_Scene04}
          durationInFrames={ELVIS_DURATIONS.publicAndTech}
          fps={ELVIS_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Elvis-Scene05-QARapidFire"
          component={Elvis_Scene05}
          durationInFrames={ELVIS_DURATIONS.qaRapidFire}
          fps={ELVIS_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Elvis-Scene06-CrowdChant"
          component={Elvis_Scene06}
          durationInFrames={ELVIS_DURATIONS.crowdChant}
          fps={ELVIS_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Elvis-Scene07-Finale"
          component={Elvis_Scene07}
          durationInFrames={ELVIS_DURATIONS.finale}
          fps={ELVIS_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
      </Folder>

      {/* Component test compositions (300 frames each) */}
      <Folder name="Components">
        <Composition
          id="Preview-TokenVisualization"
          component={TokenVisualizationPreview}
          durationInFrames={PREVIEW_DURATION}
          fps={VCP_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Preview-SoftmaxEquation"
          component={SoftmaxEquationPreview}
          durationInFrames={PREVIEW_DURATION}
          fps={VCP_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Preview-FiveLayerStack"
          component={FiveLayerStackPreview}
          durationInFrames={PREVIEW_DURATION}
          fps={VCP_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Preview-DarwinianTree"
          component={DarwinianTreePreview}
          durationInFrames={PREVIEW_DURATION}
          fps={VCP_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Preview-PetriDish"
          component={PetriDishPreview}
          durationInFrames={PREVIEW_DURATION}
          fps={VCP_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Preview-RecursiveZoom"
          component={RecursiveZoomPreview}
          durationInFrames={PREVIEW_DURATION}
          fps={VCP_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Preview-AttentionSpotlight"
          component={AttentionSpotlightPreview}
          durationInFrames={PREVIEW_DURATION}
          fps={VCP_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Preview-SkillMatching"
          component={SkillMatchingPreview}
          durationInFrames={PREVIEW_DURATION}
          fps={VCP_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Preview-TakeawayCards"
          component={TakeawayCardsPreview}
          durationInFrames={PREVIEW_DURATION}
          fps={VCP_TIMING.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
      </Folder>
    </>
  );
};
