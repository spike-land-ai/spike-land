# The New Developer Onboarding: AI Edition

_By Zoltan Erdos | Brighton, UK | January 2026_

Your first day at a new company used to feel like drowning. Now it feels like
flying. Both are dangerous.

Let me tell you about the strange problem facing new developers in 2026. And why
your team needs to think about it now.

## How Onboarding Used to Work

When I started my first real developer job, the process was slow. Almost
painfully slow.

Week one: Read the README. Set up your machine. Break something. Fix it. Ask for
help.

Week two: Read more code. Attend meetings. Start to recognize names. Still
confused.

Week three: Get your first small task. A bug fix. Something simple. You submit a
PR. It gets reviewed. You learn what you did wrong.

Month two: You start to feel useful. You know where things are. You understand
some patterns. You can answer basic questions from the next new person.

This was not fast. But it was safe. You built understanding layer by layer. Like
learning to walk before you run.

Now think about what happens with AI.

## The New Reality

I joined a new team in 2025. I had powerful AI tools at my disposal. Claude Code
could read the entire codebase in seconds. It could write features. It could
refactor code. It could do things that would take me days.

On day one, I was shipping code.

Day one.

Think about that. A new developer. No context. No understanding. Shipping code
on the first day.

It felt amazing. I felt like a superhero. My productivity numbers looked
incredible. My PRs were clean and professional.

But there was a problem. A big one.

## The Danger Zone

Here is what I learned the hard way: AI gives you superpowers but not
super-understanding.

The AI looked at the codebase and made assumptions. Smart assumptions.
Reasonable guesses based on patterns it found. Then it wrote code based on those
guesses.

As a new developer on the project, I had no idea what assumptions the agent
made.

The AI might see an old pattern and think it is the current standard. Wrong.

The AI might miss a comment explaining why something works a certain way. Wrong
again.

The AI might follow a convention that the team abandoned six months ago. Still
wrong.

And I could not catch these mistakes. I did not have enough context. I did not
know what questions to ask. I trusted the AI because its code looked right.

My PRs were pure AI slop. Not because the code was bad. Not because the AI was
stupid. But because I had power without knowledge. Speed without understanding.
Fire without control.

This is the danger zone: AI plus no context equals slop.

## The Solution I Found

After some embarrassing code reviews, I changed my approach. I stopped using AI
to skip the learning. I started using it to accelerate the learning.

Here is what worked for me:

**Documentation first.** Before I wrote any feature code, I created
documentation about what I learned. Notes about patterns. Questions I had.
Answers I found. This forced me to understand before I generated.

**Scripts second.** I built small tools to check my assumptions. Quick tests.
Simple validations. Ways to prove that the code did what I thought it did. Not
what the AI assumed.

**Tests third.** I wrote tests before asking AI for implementation. Not because
TDD is trendy. Because if I could not write the test, I did not understand the
problem. The test became proof of understanding.

**AI last.** Only after I had documentation, scripts, and tests did I let AI
write the main code. By then, I could verify its work. I could catch wrong
assumptions. I could say "no, that pattern is old" or "wait, that function does
something different."

This felt slower at first. It was slower at first. But the code was actually
good. The PRs got approved. The senior developers stopped looking worried.

## For Teams: How to Prepare

If you lead a team, you need to think about this now. Your next new hire will
arrive with AI superpowers. Are you ready?

**Write down your assumptions.** The things that seem obvious to you. The
patterns you follow. The conventions you use. The history that explains why. New
developers will not know these. Their AI tools will not know either. Write it
down.

**Create a context package.** A collection of documents that explain how things
work. Not just what the code does. Why it does it. What you tried before. What
failed. What succeeded. Give this to new developers on day one.

**Design safe first tasks.** Not just easy tasks. Safe tasks. Work where AI
assumptions cannot cause damage. Tasks that teach more than they produce. Let
new developers build context before they build features.

**Review differently.** When you review code from new developers, ask: "Did you
write this or did AI write this?" Not to judge. To teach. Help them see where AI
made wrong assumptions. Show them what context they were missing.

**Pair program more.** Sitting with a new developer for an hour teaches more
than ten documents. You can share the hidden knowledge. The things that are not
written anywhere. The tribal wisdom that AI cannot access.

## The Future We Are Building

AI is not going away. It is getting better. New developers will have more power,
not less.

This is not bad. It is actually wonderful. Developers can contribute faster.
Teams can move quicker. Products can improve sooner.

But only if we handle the context problem.

The old onboarding was slow because understanding takes time. That has not
changed. Understanding still takes time. What changed is that we can now write
code before we understand.

That is a superpower and a trap.

My advice to new developers: be humble about your knowledge, even when your code
looks great. Spend the time to understand. Documentation first. Context before
code. Learning before shipping.

My advice to teams: prepare for AI-powered new hires. Write things down. Share
context generously. Design onboarding that builds understanding, not just
productivity.

The future belongs to developers who combine AI power with deep understanding.
Not one or the other. Both.

I learned this lesson through embarrassment. You can learn it from this post
instead.

That is a much better way.

---

_Zoltan Erdos is a developer based in Brighton, UK, building spike.land. He
believes onboarding is changing forever and wants to help both sides get it
right._
