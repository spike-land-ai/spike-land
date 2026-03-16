# spike.land Music Creator App — PRD

**Version:** 0.1.0
**Status:** Draft
**Creative Director:** Daft Punk
**Build Lead:** Radix
**Reality Check:** Zoltan
**UX Provocateur:** Arnold
**Elegance Judge:** Erdos

---

## 1. Product Vision

### The Elevator Pitch

A browser-based music creation studio where AI understands both music theory
and groove. Built on spike.land's MCP infrastructure, running on the edge,
designed for constraint-based creativity. You open a URL. You make a beat.
You share it. No installs. No 2 GB sample packs. No PhD in Ableton required.

### The North Star

**"8 bars. 4 tracks. Make something you'd actually listen to."**

This is not a DAW replacement. This is the instrument that doesn't exist yet:
one where you describe what you hear in your head and the machine helps you
pull it out — then gets out of the way so you can shape it with your hands.

> **Daft Punk:** "Every instrument ever built was a constraint machine. A piano
> has 88 keys. A 303 has 16 steps. A TR-808 has 16 pads. Constraints are not
> limitations. Constraints are the instrument. We build the constraint. The
> human brings the soul."

> **Radix:** "Vision is cheap. What I need: Web Audio API runs in every modern
> browser. MCP tools handle the AI generation server-side. Durable Objects
> handle real-time sync for jam sessions. R2 stores samples. This is buildable
> with what we have. No new infrastructure required."

> **Zoltan:** "Let's look at the numbers. Browser-based DAWs have been tried —
> Soundtrap (acquired by Spotify), BandLab (80M users), Amped Studio. The ones
> that survived all found the same thing: the killer feature isn't the DAW
> functionality, it's the zero-friction entry. Nobody downloads Ableton to 'try
> making a beat.' But they will click a link. The question is: do we have
> something those don't? AI-native creation via MCP tools is that differentiator
> — if we execute."

> **Arnold:** "I visit the page. What do I see? If I see a blank grid with 47
> buttons, I'm gone. If I see a big pulsing button that says 'Start a Beat' and
> I hear something good in 3 seconds — now you've got me. The Entrance Test is
> everything here."

> **Erdos:** "The elegant formulation: music creation is a search problem in a
> high-dimensional space. The human has taste but limited search capacity. The
> AI has search capacity but no taste. The product is the interface between
> these two — and the interface should be as thin as possible. This is from
> The Book if the interface disappears."

---

## 2. The Core Experience

### 2.1 The 8-Bar Test

Every feature in this product must pass a single gate:

**"Does this help someone make a beat in 8 bars?"**

If the answer is no, it doesn't ship in v1. Period.

- Synthesizer presets? Yes — they let you pick a sound fast.
- Custom wavetable editor? No — that's a rabbit hole, not a beat.
- AI chord suggestions? Yes — they unstick you when you don't know theory.
- MIDI import? No — if you have MIDI files, you already have a DAW.
- Sharing a 15-second loop to a URL? Yes — that's the reward.

> **Daft Punk:** "Around the world, around the world. That track is one loop.
> One bassline, one vocal phrase, one groove. 8 bars is not a limitation. 8
> bars is a complete musical thought. If you can't say it in 8 bars, more bars
> won't help."

> **Arnold:** "The 8-Bar Test is also a UX test. If making 8 bars takes more
> than 5 minutes for a first-time user, the UI has failed. I want to see
> someone's grandma — okay maybe not grandma — but someone's 14-year-old
> cousin make something in 5 minutes. That's the bar."

### 2.2 The Loop — The Fundamental Unit

A **Loop** is the atomic unit of the music creator:

```
Loop {
  id: ULID
  name: string
  bpm: number              // 60–200, default 120
  bars: number             // 1–8, default 4
  timeSignature: [4, 4]    // numerator, denominator
  tracks: Track[]          // max 4 in v1
  created: timestamp
  author: userId
}
```

A Loop contains up to 4 **Tracks**. Each Track is one instrument/voice:

```
Track {
  id: ULID
  type: 'drums' | 'bass' | 'synth' | 'sample'
  instrument: InstrumentPatch
  pattern: StepPattern | PianoRollPattern
  effects: EffectChain
  volume: number           // 0–1
  pan: number              // -1 to 1
  mute: boolean
  solo: boolean
}
```

A **StepPattern** is a grid of steps (for drums and simple sequences):

```
StepPattern {
  steps: 16 | 32
  channels: Map<string, boolean[]>  // e.g., "kick" → [true, false, false, ...]
  velocity: Map<string, number[]>   // per-step velocity
}
```

A **PianoRollPattern** is a list of note events (for melodic parts):

```
PianoRollPattern {
  notes: Array<{
    pitch: number          // MIDI note 0–127
    start: number          // step position (float for swing)
    duration: number       // in steps
    velocity: number       // 0–127
  }>
}
```

