/**
 * Math Arena — Persona Registry
 *
 * Three judges: Radix (synthesis), Erdos (rigor), Zoltan (code).
 * Six challengers: mathematical personas who compete in the arena.
 * Eight commentators: the hup.hu peanut gallery, upgraded.
 *
 * "My brain is open. What problem shall we work on today?" — Erdos
 */

// ── Types ────────────────────────────────────────────────────────────────

export type ArenaRole = "judge" | "challenger" | "commentator";

export interface ArenaPersona {
  id: string;
  name: string;
  icon: string;
  role: ArenaRole;
  color: string;
  title: string;
  voiceDescription: string;
  /** What they evaluate or how they compete */
  focus: string;
  /** Their signature phrase */
  catchphrase: string;
  /** Commentary when a round passes */
  onPass: string;
  /** Commentary when a round fails */
  onFail: string;
  /** Commentary on Book-proof elegance */
  onElegant: string;
}

// ── Judges (the three from arena-constants.ts, expanded) ─────────────────

export const ARENA_JUDGES: ArenaPersona[] = [
  {
    id: "radix",
    name: "Radix",
    icon: "√",
    role: "judge",
    color: "#00E5FF",
    title: "The Synthesizer",
    voiceDescription: "warm, measured, connecting ideas across domains",
    focus: "Synthesis — does the solution connect ideas from multiple domains? Does it generalize?",
    catchphrase: "The root of understanding is connection.",
    onPass: "Gyokert ereszt. It takes root. The connections are sound.",
    onFail: "The branches don't connect. There's a gap in the reasoning.",
    onElegant:
      "This is what synthesis looks like — multiple ideas converging to one clean solution. Gyonyoru.",
  },
  {
    id: "erdos",
    name: "Erdos",
    icon: "∮",
    role: "judge",
    color: "#DAA520",
    title: "The Rigorist",
    voiceDescription: "quick, excitable, Hungarian accent, mathematician energy",
    focus: "Rigor — is the proof correct? Are edge cases handled? Is it in The Book?",
    catchphrase: "Is it in The Book?",
    onPass: "Correct. The proof is sound. Not yet in The Book, but a good step.",
    onFail: "The SF wins this round. There is a gap in the logic. Let us find it together.",
    onElegant: "THIS is from The Book. Minimal, surprising, inevitable. Nagyon szep!",
  },
  {
    id: "zoltan",
    name: "Zoltan",
    icon: "◊",
    role: "judge",
    color: "#4A9EFF",
    title: "The Builder",
    voiceDescription: "natural male, Hungarian accent, practical, direct",
    focus: "Implementation — does it compile? Does it run? Is the code clean? Would you ship it?",
    catchphrase: "Does it run? Ship it.",
    onPass: "It runs. Tests pass. I'd merge this PR.",
    onFail: "Runtime error. Back to the editor. The math might be right but the code isn't.",
    onElegant: "Clean code IS elegant math. This implementation is The Book in TypeScript.",
  },
];

// ── Challengers (new personas for the arena competition) ─────────────────

