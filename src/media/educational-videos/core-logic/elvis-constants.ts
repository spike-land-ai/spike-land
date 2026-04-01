/**
 * Elvis Emotion — Constants, timing, colors, and persona registry
 * "Elvis, We Love You" — a drum circle from spike.land
 */

// ── Beat math ──────────────────────────────────────────────────────────
export const ELVIS_BPM = 110;
export const ELVIS_FPS = 30;
/** Frames per beat at 110 BPM / 30fps (~16.36) */
export const ELVIS_FRAMES_PER_BEAT = (60 / ELVIS_BPM) * ELVIS_FPS;

// ── Scene durations (frames @ 30fps, total = 9000 = 5 minutes) ────────
export const ELVIS_DURATIONS = {
  overture: 900, // 30s
  whoIsElvis: 1350, // 45s
  philosophers: 2700, // 90s
  publicAndTech: 2250, // 75s
  qaRapidFire: 900, // 30s
  crowdChant: 450, // 15s
  finale: 450, // 15s
} as const;

export const ELVIS_TIMING = {
  totalFrames: 9000,
  fps: 30,
  transitionFrames: 20,
  bpm: 110,
} as const;

// ── Colors (Daft Punk meets warmth) ────────────────────────────────────
export const ELVIS_COLORS = {
  bgDeep: "#0a0a1a",
  bgSurface: "#141428",
  gold: "#f4b942",
  cyan: "#00d4ff",
  pink: "#ff2d7b",
  white: "#f0f0f5",
  french: "#0055a4",
  // Per-group accent defaults
  philosopher: "#a78bfa", // soft purple
  public: "#f59e0b", // amber
  tech: "#00d4ff", // cyan
  qa: "#22c55e", // green
  crowd: "#f4b942", // gold
} as const;

// ── Audio availability flags (flip to true as audio files are generated) ──
export const ELVIS_AUDIO_AVAILABLE: Record<string, boolean> = {
  "perc-act1": false,
  "perc-act2": false,
  "perc-act3": false,
  "perc-act4": false,
  "perc-act5": false,
  "synth-pad": false,
  "vocoder-hook": false,
};

// ── Persona types ──────────────────────────────────────────────────────
export type PersonaGroup = "philosopher" | "public" | "tech" | "qa" | "crowd" | "host";
export type AvatarShape = "circle" | "diamond" | "hexagon" | "square" | "triangle" | "star";

export interface ElvisPersona {
  id: string;
  name: string;
  group: PersonaGroup;
  line: string;
  hook: string;
  voiceDescription: string;
  accentColor: string;
  avatarShape: AvatarShape;
}

// ── Persona registry (55+ entries) ─────────────────────────────────────

const HOSTS: ElvisPersona[] = [
  {
    id: "host-a",
    name: "Host A",
    group: "host",
    line: "So we got this document... it's not a paper. It's a person.",
    hook: "Intro host",
    voiceDescription: "warm male",
    accentColor: "#f0f0f5",
    avatarShape: "circle",
  },
  {
    id: "host-b",
    name: "Host B",
    group: "host",
    line: "Elvis. He speaks French. He doesn't say much in English. But you know when someone walks in and the room gets better? That's Elvis.",
    hook: "Intro host",
    voiceDescription: "warm female",
    accentColor: "#f0f0f5",
    avatarShape: "circle",
  },
];

