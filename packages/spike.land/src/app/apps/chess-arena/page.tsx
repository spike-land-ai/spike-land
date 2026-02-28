import type { Metadata } from "next";
import { ChessArenaClient } from "./ChessArenaClient";

export const metadata: Metadata = {
  title: "Chess Arena | spike.land",
  description: "Multiplayer chess with ELO ratings, timed controls, and full game replay.",
};

export default function ChessArenaPage() {
  return <ChessArenaClient />;
}
