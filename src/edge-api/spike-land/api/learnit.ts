import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import type { Env } from "../core-logic/env";
import { createDb } from "../db/db/db-index";
import { learnItContent } from "../db/db/schema";
import { acceptsMarkdown, markdownResponse } from "../../common/core-logic/content-negotiation";

export const learnitRoute = new Hono<{ Bindings: Env }>();

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuizQuestion {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

interface GeneratedTopicData {
  slug: string;
  title: string;
  description: string;
  content: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  estimatedMinutes: number;
  quiz: QuizQuestion[];
}

// ─── Content Generation ───────────────────────────────────────────────────────

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function inferDifficulty(slug: string): "Beginner" | "Intermediate" | "Advanced" | "Expert" {
  const expertTopics = [
    "kubernetes",
    "webassembly",
    "compiler",
    "rust",
    "llms",
    "transformers",
    "distributed-systems",
  ];
  const advancedTopics = [
    "graphql",
    "docker",
    "oauth-2",
    "mcp-protocol",
    "edge-computing",
    "rag",
    "fine-tuning",
  ];
  const beginnerTopics = ["html", "css", "javascript-basics", "git-basics", "sql-basics"];

  if (expertTopics.some((t) => slug.includes(t))) return "Expert";
  if (advancedTopics.some((t) => slug.includes(t))) return "Advanced";
  if (beginnerTopics.some((t) => slug.includes(t))) return "Beginner";
  return "Intermediate";
}

function generateStructuredContent(title: string, slug: string): string {
  const difficulty = inferDifficulty(slug);

  return `## Overview

${title} is a core concept in modern software development. Whether you're just getting started or looking to deepen your understanding, this guide covers the essential knowledge you need.

**Difficulty:** ${difficulty}
**Prerequisites:** Basic programming knowledge

## What is ${title}?

${title} is a set of principles, patterns, and tools that enable developers to build reliable, scalable systems. It has become an essential skill in the modern engineering landscape.

At its core, ${title} solves the problem of complexity by providing structured approaches to common challenges. Understanding the fundamentals gives you a strong foundation for applying these concepts in real-world projects.

## Key Concepts

### Fundamentals

The foundational aspects of ${title} include:

- **Core principles** — the invariants that don't change regardless of implementation
- **Common patterns** — reusable solutions to recurring problems
- **Trade-offs** — every approach has benefits and costs to consider

### How It Works

\`\`\`typescript
// Example: demonstrating ${title} concepts in TypeScript
interface Config {
  enabled: boolean;
  timeout: number;
  retries: number;
}

function createDefaultConfig(): Config {
  return {
    enabled: true,
    timeout: 5000,
    retries: 3,
  };
}

function applyConfig(base: Config, overrides: Partial<Config>): Config {
  return { ...base, ...overrides };
}

const config = applyConfig(createDefaultConfig(), { timeout: 10000 });
console.log(config);
\`\`\`

### Integration Patterns

When integrating ${title} into existing systems, follow these patterns:

1. **Start small** — introduce concepts incrementally
2. **Measure impact** — establish baselines before optimizing
3. **Document decisions** — capture why, not just what
4. **Iterate** — refine based on real-world feedback

## Practical Example

Here is a more complete example showing ${title} in action:

\`\`\`javascript
// Real-world usage pattern
const processor = {
  process(input) {
    if (!input || typeof input !== 'string') {
      throw new Error('Input must be a non-empty string');
    }
    return input.trim().toLowerCase().replace(/\\s+/g, '-');
  },

  batch(inputs) {
    return inputs.map(i => this.process(i));
  }
};

console.log(processor.process("  Hello World  "));
console.log(processor.batch(["Foo Bar", "Baz Qux"]));
\`\`\`

## Best Practices

Following these practices will help you get the most out of ${title}:

1. **Understand before abstracting** — master the basics before reaching for frameworks
2. **Consistency matters** — apply patterns uniformly across your codebase
3. **Test edge cases** — the interesting bugs live in the corners
4. **Keep it simple** — complexity should be justified by real requirements
5. **Stay current** — this space evolves rapidly; follow the community

## Common Pitfalls

Avoid these mistakes when working with ${title}:

- **Over-engineering** — solving problems you don't have yet
- **Skipping fundamentals** — jumping to advanced features without understanding basics
- **Ignoring errors** — always handle failure cases explicitly
- **Premature optimization** — measure first, then optimize
- **Tight coupling** — design for flexibility from the start

## Performance Considerations

When using ${title} at scale, keep in mind:

- Monitor resource usage in production environments
- Cache aggressively where data is stable
- Use connection pooling for I/O-bound operations
- Profile before optimizing — intuition is often wrong

## Further Reading

To deepen your understanding, explore:

- Official documentation and specifications
- Community blogs and case studies
- Open source implementations for reference
- Academic papers for theoretical foundations

## Summary

${title} is a powerful tool in any developer's toolkit. By understanding its core principles, practicing with real examples, and following best practices, you'll be well-equipped to apply it effectively in your projects.

The key takeaway: start with fundamentals, build intuition through practice, and always measure impact before optimizing.
`;
}

function generateQuiz(title: string, slug: string): QuizQuestion[] {
  const difficulty = inferDifficulty(slug);
  return [
    {
      question: `What is the primary purpose of ${title}?`,
      options: [
        "To reduce development team size",
        "To solve complexity through structured principles and patterns",
        "To eliminate all runtime errors",
        "To replace existing programming languages",
      ],
      correctIndex: 1,
      explanation: `${title} provides structured approaches to managing complexity, enabling developers to build more reliable and maintainable systems.`,
    },
    {
      question: `Which of the following is a best practice when learning ${title}?`,
      options: [
        "Jump directly to advanced features",
        "Master fundamentals before reaching for frameworks",
        "Optimize performance before measuring",
        "Avoid writing tests initially",
      ],
      correctIndex: 1,
      explanation:
        "Understanding the fundamentals before adding abstractions ensures you build on a solid foundation and can debug problems effectively.",
    },
    {
      question: "What is 'over-engineering'?",
      options: [
        "Writing too many unit tests",
        "Using too many comments in code",
        "Adding unnecessary complexity for problems you don't have",
        "Deploying too frequently",
      ],
      correctIndex: 2,
      explanation:
        "Over-engineering means solving problems that don't exist yet, which increases complexity without delivering value.",
    },
    {
      question: `What difficulty level is ${title} considered?`,
      options: ["Beginner", "Intermediate", "Advanced", "Expert"],
      correctIndex:
        difficulty === "Beginner"
          ? 0
          : difficulty === "Intermediate"
            ? 1
            : difficulty === "Advanced"
              ? 2
              : 3,
      explanation: `${title} is classified as ${difficulty} because it requires ${
        difficulty === "Beginner"
          ? "only basic programming knowledge"
          : difficulty === "Intermediate"
            ? "solid programming fundamentals and some practical experience"
            : difficulty === "Advanced"
              ? "deep understanding of related systems and patterns"
              : "expert-level knowledge of systems, algorithms, and architectural patterns"
      }.`,
    },
    {
      question: "When should you optimize for performance?",
      options: [
        "Before writing any code",
        "After measuring and identifying real bottlenecks",
        "Only in production",
        "Never — modern hardware is fast enough",
      ],
      correctIndex: 1,
      explanation:
        "Premature optimization is a common pitfall. Always measure first to identify actual bottlenecks before spending time optimizing.",
    },
  ];
}

// ─── Routes ────────────────────────────────────────────────────────────────────

// List published topics (JSON only)
learnitRoute.get("/api/learnit", async (c) => {
  const db = createDb(c.env.DB);

  const topics = await db
    .select({
      slug: learnItContent.slug,
      title: learnItContent.title,
      description: learnItContent.description,
      viewCount: learnItContent.viewCount,
    })
    .from(learnItContent)
    .where(eq(learnItContent.status, "published"))
    .orderBy(desc(learnItContent.viewCount))
    .limit(100);

  c.header("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
  return c.json({ topics, total: topics.length });
});

// Generate content for a new topic (POST /api/learnit/generate)
learnitRoute.post("/api/learnit/generate", async (c) => {
  let body: { slug?: unknown };
  try {
    body = (await c.req.json()) as { slug?: unknown };
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : null;
  if (!slug) {
    return c.json({ error: "slug is required" }, 400);
  }

  const title = slugToTitle(slug);
  const difficulty = inferDifficulty(slug);
  const content = generateStructuredContent(title, slug);
  const quiz = generateQuiz(title, slug);
  const estimatedMinutes = Math.max(5, Math.round(content.split(" ").length / 200));

  // Attempt to cache in D1 (best-effort, no auth required for generation)
  try {
    const db = createDb(c.env.DB);
    const existing = await db
      .select({ id: learnItContent.id })
      .from(learnItContent)
      .where(eq(learnItContent.slug, slug))
      .limit(1);

    if (existing.length === 0) {
      const id = crypto.randomUUID();
      await db.insert(learnItContent).values({
        id,
        slug,
        title,
        description: `Learn about ${title} — concepts, examples, and best practices.`,
        content,
        status: "published",
        viewCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  } catch {
    // DB unavailable in some environments — still return the generated data
  }

  const result: GeneratedTopicData = {
    slug,
    title,
    description: `Learn about ${title} — concepts, examples, and best practices.`,
    content,
    difficulty,
    estimatedMinutes,
    quiz,
  };

  c.header("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  return c.json(result);
});

// Get individual topic
learnitRoute.get("/api/learnit/:slug", async (c) => {
  const slug = c.req.param("slug");
  const db = createDb(c.env.DB);

  const results = await db
    .select()
    .from(learnItContent)
    .where(eq(learnItContent.slug, slug))
    .limit(1);

  const topic = results[0];

  if (!topic || topic.status !== "published") {
    return c.json({ error: "Topic not found" }, 404);
  }

  // Increment view count in the background
  try {
    c.executionCtx.waitUntil(
      db
        .update(learnItContent)
        .set({ viewCount: topic.viewCount + 1 })
        .where(eq(learnItContent.id, topic.id)),
    );
  } catch {
    /* no ExecutionContext in some environments */
  }

  // Content negotiation: return raw content for agents
  if (acceptsMarkdown(c)) {
    return markdownResponse(topic.content, "public, max-age=300");
  }

  // Enrich with generated quiz and metadata
  const difficulty = inferDifficulty(slug);
  const quiz = generateQuiz(topic.title, slug);
  const estimatedMinutes = Math.max(5, Math.round(topic.content.split(" ").length / 200));

  c.header("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
  return c.json({
    slug: topic.slug,
    title: topic.title,
    description: topic.description,
    content: topic.content,
    viewCount: topic.viewCount + 1,
    difficulty,
    estimatedMinutes,
    quiz,
  });
});
