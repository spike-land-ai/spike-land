/**
 * Audio Studio App - Main Page
 * Complete overhaul of the audio mixer into a full DAW-style studio
 */

import { AudioStudioClient } from "./AudioStudioClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audio Studio — Multi-track Mixing & AI Voice | Spike Land",
  description:
    "A professional audio production suite with multi-track mixing, drag-drop upload, waveform visualization, and AI-powered text-to-speech.",
};

export default function AudioStudioPage() {
  return <AudioStudioClient />;
}