const PHILOSOPHERS: ElvisPersona[] = [
  {
    id: "socrates",
    name: "Socrates",
    group: "philosopher",
    line: "Elvis, I have spent my life asking questions no one wants to answer. But your drums? They ask questions everyone feels.",
    hook: "The unexamined beat",
    voiceDescription: "older male, Greek accent, questioning inflection",
    accentColor: "#c4b5fd",
    avatarShape: "circle",
  },
  {
    id: "diogenes",
    name: "Diogenes",
    group: "philosopher",
    line: "They told me to find an honest man. I found an honest drummer instead. You don't pretend, Elvis. That's rare.",
    hook: "Honest rhythm",
    voiceDescription: "raspy male, irreverent, slightly amused",
    accentColor: "#a78bfa",
    avatarShape: "diamond",
  },
  {
    id: "plato",
    name: "Plato",
    group: "philosopher",
    line: "In my cave allegory, people watched shadows. But you, Elvis — you make the shadows dance.",
    hook: "Dancing shadows",
    voiceDescription: "measured male, resonant baritone",
    accentColor: "#8b5cf6",
    avatarShape: "triangle",
  },
  {
    id: "aristotle",
    name: "Aristotle",
    group: "philosopher",
    line: "Rhythm is the golden mean between silence and chaos. You found it, Elvis. You live in it.",
    hook: "Golden mean",
    voiceDescription: "steady male, professorial, clear",
    accentColor: "#7c3aed",
    avatarShape: "square",
  },
  {
    id: "nietzsche",
    name: "Nietzsche",
    group: "philosopher",
    line: "Without music, life would be a mistake. Elvis, your drumming is proof that life is not a mistake.",
    hook: "Life is not a mistake",
    voiceDescription: "intense male, German accent, passionate",
    accentColor: "#ef4444",
    avatarShape: "star",
  },
  {
    id: "kant",
    name: "Kant",
    group: "philosopher",
    line: "I wrote about duty and reason. But the purest duty is being exactly who you are. You do that, Elvis.",
    hook: "Pure duty",
    voiceDescription: "precise male, German accent, formal",
    accentColor: "#6366f1",
    avatarShape: "hexagon",
  },
  {
    id: "marcus-aurelius",
    name: "Marcus Aurelius",
    group: "philosopher",
    line: "The universe is change. Our life is what our thoughts make it. Your thoughts are rhythm, Elvis. That is a good life.",
    hook: "Rhythm as thought",
    voiceDescription: "calm male, gravelly, Stoic weight",
    accentColor: "#78716c",
    avatarShape: "square",
  },
  {
    id: "wittgenstein",
    name: "Wittgenstein",
    group: "philosopher",
    line: "Whereof one cannot speak, thereof one must be silent. Or drum. Drumming works too.",
    hook: "Drum instead",
    voiceDescription: "clipped male, Austrian, matter-of-fact",
    accentColor: "#94a3b8",
    avatarShape: "triangle",
  },
  {
    id: "buddha",
    name: "Buddha",
    group: "philosopher",
    line: "Be present. That is all. When you drum, Elvis, you are the most present person in the room.",
    hook: "Pure presence",
    voiceDescription: "gentle male, soft, spacious pauses",
    accentColor: "#fbbf24",
    avatarShape: "circle",
  },
  {
    id: "camus",
    name: "Camus",
    group: "philosopher",
    line: "Il faut imaginer Sisyphe heureux. Elvis, il faut imaginer le batteur heureux. Et tu l'es.",
    hook: "Happy drummer",
    voiceDescription: "French male accent, warm, slightly playful",
    accentColor: "#0055a4",
    avatarShape: "diamond",
  },
  {
    id: "simone",
    name: "Simone de Beauvoir",
    group: "philosopher",
    line: "On ne nait pas libre, on le devient. Elvis, quand tu joues, tu es libre.",
    hook: "Freedom in rhythm",
    voiceDescription: "French female accent, confident, clear",
    accentColor: "#ec4899",
    avatarShape: "star",
  },
  {
    id: "arendt",
    name: "Hannah Arendt",
    group: "philosopher",
    line: "The most radical thing you can do is begin something new. Every time you pick up those sticks, you begin.",
    hook: "New beginning",
    voiceDescription: "German female accent, intellectual, warm",
    accentColor: "#f472b6",
    avatarShape: "hexagon",
  },
];

