import type { ReaderBlock, ReaderTimelineEntry } from "./blog-reader";
import { buildReaderTimeline } from "./blog-reader";

export type ElevenLabsStatus = "ended" | "idle" | "loading" | "paused" | "playing";

const WORDS_PER_MINUTE = 165;
const MAX_CHUNK_SECONDS = 60;
const TTS_CACHE_NAME = "spike-tts-v1";
const TTS_PROXY_PATH = "/proxy/tts";

export interface TtsChunk {
  blockEnd: number;
  blockStart: number;
  cacheKey: string;
  text: string;
  words: number;
}

export const ELEVENLABS_VOICES: Array<{ id: string; name: string }> = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam" },
  { id: "XB0fDUnXU5powFXDhCwa", name: "Charlotte" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily" },
  { id: "bIHbv24MWmeRgasZH58o", name: "Will" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica" },
  { id: "iP95p4xoKVk53GoZ742B", name: "Chris" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel" },
];

export async function hashChunkKey(voiceId: string, text: string): Promise<string> {
  const data = new TextEncoder().encode(`${voiceId}:${text}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function groupBlocksIntoChunks(blocks: ReaderBlock[], voiceId: string): TtsChunk[] {
  if (blocks.length === 0) return [];

  const chunks: TtsChunk[] = [];
  let currentStart = 0;
  let currentWords = 0;
  let currentTexts: string[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockSeconds = (block.words / WORDS_PER_MINUTE) * 60;
    const currentSeconds = (currentWords / WORDS_PER_MINUTE) * 60;

    if (currentTexts.length > 0 && currentSeconds + blockSeconds > MAX_CHUNK_SECONDS) {
      const text = currentTexts.join("\n\n");
      chunks.push({
        blockStart: currentStart,
        blockEnd: i - 1,
        text,
        words: currentWords,
        cacheKey: `${voiceId}:${text}`,
      });
      currentStart = i;
      currentWords = 0;
      currentTexts = [];
    }

    currentTexts.push(block.text);
    currentWords += block.words;
  }

  if (currentTexts.length > 0) {
    const text = currentTexts.join("\n\n");
    chunks.push({
      blockStart: currentStart,
      blockEnd: blocks.length - 1,
      text,
      words: currentWords,
      cacheKey: `${voiceId}:${text}`,
    });
  }

  return chunks;
}

function chunkIndexForBlock(chunks: TtsChunk[], blockIndex: number): number {
  return chunks.findIndex((c) => blockIndex >= c.blockStart && blockIndex <= c.blockEnd);
}

export function mapAudioProgressToBlock(
  chunk: TtsChunk,
  blocks: ReaderBlock[],
  currentTime: number,
  duration: number,
): number {
  if (duration <= 0) return chunk.blockStart;

  const fraction = Math.min(1, currentTime / duration);
  const totalWords = chunk.words;
  const targetWord = fraction * totalWords;

  let accumulated = 0;
  for (let i = chunk.blockStart; i <= chunk.blockEnd; i++) {
    const block = blocks[i];
    if (!block) continue;
    accumulated += block.words;
    if (accumulated >= targetWord) return i;
  }

  return chunk.blockEnd;
}

async function fetchTtsAudio(text: string, voiceId: string): Promise<ArrayBuffer> {
  const response = await fetch(TTS_PROXY_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ text, voice_id: voiceId }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`TTS fetch failed (${response.status}): ${detail}`);
  }

  return response.arrayBuffer();
}

async function getOrFetchAudio(chunk: TtsChunk, voiceId: string): Promise<ArrayBuffer> {
  const hash = await hashChunkKey(voiceId, chunk.text);
  const cacheUrl = `https://tts-cache.spike.land/${hash}.mp3`;

  try {
    const cache = await caches.open(TTS_CACHE_NAME);
    const cached = await cache.match(cacheUrl);
    if (cached) {
      return cached.arrayBuffer();
    }
  } catch {
    // Cache API not available — proceed without cache
  }

  const audioData = await fetchTtsAudio(chunk.text, voiceId);

  try {
    const cache = await caches.open(TTS_CACHE_NAME);
    const cacheResponse = new Response(audioData.slice(0), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
    await cache.put(cacheUrl, cacheResponse);
  } catch {
    // Cache write failed — non-critical
  }

  return audioData;
}

export class ElevenLabsTtsEngine {
  private audio: HTMLAudioElement | null = null;
  private blocks: ReaderBlock[] = [];
  private chunks: TtsChunk[] = [];
  private prefetchPromise: Promise<ArrayBuffer> | null = null;
  private runId = 0;
  private status: ElevenLabsStatus = "idle";
  private timeline: ReaderTimelineEntry[] = [];
  private timeUpdateHandler: (() => void) | null = null;
  private voiceId = ELEVENLABS_VOICES[0]?.id;

  onBlockChange: (blockIndex: number) => void = () => {};
  onProgress: (seconds: number) => void = () => {};
  onStatusChange: (status: ElevenLabsStatus) => void = () => {};

  initialize(blocks: ReaderBlock[], voiceId: string): void {
    this.stop();
    this.blocks = blocks;
    this.voiceId = voiceId;
    this.chunks = groupBlocksIntoChunks(blocks, voiceId);
    this.timeline = buildReaderTimeline(blocks, 1);
    this.prefetchPromise = null;
  }

  async play(fromBlockIndex = 0): Promise<void> {
    if (this.blocks.length === 0 || this.chunks.length === 0) return;

    const ci = chunkIndexForBlock(this.chunks, fromBlockIndex);
    if (ci < 0) return;

    this.runId += 1;
    const localRunId = this.runId;

    this.setStatus("loading");

    try {
      const audioData = await getOrFetchAudio(this.chunks[ci], this.voiceId);
      if (localRunId !== this.runId) return;
      await this.playAudioData(audioData, ci, localRunId);
    } catch {
      if (localRunId !== this.runId) return;
      this.setStatus("idle");
    }
  }

  pause(): void {
    if (this.audio && this.status === "playing") {
      this.audio.pause();
      this.setStatus("paused");
    }
  }

  resume(): void {
    if (this.audio && this.status === "paused") {
      this.audio.play().catch(() => this.setStatus("idle"));
      this.setStatus("playing");
    }
  }

  stop(): void {
    this.runId += 1;
    this.cleanupAudio();
    this.prefetchPromise = null;
    this.setStatus("idle");
  }

  seekToBlock(blockIndex: number): void {
    const wasPlaying = this.status === "playing" || this.status === "loading";
    this.stop();
    if (wasPlaying) {
      this.play(blockIndex);
    } else {
      this.onBlockChange(blockIndex);
      const entry = this.timeline[blockIndex];
      if (entry) this.onProgress(entry.start);
    }
  }

  setPlaybackRate(rate: number): void {
    if (this.audio) {
      this.audio.playbackRate = rate;
    }
  }

  getStatus(): ElevenLabsStatus {
    return this.status;
  }

  private setStatus(next: ElevenLabsStatus): void {
    this.status = next;
    this.onStatusChange(next);
  }

  private cleanupAudio(): void {
    if (this.audio) {
      if (this.timeUpdateHandler) {
        this.audio.removeEventListener("timeupdate", this.timeUpdateHandler);
        this.timeUpdateHandler = null;
      }
      this.audio.pause();
      this.audio.removeAttribute("src");
      this.audio.load();
      this.audio = null;
    }
  }

  private async playAudioData(
    audioData: ArrayBuffer,
    chunkIndex: number,
    localRunId: number,
  ): Promise<void> {
    this.cleanupAudio();

    const blob = new Blob([audioData], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);

    const audio = new Audio(url);
    this.audio = audio;

    const chunk = this.chunks[chunkIndex];

    // Start prefetching next chunk
    this.prefetchNext(chunkIndex);

    const timeUpdateHandler = () => {
      if (localRunId !== this.runId) return;

      const blockIndex = mapAudioProgressToBlock(
        chunk,
        this.blocks,
        audio.currentTime,
        audio.duration,
      );
      this.onBlockChange(blockIndex);

      const entry = this.timeline[blockIndex];
      if (entry) {
        const blockWordsBeforeThis = this.blocks
          .slice(chunk.blockStart, blockIndex)
          .reduce((sum, b) => sum + b.words, 0);
        const blockFraction = audio.duration > 0 ? audio.currentTime / audio.duration : 0;
        const totalWordsFraction = blockFraction * chunk.words;
        const wordsIntoBlock = Math.max(0, totalWordsFraction - blockWordsBeforeThis);
        const block = this.blocks[blockIndex];
        const blockProgress =
          block && block.words > 0 ? Math.min(1, wordsIntoBlock / block.words) : 0;
        this.onProgress(entry.start + entry.seconds * blockProgress);
      }
    };

    this.timeUpdateHandler = timeUpdateHandler;
    audio.addEventListener("timeupdate", timeUpdateHandler);

    audio.addEventListener(
      "ended",
      () => {
        if (localRunId !== this.runId) return;
        URL.revokeObjectURL(url);

        const nextChunkIndex = chunkIndex + 1;
        if (nextChunkIndex < this.chunks.length) {
          const nextChunk = this.chunks[nextChunkIndex];

          const playNext = async () => {
            try {
              const nextAudioData = this.prefetchPromise
                ? await this.prefetchPromise
                : await getOrFetchAudio(nextChunk, this.voiceId);
              if (localRunId !== this.runId) return;
              this.prefetchPromise = null;
              await this.playAudioData(nextAudioData, nextChunkIndex, localRunId);
            } catch {
              if (localRunId !== this.runId) return;
              this.setStatus("idle");
            }
          };
          playNext();
        } else {
          this.setStatus("ended");
          const lastEntry = this.timeline.at(-1);
          if (lastEntry) this.onProgress(lastEntry.end);
        }
      },
      { once: true },
    );

    audio.addEventListener(
      "error",
      () => {
        if (localRunId !== this.runId) return;
        URL.revokeObjectURL(url);
        this.setStatus("idle");
      },
      { once: true },
    );

    try {
      await audio.play();
      if (localRunId !== this.runId) return;
      this.setStatus("playing");
    } catch {
      if (localRunId !== this.runId) return;
      this.setStatus("idle");
    }
  }

  private prefetchNext(currentChunkIndex: number): void {
    const nextIndex = currentChunkIndex + 1;
    if (nextIndex >= this.chunks.length) return;
    if (this.prefetchPromise) return;

    const nextChunk = this.chunks[nextIndex];
    this.prefetchPromise = getOrFetchAudio(nextChunk, this.voiceId).catch(() => {
      this.prefetchPromise = null;
      return new ArrayBuffer(0);
    });
  }
}