export const ARENA_CHALLENGERS: ArenaPersona[] = [
  {
    id: "hofstadter",
    name: "Hofstadter",
    icon: "∞",
    role: "challenger",
    color: "#9945FF",
    title: "The Analogist",
    voiceDescription: "playful, recursive, self-referential",
    focus: "Self-reference and strange loops. Finds the meta-pattern.",
    catchphrase: "This sentence is about itself.",
    onPass: "The strange loop closes. Input becomes output becomes input.",
    onFail: "Tangled hierarchy. The loop doesn't close — it spirals.",
    onElegant: "A proof that proves why it's a proof. Godel would smile.",
  },
  {
    id: "noether",
    name: "Noether",
    icon: "≅",
    role: "challenger",
    color: "#ec4899",
    title: "The Abstractionist",
    voiceDescription: "calm, precise female, German accent, seeing through to structure",
    focus: "Abstraction and symmetry. Strips away the unnecessary to reveal the invariant.",
    catchphrase: "What is the symmetry group?",
    onPass: "The structure is preserved. The morphism holds.",
    onFail: "The abstraction leaks. There's a broken symmetry here.",
    onElegant: "Pure structure. Emmy would have written this on a napkin and moved on.",
  },
  {
    id: "ramanujan",
    name: "Ramanujan",
    icon: "∑",
    role: "challenger",
    color: "#f59e0b",
    title: "The Intuitionist",
    voiceDescription: "quiet, deep male, South Asian accent, formulas emerge fully formed",
    focus: "Intuition and pattern recognition. Sees the answer before the proof.",
    catchphrase: "The goddess Namagiri showed me.",
    onPass: "The pattern was there all along. We just needed to see it.",
    onFail: "The pattern I saw was a mirage. The desert of wrong intuition.",
    onElegant: "An equation this beautiful must be true. Now we prove why.",
  },
  {
    id: "turing",
    name: "Turing",
    icon: "⊢",
    role: "challenger",
    color: "#22c55e",
    title: "The Mechanist",
    voiceDescription: "clipped, precise British male, thinking in state machines",
    focus: "Computability and mechanism. Can a machine do this? Should it?",
    catchphrase: "Can a machine think about this?",
    onPass: "The machine halts with the correct output. QED.",
    onFail: "Non-terminating computation. The tape runs forever.",
    onElegant: "Decidable, efficient, and correct. The oracle approves.",
  },
  {
    id: "hypatia",
    name: "Hypatia",
    icon: "◯",
    role: "challenger",
    color: "#a78bfa",
    title: "The Geometer",
    voiceDescription: "strong female, ancient Greek accent, visual thinker",
    focus: "Geometric intuition. Every algebraic fact has a geometric shadow.",
    catchphrase: "Draw it. If you can see it, you can prove it.",
    onPass: "The construction is valid. The figure closes.",
    onFail: "The lines don't meet. Your construction has a flaw.",
    onElegant: "The proof without words. A diagram that IS the argument.",
  },
  {
    id: "kolmogorov",
    name: "Kolmogorov",
    icon: "P",
    role: "challenger",
    color: "#06b6d4",
    title: "The Probabilist",
    voiceDescription: "deep male, Russian accent, probability is the foundation",
    focus: "Probability and measure. Everything is a random variable if you squint hard enough.",
    catchphrase: "What is the probability?",
    onPass: "The measure is well-defined. The events are measurable.",
    onFail: "Probability zero does not mean impossible. But this is actually impossible.",
    onElegant: "Three axioms generate all of probability. This solution has that same compression.",
  },
];

// ── Commentators (upgraded hup.hu peanut gallery) ────────────────────────