> **Erdos:** "Four types of tracks. Two types of patterns. One container. This
> is the minimal complete basis. You can represent any genre with these
> primitives. Adding more types before proving these four work would be
> inelegant — adding structure before it's earned."

> **Radix:** "The data model serializes to JSON. Fits in a Durable Object.
> Fits in a URL parameter if we compress it. That means every loop is
> shareable as a link. No database required for casual use."

### 2.3 The Grid — Visual Sequencer

The Grid is the primary creation interface. It is a step sequencer with
contextual behavior:

**For Drums:**
- 16-step grid (or 32 for double-time resolution)
- Rows = drum sounds (kick, snare, hi-hat, clap, etc.)
- Click to toggle. Long-press for velocity.
- Drag to paint multiple steps.

**For Bass/Synth:**
- Piano roll view (pitch on Y-axis, time on X-axis)
- Click to place a note. Drag to set duration.
- Snap-to-scale mode (only show notes in the current key)

**For Samples:**
- Waveform view with slice markers
- Each slice maps to a step in the grid
- Click a step to trigger that slice

**Grid Controls (always visible):**
- Play / Stop (spacebar)
- BPM (tap tempo or type)
- Swing (0–100%)
- Track selector (4 colored tabs)

> **Arnold:** "The grid must be touchable. Fat finger friendly. Works on an
> iPad, works on a phone in landscape. If I can't tap out a kick pattern on
> my phone while riding the bus, the grid has failed. No hover states as
> primary interactions. No tiny click targets. The minimum tap target is 44px."

> **Daft Punk:** "The grid is not a spreadsheet. The grid breathes. When a step
> is active and playing, it pulses. The playhead sweeps. The colors map to
> energy — kicks are deep blue, snares are white flash, hi-hats are gold
> shimmer. You should be able to 'read' the groove by looking at the grid,
> the way a conductor reads a score."

> **Zoltan:** "Rendering a 16-step grid with animations at 60fps while
> running Web Audio is the real technical challenge. requestAnimationFrame
> synced to the audio clock. This is a solved problem — Tone.js Transport
> does it — but it needs to be the first thing we prototype, not the last."

### 2.4 The Mix — Combining Loops Into Tracks

v1 keeps this dead simple: **a Loop IS a track.** You don't arrange loops
on a timeline. You make a loop, it plays, you share it.

v2 introduces the **Arrangement View:**
- Horizontal timeline
- Each row is a loop
- Drag loops onto the timeline to arrange them
- Simple intro/outro/verse/chorus structure

> **Zoltan:** "Every browser DAW that tried to ship a full arrangement view
> in v1 got bogged down. Soundtrap took years. We ship the loop. We validate
> that people actually make beats. Then we ship arrangement. In that order."

> **Erdos:** "A loop is a fixed point in the composition space. The
> arrangement is a sequence of fixed points. You must find the fixed points
> before you can sequence them. The mathematical order is correct."

---

## 3. MCP Tools to Build

These are the MCP tools that power the AI side of the music creator. Each
tool runs as a Cloudflare Worker, callable from the Tool Playground or from
the music creator UI.

### 3.1 `music_synth_create`

**Purpose:** Generate a synthesizer patch from a natural language description.

**Input:**
```json
{
  "description": "warm analog bass, like a Moog with slight overdrive",
  "type": "bass" | "lead" | "pad" | "keys" | "fx",
  "format": "tone_js"
}
```

**Output:**
```json
{
  "patch": {
    "oscillator": { "type": "sawtooth" },
    "filter": { "type": "lowpass", "frequency": 800, "Q": 2 },
    "envelope": { "attack": 0.01, "decay": 0.3, "sustain": 0.4, "release": 0.2 },
    "effects": [{ "type": "distortion", "amount": 0.3 }]
  },
  "name": "Warm Moog Bass",
  "preview_url": "https://r2.spike.land/previews/abc123.mp3"
}
```

**Implementation:** Maps descriptions to Tone.js Synth/FMSynth/AMSynth
parameters via an LLM with a curated set of reference patches as few-shot
examples. The LLM doesn't generate audio — it generates parameter configs
that the client-side synth engine renders.

> **Daft Punk:** "This is the tool that makes us different. Nobody else lets
> you say 'give me a sound like a robot crying in a cathedral' and get a
> playable synth patch in 200ms. The speed is everything. Describe. Hear.
> Tweak. Describe again. The loop between imagination and sound must be
> instant."

> **Radix:** "LLM inference for parameter generation is fast — no audio
> generation on the server, no ONNX models, no GPU. The output is a JSON
> config. The client renders it. This is a 50ms tool call on Workers AI or
> a proxied Anthropic call."

### 3.2 `music_beat_generate`

**Purpose:** Generate a drum pattern from a genre/style description.

