import type { PrdDefinition } from "../../core-logic/types.js";

export const crdtLabPrd: PrdDefinition = {
  id: "app:crdt-lab",
  level: "app",
  name: "CRDT Lab",
  summary: "Interactive CRDT simulator with G-Counter, PN-Counter, LWW-Register, and OR-Set",
  purpose:
    "Educational app for exploring conflict-free replicated data types. Simulate concurrent edits across replicas, merge operations, and convergence checking.",
  constraints: [
    "Simulations must be deterministic given same inputs",
    "Visualizations update in real-time as operations apply",
    "Support AP vs CP comparison mode",
  ],
  acceptance: [
    "All four CRDT types demonstrate convergence after concurrent edits",
    "Users can step through merge operations one at a time",
  ],
  toolCategories: ["crdt"],
  tools: [],
  composesFrom: ["platform", "domain:labs", "route:/apps"],
  routePatterns: ["/apps/crdt-lab"],
  keywords: ["crdt", "distributed", "replicate", "merge", "convergence"],
  tokenEstimate: 350,
  version: "1.0.0",
};
