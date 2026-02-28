import type { GrabbedByState, Vector3 } from "./card";

export type DiceType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";

export interface DiceState {
  id: string;
  type: DiceType;
  value: number; // Current face value
  position: Vector3;
  rotation: Vector3;
  isRolling: boolean;
  seed: number; // For deterministic replay
  ownerId: string | null;
  grabbedBy?: GrabbedByState | null; // Who is currently grabbing this dice
}
