# How to Not Produce AI Slop: A Framework

_By Zoltan Erdos | Brighton, UK | January 2026_

In my last post, I confessed something embarrassing. When I joined a new team in
2025, my pull requests were pure AI slop. Even when I tried my best to avoid it.

Many of you asked me: "Okay, you messed up. But what do you do now? How do you
use AI without producing garbage?"

Fair question. Here is my framework.

## What AI Slop Actually Looks Like

Let me paint the picture.

You open a PR. The code looks clean. The variable names are good. The structure
seems professional. The tests pass. The linter is happy.

But something is wrong.

The code follows patterns that nobody uses anymore. It makes assumptions about
the database that are not true. It calls a function in a way that "works" but
breaks in edge cases that only your teammates know about.

This is AI slop. It is not broken code. It is code built on broken assumptions.
It looks right. It feels right. But it does not fit.

The scary part? You cannot tell. Not when you are new. Not when you trusted the
AI to understand the codebase better than you did.

## Why This Happens

Here is the core problem.

When you ask an AI to write code, it looks at your codebase. It sees patterns.
It makes guesses. Then it writes code based on those guesses.

Most of the time, the AI is smart. It makes good guesses. The code works.

But sometimes the AI is wrong. And as a new developer on a legacy codebase, you
have no way to verify what the AI assumed.

The AI sees an old function. It assumes that function still works the same way.
But a teammate refactored it six months ago. The AI does not know. You do not
know either.

The AI follows a pattern it found in one file. But that pattern is deprecated.
The team moved on. The AI cannot tell. Neither can you.

This is the trap. The AI gives you confidence you have not earned.

## The Most Important Change: Planning Interviews

This is the single biggest improvement I made. And it sounds almost too simple.

**During planning, the agent interviews me.**

Before any code is written, I have the AI ask me questions about the problem.
Not just any questions. The AI keeps asking until it has a full picture. Until I
have a full picture.

"What is the user flow here?" "What data already exists on the server?" "Why
does this ID appear in the URL?" "What happens if this fails?"

If I cannot answer a question, I stop. I go back to the documentation. Or I run
another agent to find out. I do not proceed until I understand.

This does two things. First, it forces me to understand the problem deeply
before I generate any code. Second, it catches wrong assumptions before they
become wrong code.

The AI is no longer just a code generator. It is my planning partner. It
interrogates my understanding until that understanding is solid.

This is now the most important part of my workflow. 30% of my effort goes to
planning. That sounds like a lot. It is the best investment I make.

## Documentation: Creating Your Safety Net

Before I write any code, I create a personal knowledge base. I document
everything I learn about the codebase. Every conversation with a teammate. Every
weird pattern I discover. Every "aha" moment.

But I took this further.

I use NotebookLM to accelerate my learning. I feed it all the documentation I
gather - Confluence pages, code comments, API docs, architecture diagrams. Then
I ask it to generate:

- **Learning tutorials** that walk me through the domain
- **System diagrams** that visualize how things connect
- **Flashcards** for memorizing key concepts
- **Quizzes** to test my understanding

After one incident where I completely misunderstood how the basket architecture
worked, I used this approach. In one weekend, I mastered domain knowledge that
would have taken weeks to learn the traditional way.

This documentation lives on my machine. It is my safety net. When the AI makes a
suggestion, I check it against my notes.

Why does this work? Because the AI does not have your context. It does not know
what your teammates told you. It does not know the decisions made in yesterday's
meeting. But you do. Write it down.

## Custom Skills: Teaching the AI Your Patterns

Here is something most developers miss: you can teach the AI how your team
works.

I encode our project patterns into Claude's custom instructions. Team
conventions. Coding standards. Architectural decisions. Common pitfalls.

Now when I ask for help, the AI already knows:

- Which state management pattern we use
- How we structure our components
- Which APIs to call and which to avoid
- What the team considers "the right way"

The AI stops guessing. It follows the playbook I gave it.

This is context engineering. You are not just asking the AI to write code. You
are giving it the knowledge to write code correctly for your specific context.

## Multi-Agent Orchestration: Not Just a Copilot

In December 2025, Opus 4.5 was released. It changed everything.

With proper instructions, the AI can orchestrate multiple agents as a
coordinated team. One agent plans. Another writes code. Another reviews. Another
tests.

You do not just have a copilot anymore. You have a whole dev team. Or a flock of
dev teams.

This sounds like hype. It is not. I use this daily.

When I start a task, I can spawn agents that work in parallel. One explores the
codebase. Another reads the documentation. Another checks for similar patterns.
They report back. I synthesize. Then we proceed together.

The key is "with proper instructions." You need to tell the AI exactly what each
agent should focus on. What questions to answer. What to look for. What to
report back.