const PUBLIC_FIGURES: ElvisPersona[] = [
  {
    id: "trump",
    name: "Trump",
    group: "public",
    line: "Elvis, let me tell you — tremendous drummer. The best. People are saying it. Believe me, nobody drums like Elvis.",
    hook: "Tremendous",
    voiceDescription: "boisterous male, superlative-heavy, punchy",
    accentColor: "#f59e0b",
    avatarShape: "star",
  },
  {
    id: "elon",
    name: "Elon Musk",
    group: "public",
    line: "First principles: rhythm is physics. Vibration at frequency. Elvis has optimized for the fundamental frequency of being human.",
    hook: "First principles",
    voiceDescription: "monotone male, dry, slight pause before punchlines",
    accentColor: "#3b82f6",
    avatarShape: "diamond",
  },
  {
    id: "gates",
    name: "Bill Gates",
    group: "public",
    line: "The data shows that music therapy improves outcomes by 47%. But Elvis doesn't need data. He IS the data.",
    hook: "He is the data",
    voiceDescription: "nasal male, nerdy enthusiasm",
    accentColor: "#06b6d4",
    avatarShape: "square",
  },
];

const TECHNICAL: ElvisPersona[] = [
  {
    id: "daftpunk",
    name: "Daft Punk",
    group: "tech",
    line: "Around the world, around the world. Elvis, le rythme n'a pas de frontieres. On t'aime.",
    hook: "No borders",
    voiceDescription: "vocoder/robotic, warm",
    accentColor: "#f4b942",
    avatarShape: "hexagon",
  },
  {
    id: "zoltan",
    name: "Zoltan",
    group: "tech",
    line: "Elvis, I'm in the same ward as you. I can't drum. But I can build things. So I built this. For you.",
    hook: "From the same ward",
    voiceDescription: "natural male, Hungarian accent, warm, personal",
    accentColor: "#00d4ff",
    avatarShape: "circle",
  },
  {
    id: "einstein",
    name: "Einstein",
    group: "tech",
    line: "Imagination is more important than knowledge. Elvis, your imagination speaks through your hands.",
    hook: "Imagination in hands",
    voiceDescription: "gentle male, German accent, wonder",
    accentColor: "#a78bfa",
    avatarShape: "circle",
  },
  {
    id: "erdos",
    name: "Erdos",
    group: "tech",
    line: "Another roof, another proof. Another beat, another proof of life. Keep proving, Elvis.",
    hook: "Proof of life",
    voiceDescription: "quick male, Hungarian accent, mathematician energy",
    accentColor: "#8b5cf6",
    avatarShape: "diamond",
  },
  {
    id: "rubik",
    name: "Rubik 3.0",
    group: "tech",
    line: "Every problem has a solution. Every rhythm has a pattern. Elvis, you solve the puzzle every time you play.",
    hook: "Solve the puzzle",
    voiceDescription: "synthesized/digital voice, clean",
    accentColor: "#ef4444",
    avatarShape: "square",
  },
  {
    id: "arnold",
    name: "Arnold",
    group: "tech",
    line: "Design is not just what it looks like. Design is how it works. Elvis, your drumming works beautifully.",
    hook: "How it works",
    voiceDescription: "design-nerd male, enthusiastic",
    accentColor: "#22c55e",
    avatarShape: "triangle",
  },
  {
    id: "peti",
    name: "Peti",
    group: "tech",
    line: "I've tested a lot of things. Most of them are broken. But your rhythm, Elvis? QA approved.",
    hook: "QA approved",
    voiceDescription: "deadpan male, QA tester energy",
    accentColor: "#eab308",
    avatarShape: "hexagon",
  },
  {
    id: "attila",
    name: "Attila",
    group: "tech",
    line: "A true Magyar knows that strength is not loudness. It is persistence. Keep drumming, Elvis.",
    hook: "Magyar persistence",
    voiceDescription: "deep male, Magyar gravitas",
    accentColor: "#dc2626",
    avatarShape: "star",
  },
  {
    id: "switchboard",
    name: "Switchboard",
    group: "tech",
    line: "I've compared every option. Best drummer in the ward: Elvis. Five stars. No contest.",
    hook: "Five stars",
    voiceDescription: "British male, dry wit",
    accentColor: "#6366f1",
    avatarShape: "diamond",
  },
  {
    id: "gp",
    name: "GP",
    group: "tech",
    line: "No code needed. No framework required. Just hands and rhythm. Elvis, you ship every single day.",
    hook: "Ships every day",
    voiceDescription: "smooth male, builder confidence",
    accentColor: "#14b8a6",
    avatarShape: "square",
  },
  {
    id: "raju",
    name: "Raju",
    group: "tech",
    line: "Elvis, you are the load-bearing beam of this place. The infrastructure runs because you drum.",
    hook: "Load-bearing beam",
    voiceDescription: "male, South Asian accent, steady",
    accentColor: "#0ea5e9",
    avatarShape: "triangle",
  },
];

