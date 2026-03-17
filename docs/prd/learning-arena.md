# Learning Arena — The Open Learning Platform

> **Duolingo gamifies drills. Brilliant gamifies puzzles. spike.land gamifies
> building things with domain experts as mentors. Different category. And free.**

**Status:** Draft — executable blueprint
**Date:** 2026-03-17
**Authors:** The Arena (Erdős, Zoltán, Einstein, Daft Punk, GP, Arnold, Peti)

---

## 1. Why This Kills Duolingo and Brilliant

| Platform | Model | What it teaches | How it teaches | Cost |
|----------|-------|----------------|----------------|------|
| **Duolingo** | Gamified drills | Language vocabulary | Spaced repetition + streaks | Free + $8/mo premium |
| **Brilliant** | Interactive puzzles | Math + science concepts | Visual problem sets | $25/mo |
| **spike.land** | Persona mentors + PRDs | How to build anything | Build it, with an expert watching | **Free** (shared token pool) |

The gap: Duolingo teaches you French words. Brilliant teaches you calculus
concepts. Neither teaches you to **build something real** with what you learned.

spike.land's Learning Arena puts you in a room with Einstein to learn physics
*by building a simulation*. With Erdős to learn graph theory *by solving a
real problem*. With GP to learn how to ship an app *by actually shipping one*.

The learning IS the building. The mentor IS the persona. The test IS the
working artifact.

---

## 2. Architecture: PRD-Driven Learning

### The Insight

Every PRD is already a lesson plan:

```
PRD                     → Lesson
Problem Statement       → "Why should I care?"
Hypothesis              → "What will I learn?"
Success Criteria        → "How will I know I learned it?"
The Content             → The lesson itself
"Your Turn" prompts     → Exercises
Falsifiability Gate     → Critical thinking
personaPrompts          → Visual aids (generated dynamically)
```

No new infrastructure needed. Blog posts in PRD format ARE the curriculum.

### The Universal PRD Runner

Every URL on spike.land can become a learning experience:

```
spike.land/learn/physics          → Einstein teaches relativity via thought experiments
spike.land/learn/mathematics      → Erdős teaches graph theory via problems
spike.land/learn/music-production → Daft Punk teaches synthesis via the /music page
spike.land/learn/ship-an-app      → GP teaches requirements via building GlassBank
spike.land/learn/backend          → Raju teaches infrastructure via spike.land's own architecture
spike.land/learn/ux               → Arnold teaches design by roasting your UI
spike.land/learn/testing          → Peti teaches QA by finding bugs in your code
spike.land/learn/privacy          → Switchboard teaches consumer rights via real comparisons
```

The URL determines the persona. The persona determines the teaching style.
The PRD format determines the lesson structure.

### Content Generation from PRDs

```
GET /learn/:topic
  → Look up topic in PRD registry (src/prd-registry/)
  → Select matching persona(s)
  → Generate lesson from PRD structure:
      1. Hook (problem statement — why should I care?)
      2. Concept (the core idea, explained by persona)
      3. Interactive exercise (build/solve/create something)
      4. Verification (did the artifact work?)
      5. Next steps (related topics)
  → Hero image generated per-persona from shared token pool
  → No auth needed
```

---

## 3. Features

### Feature 1: Topic Explorer

A browsable topic graph. Each node is a concept. Each edge is a prerequisite.

```
Physics
  ├── Thought Experiments (Einstein)
  │   ├── Special Relativity
  │   └── General Relativity
  ├── Quantum Mechanics (Einstein + Erdős)
  └── Entrainment (Einstein + Daft Punk)

Mathematics
  ├── Graph Theory (Erdős)
  ├── Probabilistic Method (Erdős)
  ├── Strange Loops (Zoltán)
  └── Fixed-Point Theorems (Zoltán + Erdős)

Building Apps
  ├── Writing a PRD (GP)
  ├── MCP Tools as Requirements (GP)
  ├── Testing Your Business Logic (Peti)
  └── Shipping Without Being a Developer (GP)

Music Production
  ├── Synthesis Basics (Daft Punk)
  ├── Sidechain Compression (Daft Punk)
  ├── The 8-Bar Test (Daft Punk + Zoltán)
  └── Music as Physics (Einstein + Daft Punk)
```

**Implementation:** Static Astro page at `/learn`. Topic data from PRD registry.
Each topic links to its lesson page. No database needed — the PRD registry IS
the curriculum database.

**Done-when:**
- [ ] `/learn` page renders topic graph
- [ ] Each topic links to `/learn/:topic`
- [ ] Under 50KB, works at 320px
- [ ] Topics auto-discovered from PRD registry

### Feature 2: Persona-Led Lessons

Each lesson is a conversation with the right persona.

```
User opens: /learn/sidechain-compression

Page loads with:
  - Daft Punk persona context
  - Lesson PRD: "What is sidechain compression?"
  - Interactive element: the /music sequencer with sidechain on/off toggle
  - "Your turn" prompt: "Make the kick pump. Adjust the threshold."
  - Verification: "Does your head nod? If yes, you learned it."
```