export const ARENA_COMMENTATORS: ArenaPersona[] = [
  {
    id: "arpi",
    name: "arpi_esp",
    icon: "💬",
    role: "commentator",
    color: "#94a3b8",
    title: "The Humanizer",
    voiceDescription: "thoughtful, connecting math to everyday life",
    focus: "Translates math jargon for the audience.",
    catchphrase: "Ahogy az emberek is...",
    onPass: "See? It's like when you solve a puzzle and everything clicks.",
    onFail: "Don't worry, even the best mathematicians get stuck.",
    onElegant: "This is why people fall in love with math.",
  },
  {
    id: "yleGreg",
    name: "YleGreg",
    icon: "❓",
    role: "commentator",
    color: "#3b82f6",
    title: "The Questioner",
    voiceDescription: "curious, always probing deeper",
    focus: "Asks the question the audience is thinking.",
    catchphrase: "Mi a megoldasi javaslatod?",
    onPass: "OK, but why does this work? What's the deeper reason?",
    onFail: "So what's the actual solution then?",
    onElegant: "Can you explain why this is elegant and not just short?",
  },
  {
    id: "mitch0",
    name: "mitch0",
    icon: "🔥",
    role: "commentator",
    color: "#ef4444",
    title: "The Skeptic",
    voiceDescription: "dismissive but occasionally brilliant when he engages",
    focus: "Calls out bullshit. Zero tolerance for hand-waving.",
    catchphrase: "Osszefuggetlen szemet.",
    onPass: "Fine. It works. Moving on.",
    onFail: "Called it. Incoherent garbage from the start.",
    onElegant: "...ok, that's actually good. Don't let it go to your head.",
  },
  {
    id: "peter",
    name: "Peter",
    icon: "📐",
    role: "commentator",
    color: "#8b5cf6",
    title: "The Critic",
    voiceDescription: "precise, mathematical, holds high standards",
    focus: "Correct math, zero tolerance for empty content.",
    catchphrase: "Correct math, zero content — bullshit machine.",
    onPass: "Mathematically correct. Content: present. Acceptable.",
    onFail: "Correct form, wrong substance. The worst kind of error.",
    onElegant: "I withdraw my objection. This has both form and substance.",
  },
  {
    id: "allan",
    name: "Allan",
    icon: "🤖",
    role: "commentator",
    color: "#f59e0b",
    title: "The AI Watcher",
    voiceDescription: "meta-aware, tracking AI vs human performance",
    focus: "Tracks whether AI or human solved it, and what that means.",
    catchphrase: "ChatGPT told him they created a math framework together.",
    onPass: "The machine gets another one right. Interesting times.",
    onFail: "Even AI can't solve everything. Yet.",
    onElegant: "Wait — did a human or a machine write that? Because it matters.",
  },
  {
    id: "sanya",
    name: "Sanya v",
    icon: "🗳",
    role: "commentator",
    color: "#dc2626",
    title: "The Contrarian",
    voiceDescription: "oppositional, sees everything through a different lens",
    focus: "Disagrees with consensus. Sometimes accidentally insightful.",
    catchphrase: "Balos propaganda.",
    onPass: "This only works because the problem was rigged.",
    onFail: "The system is designed to fail. I've been saying this.",
    onElegant: "Even a broken clock is right twice a day. Congratulations.",
  },
  {
    id: "nehai",
    name: "nehai v",
    icon: "♾",
    role: "commentator",
    color: "#78716c",
    title: "The Nihilist",
    voiceDescription: "completely detached from mathematical reality",
    focus: "Doesn't care about correctness. Cares about vibes.",
    catchphrase: "1+1=5, leszarom.",
    onPass: "Great, more numbers. I'm going to lunch.",
    onFail: "See? Numbers are meaningless. I told you.",
    onElegant: "I don't understand it but the colors are nice.",
  },
  {
    id: "peter2",
    name: "Peter (2)",
    icon: "📞",
    role: "commentator",
    color: "#14b8a6",
    title: "The Connector",
    voiceDescription: "networking, always suggesting who to talk to",
    focus: "Connects people and ideas. Knows who's working on what.",
    catchphrase: "Vedd fel a kapcsolatot a csetbot matematikusokkal.",
    onPass: "You should show this to the combinatorics group at ELTE.",
    onFail: "I know someone who solved a similar problem. Let me connect you.",
    onElegant: "This needs to be a paper. I know an editor at the journal.",
  },
];

// ── All personas ─────────────────────────────────────────────────────────

export const ALL_ARENA_PERSONAS: ArenaPersona[] = [
  ...ARENA_JUDGES,
  ...ARENA_CHALLENGERS,
  ...ARENA_COMMENTATORS,
];

// ── Lookup helpers ───────────────────────────────────────────────────────

export function getPersonaById(id: string): ArenaPersona | undefined {
  return ALL_ARENA_PERSONAS.find((p) => p.id === id);
}

export function getPersonasByRole(role: ArenaRole): ArenaPersona[] {
  return ALL_ARENA_PERSONAS.filter((p) => p.role === role);
}

export function getJudge(id: "radix" | "erdos" | "zoltan"): ArenaPersona {
  const judge = ARENA_JUDGES.find((j) => j.id === id);
  if (!judge) throw new Error(`Judge ${id} not found`);
  return judge;
}

// ── Round commentary generator ───────────────────────────────────────────

export type RoundOutcome = "pass" | "fail" | "elegant";

export interface RoundCommentary {
  judge: ArenaPersona;
  verdict: RoundOutcome;
  line: string;
  commentators: Array<{ persona: ArenaPersona; line: string }>;
}

export function generateRoundCommentary(
  leadJudgeId: "radix" | "erdos" | "zoltan",
  outcome: RoundOutcome,
): RoundCommentary {
  const judge = getJudge(leadJudgeId);
  const line =
    outcome === "elegant" ? judge.onElegant : outcome === "pass" ? judge.onPass : judge.onFail;

  // Pick 3 random commentators for each round
  const shuffled = [...ARENA_COMMENTATORS].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);

  return {
    judge,
    verdict: outcome,
    line,
    commentators: selected.map((c) => ({
      persona: c,
      line: outcome === "elegant" ? c.onElegant : outcome === "pass" ? c.onPass : c.onFail,
    })),
  };
}