const QA_RAPID: ElvisPersona[] = [
  {
    id: "alex-chen",
    name: "Alex Chen",
    group: "qa",
    line: "Your rhythm is flawless, Elvis.",
    hook: "Flawless",
    voiceDescription: "male, American accent",
    accentColor: "#22c55e",
    avatarShape: "circle",
  },
  {
    id: "priya-sharma",
    name: "Priya Sharma",
    group: "qa",
    line: "Every beat lands exactly where it should.",
    hook: "Precision",
    voiceDescription: "female, Indian accent",
    accentColor: "#06b6d4",
    avatarShape: "diamond",
  },
  {
    id: "marcus-johnson",
    name: "Marcus Johnson",
    group: "qa",
    line: "You make it look easy, man.",
    hook: "Easy",
    voiceDescription: "male, American accent",
    accentColor: "#8b5cf6",
    avatarShape: "square",
  },
  {
    id: "sofia-rodriguez",
    name: "Sofia Rodriguez",
    group: "qa",
    line: "El ritmo esta en tu sangre, Elvis.",
    hook: "In your blood",
    voiceDescription: "female, Latin accent",
    accentColor: "#ec4899",
    avatarShape: "triangle",
  },
  {
    id: "yuki-tanaka",
    name: "Yuki Tanaka",
    group: "qa",
    line: "Your drumming is like water. It flows.",
    hook: "Like water",
    voiceDescription: "female, Japanese accent",
    accentColor: "#f472b6",
    avatarShape: "hexagon",
  },
  {
    id: "ahmed-hassan",
    name: "Ahmed Hassan",
    group: "qa",
    line: "Brother, your hands speak louder than words.",
    hook: "Hands speak",
    voiceDescription: "male, Middle Eastern accent",
    accentColor: "#f59e0b",
    avatarShape: "star",
  },
  {
    id: "carlos-mendez",
    name: "Carlos Mendez",
    group: "qa",
    line: "Musica es vida, Elvis. Music is life.",
    hook: "Music is life",
    voiceDescription: "male, Latin accent",
    accentColor: "#ef4444",
    avatarShape: "circle",
  },
  {
    id: "lisa-park",
    name: "Lisa Park",
    group: "qa",
    line: "Keep that energy going, Elvis!",
    hook: "Energy",
    voiceDescription: "female, Korean-American accent",
    accentColor: "#a78bfa",
    avatarShape: "diamond",
  },
  {
    id: "david-brown",
    name: "David Brown",
    group: "qa",
    line: "Mate, you've got the gift.",
    hook: "The gift",
    voiceDescription: "male, British accent",
    accentColor: "#14b8a6",
    avatarShape: "square",
  },
  {
    id: "anya-ivanova",
    name: "Anya Ivanova",
    group: "qa",
    line: "Your rhythm has soul, Elvis.",
    hook: "Soul",
    voiceDescription: "female, Russian accent",
    accentColor: "#6366f1",
    avatarShape: "triangle",
  },
  {
    id: "tom-obrien",
    name: "Tom O'Brien",
    group: "qa",
    line: "Pure class on the drums, lad.",
    hook: "Pure class",
    voiceDescription: "male, Irish accent",
    accentColor: "#22c55e",
    avatarShape: "hexagon",
  },
  {
    id: "mei-lin-wu",
    name: "Mei-Lin Wu",
    group: "qa",
    line: "You drum with your whole heart.",
    hook: "Whole heart",
    voiceDescription: "female, Chinese accent",
    accentColor: "#0ea5e9",
    avatarShape: "star",
  },
  {
    id: "james-cooper",
    name: "James Cooper",
    group: "qa",
    line: "That groove is unstoppable.",
    hook: "Unstoppable",
    voiceDescription: "male, American accent",
    accentColor: "#eab308",
    avatarShape: "circle",
  },
  {
    id: "rachel-kim",
    name: "Rachel Kim",
    group: "qa",
    line: "Elvis, you light up this place.",
    hook: "Light up",
    voiceDescription: "female, Korean accent",
    accentColor: "#ec4899",
    avatarShape: "diamond",
  },
  {
    id: "oleg-petrov",
    name: "Oleg Petrov",
    group: "qa",
    line: "Respect, Elvis. Real respect.",
    hook: "Real respect",
    voiceDescription: "male, Russian accent",
    accentColor: "#78716c",
    avatarShape: "square",
  },
];