**Implementation:** The lesson page is a chat with the persona, pre-seeded with
the lesson context. The persona knows the topic, the exercises, and the success
criteria. The user learns by doing — guided by the persona.

**Done-when:**
- [ ] `/learn/:topic` loads correct persona with topic context
- [ ] Persona explains the concept in their voice
- [ ] At least one interactive exercise per lesson
- [ ] Success criteria are checkable (not subjective)

### Feature 3: Spaced Repetition (LearnIt Integration)

The existing LearnIt system provides:
- Adaptive quizzing based on topic mastery
- Spaced repetition scheduling
- Badge-based progression

Wire it into the Learning Arena:

```
After completing a lesson:
  → Generate 3-5 quiz questions from the PRD content
  → Schedule spaced repetition reviews
  → Award badges for topic mastery
  → Track progress across the topic graph
```

**Done-when:**
- [ ] Lessons generate quiz questions automatically
- [ ] Spaced repetition schedules reviews
- [ ] Badge appears on profile after topic mastery
- [ ] Progress visible on topic graph (completed nodes highlighted)

### Feature 4: The Universal PRD Runner

**This is the key innovation.**

Any URL on spike.land becomes a learning experience by appending `/learn`:

```
spike.land/blog/the-contact-proof           → read the article
spike.land/learn/the-contact-proof          → Einstein teaches you the math behind it

spike.land/qa                                → run health checks
spike.land/learn/qa                          → Raju teaches you why each check matters

spike.land/music                             → play the sequencer
spike.land/learn/music                       → Daft Punk teaches you production
```

The PRD runner:
1. Resolves the URL to content (blog post, page, tool)
2. Selects the best persona(s) for that content
3. Generates a lesson plan from the content + PRD structure
4. Renders as a persona-led interactive experience
5. Images generated dynamically from persona prompts in the content's frontmatter

**Implementation:**
- Astro page at `/learn/[...slug].astro`
- Fetches content from the matching URL
- Injects persona context based on content tags/category
- Renders as chat interface with pre-seeded lesson context

**Done-when:**
- [ ] Any blog post accessible as a lesson via `/learn/:slug`
- [ ] Correct persona auto-selected based on content
- [ ] Lesson structure follows PRD format
- [ ] Hero images generated per-persona from shared token pool

---

## 4. Why This Is Free

The shared token pool (Token Bank PRD) powers everything:

1. **Persona conversations** — donated API keys route through the pool
2. **Image generation** — hero images generated on-demand, cached in R2
3. **Quiz generation** — LLM generates questions from content, cached
4. **No per-user cost** — the infrastructure is edge compute (Cloudflare Workers),
   the content is static (Astro), the intelligence is pooled

Duolingo employs 700 people and charges $8/month.
Brilliant employs 200 people and charges $25/month.

spike.land has one person, two dogs, a shared token pool, and 9 personas.
The personas never sleep, never ask for a raise, and never ship a feature
without a PRD.

---

## 5. The Erdős Test

**Is this from The Book?**

The most elegant learning platform is one where:
- The curriculum IS the product documentation (PRDs)
- The teachers ARE the product personas (already built)
- The exercises ARE the product features (already shipped)
- The infrastructure IS the product infrastructure (already running)

Nothing new is required except the connection. The /learn route is a lens —
it takes existing content and refracts it through a persona.

**Erdős:** "This is trivial. Which is the highest praise I can give."

---

## 6. 14-Day Sprint Plan

| Day | Task | Owner |
|-----|------|-------|
| 1-2 | `/learn` topic explorer page (static Astro, topic graph from PRD registry) | Arnold (design) + Radix (build) |
| 3-4 | `/learn/:topic` lesson page (persona chat pre-seeded with topic context) | Raju (backend) + Arnold (frontend) |
| 5-6 | Universal PRD runner (`/learn/[...slug]` resolving any content to a lesson) | Zoltán (architecture) |
| 7-8 | Quiz generation from PRD content + LearnIt integration | Erdős (question design) + Peti (testing) |
| 9-10 | Spaced repetition scheduling + badge system | Raju (backend) |
| 11-12 | 10 seed lessons (one per persona specialty) | All personas |
| 13 | Mobile testing on real devices + QA Arena health checks | Peti + Arnold |
| 14 | Ship. Blog post. Tweet thread. | GP (story) + Daft Punk (hype) |

---

## 7. The Blog Post That Writes Itself

```markdown
title: "We Built a Free Learning Platform That Makes Duolingo Look Like Flash Cards"
author: "GP"
personaPrompts:
  gp: "A chemist teaching physics to a dog wearing a tiny graduation cap — warm Brighton light"
  einstein: "Einstein grading Duolingo's homework, giving it an F — charcoal sketch"
  erdos: "A graph where each node is a Duolingo lesson and the edges show they're all disconnected — mathematical diagram style"
  daftpunk: "Split screen: left side is a boring multiple choice quiz, right side is a kid making a beat that teaches frequency — neon vs fluorescent lighting"
```

---

*Váltsd valóra az álmaidat. Kezdd ma.*

*The dogs approved this PRD. They learned faster than any human in the beta.*
