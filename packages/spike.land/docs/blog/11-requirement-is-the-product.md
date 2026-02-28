# The Requirement Is the Product

_By Zoltan Erdos | Brighton, UK | January 2026_

I wrote the perfect ticket last week. Three paragraphs. Clear acceptance
criteria. A diagram showing what should happen. Examples of edge cases.

Then I gave it to Claude. The AI built the feature in twenty minutes. No bugs.
No confusion. No back-and-forth.

That is when it hit me. I did not build that feature. The ticket built that
feature. The requirement was the product.

## The Old World

Let me tell you how software used to work.

Someone wrote requirements. Often vague. Often incomplete. Then developers spent
days figuring out what those requirements actually meant. They made assumptions.
They asked questions. They guessed when no one answered.

The real work was translating fuzzy ideas into working code. Requirements were
just the starting point. The heavy lifting came after.

A good developer could take a bad requirement and make something useful. That
was the skill. Understanding what people meant, not what they said.

I spent years developing this skill. Reading between the lines. Asking the right
questions. Making good assumptions when I had to.

Then AI changed everything.

## The Shift

Here is what happened. Code became instant.

With Claude Opus 4.6, I can describe a feature and watch it appear. Complex
features. Database queries. API endpoints. Frontend components. All of it, fast.

But only if the description is perfect.

When my requirements are clear, AI executes flawlessly. When my requirements are
vague, AI makes assumptions. Sometimes good assumptions. Sometimes terrible
ones.

I learned this the hard way. I would write a quick ticket. The AI would build
something. Then I would realize the AI misunderstood. But it did not
misunderstand. I was not clear. The AI did exactly what I asked. I just asked
for the wrong thing.

The bottleneck moved. It is no longer coding. It is requirements.

I used to spend twenty percent of my time on requirements and eighty percent on
coding. Now those numbers are reversed. I spend most of my time thinking about
what to build. The building itself takes minutes.

## The New Skill

If coding agents are making mistakes, the requirements were not specified well
enough.

I say this to myself every time something goes wrong. Not "the AI is broken."
Not "the model needs to improve." The issue in the first place was that the
ticket was not created properly. The requirement was not clear.

This is a mindset change. It puts the responsibility back on me.

Writing requirements for AI is different from writing requirements for humans.
Humans fill in gaps with intuition. They ask when confused. They make reasonable
assumptions based on experience.

AI does not work that way. AI takes your words literally. Every word. Every
assumption you did not state becomes an assumption the AI makes for you.

Good requirements for AI need:

**Explicit context.** What system is this for? What already exists? What
constraints apply? Do not assume the AI knows your codebase the way your
teammate does.

**Clear success criteria.** How do we know this works? What tests should pass?
What should the user see? Be specific. "It should work" is not good enough.

**Examples.** Show input and expected output. Edge cases too. When requirements
get confusing, examples make them clear.

**Boundaries.** What should this NOT do? What is out of scope? AI loves to be
helpful. It will add features you did not ask for if you do not tell it to stop.

## What Good Requirements Look Like

Let me show you the difference.

Bad requirement: "Add a login button."

The AI will add a button. Somewhere. With some styling. Doing something when
clicked. All of it will be assumptions.

Good requirement:

```
Add a login button to the navigation bar.

Location: Top right corner, next to the user avatar
Style: Use the existing "primary" button variant from our design system
Behavior on click: Open the LoginModal component
Text: "Sign In"
Visibility: Only show when user is not logged in

Test: When logged out, clicking the button should open the login modal.
Test: When logged in, the button should not appear.
```

The second requirement takes longer to write. But it builds the right thing on
the first try. No back-and-forth. No "that is not what I meant." No wasted time.

The requirement IS the work now.

## The Future

I think about where this goes.

If requirements are the bottleneck, maybe AI should help with requirements too.
And it can. I use AI to help me think through features. To ask what I am
forgetting. To suggest edge cases I missed.

But someone still needs to decide what to build. Someone still needs to
understand the problem. Someone still needs to say yes or no.

That someone might not be called a developer much longer. Maybe they are a
product person. Maybe they are a designer. Maybe they are something new we do
not have a name for yet.

I know one thing. The skill of writing clear requirements is more valuable than
ever. The person who can specify exactly what should happen, in a way AI can
execute perfectly, that person creates real value.

The code is just the output. The requirement is the product.

I spent twenty years learning to write code. Now I am learning to write
requirements. It feels strange. It feels like starting over. But it is the
reality.

The developers who figure this out will thrive. They will ship faster than ever.
They will build more than ever. Because their requirements will be so clear that
AI becomes an extension of their thinking.

The developers who keep treating requirements as a chore, something to rush
through before the "real work" begins, they will struggle. Their AI will make
mistakes. They will blame the tools. But the tools are not the problem.

The requirement is the product.

Write it like you mean it.

---

_Zoltan Erdos is a developer based in Brighton, UK, building spike.land. He now
spends more time writing tickets than writing code._