Multi-agent only works if you know what you are doing. But when you do, it
multiplies your capability dramatically.

## Agent-Based Testing: Catching What You Miss

This is my new secret weapon.

I have agents that test like humans test.

The agent spins up a browser. Logs in with test credentials. Navigates to the
feature. Tries to use it the way a real user would. Clicks buttons. Fills forms.
Checks if things work.

If something breaks, the agent catches it. It takes screenshots. It compares
them with Figma designs. It reports exactly what went wrong.

This catches bugs that unit tests miss. Unit tests verify code works.
Agent-based tests verify the feature works.

Before I submit a PR, an agent has already tried to break it. When that agent
cannot find problems, I have confidence. Real confidence. Not "it looks right"
confidence.

## Testing as Your Defense

I now write tests before I write code.

Not because test-driven development is trendy. Because tests force me to
understand the problem.

Think about it. To write a test, you must know what the code should do. You must
understand the inputs. You must understand the outputs. You must think about
edge cases.

If you cannot write the test, you do not understand the problem. And if you do
not understand the problem, you should not ask the AI to write the solution.

**Unit tests catch the small lies.** They verify that each piece works alone.

**End-to-end tests catch the big lies.** They verify that the pieces work
together.

**Agent-based tests catch the human lies.** They verify that real users can
actually use the feature.

When my tests pass - all three types - I have proof. Not hope. Proof.

Here is my rule now: No PR goes up without tests. Period. If I cannot test it, I
do not ship it.

## TypeScript as Your Guardrail

Strict TypeScript is your first line of defense against AI slop. Here is why.

The AI writes code. The code looks correct. But the AI made an assumption about
a data type. It assumed a field would always exist. It assumed an array would
never be empty. It assumed a string would always be a valid UUID.

With loose typing, this code runs. It fails at runtime. In production. With
angry users.

With strict TypeScript, the compiler catches this immediately. It says: "No,
this field could be undefined. Handle that case."

The AI gets caught. Before the code review. Before the deployment. Before the
incident report.

**If you have proper TypeScript setup and testing setup, you will not have AI
slop issues.** I say this from experience. The types and tests catch what you
miss.

Set TypeScript to strict mode. Enable all the rules that feel annoying. They are
annoying because they are catching real problems.

## The New Effort Distribution

Here is how my time is spent now:

- **30% planning** - Understanding the problem, having the AI interview me,
  verifying my understanding
- **50% testing** - Writing tests, running agent-based tests, verifying
  everything works
- **20% quality improvement** - Can we do better? Are there edge cases? Is it
  maintainable?

Notice what is missing? Coding. The actual typing of code takes almost no time.

This is the shift. The AI writes the code. I make sure the code is right.

## The Checklist: Before You Submit That PR

Here is what I check now, every single time.

**Before I ask the AI for help:**

- [ ] Can I explain the problem in my own words?
- [ ] Has the AI interviewed me about the requirements?
- [ ] Do I understand why the current code exists?
- [ ] Have I checked my documentation for relevant context?

**After the AI writes code:**

- [ ] Can I explain every line to a teammate?
- [ ] Have I verified the AI's assumptions?
- [ ] Do I know why the AI chose this approach?
- [ ] Have the agents tested it like a human would?

**Before I create the PR:**

- [ ] Do my unit tests prove the code works?
- [ ] Do my end-to-end tests prove the feature works?
- [ ] Do my agent-based tests prove users can use it?
- [ ] Does TypeScript pass with no errors in strict mode?
- [ ] Can I answer "why" for every decision?

If any answer is "no," I stop. I go back. I learn more.

## The Speed Paradox

You might think this framework makes you slow. All this planning. All this
documentation. All this testing.

Actually, the opposite is true.

With the right level of testing and process, you can develop software at
incredible speed with quality. Not just fast. Fast and good.

Here is why. When your PR is clean, it gets approved fast. No back-and-forth. No
"why did you do this?" No "we stopped using that pattern last year."

One clean PR beats five sloppy ones. Every time.

## What I Want You to Take Away

AI coding tools are incredible. They have changed my work forever. I use them
every single day.

But they are tools. Not magic. Not shortcuts.

The framework is simple:

1. Have the AI interview you during planning
2. Build comprehensive documentation using tools like NotebookLM
3. Encode your patterns into custom skills
4. Use multi-agent orchestration for complex tasks
5. Test with agents that behave like real users
6. Write tests before code
7. Use strict TypeScript
8. Check every assumption before you ship

Do this, and your PRs will not be AI slop. They will be your work, enhanced by
AI.

That is the difference that matters.

---

_Zoltan Erdos is a developer based in Brighton, UK, building spike.land. He
shares what he learns about working with AI coding tools._