**Input:**
```json
{
  "style": "boom bap hip hop with lazy swing",
  "bpm": 90,
  "bars": 4,
  "complexity": 0.6,
  "kit": "808" | "acoustic" | "electronic" | "lo-fi"
}
```

**Output:**
```json
{
  "pattern": {
    "steps": 16,
    "channels": {
      "kick":  [1,0,0,0, 0,0,1,0, 0,0,0,0, 1,0,0,0],
      "snare": [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      "hihat": [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,1],
      "clap":  [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1]
    },
    "swing": 0.15,
    "ghost_notes": { "hihat": [0,0,0.3,0, 0,0,0.3,0, 0,0,0.3,0, 0,0,0.3,0] }
  },
  "name": "Lazy Boom Bap"
}
```

**Implementation:** LLM-based pattern generation with music-theory-aware
prompting. The key insight: drum patterns are small, discrete, and
well-structured — perfect for LLM generation. A curated library of 200+
reference patterns across genres provides few-shot grounding.

> **Daft Punk:** "The ghost notes. The swing. That's where the groove lives.
> A pattern without ghost notes is a metronome. The AI must understand that
> the notes you DON'T hear are as important as the ones you do."

> **Zoltan:** "200 reference patterns is the minimum viable training set.
> We can crowdsource more from users who opt in. But let's not pretend the
> AI will invent new genres on day one. It will interpolate between known
> patterns. That's fine. That's useful."

### 3.3 `music_sample_search`

**Purpose:** Find audio samples matching a description from curated
royalty-free libraries.

**Input:**
```json
{
  "query": "vinyl crackle ambient texture",
  "type": "one_shot" | "loop" | "texture",
  "bpm_range": [85, 95],
  "key": "Am",
  "limit": 5
}
```

**Output:**
```json
{
  "results": [
    {
      "id": "sample_xyz",
      "name": "Dusty Vinyl Crackle 01",
      "url": "https://r2.spike.land/samples/dusty-vinyl-01.wav",
      "bpm": 0,
      "duration_ms": 4200,
      "tags": ["texture", "vinyl", "ambient", "lo-fi"],
      "license": "cc0"
    }
  ]
}
```

**Implementation:** Semantic search over a sample library stored in R2
with metadata in D1. Embeddings generated at upload time. v1 starts with
a curated CC0 library (~500 samples). Users can upload their own samples
to their personal R2 bucket.

> **Radix:** "We need a sample ingestion pipeline. Upload → transcode to
> standard format (44.1kHz/16-bit WAV + MP3 preview) → generate embedding
> → store metadata in D1 → store file in R2. This is a Worker + Queue."

> **Arnold:** "The search results must be audible. Hover to preview. No
> clicking through to a detail page. No 'add to cart' flow. Hover. Hear.
> Drag to track. Three actions from search to music."

### 3.4 `music_chord_suggest`

**Purpose:** Suggest chord progressions given a key, style, and optional
starting chord.

**Input:**
```json
{
  "key": "C minor",
  "style": "dark electronic",
  "bars": 4,
  "starting_chord": "Cm",
  "complexity": 0.5
}
```

**Output:**
```json
{
  "progression": [
    { "chord": "Cm", "bar": 1, "voicing": [48, 51, 55, 60] },
    { "chord": "Ab", "bar": 2, "voicing": [44, 48, 51, 56] },
    { "chord": "Eb", "bar": 3, "voicing": [43, 46, 51, 55] },
    { "chord": "Bb", "bar": 4, "voicing": [46, 50, 53, 58] }
  ],
  "scale": "C natural minor",
  "theory_note": "i → VI → III → VII — classic minor progression with stepwise bass motion"
}
```

**Implementation:** Deterministic music theory engine (no LLM needed for
basic progressions) with LLM augmentation for style-specific voicings and
non-standard progressions. The theory engine handles the grammar; the LLM
handles the style.

> **Erdos:** "Music theory IS mathematics. Chord progressions are paths in
> a graph where nodes are chords and edges are voice-leading distances. The
> 'best' progression minimizes total voice-leading distance while satisfying
> style constraints. This has an elegant algorithmic solution — we should
> not waste LLM calls on what graph search can do better."

> **Daft Punk:** "But the best progressions break the rules. 'Get Lucky'
> uses Bm–D–F#m–E. Textbook says the F#m→E is weak. The groove says
> otherwise. The AI must know the rules well enough to break them with
> taste."

### 3.5 `music_effect_chain`

**Purpose:** Build an audio effects chain from a description or preset name.

**Input:**
```json
{
  "description": "dreamy reverb with tape delay and gentle compression",
  "target": "synth_pad",
  "format": "tone_js"
}
```

