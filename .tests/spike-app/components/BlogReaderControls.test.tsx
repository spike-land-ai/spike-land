import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BlogReaderControls } from "../../../src/core/block-website/ui/BlogReaderControls";

class MockSpeechSynthesisUtterance {
  lang = "";
  onboundary: ((event: { charIndex: number }) => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onstart: (() => void) | null = null;
  rate = 1;
  text: string;
  voice: SpeechSynthesisVoice | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

function ReaderHarness() {
  const scopeRef = useRef<HTMLDivElement | null>(null);

  return (
    <>
      <BlogReaderControls contentKey="reader-demo" scopeRef={scopeRef} />
      <div ref={scopeRef}>
        <h1 data-reader-block="true" data-reader-kind="title">
          Assisted reading
        </h1>
        <p data-reader-block="true" data-reader-kind="paragraph">
          This is the first paragraph of the article.
        </p>
        <h2 data-reader-block="true" data-reader-kind="heading-2">
          Deep Dive
        </h2>
        <p data-reader-block="true" data-reader-kind="paragraph">
          This is the second paragraph of the article.
        </p>
      </div>
    </>
  );
}

describe("BlogReaderControls", () => {
  const speak = vi.fn();
  const pause = vi.fn();
  const resume = vi.fn();
  const cancel = vi.fn();

  beforeEach(() => {
    let paused = false;

    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(0), 0),
    );
    vi.stubGlobal("cancelAnimationFrame", (handle: number) => window.clearTimeout(handle));

    speak.mockImplementation((utterance: MockSpeechSynthesisUtterance) => {
      paused = false;
      utterance.onstart?.();
    });
    pause.mockImplementation(() => {
      paused = true;
    });
    resume.mockImplementation(() => {
      paused = false;
    });
    cancel.mockImplementation(() => {
      paused = false;
    });

    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        cancel,
        getVoices: () => [
          {
            default: true,
            lang: "en-US",
            localService: true,
            name: "Test Voice",
            voiceURI: "test-voice",
          } as SpeechSynthesisVoice,
        ],
        pause,
        get paused() {
          return paused;
        },
        resume,
        speak,
      } satisfies Pick<
        SpeechSynthesis,
        "cancel" | "getVoices" | "pause" | "paused" | "resume" | "speak"
      >,
    });

    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      writable: true,
      value: MockSpeechSynthesisUtterance,
    });

    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("scans article blocks and starts speech playback", async () => {
    render(<ReaderHarness />);

    await screen.findByText("4 readable blocks");

    fireEvent.click(screen.getByRole("button", { name: /read aloud/i }));

    expect(speak).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
    expect(document.querySelector('[data-reader-active="true"]')).toHaveTextContent(
      "Assisted reading",
    );
  });

  it("updates the reader scope variables when typography controls change", async () => {
    const { container } = render(<ReaderHarness />);

    await screen.findByText("4 readable blocks");

    const scope = container.querySelector('[data-reader-surface="true"]') as HTMLDivElement | null;
    expect(scope).not.toBeNull();

    fireEvent.change(screen.getByLabelText("Reading font size"), {
      target: { value: "1.2" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sage/i }));

    await waitFor(() => {
      expect(scope?.style.getPropertyValue("--reader-font-scale")).toBe("1.2");
      expect(scope?.style.getPropertyValue("--reader-focus-bg")).toContain("color-mix");
    });
  });
});
