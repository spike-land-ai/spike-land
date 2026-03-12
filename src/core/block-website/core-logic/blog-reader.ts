export interface ReaderBlock {
  element: HTMLElement;
  id: string;
  kind: string;
  text: string;
  words: number;
}

export interface ReaderTimelineEntry {
  block: ReaderBlock;
  end: number;
  seconds: number;
  start: number;
}

const WORDS_PER_MINUTE = 165;

export function normalizeReaderText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function estimateReaderSeconds(text: string, rate: number): number {
  const words = normalizeReaderText(text).split(" ").filter(Boolean).length;
  if (words === 0) return 0;

  const adjustedRate = Math.max(0.6, rate);
  const seconds = (words / (WORDS_PER_MINUTE * adjustedRate)) * 60;
  return Math.max(1.25, Number(seconds.toFixed(2)));
}

export function collectReaderBlocks(root: ParentNode): ReaderBlock[] {
  if (!("querySelectorAll" in root)) return [];

  const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-reader-block="true"]'));

  return elements
    .filter((element) => {
      const nestedParent = element.parentElement?.closest<HTMLElement>(
        '[data-reader-block="true"]',
      );
      return nestedParent == null;
    })
    .map((element, index) => {
      const text = normalizeReaderText(element.innerText || element.textContent || "");
      if (!text) return null;

      return {
        element,
        id: element.dataset["readerId"] ?? `reader-block-${index}`,
        kind: element.dataset["readerKind"] ?? element.tagName.toLowerCase(),
        text,
        words: text.split(" ").filter(Boolean).length,
      };
    })
    .filter((block): block is ReaderBlock => block != null);
}

export function buildReaderTimeline(blocks: ReaderBlock[], rate: number): ReaderTimelineEntry[] {
  let elapsed = 0;

  return blocks.map((block) => {
    const seconds = estimateReaderSeconds(block.text, rate);
    const entry = {
      block,
      seconds,
      start: elapsed,
      end: elapsed + seconds,
    };
    elapsed += seconds;
    return entry;
  });
}

export function findReaderBlockIndexByTime(
  timeline: ReaderTimelineEntry[],
  targetSeconds: number,
): number {
  if (timeline.length === 0) return 0;

  const clampedTarget = Math.max(0, Math.min(targetSeconds, timeline.at(-1)?.end ?? 0));
  const foundIndex = timeline.findIndex((entry) => clampedTarget < entry.end);
  return foundIndex === -1 ? timeline.length - 1 : foundIndex;
}

export function formatReaderTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}
