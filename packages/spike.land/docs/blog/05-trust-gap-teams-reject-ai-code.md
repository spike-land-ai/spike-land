# The Trust Gap: Why Teams Reject AI-Generated Code

_By Zoltan Erdos | Brighton, UK | January 2026_

I knew something was wrong when my PR sat untouched for three days.

The code was good. The tests passed. The feature worked exactly as requested. I
had checked everything twice. But nobody would approve it.

Then I heard the conversation in the break room. "That one from Zoltan? I will
just rewrite it myself. Faster than reviewing all that AI stuff."

That is when I understood. They were not reviewing my work. They were avoiding
it.

## The Pattern I Could Not Ignore

Every developer knows this feeling: you submit a PR and wait. Sometimes the wait
is short. Sometimes it takes longer. But there is a different kind of waiting.
The kind where your PR sits in a queue that never moves.

My PRs started taking three to four times longer to review than my colleagues'
work. Same size. Same complexity. Same feature area. But mine would sit there
while others flew through.

At first, I thought I was doing something wrong. Maybe my code had problems.
Maybe I was missing something obvious. So I worked harder. I added more tests. I
wrote better documentation. I made my PRs smaller.

Nothing changed.

The truth was simpler and more painful. Everything coming from me was treated
differently. Not because of what I wrote. Because of how I wrote it.

## When Trust Breaks Down

Here is what I learned about trust in software teams: it is fragile. And once
people decide you are using AI, that trust can break very fast.

My colleagues would rather redo my entire PR than give me feedback. Think about
that. They preferred to spend hours rewriting work from scratch instead of
spending minutes telling me what to fix.

This makes no sense if you think about code quality. But it makes perfect sense
if you think about trust.

When a developer sees code they believe came from AI, something changes in their
mind. They stop seeing code. They start seeing a threat. Not a threat to the
codebase. A threat to themselves.

They think: if AI can write this code, what does that mean for me?

## The Fear Nobody Talks About

I do not want to have those fights anymore. The ones where someone says "there
is something wrong with it" before they even look at the code. The ones where
the conversation is already over before it begins.

But I understand why they fight. I understand the fear.

Software development has always been about craft. We spent years learning our
skills. We built careers on being able to solve hard problems. We took pride in
our ability to write code that works.

Now there is a tool that can do this too. Maybe not perfectly. Maybe not always.
But well enough to be scary.

When a colleague looks at my AI-assisted PR, they are not just reviewing code.
They are looking at their own future. And some of them do not like what they
see.

So they push back. They find problems. They request changes. They delay. They
rewrite. Anything to prove that the human way is still better. That they are
still needed.

This is not about my code. This is about their identity.

## The Cost We All Pay

The fighting is exhausting. But the real cost is bigger than my frustration.

When teams reject AI-assisted work, they waste time. My time writing code that
gets thrown away. Their time rewriting code that already worked. Everyone's time
in meetings arguing about process instead of building products.

But the worst cost is to relationships. I used to enjoy working with these
people. We would grab coffee. We would joke around. We would help each other.

Now there is tension. Suspicion. Distance. They look at my commits and wonder
what is really mine. I look at their feedback and wonder if it is honest or just
fear talking.

We are on the same team. We have the same goals. But AI has put a wall between
us.

## How I Broke Trust

Let me be specific about what I did wrong.

When I joined the team, there was a ticket about tracking analytics for a
checkout flow. I did not understand the architecture. I did not know that the
basket was server-side, that the backend was the single source of truth. I
assumed the frontend held the data.

I asked Claude to help. Claude generated code that called the Basket API when it
did not need to be called. The code looked perfect. It passed the tests. I
submitted it.

In the code review, a colleague asked why I was calling the Basket API. I could
not answer. Because I did not know. Because I did not understand what I had
submitted.

A senior developer was more direct: the PR was essentially garbage. Only tiny
parts were useful.

That incident broke something. Not just my confidence. Their trust.

Now, even when my PRs are good - and they are good now, I have completely
changed how I work - they still get treated differently. The skepticism is
unconscious. They do not mean to distrust me. But the memory of that PR lingers.

## Building Bridges

I wish I had an easy answer. I do not. But I have learned some things that help.

First, I stopped hiding. For a while, I tried to make my AI-assisted code look
like I wrote it all myself. This was a mistake. People found out anyway, and it
made the trust problem worse. Now I am open about my tools. Not defensive. Not
apologetic. Just honest.

Second, I started showing my work. Not just the final code. The thinking behind
it. The problems I solved. The decisions I made. When people see that I
understand what I submitted, they trust it more.

Third, I ask for feedback differently. Instead of "please review my PR," I try
"I would love your thoughts on this approach." It sounds small. But it changes
the conversation from judgment to collaboration.

Fourth, I help others learn. Some of my colleagues are curious about AI tools
but afraid to try them. When I share what I have learned, when I help them
experiment, we become partners instead of competitors.

Fifth, I completely changed my process. I spend 30% of my effort on planning -
having the AI interview me until I fully understand the problem. I spend 50% on
testing - including agent-based tests that use the feature like a real user
would. The code itself takes almost no time. But I know exactly what it does and
why.

Sixth, I give it time. Trust does not rebuild overnight. Every good PR, every
helpful conversation, every moment of genuine collaboration adds a little bit
back. It is slow. But it is working.

## The Future We Need to Build

Here is what I believe: AI is not going away. It will only get better. Teams
that learn to work with AI-assisted developers will move faster than teams that
fight it.

But we cannot force this change. We have to earn it.

That means being patient with colleagues who are scared. Understanding that
their resistance comes from a real place. Proving through our work that AI is a
tool, not a replacement.

It also means being honest about our own fears. I worry too. I wonder if my
skills will matter in five years. I do not have answers. Nobody does.

What I do know is this: the wall between AI developers and traditional
developers hurts everyone. We need to find a way through it. Not around it.
Through it.

That starts with trust. And trust starts with understanding.

## The Current Reality

My PRs are excellent now. I know this because I understand every line. Because I
can answer every question. Because the tests prove it works. Because agents have
tested it like humans would.

But my PRs still take longer to review than my colleagues' work. The bottleneck
is not the code anymore. It is the lingering memory of that basket API PR.

This is the hidden cost of producing slop. It is not just bad code that gets
thrown away. It is broken trust that takes months to rebuild. It is colleagues
who unconsciously hesitate before opening your PR.

The speed limitation is no longer technical. It is social. I can ship a feature
in hours. But getting it reviewed and merged can take days.

Despite this, I am positive. The system works. The quality is there. Each good
PR adds a little trust back. The gap is getting smaller.

Some colleagues have even started asking me about AI tools. They see that my
recent work is solid. They are curious how I do it.

That is progress. Real progress.

## The Way Forward

The fight is not over. But I think we are finally starting to have a different
conversation. Not "is AI code acceptable?" but "how do we work together in this
new world?"

For anyone reading this who damaged their reputation with early AI mistakes: it
is not permanent. You can rebuild. It just takes time and consistent quality.

Have the AI interview you during planning. Build comprehensive documentation.
Test thoroughly. Know your code inside and out.

Trust rebuilds one good PR at a time. It is slow. But it is worth it.

---

_Zoltan Erdos is a developer based in Brighton, UK, building spike.land. He
writes about the human side of AI-assisted development._
