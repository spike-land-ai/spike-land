# It Feels Like Cheating (Because It Is)

_By Zoltan Erdos | Brighton, UK | February 2026_

_How I deleted my E2E tests, rebuilt my API in two days, and stopped pretending
code is precious_

## The Confession

Every morning I sit down with my coffee, open Claude Code, describe a feature,
and twenty minutes later it ships. Tests pass. CI is green.

Then I close the laptop and think: _I cheated._

For months I downplayed it. "Oh, this feature was simple." It was not simple. It
had auth flows, database migrations, edge cases, and a full test suite. But
because I did not suffer building it, I could not accept it was real.

The feeling has a name. It is a paradigm shift arriving before the culture is
ready. When something feels too easy, you have not cheated. You have eliminated
a category of work that used to be hard. The guilt is your old identity
protesting. Your brain compares your output against the suffering it expects,
and the numbers do not match.

Here is what I did in two days that made the feeling permanent.

## The Two-Day Delete

I looked at my E2E test suite. Playwright tests. Dozens of them. Selectors
waiting to break. Tests that took four minutes to run and flaked on Tuesdays for
no reason anyone could explain.

One test was sixty lines long. Fifty-five lines tested the browser's ability to
click buttons. Five tested the business logic. I had been testing the frame
instead of the painting.

I asked myself: what if I just tested the five lines?

I moved every piece of business logic into MCP tools. Typed Zod schema, handler
function, structured response. Input validated. Output typed. Contract enforced.

Then I deleted the E2E tests. All of them.

I replaced them with MCP tool tests that run in milliseconds. No browser. No
DOM. No network. No selectors that break when someone changes a CSS class.

Here is the key insight. The same MCP handler that my React components call in
production is the same handler my tests validate. Not a mock. Not a copy. The
exact same function, schema, and contract. One source of truth. Two consumers.

When I realized what I had been doing wrong all those years, I said a word in
Hungarian that I will not translate here.

## MCP Tools Are Just Apps

If you have ever used a CLI, you already understand MCP.

MCP servers are apps. The tools on those servers are the commands. You call them
with typed input, you get structured output. That is it. No ceremony. No
framework overhead. Just functions with contracts.

Spike turns any MCP server into a CLI app. npm is the biggest open app registry
in the world. Turn your business logic into MCP tools, add them to the registry,
and they work everywhere: your production API calls them, your test suite
validates them, your AI agent uses them during development.

Three consumers. One interface. Zero mocks.

This is why Claude Code goes three to five times faster on this codebase. The
agent is not writing code blindly and hoping CI catches mistakes twenty minutes
later. It has surgical instruments. It can test its own work in real time,
verify a business rule before writing the component that calls it, validate an
auth flow before building the page that depends on it.

## The Hourglass

The testing pyramid was always the wrong shape for the AI era.

The right shape is an hourglass. Heavy on both ends, thin in the middle.

**Top: E2E specs.** Humans write these. _Given the user is logged in, when they
click checkout, then the order is placed._ Requirements in executable form.

**Bottom: MCP tool tests.** Business logic, validation, state transitions,
authorization. They run in milliseconds. They never flake.

**Middle: UI code.** AI generates this. It is disposable. If a component breaks,
you do not debug it. You regenerate it.

Seventy percent MCP tool tests. Twenty percent E2E specs. Ten percent UI tests.

The middle is disposable because if you know _why_ the code exists and you can
_prove_ it works, the code itself is just a printout. The value lives in the
requirements and the tests.

## The Ten-Second Rule

When CI takes thirty minutes, bugs compound. By the time you learn about a
failure, you have built three features on broken foundations.

When CI takes ten seconds, you know exactly what you just changed. Fix it and
move on.

Under ten seconds? Skip branches entirely. Commit directly to main. Trunk-based
development. Fifty commits a day at five seconds each is four minutes of
waiting. Branching overhead at five minutes per change is four hours of
ceremony. The choice is not a choice.

MCP tool tests make ten-second CI possible. No browsers to spin up. No network
calls. Functions in, validation out. The hourglass makes the speed possible. The
speed makes trunk-based development possible. Trunk-based development makes
rapid iteration possible.

Put them all together and you get something that feels like cheating.

## Why It Feels Like Cheating

Now it is code itself. "You mean I do not write the code anymore?"

Yes. That is what I mean.

You are not missing something. You are gaining back all the time you spent on
work that was never the point. Memory management was never the point. SQL was
never the point. Deployment was never the point.

Code was never the point.

[Requirements are the product.](/blog/11-requirement-is-the-product) Code is
just the current rendering. A printout. If you can regenerate it in twenty
minutes from clear requirements and proven tests, what exactly were you
protecting?

Your identity. The idea that your value comes from the code you write. That the
artifact is the art.

It is not. The art is knowing what to build. The art is understanding the
problem so deeply that you can describe it precisely enough for a machine to
build it correctly on the first try. That is harder than coding. Much harder.

## The BAZDMEG Method

Bazdmeg is Hungarian. I am not going to translate it. If you know, you know.

I named the methodology after an expletive because the irreverence is the point.
If your methodology has a polite name, you are still treating code like
something sacred. It is not sacred. It is disposable.

Seven principles. Born from pain. Tested in production.

1. Requirements are the product.
2. Discipline before automation.
3. Context is architecture.
4. Test the lies.
5. Orchestrate, do not operate.
6. Trust is earned in PRs.
7. Own what you ship.

## The Uncomfortable Question

If I can delete my codebase and rebuild it in twenty minutes, what was I
protecting all those years?

Not the code. Disposable.

Not the tests. Stronger than ever. Milliseconds instead of minutes.

Not the requirements. Documented. Clear. Executable.

I was protecting my ego.

What makes me valuable is understanding problems. Describing solutions
precisely. Building systems where AI does the heavy lifting while I do the
thinking.

The code? Regenerate it. Delete it. Print it again. It does not care. It has no
memory of how hard it was to write. It just runs or it does not.

Let go of that, and it stops feeling like cheating.

It starts feeling like clarity.

And clarity, it turns out, is the most productive state I have ever worked in.

---

_Zoltan Erdos is a developer based in Brighton, UK, building
[spike.land](https://spike.land). He named his methodology after a Hungarian
expletive because he believes in honesty._
