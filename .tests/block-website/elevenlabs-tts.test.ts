import { describe, expect, it } from "vitest";
import type { ReaderBlock } from "../../src/core/block-website/core-logic/blog-reader";
import {
  groupBlocksIntoChunks,
  mapAudioProgressToBlock,
} from "../../src/core/block-website/core-logic/elevenlabs-tts";

function makeBlock(text: string, words?: number): ReaderBlock {
  const wordCount = words ?? text.split(" ").filter(Boolean).length;
  return {
    element: document.createElement("p"),
    id: `block-${Math.random().toString(36).slice(2, 8)}`,
    kind: "paragraph",
    text,
    words: wordCount,
  };
}

function makeBlockWithWords(wordCount: number): ReaderBlock {
  const text = Array.from({ length: wordCount }, (_, i) => `word${i}`).join(" ");
  return makeBlock(text, wordCount);
}

describe("groupBlocksIntoChunks", () => {
  it("returns empty array for no blocks", () => {
    expect(groupBlocksIntoChunks([], "voice-1")).toEqual([]);
  });

  it("puts all blocks in one chunk when under 60s", () => {
    // 165 WPM = 165 words in 60 seconds
    // 50 words ≈ 18 seconds — well under limit
    const blocks = [makeBlockWithWords(25), makeBlockWithWords(25)];
    const chunks = groupBlocksIntoChunks(blocks, "voice-1");

    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.blockStart).toBe(0);
    expect(chunks[0]?.blockEnd).toBe(1);
    expect(chunks[0]?.words).toBe(50);
  });

  it("splits into multiple chunks at 60s boundary", () => {
    // 165 WPM → 60s = 165 words
    // 3 blocks of 100 words each → ~36s each
    // First two fit in one chunk (200 words ≈ 72s > 60s boundary)
    // So: chunk 1 = block 0 (100 words, ~36s), chunk 2 = block 1 (100 words), etc.
    const blocks = [makeBlockWithWords(100), makeBlockWithWords(100), makeBlockWithWords(100)];
    const chunks = groupBlocksIntoChunks(blocks, "voice-1");

    // Block 0: 100 words ≈ 36.4s (under 60s, fits in chunk 1)
    // Block 1: adding 100 words would be 200 words ≈ 72.7s (over 60s, flush chunk 1, start chunk 2)
    // Block 2: adding 100 words would be 200 words ≈ 72.7s (over 60s, flush chunk 2, start chunk 3)
    expect(chunks).toHaveLength(3);
    expect(chunks[0]?.blockStart).toBe(0);
    expect(chunks[0]?.blockEnd).toBe(0);
    expect(chunks[1]?.blockStart).toBe(1);
    expect(chunks[1]?.blockEnd).toBe(1);
    expect(chunks[2]?.blockStart).toBe(2);
    expect(chunks[2]?.blockEnd).toBe(2);
  });

  it("groups small blocks together under 60s", () => {
    // 10 blocks of 10 words each = 100 words ≈ 36s → all fit in one chunk
    const blocks = Array.from({ length: 10 }, () => makeBlockWithWords(10));
    const chunks = groupBlocksIntoChunks(blocks, "voice-1");

    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.blockStart).toBe(0);
    expect(chunks[0]?.blockEnd).toBe(9);
    expect(chunks[0]?.words).toBe(100);
  });

  it("correctly handles a single large block", () => {
    const blocks = [makeBlockWithWords(300)];
    const chunks = groupBlocksIntoChunks(blocks, "voice-1");

    // Single block always goes into its own chunk regardless of size
    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.blockStart).toBe(0);
    expect(chunks[0]?.blockEnd).toBe(0);
  });

  it("includes cache key with voice ID", () => {
    const blocks = [makeBlockWithWords(10)];
    const chunks = groupBlocksIntoChunks(blocks, "voice-abc");

    expect(chunks[0]?.cacheKey).toContain("voice-abc:");
  });
});

describe("mapAudioProgressToBlock", () => {
  it("returns blockStart when audio has not started", () => {
    const blocks = [makeBlockWithWords(50), makeBlockWithWords(50)];
    const chunk = {
      blockStart: 0,
      blockEnd: 1,
      text: "...",
      words: 100,
      cacheKey: "test",
    };

    expect(mapAudioProgressToBlock(chunk, blocks, 0, 10)).toBe(0);
  });

  it("returns blockEnd when audio is complete", () => {
    const blocks = [makeBlockWithWords(50), makeBlockWithWords(50)];
    const chunk = {
      blockStart: 0,
      blockEnd: 1,
      text: "...",
      words: 100,
      cacheKey: "test",
    };

    expect(mapAudioProgressToBlock(chunk, blocks, 10, 10)).toBe(1);
  });

  it("returns correct block at midpoint", () => {
    const blocks = [makeBlockWithWords(50), makeBlockWithWords(50)];
    const chunk = {
      blockStart: 0,
      blockEnd: 1,
      text: "...",
      words: 100,
      cacheKey: "test",
    };

    // At 40% → 40 words out of 100 → block 0 (which has 50 words)
    expect(mapAudioProgressToBlock(chunk, blocks, 4, 10)).toBe(0);

    // At 60% → 60 words out of 100 → block 1 (accumulated 50 from block 0, need 60)
    expect(mapAudioProgressToBlock(chunk, blocks, 6, 10)).toBe(1);
  });

  it("handles zero duration gracefully", () => {
    const blocks = [makeBlockWithWords(50)];
    const chunk = {
      blockStart: 2,
      blockEnd: 2,
      text: "...",
      words: 50,
      cacheKey: "test",
    };

    expect(mapAudioProgressToBlock(chunk, blocks, 5, 0)).toBe(2);
  });

  it("maps proportionally across unequal blocks", () => {
    // Block 0: 25 words, Block 1: 75 words → total 100
    const blocks = [makeBlockWithWords(25), makeBlockWithWords(75)];
    const chunk = {
      blockStart: 0,
      blockEnd: 1,
      text: "...",
      words: 100,
      cacheKey: "test",
    };

    // At 20% → 20 words → still in block 0 (has 25 words)
    expect(mapAudioProgressToBlock(chunk, blocks, 2, 10)).toBe(0);

    // At 30% → 30 words → in block 1 (block 0 has only 25)
    expect(mapAudioProgressToBlock(chunk, blocks, 3, 10)).toBe(1);
  });
});