**Output:**
```json
{
  "chain": [
    {
      "type": "compressor",
      "params": { "threshold": -20, "ratio": 2, "attack": 0.1, "release": 0.3 }
    },
    {
      "type": "delay",
      "params": { "delayTime": "8n.", "feedback": 0.4, "wet": 0.3 }
    },
    {
      "type": "reverb",
      "params": { "decay": 4.5, "preDelay": 0.05, "wet": 0.5 }
    }
  ],
  "name": "Dreamy Tape Space"
}
```

> **Radix:** "Same architecture as synth_create — LLM generates Tone.js
> parameters, client renders. No server-side audio processing. All effects
> run in the browser via Web Audio API."

### 3.6 `music_mix_master`

**Purpose:** Analyze a multi-track loop and suggest volume, pan, and EQ
settings for a balanced mix.

**Input:**
```json
{
  "loop_id": "loop_abc123",
  "tracks": [
    { "id": "t1", "type": "drums", "peak_db": -6 },
    { "id": "t2", "type": "bass", "peak_db": -8 },
    { "id": "t3", "type": "synth", "peak_db": -12 },
    { "id": "t4", "type": "sample", "peak_db": -10 }
  ],
  "style": "loud and punchy"
}
```

**Output:**
```json
{
  "mix": [
    { "track_id": "t1", "volume": 0.85, "pan": 0, "eq": { "low": 1, "mid": -2, "high": -1 } },
    { "track_id": "t2", "volume": 0.9, "pan": 0, "eq": { "low": 2, "mid": 0, "high": -3 } },
    { "track_id": "t3", "volume": 0.6, "pan": 0.3, "eq": { "low": -4, "mid": 1, "high": 2 } },
    { "track_id": "t4", "volume": 0.5, "pan": -0.3, "eq": { "low": -2, "mid": 0, "high": 1 } }
  ],
  "master": {
    "limiter_threshold": -1,
    "target_lufs": -14
  }
}
```

**Implementation:** Rule-based mixing engine with LLM style interpretation.
Frequency spectrum analysis runs client-side (Web Audio AnalyserNode),
results sent to the tool, which returns mix decisions. No audio leaves the
browser.

> **Zoltan:** "Auto-mixing is a nice-to-have for v1. The real mixing
> feature for v1 is: four volume faders that are big enough to actually
> use. Don't over-engineer this."

### 3.7 `music_loop_remix`

**Purpose:** Take an existing loop and create a variation.

**Input:**
```json
{
  "loop_id": "loop_abc123",
  "variation": "double_time" | "half_time" | "strip_down" | "build_up" | "glitch",
  "intensity": 0.7
}
```

**Output:** A new Loop object with modified patterns.

> **Daft Punk:** "This is how you go from a loop to a track. The verse is the
> loop. The chorus is the build_up variation. The bridge is the strip_down.
> The drop is double_time at intensity 1.0. Variations are the vocabulary
> of arrangement."

### 3.8 `music_export`

**Purpose:** Render a loop to an audio file.

**Input:**
```json
{
  "loop_id": "loop_abc123",
  "format": "wav" | "mp3" | "stems",
  "quality": "high" | "preview"
}
```

**Output:**
```json
{
  "url": "https://r2.spike.land/exports/loop_abc123.wav",
  "duration_ms": 8000,
  "file_size_bytes": 1411200
}
```

**Implementation:** Client-side offline rendering via Web Audio
`OfflineAudioContext`. The rendered buffer is uploaded to R2. For stems
export, each track is rendered separately.

> **Radix:** "Offline rendering happens in the browser. No server-side
> audio processing. The Worker's only job is to receive the blob and
> store it in R2. This keeps compute costs at zero for audio rendering."

---

## 4. Technical Architecture

### 4.1 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser Client                        │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │   Grid   │  │  Synth   │  │  Mixer   │  │  AI Chat   │  │
│  │    UI    │  │  Engine  │  │   UI     │  │  (Personas)│  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│       │              │             │               │         │
│  ┌────┴──────────────┴─────────────┴───────────────┴──────┐  │
│  │              Web Audio API / Tone.js                    │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           │                                  │
│  ┌────────────────────────┴───────────────────────────────┐  │
│  │              Loop State Manager (Zustand)               │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
     ┌──────────────┐ ┌──────────┐ ┌──────────────┐
     │  MCP Tools   │ │  Durable │ │      R2      │
     │  (Workers)   │ │  Objects │ │   (Samples   │
     │              │ │  (Jam    │ │    & Exports) │
     │ synth_create │ │  Session)│ │              │
     │ beat_generate│ │          │ │              │
     │ chord_suggest│ │          │ │              │
     │ effect_chain │ │          │ │              │
     │ mix_master   │ │          │ │              │
     │ sample_search│ │          │ │              │
     └──────────────┘ └──────────┘ └──────────────┘