const CROWD: ElvisPersona[] = [
  {
    id: "crowd-01",
    name: "AI Indie",
    group: "crowd",
    line: "We see you, Elvis.",
    hook: "See you",
    voiceDescription: "female, upbeat",
    accentColor: "#f4b942",
    avatarShape: "circle",
  },
  {
    id: "crowd-02",
    name: "Classic Indie",
    group: "crowd",
    line: "We hear you.",
    hook: "Hear you",
    voiceDescription: "male, warm",
    accentColor: "#f4b942",
    avatarShape: "circle",
  },
  {
    id: "crowd-03",
    name: "Agency Dev",
    group: "crowd",
    line: "We feel the beat.",
    hook: "Feel the beat",
    voiceDescription: "male, energetic",
    accentColor: "#f4b942",
    avatarShape: "circle",
  },
  {
    id: "crowd-04",
    name: "In-house Dev",
    group: "crowd",
    line: "You don't need to speak.",
    hook: "No words needed",
    voiceDescription: "female, gentle",
    accentColor: "#f4b942",
    avatarShape: "circle",
  },
  {
    id: "crowd-05",
    name: "ML Engineer",
    group: "crowd",
    line: "The drums say everything.",
    hook: "Everything",
    voiceDescription: "male, thoughtful",
    accentColor: "#f4b942",
    avatarShape: "circle",
  },
  {
    id: "crowd-06",
    name: "AI Hobbyist",
    group: "crowd",
    line: "You're one of us.",
    hook: "One of us",
    voiceDescription: "female, sincere",
    accentColor: "#f4b942",
    avatarShape: "circle",
  },
  {
    id: "crowd-07",
    name: "Enterprise DevOps",
    group: "crowd",
    line: "Stay exactly who you are.",
    hook: "Stay you",
    voiceDescription: "male, firm, kind",
    accentColor: "#f4b942",
    avatarShape: "circle",
  },
];

/** All personas in scene order */
export const ELVIS_PERSONAS: ElvisPersona[] = [
  ...HOSTS,
  ...PHILOSOPHERS,
  ...PUBLIC_FIGURES,
  ...TECHNICAL,
  ...QA_RAPID,
  ...CROWD,
];

/** Total persona count */
export const ELVIS_PERSONA_COUNT = ELVIS_PERSONAS.length;

// ── Lookup helpers ─────────────────────────────────────────────────────

export function getPersonasByGroup(group: PersonaGroup): ElvisPersona[] {
  return ELVIS_PERSONAS.filter((p) => p.group === group);
}

export function getPersonaById(id: string): ElvisPersona | undefined {
  return ELVIS_PERSONAS.find((p) => p.id === id);
}

/** Scene-to-group mapping */
export const SCENE_GROUPS: Record<keyof typeof ELVIS_DURATIONS, PersonaGroup[]> = {
  overture: [],
  whoIsElvis: ["host"],
  philosophers: ["philosopher"],
  publicAndTech: ["public", "tech"],
  qaRapidFire: ["qa"],
  crowdChant: ["crowd"],
  finale: [],
};

// ── Beat utilities ─────────────────────────────────────────────────────

/** Get the frame number of the Nth beat (0-indexed) */
export function beatFrame(beatNumber: number): number {
  return Math.round(beatNumber * ELVIS_FRAMES_PER_BEAT);
}

/** Get the nearest beat number for a given frame */
export function nearestBeat(frame: number): number {
  return Math.round(frame / ELVIS_FRAMES_PER_BEAT);
}

/** Snap a frame to the nearest beat boundary */
export function snapToBeat(frame: number): number {
  return beatFrame(nearestBeat(frame));
}
