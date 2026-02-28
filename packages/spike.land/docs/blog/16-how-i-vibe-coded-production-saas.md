# How I Vibe-Coded a Production SaaS in Two Months

_By Zoltan Erdos | Brighton, UK | February 2026_

I built an entire SaaS platform. Six core features. Full test coverage. CI/CD
pipeline. Stripe payments. MCP server. Live preview infrastructure. Production
deployed.

I did it alone. In about two months.

And I did it by vibe coding.

Before you roll your eyes, let me explain what I mean. Because vibe coding does
not mean what most people think it means.

## What Vibe Coding Actually Is

Most people hear "vibe coding" and think it means typing a prompt, hitting
enter, and hoping for the best. Copy-paste from ChatGPT into your editor. Ship
it. Pray.

That is not vibe coding. That is AI slop.

Real vibe coding is a methodology. It is how you work with AI as a partner, not
a slot machine. It is context engineering, requirement clarity, and systematic
validation. It is the hardest easy thing I have ever done.

Here is what it looks like in practice.

## The Platform I Built

Let me describe what I actually built, so you understand the scope.

**spike.land** is a managed deployment platform with an MCP registry. It has
multiple feature modules:

- **Orbit**: An AI-powered social media command center with real-time health
  monitoring, unified inbox, smart budget allocation, competitive intelligence,
  brand voice management, and AI-generated draft posts
- **Pixel**: AI image enhancement with a token economy
- **My-Apps**: A zero-shot app builder with live preview
- **MCP server**: Lets AI agents create and preview code in real time
- **spike-cli**: An MCP multiplexer CLI for orchestrating AI tool servers

This is not a prototype. This is not a demo. This is a production platform with
workspace management, team roles, subscription tiers, Stripe billing, OAuth
authentication, and a real database schema.

One person. Two months.

## How I Actually Did It

### Step 1: Requirements Before Code

I wrote no code for the first week.

Instead, I wrote requirements. Detailed requirements. User flows. Edge cases.
Database schemas. API contracts. Subscription tier matrices. Every decision
documented before a single line of code existed.

This sounds slow. It is not. It is the fastest thing you can do.

When I eventually asked my AI agent to build the Unified Inbox, I did not say
"build me an inbox." I said: "Here are the message types. Here are the priority
scoring rules. Here is how sentiment analysis works. Here are the keyboard
shortcuts. Here is how team assignment works. Here are the subscription tier
limits. Here is the database schema. Build it."

The AI built it correctly on the first attempt. Because I gave it everything it
needed.

### Step 2: The CLAUDE.md File

Every project has a file called CLAUDE.md. It contains everything the AI needs
to know about the project.

My CLAUDE.md is extensive. It describes the directory structure. The tech stack.
The testing requirements. The CI/CD pipeline. The git workflow. The coding
conventions.

When my AI agent reads this file, it stops guessing. It follows the playbook. It
writes code that fits the codebase. It runs the right tests. It commits with the
right format.

This is context engineering. You build the context once, and every interaction
with the AI benefits from it.

### Step 3: Test-Driven Everything

I require 100% test coverage. Not because I am a purist. Because AI-generated
code needs validation more than human-written code.

Here is why. When a human writes code, they have intuition. They know the
codebase. They feel when something is wrong. AI does not have intuition. AI has
patterns. And patterns can be wrong.

Tests catch wrong patterns. Tests do not care if the code looks clean. Tests
check if the code actually works.

My workflow: write the test first. Then have the AI write the code to pass the
test. Then have the AI write more tests to find edge cases. Then fix those edge
cases.

This cycle is fast. Much faster than debugging AI-generated code after the fact.

### Step 4: CI/CD as Safety Net

Every push triggers the full pipeline. Lint. Type check. Unit tests. Build. E2E
tests. Vercel preview deployment.

I do not merge anything until all checks are green. No exceptions.

This might seem paranoid. It is not. It is what makes solo development possible.
The CI pipeline is my second pair of eyes. It catches what I miss. It catches
what the AI misses.

When an AI agent makes a change that breaks something three files away, the CI
catches it. I fix it before it compounds.

### Step 5: Parallel Agent Orchestration

The real speed comes from parallelism.

I do not use one AI agent. I use many. One explores the codebase. Another reads
documentation. Another checks for similar patterns. Another writes the code.
Another writes tests. Another reviews the result.

They work simultaneously. They report back. I synthesize their findings. Then we
proceed.

This is not science fiction. This is how I work every day. Claude Code with
subagents. Multiple agents running in parallel. Each one focused on a specific
aspect of the problem.

The key is giving each agent the right context. Each one needs to know what to
focus on. What questions to answer. What to look for.

## The Hard Parts

I want to be honest. It was not all smooth.

### The Slop Problem

Early on, I produced AI slop. I know because I have written about it before.
Code that looked clean but made wrong assumptions. Code that followed deprecated
patterns. Code that worked in isolation but broke the system.

The fix was always the same: better context. Better requirements. Better
documentation. Every failure was a documentation gap.

### The Loneliness

Solo development is lonely. There is nobody to bounce ideas off. Nobody to catch
your blind spots in a casual conversation. Nobody to tell you when you are going
down the wrong path.

I compensated by having the AI interview me during planning. "What happens if
this fails?" "What data already exists?" "Why did you choose this approach?"

The AI became my thinking partner. Not a replacement for a team, but close
enough.

### The ADHD Factor

I have ADHD. My brain does not do sustained focus naturally. It does not do
schedules. It does not do "just push through."

Building a SaaS requires all of those things.

My solution: ruthless structure. Same routine every day. Gym at 6:30. Dog walks
at set times. Work in focused blocks. AI handles the parts my brain drops.

AI is particularly good for ADHD developers. When I lose focus and come back
hours later, the AI remembers the context. It picks up where we left off. It
does not judge. It does not ask "where were we?"

## What I Learned

### The Triangle Is Broken

For decades, we had the impossible triangle: quality, speed, and cost. Pick two.

AI broke that triangle. I built a production SaaS with high quality (100% test
coverage, CI/CD, proper architecture), high speed (two months), and low cost
(one person).

This was genuinely impossible two years ago. It is routine now.

### Requirements Are the Product

The most important thing I build every day is not code. It is requirements.

Clear, detailed, unambiguous requirements are the product. The code is just the
output. When the requirements are right, the code writes itself. Literally.

### Context Engineering Is the Skill

If you learn one thing from my experience, learn this: the quality of your AI
output is proportional to the quality of your context input.

Bad context in, bad code out. Good context in, production code out.

I spend 30% of my time on context engineering. Writing CLAUDE.md files.
Documenting decisions. Creating clear requirements. Setting up MCP tools. This
investment pays for itself a hundred times over.

## Where It Goes From Here

spike.land is live. The platform works. The infrastructure is solid.

But I am one person. I have technical depth and production tools. What I do not
have is community and distribution.

That is the next chapter. Finding the right partnerships. Getting the platform
in front of the people who need it. Proving that vibe coding is not just a
buzzword but a legitimate way to build real software.

I believe the future of software belongs to small teams and solo founders who
know how to work with AI. Not replacing developers. Amplifying them. One person
doing the work of ten. Not because they are ten times smarter, but because they
have ten times the tools.

The tools exist. The methodology works. I am living proof.

Now I need to find the others.

---

_Zoltan Erdos is a developer based in Brighton, UK, building spike.land. He
believes the future of software belongs to solo founders who master context
engineering._
