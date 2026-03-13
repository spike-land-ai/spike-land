import type { PrdDefinition } from "../../core-logic/types.js";

export const aetherDomain: PrdDefinition = {
  id: "domain:aether",
  level: "domain",
  name: "Aether — Personal Knowledge & Intelligence",
  summary:
    "Personal Knowledge Graph, Bayesian memory, mastery acceleration, decision support on edge",
  purpose:
    "Federated edge-first personal intelligence system. PKG stores skills, decisions, goals, beliefs, and events with temporal queries. Bayesian note confidence drives prompt injection. FSRS-5 mastery engine for spaced repetition.",
  constraints: [
    "All PKG data encrypted per-user on D1 (edge operator cannot read plaintext)",
    "Pure logic must work on edge AND future on-device (no CF-specific imports in core-logic/)",
    "Note extraction is non-critical — must never block the chat pipeline",
    "PKG queries must complete within 50ms on D1",
  ],
  acceptance: [
    "Spike Chat 4-stage pipeline works end-to-end with PKG context injection",
    "PKG nodes and edges persist across sessions with temporal query support",
    "Bayesian note confidence correctly promotes/demotes based on usefulness",
  ],
  toolCategories: ["aether", "pkg", "mastery", "decision"],
  tools: [],
  composesFrom: ["platform"],
  routePatterns: [],
  keywords: [
    "aether",
    "pkg",
    "knowledge graph",
    "personal knowledge",
    "bayesian",
    "memory",
    "note",
    "confidence",
    "mastery",
    "spaced repetition",
    "fsrs",
    "decision",
    "belief",
    "goal",
    "skill",
    "learning",
  ],
  tokenEstimate: 400,
  version: "1.0.0",
};
