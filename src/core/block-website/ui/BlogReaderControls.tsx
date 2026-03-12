"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  FastForward,
  Mic,
  Palette,
  Pause,
  Play,
  Rewind,
  Square,
  Type,
  Volume2,
} from "lucide-react";
import { Button } from "../lazy-imports/button";
import {
  buildReaderTimeline,
  collectReaderBlocks,
  findReaderBlockIndexByTime,
  formatReaderTime,
  type ReaderBlock,
  type ReaderTimelineEntry,
} from "../core-logic/blog-reader";
import {
  ElevenLabsTtsEngine,
  ELEVENLABS_VOICES,
  type ElevenLabsStatus,
} from "../core-logic/elevenlabs-tts";

type ReaderStatus = "ended" | "idle" | "loading" | "paused" | "playing" | "unsupported";
type ReaderTone = "mist" | "paper" | "sage";
type ReaderEngine = "browser" | "elevenlabs";

interface ReaderPreferences {
  autoFollow: boolean;
  elevenLabsVoice: string;
  engine: ReaderEngine;
  fontScale: number;
  rate: number;
  tone: ReaderTone;
}

const DEFAULT_PREFERENCES: ReaderPreferences = {
  autoFollow: true,
  elevenLabsVoice: ELEVENLABS_VOICES[0]?.id,
  engine: "browser",
  fontScale: 1,
  rate: 1,
  tone: "paper",
};

const READER_PREFERENCES_KEY = "spike.blog.reader.preferences";

const READER_TONES: Record<
  ReaderTone,
  Record<"--reader-copy" | "--reader-focus-bg" | "--reader-focus-ring" | "--reader-heading", string>
> = {
  paper: {
    "--reader-copy": "color-mix(in srgb, var(--fg) 88%, #6e5640 12%)",
    "--reader-heading": "color-mix(in srgb, var(--fg) 96%, #2f2117 4%)",
    "--reader-focus-bg": "color-mix(in srgb, var(--card-bg) 86%, #f4dcc0 14%)",
    "--reader-focus-ring": "color-mix(in srgb, var(--primary-color) 28%, #c59b64 72%)",
  },
  mist: {
    "--reader-copy": "color-mix(in srgb, var(--fg) 90%, #385e81 10%)",
    "--reader-heading": "color-mix(in srgb, var(--fg) 96%, #17283b 4%)",
    "--reader-focus-bg": "color-mix(in srgb, var(--card-bg) 82%, #d8ebff 18%)",
    "--reader-focus-ring": "color-mix(in srgb, var(--primary-color) 40%, #6fa9dc 60%)",
  },
  sage: {
    "--reader-copy": "color-mix(in srgb, var(--fg) 89%, #496651 11%)",
    "--reader-heading": "color-mix(in srgb, var(--fg) 96%, #203128 4%)",
    "--reader-focus-bg": "color-mix(in srgb, var(--card-bg) 84%, #dce9dc 16%)",
    "--reader-focus-ring": "color-mix(in srgb, var(--primary-color) 24%, #7fa483 76%)",
  },
};