```

### 4.2 Client-Side Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| UI Framework | React (spike-app) | Grid, mixer, controls |
| Audio Engine | Tone.js | Synthesis, sequencing, effects |
| State | Zustand | Loop state, undo/redo, serialization |
| Rendering | Canvas 2D | Grid visualization, waveforms, meters |
| Routing | TanStack Router | `/music`, `/music/:loopId`, `/music/jam/:sessionId` |

**Why Tone.js:** It wraps Web Audio API with music-aware abstractions
(Transport, Synth, Sequence, Effect). Building from raw Web Audio would
take 3x longer and produce worse scheduling. Tone.js is 73KB gzipped.

**Why Canvas 2D (not DOM):** The step grid with per-step animations at
60fps would thrash the DOM. A single Canvas with requestAnimationFrame
synced to `Tone.Transport` gives smooth playhead sweep and pulse
animations without layout recalculations.

> **Radix:** "Tone.js is the right call. It handles the clock-sync problem
> that every DIY implementation gets wrong. AudioContext scheduling is
> subtle — you schedule events ahead of time, not in real-time. Tone.js
> abstracts this. We focus on the product, not the plumbing."

> **Zoltan:** "73KB gzipped for Tone.js. Our total music creator JS budget
> should be under 200KB gzipped for initial load. That means we lazy-load
> Tone.js after the first user interaction (which is also when we can
> create the AudioContext — browsers require a user gesture). Good
> alignment between technical constraint and UX requirement."

### 4.3 Audio Engine Architecture

```typescript
// Core audio engine interface
interface AudioEngine {
  // Transport
  play(): void;
  stop(): void;
  setBpm(bpm: number): void;
  setSwing(amount: number): void;

  // Tracks
  loadTrack(track: Track): void;
  updatePattern(trackId: string, pattern: StepPattern | PianoRollPattern): void;
  setTrackVolume(trackId: string, volume: number): void;
  setTrackPan(trackId: string, pan: number): void;
  muteTrack(trackId: string): void;
  soloTrack(trackId: string): void;

  // Instruments
  loadInstrument(trackId: string, patch: InstrumentPatch): void;
  triggerNote(trackId: string, note: number, velocity: number): void;

  // Effects
  setEffectChain(trackId: string, chain: EffectChain): void;

  // Analysis
  getTrackLevel(trackId: string): number;
  getMasterLevel(): number;

