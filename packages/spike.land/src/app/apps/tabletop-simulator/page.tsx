import type { Metadata } from "next";
import { TabletopSimulatorClient } from "./TabletopSimulatorClient";

export const metadata: Metadata = {
  title: "Tabletop Simulator | spike.land",
  description:
    "Gather your friends for board games and RPGs in a shared 3D space. Real-time multiplayer with physics-based pieces.",
};

export default function TabletopPage() {
  return <TabletopSimulatorClient />;
}
