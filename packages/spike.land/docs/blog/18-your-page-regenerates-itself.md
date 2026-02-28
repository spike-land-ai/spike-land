# Your Page Regenerates Itself

_By Zoltan Erdos | Brighton, UK | February 2026_

_Test-driven regeneration, disposable code, and the anti-fragile system that
rebuilds itself when you break it_

## The Problem With Precious Code

We treat code like stained glass. Every function hand-placed, every abstraction
polished, every refactor performed with the reverence of a cathedral
restoration. We name our variables carefully. We agonize over directory
structure. We write comments for future maintainers who may never exist.

Then an intern changes one CSS class and the whole window shatters.

I used to be precious about my code. I had favorite components. I had files I
was proud of. I would resist refactors that touched them because they were
_mine_, they worked, and they represented hours of careful thought.

Then I started regenerating them.

Not refactoring. Not editing. Regenerating. Deleting the file entirely and
letting the system produce a new one from scratch. And the new version was
usually better. Not because the AI is smarter than me. Because it had no
attachment to the old version. No sunk cost. No "but I spent three hours on that
abstraction."

This messed with my head for a while. But once you accept it, something clicks.
What if the code was never the product? What if it was always disposable? What
if the tests were the real thing, and the implementation was just today's best
guess?

## Tests Are the DNA

Cut a starfish's arm off. It grows back.

Not a different arm. The same arm. Same shape, same function, same nerve
endings. The starfish does not remember the old arm. It does not miss it. It
regenerates from the blueprint encoded in its DNA.

Our system works the same way.

The tests are the DNA. They encode what the system must do. Not how. Not with
which library. Not using which pattern. Just: given this input, produce this
output. Given this state, enforce this constraint. Given this user, allow these
actions.

The code you see running in production is the phenotype. The current expression
of those tests. Today's rendering. It might be a React component. It might be a
server function. It might be a Cloudflare Worker handler. It does not matter.
What matters is that it satisfies the tests.

Delete the code. Run the generator. New code appears. Tests pass. Ship it.

The old code is gone. Nobody mourns it. The new code might be structured
differently. It might use different variable names. It might even use a
different approach to the same problem. None of that matters because the tests
still pass and the behavior is identical.

This is not a metaphor. This is what happens every day on spike.land.

## The Filesystem API

Until recently, our codespaces had a limitation that drove me insane. One file
at a time. An agent could read a file, edit a file, write a file. But it could
not work across files the way a real developer does. It could not grep through a
directory for a pattern. It could not glob for all TypeScript files matching a
convention. It could not do the basic filesystem operations that make Claude
Code so effective on local projects.

So we built it.

Read, write, edit, glob, grep. The same operations Claude Code uses on your
local machine, now available inside a browser codespace. An agent working in a
spike.land codespace can now do everything it can do locally. Search across
files. Find patterns. Edit multiple files in a single pass. Understand the
project structure before making changes.

This sounds simple. It was not simple. Browser sandboxes do not have
filesystems. We had to build a virtual filesystem that behaves like a real one
but runs entirely in the browser's memory, backed by a Cloudflare Durable Object
for persistence. The API surface matches what developers expect. The
implementation is nothing like what they would expect.

But the agent does not care about the implementation. It cares about the
interface. And the interface says: here are your files, work with them.

## Intent-Aware Development

The filesystem API was necessary but not sufficient. Giving an agent file
operations is like giving a surgeon hands. Useful, but the surgeon still needs
to know where to cut.

So we added intent.

When an agent starts working, it declares what it is building. "I am
implementing a checkout form with Stripe integration." "I am adding rate
limiting to the API endpoints." "I am refactoring the auth flow to support
OAuth."

The system hears this and responds. It surfaces the relevant files before the
agent asks for them. Here is your Stripe configuration. Here are the existing
payment types. Here is the test file you will need to update. Here is the schema
that constrains the checkout response.

No more digging through directories. No more "let me search for where Stripe is
configured." No more twenty-minute orientation phase where the agent builds a
mental model of the codebase by reading files one at a time.

The agent declares intent. The system provides context. The agent builds. The
tests verify. The whole loop tightens by minutes per iteration, and when you are
doing fifty iterations a day, minutes matter.

## Continuous A/B Testing

Here is where it gets interesting.

If the code is disposable and the tests are the real product, nothing stops you
from generating twenty versions of the same component. Same test suite. Same
behavioral contract. Twenty different implementations.

Deploy all of them.

