import type { PrdDefinition } from "../../core-logic/types.js";

export const labsDomain: PrdDefinition = {
  id: "domain:labs",
  level: "domain",
  name: "Labs & Simulation",
  summary: "Distributed systems simulators: CRDT, Raft, BFT, network simulation, state machines",
  purpose:
    "Experimental domain for interactive distributed systems education. Each simulator runs in-browser with real-time visualization of consensus, replication, and fault scenarios.",
  constraints: [
    "Simulations must be deterministic given the same seed",
    "Visualizations must update in real-time (<100ms)",
    "All simulators must support pause/step/resume",
  ],
  acceptance: [
    "Simulator correctly demonstrates the algorithm's invariants",
    "Users can inject faults and observe recovery",
  ],
  toolCategories: ["crdt", "netsim", "bft", "causality", "raft", "state-machine"],
  tools: [],
  composesFrom: ["platform"],
  routePatterns: [],
  keywords: [
    "distributed",
    "consensus",
    "raft",
    "crdt",
    "bft",
    "simulation",
    "network",
    "partition",
    "state machine",
    "experiment",
    "lab",
  ],
  tokenEstimate: 300,
  version: "1.0.0",
};