function readReaderPreferences(): ReaderPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;

  try {
    const raw = localStorage.getItem(READER_PREFERENCES_KEY);
    if (!raw) return DEFAULT_PREFERENCES;

    const parsed = JSON.parse(raw) as Partial<ReaderPreferences>;
    return {
      autoFollow:
        typeof parsed.autoFollow === "boolean" ? parsed.autoFollow : DEFAULT_PREFERENCES.autoFollow,
      elevenLabsVoice:
        typeof parsed.elevenLabsVoice === "string"
          ? parsed.elevenLabsVoice
          : DEFAULT_PREFERENCES.elevenLabsVoice,
      engine:
        parsed.engine === "browser" || parsed.engine === "elevenlabs"
          ? parsed.engine
          : DEFAULT_PREFERENCES.engine,
      fontScale:
        typeof parsed.fontScale === "number" ? parsed.fontScale : DEFAULT_PREFERENCES.fontScale,
      rate: typeof parsed.rate === "number" ? parsed.rate : DEFAULT_PREFERENCES.rate,
      tone:
        parsed.tone === "mist" || parsed.tone === "paper" || parsed.tone === "sage"
          ? parsed.tone
          : DEFAULT_PREFERENCES.tone,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function writeReaderPreferences(preferences: ReaderPreferences) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(READER_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch {
    // Ignore storage failures. Runtime controls still work.
  }
}

function getSpeechSupport() {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window
  );
}

function getSpeechSynthesisHandle(): SpeechSynthesis | null {
  return getSpeechSupport() ? window.speechSynthesis : null;
}

function pickVoice(synth: SpeechSynthesis, lang: string) {
  const voices = synth.getVoices();
  if (voices.length === 0) return null;

  const normalizedLang = lang.toLowerCase();
  return (
    voices.find((voice) => voice.lang.toLowerCase() === normalizedLang) ??
    voices.find((voice) =>
      voice.lang.toLowerCase().startsWith(normalizedLang.split("-")[0] ?? ""),
    ) ??
    voices[0]
  );
}

export function BlogReaderControls({
  contentKey,
  scopeRef,
}: {
  contentKey: string;
  scopeRef: RefObject<HTMLElement | null>;
}) {
  const preferences = readReaderPreferences();
  const [autoFollow, setAutoFollow] = useState(preferences.autoFollow);
  const [blocks, setBlocks] = useState<ReaderBlock[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [engine, setEngine] = useState<ReaderEngine>(preferences.engine);
  const [elevenLabsVoice, setElevenLabsVoice] = useState(preferences.elevenLabsVoice);
  const [fontScale, setFontScale] = useState(preferences.fontScale);
  const [progressSeconds, setProgressSeconds] = useState(0);
  const [rate, setRate] = useState(preferences.rate);
  const [status, setStatus] = useState<ReaderStatus>(getSpeechSupport() ? "idle" : "unsupported");
  const [tone, setTone] = useState<ReaderTone>(preferences.tone);

  const blocksRef = useRef<ReaderBlock[]>([]);
  const boundaryTickRef = useRef(0);
  const currentIndexRef = useRef(0);
  const rateRef = useRef(rate);
  const runIdRef = useRef(0);
  const timelineRef = useRef<ReaderTimelineEntry[]>([]);
  const autoFollowRef = useRef(autoFollow);
  const elevenLabsRef = useRef<ElevenLabsTtsEngine | null>(null);

  const isElevenLabs = engine === "elevenlabs";

  const timeline = useMemo(() => buildReaderTimeline(blocks, rate), [blocks, rate]);
  const totalSeconds = timeline.at(-1)?.end ?? 0;
  const currentBlock = blocks[currentIndex] ?? null;
  const currentHeadingId = currentBlock?.kind.startsWith("heading-") ? currentBlock.id : "";
  const sectionOptions = useMemo(
    () => blocks.filter((block) => block.kind.startsWith("heading-")),
    [blocks],
  );
  const audioDisabled = blocks.length === 0 || (status === "unsupported" && !isElevenLabs);

  useEffect(() => {
    blocksRef.current = blocks;
    timelineRef.current = timeline;
  }, [blocks, timeline]);

  useEffect(() => {
    autoFollowRef.current = autoFollow;
    rateRef.current = rate;
    writeReaderPreferences({ autoFollow, elevenLabsVoice, engine, fontScale, rate, tone });
  }, [autoFollow, elevenLabsVoice, engine, fontScale, rate, tone]);

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    scope.dataset["readerSurface"] = "true";
    scope.dataset["readerState"] = status;
    scope.style.setProperty("--reader-font-scale", String(fontScale));
    scope.style.setProperty("--reader-line-height", String(1.82 + (fontScale - 1) * 0.12));

    const toneTokens = READER_TONES[tone];
    for (const [name, value] of Object.entries(toneTokens)) {
      scope.style.setProperty(name, value);
    }

    return () => {
      scope.removeAttribute("data-reader-state");
      scope.style.removeProperty("--reader-font-scale");
      scope.style.removeProperty("--reader-line-height");
      for (const name of Object.keys(toneTokens)) {
        scope.style.removeProperty(name);
      }
    };
  }, [fontScale, scopeRef, status, tone]);

  // Initialize ElevenLabs engine when blocks or voice change
  useEffect(() => {
    if (!isElevenLabs || blocks.length === 0) return;

    if (!elevenLabsRef.current) {
      elevenLabsRef.current = new ElevenLabsTtsEngine();
    }

    const ttsEngine = elevenLabsRef.current;
    ttsEngine.onBlockChange = (blockIndex: number) => {
      syncActiveBlock(blockIndex);
    };
    ttsEngine.onProgress = (seconds: number) => {
      setProgressSeconds(seconds);
    };
    ttsEngine.onStatusChange = (elStatus: ElevenLabsStatus) => {
      setStatus(elStatus);
    };

    ttsEngine.initialize(blocks, elevenLabsVoice);
  }, [blocks, elevenLabsVoice, isElevenLabs]);

  function syncActiveBlock(nextIndex: number) {
    const nextBlock = blocksRef.current[nextIndex] ?? null;

    blocksRef.current.forEach((block, blockIndex) => {
      block.element.dataset["readerActive"] =
        nextBlock && blockIndex === nextIndex ? "true" : "false";
    });

    currentIndexRef.current = nextIndex;
    setCurrentIndex(nextIndex);

    if (nextBlock && autoFollowRef.current) {
      nextBlock.element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }
  }

  function cancelSpeech() {
    const synth = getSpeechSynthesisHandle();
    runIdRef.current += 1;
    synth?.cancel();
  }

  function stopPlayback(nextStatus: Exclude<ReaderStatus, "unsupported"> = "idle") {
    if (isElevenLabs) {
      elevenLabsRef.current?.stop();
      return;
    }
    cancelSpeech();
    setStatus(getSpeechSupport() ? nextStatus : "unsupported");
  }

  function jumpToIndex(nextIndex: number, continuePlayback: boolean) {
    const clampedIndex = Math.max(
      0,
      Math.min(nextIndex, Math.max(0, blocksRef.current.length - 1)),
    );

    if (isElevenLabs) {
      if (continuePlayback) {
        elevenLabsRef.current?.seekToBlock(clampedIndex);
      } else {
        syncActiveBlock(clampedIndex);
        const entry = timelineRef.current[clampedIndex];
        setProgressSeconds(entry?.start ?? 0);
      }
      return;
    }

    const entry = timelineRef.current[clampedIndex];

    syncActiveBlock(clampedIndex);
    setProgressSeconds(entry?.start ?? 0);

    if (continuePlayback) {
      startBrowserPlayback(clampedIndex);
      return;
    }

    if (status === "paused") {
      stopPlayback("idle");
    }
  }

  function startBrowserPlayback(nextIndex: number) {
    const synth = getSpeechSynthesisHandle();
    const nextBlock = blocksRef.current[nextIndex];
    const nextEntry = timelineRef.current[nextIndex];

    if (!synth || !nextBlock || !nextEntry) {
      setStatus(getSpeechSupport() ? "idle" : "unsupported");
      return;
    }

    runIdRef.current += 1;
    const localRunId = runIdRef.current;

    boundaryTickRef.current = 0;
    synth.cancel();

    syncActiveBlock(nextIndex);
    setProgressSeconds(nextEntry.start);

    const utterance = new SpeechSynthesisUtterance(nextBlock.text);
    utterance.rate = rateRef.current;
    utterance.lang = document.documentElement.lang || navigator.language || "en-US";

    const preferredVoice = pickVoice(synth, utterance.lang);
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      if (localRunId !== runIdRef.current) return;
      setStatus("playing");
    };

    utterance.onboundary = (event) => {
      if (localRunId !== runIdRef.current || typeof event.charIndex !== "number") return;

      const now = performance.now();
      if (now - boundaryTickRef.current < 120 && event.charIndex < nextBlock.text.length - 1) {
        return;
      }
      boundaryTickRef.current = now;

      const progress = Math.min(1, event.charIndex / Math.max(1, nextBlock.text.length));
      setProgressSeconds(nextEntry.start + nextEntry.seconds * progress);
    };

    utterance.onend = () => {
      if (localRunId !== runIdRef.current) return;

      const followingIndex = nextIndex + 1;
      if (followingIndex < blocksRef.current.length) {
        startBrowserPlayback(followingIndex);
        return;
      }

      setProgressSeconds(timelineRef.current.at(-1)?.end ?? 0);
      setStatus("ended");
      syncActiveBlock(nextIndex);
    };

    utterance.onerror = () => {
      if (localRunId !== runIdRef.current) return;
      setStatus("idle");
    };

    synth.speak(utterance);
  }

  function moveBySeconds(deltaSeconds: number) {
    const nextIndex = findReaderBlockIndexByTime(
      timelineRef.current,
      progressSeconds + deltaSeconds,
    );
    jumpToIndex(nextIndex, status === "playing");
  }

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    cancelSpeech();
    elevenLabsRef.current?.stop();
    setStatus(getSpeechSupport() || engine === "elevenlabs" ? "idle" : "unsupported");
    setProgressSeconds(0);

    const schedule =
      typeof window !== "undefined" && "requestAnimationFrame" in window
        ? window.requestAnimationFrame.bind(window)
        : (callback: FrameRequestCallback) =>
            window.setTimeout(() => callback(performance.now()), 0);

    const cancel: (handle: number) => void =
      typeof window !== "undefined" && "cancelAnimationFrame" in window
        ? (handle: number) => cancelAnimationFrame(handle)
        : (handle: number) => clearTimeout(handle);

    const handle = schedule(() => {
      const nextBlocks = collectReaderBlocks(scope as unknown as ParentNode);
      nextBlocks.forEach((block, index) => {
        block.element.dataset["readerId"] = block.id || `reader-block-${index}`;
        block.element.dataset["readerActive"] = index === 0 ? "true" : "false";
      });

      blocksRef.current = nextBlocks;
      setBlocks(nextBlocks);
      currentIndexRef.current = 0;
      setCurrentIndex(0);
      setProgressSeconds(0);
    });

    return () => {
      cancel(handle);
    };
  }, [contentKey, scopeRef, engine]);

  useEffect(() => {
    return () => {
      cancelSpeech();
      elevenLabsRef.current?.stop();
    };
  }, []);

  const handlePlayPause = () => {
    if (blocksRef.current.length === 0) return;

    if (isElevenLabs) {
      const ttsEngine = elevenLabsRef.current;
      if (!ttsEngine) return;

      const elStatus = ttsEngine.getStatus();
      if (elStatus === "playing") {
        ttsEngine.pause();
        return;
      }
      if (elStatus === "paused") {
        ttsEngine.resume();
        return;
      }
      void ttsEngine.play(currentIndexRef.current);
      return;
    }

    const synth = getSpeechSynthesisHandle();
    if (!synth) return;

    if (status === "playing") {
      synth.pause();
      setStatus("paused");
      return;
    }

    if (status === "paused" && synth.paused) {
      synth.resume();
      setStatus("playing");
      return;
    }

    startBrowserPlayback(currentIndexRef.current);
  };

  const handleSeek = (nextValue: number) => {
    const nextIndex = findReaderBlockIndexByTime(timelineRef.current, nextValue);
    jumpToIndex(nextIndex, status === "playing");
  };

  const handleRateChange = (nextRate: number) => {
    setRate(nextRate);

    if (isElevenLabs) {
      elevenLabsRef.current?.setPlaybackRate(nextRate);
      return;
    }

    if (status === "playing") {
      startBrowserPlayback(currentIndexRef.current);
      return;
    }

    if (status === "paused") {
      stopPlayback("idle");
    }
  };

  const handleEngineChange = (nextEngine: ReaderEngine) => {
    stopPlayback("idle");
    setEngine(nextEngine);
    if (nextEngine === "elevenlabs" || getSpeechSupport()) {
      setStatus("idle");
    }
  };

  return (
    <div className="not-prose sticky top-4 z-30 mx-auto mb-10 max-w-3xl">
      <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/78 p-4 shadow-[var(--panel-shadow)] backdrop-blur-xl">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/18 bg-primary/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-primary">
                <Volume2 className="size-3.5" />
                Assisted Reading
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Read aloud, tune the pace, and keep the page aligned with the active passage.
              </p>
            </div>

            <div className="rounded-2xl border border-border/55 bg-background/55 px-4 py-3 text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                Progress
              </p>
              <p className="mt-1 text-sm font-black text-foreground">
                {formatReaderTime(progressSeconds)} / {formatReaderTime(totalSeconds)}
              </p>
            </div>
          </div>

          {/* Engine toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-2xl border border-border/55 bg-background/55 p-0.5">
              {(["browser", "elevenlabs"] as ReaderEngine[]).map((eng) => (
                <button
                  key={eng}
                  type="button"
                  onClick={() => handleEngineChange(eng)}
                  className={`flex items-center gap-1.5 rounded-[0.85rem] px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] transition-colors ${
                    engine === eng
                      ? "bg-primary/12 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {eng === "browser" ? (
                    <Volume2 className="size-3.5" />
                  ) : (
                    <Mic className="size-3.5" />
                  )}
                  {eng === "browser" ? "Browser" : "ElevenLabs"}
                </button>
              ))}
            </div>

            {isElevenLabs && (
              <select
                value={elevenLabsVoice}
                onChange={(event) => {
                  stopPlayback("idle");
                  setElevenLabsVoice(event.target.value);
                }}
                className="h-8 rounded-2xl border border-border/60 bg-card/70 px-2 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/25"
              >
                {ELEVENLABS_VOICES.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={handlePlayPause}
              disabled={audioDisabled}
              className="rounded-2xl px-4 text-xs font-black uppercase tracking-[0.18em]"
            >
              {status === "playing" ? (
                <Pause className="mr-2 size-4" />
              ) : status === "loading" ? (
                <Volume2 className="mr-2 size-4 animate-pulse" />
              ) : (
                <Play className="mr-2 size-4" />
              )}
              {status === "playing"
                ? "Pause"
                : status === "paused"
                  ? "Resume"
                  : status === "loading"
                    ? "Loading..."
                    : "Read Aloud"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => stopPlayback("idle")}
              disabled={audioDisabled}
              className="rounded-2xl px-4 text-xs font-black uppercase tracking-[0.18em]"
            >
              <Square className="mr-2 size-4" />
              Stop
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => moveBySeconds(-30)}
              disabled={audioDisabled}
              className="rounded-2xl px-3 text-xs font-black uppercase tracking-[0.18em]"
            >
              <Rewind className="mr-2 size-4" />
              -30s
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => moveBySeconds(30)}
              disabled={audioDisabled}
              className="rounded-2xl px-3 text-xs font-black uppercase tracking-[0.18em]"
            >
              <FastForward className="mr-2 size-4" />
              +30s
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-3 rounded-[1.6rem] border border-border/55 bg-background/55 p-4">
              <div>
                <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                  <span>Jump</span>
                  <span>{blocks.length} readable blocks</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, Math.ceil(totalSeconds))}
                  step={1}
                  value={Math.min(Math.ceil(progressSeconds), Math.max(0, Math.ceil(totalSeconds)))}
                  onChange={(event) => handleSeek(Number(event.target.value))}
                  className="mt-3 w-full accent-primary"
                  aria-label="Jump through the article"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                  Jump to Section
                </label>
                <select
                  value={currentHeadingId}
                  onChange={(event) => {
                    const nextIndex = blocks.findIndex((block) => block.id === event.target.value);
                    if (nextIndex >= 0) {
                      jumpToIndex(nextIndex, status === "playing");
                    }
                  }}
                  className="mt-2 h-12 w-full rounded-2xl border border-border/60 bg-card/70 px-3 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/25"
                >
                  <option value="">Current position</option>
                  {sectionOptions.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.text}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3 rounded-[1.6rem] border border-border/55 bg-background/55 p-4">
              <div>
                <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Volume2 className="size-3.5" />
                    Rate
                  </span>
                  <span>{rate.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0.7}
                  max={1.8}
                  step={0.1}
                  value={rate}
                  onChange={(event) => handleRateChange(Number(event.target.value))}
                  disabled={status === "unsupported" && !isElevenLabs}
                  className="mt-3 w-full accent-primary"
                  aria-label="Speech rate"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Type className="size-3.5" />
                    Font Size
                  </span>
                  <span>{Math.round(fontScale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.9}
                  max={1.25}
                  step={0.05}
                  value={fontScale}
                  onChange={(event) => setFontScale(Number(event.target.value))}
                  className="mt-3 w-full accent-primary"
                  aria-label="Reading font size"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Palette className="size-3.5" />
                    Tone
                  </span>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-foreground">
                    <input
                      type="checkbox"
                      checked={autoFollow}
                      onChange={(event) => setAutoFollow(event.target.checked)}
                      className="size-3.5 rounded border-border/60 accent-primary"
                    />
                    Auto-follow
                  </label>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["paper", "mist", "sage"] as ReaderTone[]).map((toneOption) => (
                    <button
                      key={toneOption}
                      type="button"
                      onClick={() => setTone(toneOption)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] transition-colors ${
                        tone === toneOption
                          ? "border-primary/28 bg-primary/12 text-primary"
                          : "border-border/60 bg-card/70 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {toneOption}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {status === "unsupported" && !isElevenLabs && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Read-aloud controls need the browser Speech Synthesis API. The typography and focus
              controls still apply. Switch to ElevenLabs for high-quality voices.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