Not sequentially. Simultaneously. Twenty variants of your checkout page, each
satisfying the same tests, each taking a slightly different approach to layout,
copy, interaction design. Route real users to each variant. Measure completion
rates, time on page, error rates, satisfaction scores.

Declare a winner. Replace the other nineteen. Tomorrow, generate twenty more
variants from the winning baseline. Repeat.

The test suite is stable. The implementations compete. Natural selection, but
for UI components.

This is not theoretical. This is what test-driven regeneration enables when you
stop treating code as precious. When code is disposable, experimentation is
free. When experimentation is free, optimization is continuous. When
optimization is continuous, your product improves every day without anyone
making a deliberate decision to improve it.

The system improves itself. You just write better tests.

## Anti-Fragility

Nassim Taleb wrote about systems that get stronger when stressed. He called them
anti-fragile. Most software is the opposite. Stress it and it breaks. Break it
and it stays broken until a human intervenes.

Our system is different.

The MCP server goes down. Three new instances regenerate from the test suite.
Each instance might produce slightly different code. Different variable names.
Different internal structure. Same external behavior. Same passing tests.

A component throws an error in production. The system does not page a developer
at 3 AM. It regenerates the component. Tests pass. Deploy. The user who
triggered the error sees a fixed version on their next page load. The whole
cycle takes minutes, not hours.

Someone posts a comment on a test: "this should also handle the case where the
user has no payment method." That comment becomes a test case. The test case
triggers regeneration. The regenerated code handles the new case. Two minutes
from comment to feature.

Break something, and the system routes around it. Stress it, and it produces
more variants. Kill an instance, and three more take its place. This is not
resilience. Resilience means returning to the original state. This is
anti-fragility. The system comes back _better_ because each regeneration is a
fresh attempt at satisfying the tests, unburdened by the accumulated compromises
of the previous version.

The accumulated compromises. That is what kills most software. Every quick fix.
Every "we will clean this up later." Every hack that worked in the moment and
calcified into permanent architecture. Regeneration eliminates all of it. Every
version starts clean.

## The Customer Experience

Your page is not static. It is today's best variant.

Tomorrow it might look different. The layout might shift. The copy might change.
The interaction patterns might evolve. But the behavior, the thing the tests
guarantee, remains constant. Your checkout still works. Your data is still safe.
Your account still functions exactly as documented.

What changes is the expression. The phenotype.

Visitors get novel experiences without anyone in a design meeting deciding to
"refresh the brand." The refresh is continuous. The best-performing variant
survives. The underperformers get replaced. Every page is tested, measured, and
competing for its right to exist.

This sounds brutal and it is. But it is also how every successful product
already works, just on a longer timescale. Companies A/B test landing pages over
weeks. We do it over hours. Companies redesign annually. We regenerate daily.
The mechanism is identical. The cycle time is compressed by orders of magnitude.

Your users do not notice. They just notice that the product keeps getting
better. That is the whole point.

## The Stack

Here is how spike.land makes this possible.

**Filesystem API.** Claude Code-style file operations running inside browser
codespaces. Read, write, edit, glob, grep. Agents work with multiple files the
same way they work locally. Built on a virtual filesystem backed by Cloudflare
Durable Objects.

**Test-driven generation.** Tests are written by humans. Implementations are
generated by agents. The tests define the contract. The agent satisfies it. If
the generated code does not pass, it gets regenerated. No debugging. No fixing.
Delete and reprint.

**Continuous regeneration.** Components are not maintained. They are regenerated
on a schedule or in response to events. New test added? Regenerate. Performance
regression detected? Regenerate. Error rate spikes? Regenerate. The trigger
varies. The response is always the same.

**MCP protocol.** Every tool in the system is an MCP tool with a typed Zod
schema. Agents use the same tools in development that run in production. Tests
validate the same interface. One contract, three consumers.

**Cloudflare Workers.** Edge computing for regeneration. Instances spin up in
milliseconds. Deploy globally in seconds. No cold starts worth measuring. The
infrastructure matches the speed of the development cycle.

**Monaco editor.** The browser-based editor that makes codespaces feel like a
local IDE. Syntax highlighting, type checking, and agent integration in the
browser. No local setup required.

This is the infrastructure for disposable code. Not disposable quality.
Disposable _implementations_. The quality lives in the tests. The
implementations are just today's printout.

Tomorrow we print again.

---

_Zoltan Erdos is a developer based in Brighton, UK, building
[spike.land](https://spike.land). His code has no feelings about being deleted._
