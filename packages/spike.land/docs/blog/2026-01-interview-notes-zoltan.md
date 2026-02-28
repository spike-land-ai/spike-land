# Interview Notes: Zoltan Erdos on the Developer Identity Crisis of 2026

**Date:** January 2026 **Subject:** Zoltan Erdos **Location:** Brighton, UK
**Role:** Developer & Founder of Spike.land

---

## Key Memorable Quotes

### On Uncertainty

> "2026 will be such a ride - but I never felt so uncertain. The profession is
> under a big refactor."

> "I'm not sure that in 2026 people are still employing developers. Being a
> developer will be obsolete in two years, for sure."

> "Earning less than I earned five years ago. The career progression kind of
> stopped."

### On the Productivity Paradox

> "I became the most productive that I ever been in my life... unfortunately, at
> work it's not that easy."

> "If I do a PR fast, it won't even be looked at until the end of the sprint."

> "The PR won't be looked at until the end of the sprint. And last moment, they
> decide everything is wrong with it."

### On the "AI Slop" Confession

> "For a brief period, when I started in a new team, my PRs were pure AI slop -
> even with my very best effort to avoid that."

> "The AI takes assumptions on legacy codebase, and as a new developer, you have
> no idea what assumptions the agent made."

### On Trust & Team Dynamics

> "Everything coming from me, from AI - those PRs take 3-4x longer to review. My
> productivity at work because of this is really bad."

> "Colleagues would rather redo the whole PR and trash your work than feedback
> your PR in time - even when you asked for early feedback."

> "They are not trusting anything coming from me. If it's not working the first
> try... maybe not the first try but the second, the task will be done much
> faster."

### On the Quality Triangle Breaking

> "Previously: Quality, Speed, Price - choose two. Now with AI, all three are
> possible. High quality, fast, AND cheap. This is changing the industry
> completely."

### On Model Evolution

> "The first really good model that surprised me was Claude Sonnet 3.7"

> "Opus 4.0 - I could solve an issue that I couldn't technically solve before"

> "Opus 4.6 - from 10 tasks with proper planning, it can execute 8-9"

### On What Developers Get Wrong

> "If coding agents are making mistakes, the requirements weren't specified well
> enough."

> "The issue in the first place was that the ticket wasn't created properly. The
> requirement wasn't clear."

### On Identity & ADHD

> "I have ADHD which makes my communication style harder. I was always afraid of
> hearing feedback because my mind thinks you're judging me, not my work."

> "I want to be seen as a guy who really loves tech, really passionate about
> programming."

### On Economic Reality

> "It's borderline impossible to buy a flat if you are on payroll. You have to
> be a contractor. Being a contractor comes with extra uncertainty."

> "Private equity is behind everything. It feels like the economy is about to
> collapse."

### On What He Wants

> "I would like to work with clients that are open-minded for AI. I don't want
> those fights about 'it's generated with AI, there's something wrong with it.'"

> "My dream is to have my own company, be big, have an office in Brighton, nice
> people to work with."

---

## The Basket API Incident: A Case Study

_This specific example illustrates the "AI slop" problem in concrete detail._

### The Setup

> "I was working on two apps - a Next.js cancellation flow and an Angular
> e-commerce store. The ticket was about tracking analytics when users accept a
> retention offer. Simple, right?"

> "The flow was: user goes to cancel, sees a retention offer with an ID in the
> URL, clicks it, goes to the Angular app, and checks out. I needed to track
> that checkout event."

### The Misunderstanding

> "I assumed the frontend holds the basket in memory until checkout. That's what
> made sense to me. But the basket was server-side - the backend was the single
> source of truth. The ID in the URL was just for double-checking."

> "I didn't know what I didn't know. The ticket requirements weren't clear, but
> I didn't know enough to ask the right questions."

### The Perfect Storm

> "Claude was having technical issues at that time. There's actually a
> [postmortem from Anthropic](https://www.anthropic.com/engineering/a-postmortem-of-three-recent-issues)
> about it. Context window routing errors affected 30% of Claude Code users. The
> tool I trusted was producing good-looking but low-quality output."

> "When the AI hallucinates confidently, it makes you hallucinate too. Claude
> generated code that called the Basket API when it shouldn't have. It looked
> right. It felt right. So I submitted the PR."

### The Review

> "One colleague kept asking questions I couldn't answer. A more senior
> developer was more direct - she said the PR was essentially garbage. Only tiny
> parts were useful."

> "The basket was already there on the server. Why was I calling the Basket API?
> I had no answer. Because I didn't make that decision. Claude did."

### The Solution

> "After that incident, I created a comprehensive developer guide. I used
> NotebookLM to generate learning tutorials, system diagrams, flashcards,
> quizzes. In one weekend, I mastered all of it."

> "But the biggest change is how I plan now. During planning, the agent
> interviews me. It asks questions until I have a full picture. If I can't
> answer something, I go back to the documentation or run another agent to find
> out."

> "Then Opus 4.6 came out in December. It can orchestrate multiple agents as a
> coordinated team. You don't just have a copilot anymore - you have a whole dev
> team. Or a flock of dev teams."

### The New Process

> "My effort now is 30% planning, 50% testing, 20% quality improvement. The
> agent spins up a browser, logs in with test credentials, tries to pass the
> feature like a human tester would. It takes screenshots, compares with Figma."

> "I stopped producing slop. But my reputation at work is still damaged. My PRs
> still take longer to review than others. That will take time to rebuild."

---

## Context & Background

- **Personal:** Hungarian developer living in Brighton, UK. Has two dogs.
  Practices daily routine (gym at 6:30am, dog walks, structured work schedule).
- **Professional:** Works remotely full-time while building Spike.land as a side
  project/startup.
- **Technical:** Passionate about JavaScript/TypeScript, Docker, distributed
  systems, mathematics.
- **Spike.land:** Managed deployment platform with MCP registry - code editing,
  live preview, AI tool orchestration, and managed deployments.

---

## Key Themes for Blog Posts

1. **The Productivity Paradox** - Being too fast for your team
2. **The AI Slop Problem** - When AI makes assumptions you can't verify
3. **The Trust Gap** - Why teams reject AI-generated code
4. **The Economic Squeeze** - Earning less, career stalled, uncertain future
5. **The Identity Crisis** - What does "developer" mean when AI codes better?
6. **The Quality Triangle** - AI broke the speed/quality/price tradeoff
7. **The New Skills** - Context engineering, MCP, requirements writing
