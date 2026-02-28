import { MusicCreatorClient } from "./MusicCreatorClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Music Creator — AI Multi-Track Composer | Spike Land",
  description:
    "Compose multi-track music with a piano roll, instrument selector, mixer controls, and AI generation powered by Spike Land.",
};

export default function Page() {
  return <MusicCreatorClient />;
}