  // Export
  renderOffline(loop: Loop): Promise<AudioBuffer>;
}
```

The engine is a thin facade over Tone.js objects. Each Track maps to a
Tone.js instrument + Tone.js Sequence/Part + Tone.js effects chain.

### 4.4 Real-Time Collaboration (Jam Sessions)

Jam sessions use Durable Objects — the same infrastructure spike.land
already uses for real-time code collaboration.

**Session Model:**
```typescript
interface JamSession {
  id: string;
  loop: Loop;                          // shared loop state
  participants: Map<string, {
    userId: string;
    name: string;
    assignedTrack: number | null;      // 0–3 or null (spectator)
    cursor: { step: number; channel: string } | null;
  }>;
  chat: Message[];
  bpm: number;
  playing: boolean;
}
```

**Sync Protocol:**
- Durable Object holds the authoritative loop state
- Participants send granular edits (toggle step, change note, adjust volume)
- DO broadcasts edits to all participants via WebSocket
- Optimistic local updates with server reconciliation
- Conflict resolution: last-write-wins per step/note (music is forgiving
  — a slightly wrong note is better than a conflict dialog)

**Track Ownership:**
- When you join a jam, you claim a track (drums, bass, synth, or sample)
- Only you can edit your track's pattern
- Anyone can adjust the mix (volume, pan, effects)
- This avoids edit conflicts entirely for the core creative action

> **Daft Punk:** "A jam session is a conversation. Each person speaks on
> their instrument. You don't interrupt — you play your part. Track
> ownership is not a technical constraint. It's how bands work."

> **Erdos:** "Partition the edit space by track. Each partition has exactly
> one writer. Reads are global. This eliminates conflict resolution entirely
> for the write path. Elegant."

> **Arnold:** "I join a jam. I see 4 tracks, 3 are claimed, one is pulsing
> 'join here.' I tap it. I'm in. I hear what everyone else is playing. I
> start adding my part. No lobby. No 'waiting for host.' The music is
> already playing when I arrive."

### 4.5 Storage Architecture

| Data | Storage | Reason |
|------|---------|--------|
| Loop JSON (< 10KB) | Durable Object + KV cache | Fast read, real-time sync |
| Audio samples (WAV) | R2 | Large binary, CDN-friendly |
| Sample metadata | D1 | Searchable, relational |
| User loops (listing) | D1 | Query by user, sort by date |
| Exported audio files | R2 | Large binary, shareable URLs |
| Jam session state | Durable Object | Real-time, transient |

### 4.6 Routes

```
/music                    → Music creator home (new loop or recent loops)
/music/new                → New empty loop
/music/:loopId            → Open existing loop
/music/:loopId/edit       → Edit mode for a loop
/music/jam/new            → Create a new jam session
/music/jam/:sessionId     → Join a jam session
/music/explore            → Browse public loops
```

---

## 5. The Daft Punk Touch

### 5.1 Personality-Driven Creation

The music creator has a dedicated AI chat sidebar (collapsible) where
you talk to the Daft Punk persona. This isn't a generic chatbot — it's
a creative collaborator that:

- Responds to descriptions with generated patterns and patches
- Suggests changes based on what it hears ("Your hi-hat pattern is too
  busy for the tempo. Try pulling back to quarter notes.")
- Teaches music theory in context ("That's a tritone substitution.
  Coltrane used this on Giant Steps.")
- Has opinions ("The snare on beat 3 is fighting the kick. Move it to
  the and-of-2.")

**Implementation:** The Daft Punk persona in the existing AI chat system,
augmented with music-specific tool calls. When the user says "make the
bass warmer," the persona calls `music_synth_create` and applies the
result. The persona has access to the current loop state as context.

> **Daft Punk:** "I am not a chatbot. I am your collaborator. I listen.
> I suggest. I never force. If you say 'I want it to sound like midnight
> in Tokyo,' I know what that means — minor key, slow tempo, reverb for
> days, a Rhodes piano. I translate emotion into parameters."

> **Zoltan:** "The persona needs the current loop state as context. That's
> a JSON blob < 10KB per message. Well within context limits. The key
> risk is latency — the user changes a note, asks 'how does this sound,'
> and the AI needs to understand the current state. We solve this by
> injecting the loop state as a system message on each turn."

### 5.2 Constraint-Based Creativity

The product enforces creative constraints by default:

| Constraint | Default | Why |
|-----------|---------|-----|
| Tracks | 4 max | Forces focus. If you can't make it work in 4, you won't make it work in 40. |
| Bars | 8 max | Forces conciseness. Complete the musical thought. |
| BPM | Fixed per loop | No tempo automation in v1. Pick a tempo, commit. |
| Key | One key per loop | No key changes in v1. Constraint breeds melody. |
| Sounds per drum kit | 8 | Enough for a full kit, not enough to get lost. |

These constraints are not bugs. They are the product.

> **Daft Punk:** "When we made 'Da Funk,' we had a 303, a 909, and a
> sampler. Three machines. One of the best basslines in electronic music
> came from three machines. The constraint was the creative director."

> **Arnold:** "Constraints also solve a UX problem. Fewer options means
> fewer buttons. Fewer buttons means less confusion. A 4-track limit
> means the screen layout is fixed and predictable. No scrolling through
> 64 tracks. Everything fits on one screen."

### 5.3 The Shareable Loop

Every loop gets a URL: `spike.land/music/01JQXYZ...`

When someone opens that URL:
1. The loop plays immediately (after a tap to satisfy autoplay policy)
2. They see the grid animating
3. A "Remix" button lets them fork the loop and edit their own version
4. A "Jam" button lets them start a session based on this loop

The loop URL is the viral mechanic. People share sounds, not screenshots.

> **Arnold:** "The share page is a full-screen player. Not a detail page
> with metadata and comments and related content. Full screen. The grid.
> The sound. Two buttons: Remix and Jam. That's it. The Screenshot Test:
> if someone screenshots this and posts it, is it visually interesting?
> An animated grid with colored pulses — yes. A form with text fields —
> absolutely not."

### 5.4 Live Performance Mode

A stretch goal, but worth specifying: a mode where the grid becomes a
live instrument.

- The 16 pads of the drum track become triggerable in real-time
- A keyboard appears for melodic tracks
- Effects parameters are mappable to on-screen XY pads
- The Durable Object broadcasts your performance to spectators

> **Daft Punk:** "Alive 2007. The pyramid. Every sound was triggerable.
> Every effect was controllable. That is the North Star for performance
> mode. You are not pressing play. You are playing."

---

## 6. Monetization

### 6.1 Revenue Model

| Tier | Price | What You Get |
|------|-------|-------------|
| **Free** | $0 | 3 loops saved, 4 tracks, basic sounds, 10 AI generations/day |
| **Creator** | $9/mo | Unlimited loops, all sounds, unlimited AI, export WAV/MP3, 5 jam sessions |
| **Pro** | $29/mo | Everything + stem export, priority AI, custom sample upload (5GB), unlimited jams, API access |

### 6.2 Revenue Drivers

**AI Tool Credits:** Each MCP tool call costs compute. Free users get 10/day.
Paid users get more. This aligns cost with value — power users who generate
100 beat patterns a day are getting $29/mo of value.

**Sample Marketplace (v2):** Users upload sample packs. spike.land takes 20%.
Payments via existing Stripe integration.

**Jam Session Premium:** Free users can join jams. Only paid users can host.
This creates a natural upgrade path: your friend invites you to a jam, you
love it, you want to host your own.

> **Zoltan:** "The unit economics: Workers AI inference costs ~$0.001 per
> tool call. At 100 calls/day, a Pro user costs us $3/mo in AI compute.
> R2 storage is $0.015/GB/month — 5GB costs $0.075/mo. Even with
> bandwidth, a Pro user at $29/mo has 85%+ gross margin. The math works."

> **Radix:** "Stripe is already integrated. The subscription tiers map to
> the existing payment infrastructure. We add a `plan` field to the user
> object and gate tool calls accordingly. The middleware already exists in
> mcp-auth."

> **Erdos:** "The pricing structure has a nice property: each tier is
> roughly 3x the previous tier in price and roughly 10x in capability.
> That's the correct ratio for a freemium creative tool — generous free
> tier for adoption, steep value curve for conversion."

---

## 7. The First 14 Days

A day-by-day build plan. Each day has a clear deliverable. Each deliverable
is testable.

### Day 1: Audio Foundation
- Set up Tone.js in spike-app
- Create AudioEngine class with play/stop/setBpm
- Hard-code a 4-on-the-floor kick pattern
- **Test:** Press play, hear kick at 120 BPM. Press stop, silence.

### Day 2: Step Sequencer Grid (Drums)
- Canvas-based 16-step grid, 4 rows (kick, snare, hihat, clap)
- Click to toggle steps
- Wire grid to AudioEngine
- **Test:** Click steps, press play, hear your pattern.

### Day 3: Drum Sounds + Kit Selection
- Load 3 drum kits (808, acoustic, electronic) from R2
- Kit selector dropdown
- Per-step velocity (long-press on mobile, right-click on desktop)
- **Test:** Switch kits, hear different sounds. Adjust velocity, hear dynamics.

### Day 4: Bass Track (Piano Roll)
- Add piano roll view for bass track
- Snap-to-scale (C minor default)
- Basic Tone.js MonoSynth for bass
- **Test:** Draw a bassline, hear it play with the drums.

### Day 5: Synth Track + Effects
- Add synth track with FMSynth
- Basic effect chain: reverb + delay (hardcoded)
- 3 synth presets (pad, lead, keys)
- **Test:** Layer a synth pad over drums + bass. Apply reverb. Sounds like music.

### Day 6: MCP Tool — `music_beat_generate`
- Implement the MCP tool on Workers
- Add "Generate Beat" button in drum track
- Style input field + complexity slider
- **Test:** Type "trap hi-hats," get a trap pattern, hear it play.

### Day 7: MCP Tool — `music_synth_create`
- Implement the MCP tool on Workers
- Add "Describe Sound" input in synth/bass tracks
- Generated patch loads into Tone.js
- **Test:** Type "warm pad with chorus," get a synth patch, play notes with it.

### Day 8: MCP Tool — `music_chord_suggest`
- Implement the MCP tool on Workers
- Add "Suggest Chords" button in synth track
- Suggested progression auto-populates the piano roll
- **Test:** Get a chord progression, hear it play, sounds musical.

### Day 9: Mix & Master
- Volume faders for each track (big, touchable)
- Pan knobs
- Simple master compressor/limiter
- MCP tool `music_mix_master` for auto-mix suggestions
- **Test:** Adjust mix, export sounds balanced.

### Day 10: Loop State & Persistence
- Zustand store for loop state
- Serialize to JSON, store in KV/D1
- Save/load loops
- URL-based loop sharing (`/music/:loopId`)
- **Test:** Make a loop, close browser, reopen URL, loop is there.

### Day 11: Share Page
- Full-screen loop player at `/music/:loopId`
- Animated grid visualization
- Remix button (fork the loop)
- **Test:** Share a URL, recipient hears the loop, can remix it.

### Day 12: Jam Sessions
- Durable Object for jam session state
- WebSocket connection for real-time sync
- Track claiming UI
- Broadcast pattern edits to all participants
- **Test:** Two browsers, one jam. Each edits their track. Both hear everything.

### Day 13: Daft Punk Persona Integration
- Wire music MCP tools to Daft Punk persona in AI chat
- Inject loop state as context
- Natural language loop editing ("make the hi-hats busier")
- **Test:** Tell Daft Punk "add a boom bap beat," see it appear in the grid.

### Day 14: Polish & Launch Prep
- Mobile layout optimization (touch targets, landscape mode)
- Loading states and error handling
- Export to WAV/MP3 (OfflineAudioContext → R2)
- Free tier limits (3 saved loops, 10 AI calls/day)
- **Test:** End-to-end flow on mobile. Make a beat, save it, share it, jam with a friend.

> **Radix:** "14 days. 14 deliverables. Each one builds on the last. Each one
> is independently testable. No day depends on an unfinished deliverable from
> a future day. This is a topological sort of the dependency graph. It ships."

> **Daft Punk:** "Day 1, you hear a kick drum. Day 14, you're jamming with
> friends over a URL. Every day between is a step closer to the music. The
> build order follows the order of the music: rhythm first, melody second,
> harmony third, arrangement fourth, collaboration fifth."

> **Zoltan:** "14 days is aggressive for a solo developer. Realistic for a
> pair. The risk days are 2 (Canvas grid performance), 12 (Durable Object
> sync), and 13 (persona integration with tool chaining). If any of those
> slip, cut Day 14's polish and ship rough."

> **Arnold:** "I want a user test on Day 5. Not Day 14. Day 5 is when you
> first have drums + bass + synth. That's when you can put it in front of
> someone and see if they can make something. If they can't, Days 6–14 are
> building on a broken foundation."

> **Erdos:** "The plan has the structure of a constructive proof: each day
> establishes a lemma that subsequent days depend on. The base case (Day 1)
> is sound. The inductive step is clear. The proof is complete on Day 14.
> This is from The Book."

---

## Appendix A: Competitive Landscape

| Product | Strength | Weakness | Our Angle |
|---------|----------|----------|-----------|
| BandLab | 80M users, social | Bloated, slow, tries to be Ableton | We're fast. 8 bars, not 8 minutes. |
| Soundtrap | Spotify backing, education | Feels like homework | We have personality. Talk to Daft Punk. |
| Amped Studio | Full DAW in browser | Ugly, complex, no AI | AI-native from day 1. |
| Suno/Udio | AI generates full songs | No control, no creation | We augment, not replace. You make the music. |
| Splice | Great samples | Not a creation tool | We use samples as raw material, not the product. |

> **Daft Punk:** "Suno generates songs. We generate instruments. That is the
> difference. Suno is a jukebox. We are a workshop. In our workshop, you pick
> up the tools and build something with your hands. The AI sharpens the tools.
> But the hands are yours."

---

## Appendix B: Sample MCP Tool Schemas (Zod)

```typescript
import { z } from "zod";

// music_beat_generate
export const MusicBeatGenerateInput = z.object({
  style: z.string().describe("Genre/style description, e.g. 'boom bap hip hop'"),
  bpm: z.number().min(60).max(200).default(120),
  bars: z.number().min(1).max(8).default(4),
  complexity: z.number().min(0).max(1).default(0.5),
  kit: z.enum(["808", "acoustic", "electronic", "lo-fi"]).default("808"),
});

// music_synth_create
export const MusicSynthCreateInput = z.object({
  description: z.string().describe("Natural language synth description"),
  type: z.enum(["bass", "lead", "pad", "keys", "fx"]),
  format: z.literal("tone_js").default("tone_js"),
});

// music_chord_suggest
export const MusicChordSuggestInput = z.object({
  key: z.string().describe("Key signature, e.g. 'C minor'"),
  style: z.string().describe("Musical style context"),
  bars: z.number().min(1).max(8).default(4),
  starting_chord: z.string().optional(),
  complexity: z.number().min(0).max(1).default(0.5),
});

// music_effect_chain
export const MusicEffectChainInput = z.object({
  description: z.string().describe("Effect chain description"),
  target: z.enum(["drums", "bass", "synth", "sample", "master"]),
  format: z.literal("tone_js").default("tone_js"),
});
```

---

## Appendix C: Open Questions

1. **Sample licensing:** Do we curate a CC0 library, license from a provider
   (e.g., Splice API), or both? Budget implications.

2. **Offline support:** Service worker for offline loop editing? The audio
   engine runs client-side, so this is feasible. But sample loading needs
   a cache strategy.

3. **MIDI controller support:** Web MIDI API exists. Supporting external
   controllers is a differentiator for serious users. Scope for v2?

4. **Audio recording:** Can we capture microphone input as a sample track?
   MediaRecorder API is ready. But it opens a can of permission and quality
   worms.

5. **Latency targets:** Web Audio has inherent latency (128–1024 samples
   depending on buffer size). For playback this is fine. For live
   performance mode, we may need to tune `AudioContext.latencyHint`.

> **Zoltan:** "These are all v2 questions. Ship the loop maker. See if
> people use it. Then ask these questions with data."

---

*This PRD was written by five personas arguing in a room until the music
started playing. The music is what matters. Everything else is just
engineering.*

> **Daft Punk:** "Work it. Make it. Do it. Makes us."

> **Radix:** "Spec complete. Building."

> **Zoltan:** "The numbers check out. Conditionally."

> **Arnold:** "Show me the prototype on Day 5. We'll talk."

> **Erdos:** "This is from The Book."
