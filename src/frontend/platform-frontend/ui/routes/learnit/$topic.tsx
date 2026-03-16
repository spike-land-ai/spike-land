/**
 * LearnIt Topic Detail Page
 *
 * Features:
 * - Hero section with title, difficulty badge, estimated time
 * - Markdown-rendered content from learnit API
 * - Table of contents sidebar (auto-generated from headings)
 * - Interactive code examples (copy + simulated run)
 * - Previous / Next topic navigation
 * - Progress tracking (% complete per topic via quiz)
 */

import { Link, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { TopicQuiz } from "../../components/learnit/TopicQuiz";
import { useProgress } from "../../components/learnit/useProgress";
import type { QuizQuestion } from "../../components/learnit/TopicQuiz";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopicData {
  slug: string;
  title: string;
  description: string;
  content: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  estimatedMinutes?: number;
  quiz?: QuizQuestion[];
  viewCount?: number;
}

interface TocEntry {
  id: string;
  text: string;
  level: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RECENTLY_VIEWED_KEY = "learnit-recently-viewed-v1";
const MAX_RECENT = 6;

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: "bg-green-500/10 text-green-600 dark:text-green-400",
  Intermediate: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Advanced: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  Expert: "bg-red-500/10 text-red-600 dark:text-red-400",
};

// Adjacent topics for navigation (ordered flat list from popular topics)
const TOPIC_ORDER = [
  "typescript",
  "react-hooks",
  "graphql",
  "docker",
  "kubernetes",
  "webassembly",
  "rust",
  "llms",
  "mcp-protocol",
  "edge-computing",
  "websockets",
  "oauth-2",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function extractToc(markdown: string): TocEntry[] {
  const lines = markdown.split("\n");
  const toc: TocEntry[] = [];
  for (const line of lines) {
    const match = /^(#{1,4})\s+(.+)/.exec(line);
    if (match && match[1] && match[2]) {
      const level = match[1].length;
      const text = match[2].trim();
      toc.push({ id: slugify(text), text, level });
    }
  }
  return toc;
}

function saveRecentlyViewed(slug: string, label: string) {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    const existing: Array<{ slug: string; label: string; viewedAt: number }> = raw
      ? (JSON.parse(raw) as Array<{ slug: string; label: string; viewedAt: number }>)
      : [];
    const filtered = existing.filter((t) => t.slug !== slug);
    const updated = [{ slug, label, viewedAt: Date.now() }, ...filtered].slice(0, MAX_RECENT);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable
  }
}

function displayName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── Markdown Renderer ────────────────────────────────────────────────────────

function renderMarkdown(md: string): string {
  // Very lightweight markdown → HTML — good enough for the generated content
  return md
    .replace(
      /^#### (.+)$/gm,
      `<h4 id="${"$1".toLowerCase().replace(/\s+/g, "-")}" class="text-base font-semibold mt-6 mb-2 text-foreground">$1</h4>`,
    )
    .replace(
      /^### (.+)$/gm,
      (_, t: string) =>
        `<h3 id="${slugify(t)}" class="text-lg font-semibold mt-8 mb-3 text-foreground">${t}</h3>`,
    )
    .replace(
      /^## (.+)$/gm,
      (_, t: string) =>
        `<h2 id="${slugify(t)}" class="text-xl font-bold mt-10 mb-4 text-foreground border-b border-border pb-2">${t}</h2>`,
    )
    .replace(
      /^# (.+)$/gm,
      (_, t: string) =>
        `<h1 id="${slugify(t)}" class="text-2xl font-bold mt-2 mb-4 text-foreground">${t}</h1>`,
    )
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(
      /`([^`]+)`/g,
      '<code class="rounded bg-muted px-1 py-0.5 text-sm font-mono text-foreground">$1</code>',
    )
    .replace(
      /```(\w+)?\n([\s\S]*?)```/g,
      (_, lang: string | undefined, code: string) =>
        `<pre class="learnit-code-block" data-lang="${lang ?? ""}"><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`,
    )
    .replace(
      /^> (.+)$/gm,
      '<blockquote class="border-l-4 border-primary/40 pl-4 italic text-muted-foreground my-4">$1</blockquote>',
    )
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-foreground">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-foreground">$2</li>')
    .replace(/\n\n/g, '</p><p class="my-3 text-foreground leading-relaxed">')
    .replace(/^(?!<[hplbco])(.+)$/gm, (line) =>
      line.trim() ? `<p class="my-3 text-foreground leading-relaxed">${line}</p>` : "",
    );
}

// ─── Code Block with Run Button ───────────────────────────────────────────────

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API may be blocked
    }
  };

  const handleRun = () => {
    if (lang !== "javascript" && lang !== "js" && lang !== "ts" && lang !== "typescript") {
      setOutput("Run is only supported for JavaScript/TypeScript examples.");
      return;
    }
    setRunning(true);
    setOutput(null);
    // Simulate execution with captured console.log
    try {
      const logs: string[] = [];
      const fakeConsole = {
        log: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
        error: (...args: unknown[]) => logs.push(`[error] ${args.map(String).join(" ")}`),
      };
      new Function("console", `"use strict"; ${code}`)(fakeConsole);
      setOutput(logs.length ? logs.join("\n") : "(no output)");
    } catch (err) {
      setOutput(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRunning(false);
    }
  };

  const canRun = ["javascript", "js", "typescript", "ts"].includes((lang ?? "").toLowerCase());

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2">
        <span className="text-xs font-mono text-muted-foreground">{lang || "code"}</span>
        <div className="flex gap-2">
          {canRun && (
            <button
              type="button"
              onClick={handleRun}
              disabled={running}
              className="rounded-md bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              {running ? "Running..." : "Run"}
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-md bg-muted px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            aria-label={copied ? "Copied" : "Copy code"}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      <pre className="overflow-x-auto p-4 text-sm font-mono text-foreground">
        <code>{code}</code>
      </pre>
      {output !== null && (
        <div className="border-t border-border bg-background px-4 py-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Output
          </p>
          <pre className="text-xs text-foreground whitespace-pre-wrap">{output}</pre>
        </div>
      )}
    </div>
  );
}

// ─── Content Renderer with Interactive Code Blocks ────────────────────────────

function ContentRenderer({ content }: { content: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Replace learnit-code-block placeholders with interactive CodeBlock portals
    const preBlocks = container.querySelectorAll<HTMLPreElement>("pre.learnit-code-block");
    for (const pre of preBlocks) {
      const lang = pre.getAttribute("data-lang") ?? "";
      const code = pre.querySelector("code")?.textContent ?? "";
      // Create a mount point and inject CodeBlock via innerHTML approach
      const wrapper = document.createElement("div");
      wrapper.className = "learnit-code-wrapper";
      pre.replaceWith(wrapper);
      // We render statically since we can't use ReactDOM.createRoot here trivially
      // Instead, encode the code block data for the CodeBlocksRenderer below
      wrapper.setAttribute("data-lang", lang);
      wrapper.setAttribute("data-code", code);
    }
  }, [content]);

  return (
    <div
      ref={containerRef}
      className="prose-learnit max-w-none"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}

// ─── Table of Contents ────────────────────────────────────────────────────────

function TableOfContents({ entries, activeId }: { entries: TocEntry[]; activeId: string | null }) {
  if (entries.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="sticky top-24 space-y-1">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        On this page
      </p>
      {entries.map((entry) => (
        <a
          key={entry.id}
          href={`#${entry.id}`}
          className={`block rounded-md py-1 text-sm transition-colors ${
            entry.level === 2 ? "pl-0" : entry.level === 3 ? "pl-3" : "pl-6"
          } ${
            activeId === entry.id
              ? "font-medium text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {entry.text}
        </a>
      ))}
    </nav>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function LearnitTopicPage() {
  const { topic } = useParams({ strict: false }) as { topic: string };
  const [topicData, setTopicData] = useState<TopicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeHeading, setActiveHeading] = useState<string | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const { completeTopic, isCompleted } = useProgress();

  const name = displayName(topic);

  // Navigation
  const topicIndex = TOPIC_ORDER.indexOf(topic);
  const prevTopic = topicIndex > 0 ? TOPIC_ORDER[topicIndex - 1] : null;
  const nextTopic =
    topicIndex >= 0 && topicIndex < TOPIC_ORDER.length - 1 ? TOPIC_ORDER[topicIndex + 1] : null;

  // Save to recently viewed
  useEffect(() => {
    saveRecentlyViewed(topic, name);
  }, [topic, name]);

  // Fetch topic content
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setTopicData(null);
    setQuizCompleted(false);

    async function fetchTopic() {
      try {
        const res = await fetch(`/api/learnit/${encodeURIComponent(topic)}`);
        if (!res.ok) {
          if (res.status === 404) {
            // Topic not found — request generation
            const genRes = await fetch(`/api/learnit/generate`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slug: topic }),
            });
            if (!genRes.ok) throw new Error("Failed to generate content");
            const generated = (await genRes.json()) as TopicData;
            if (!cancelled) setTopicData(generated);
          } else {
            throw new Error(`HTTP ${res.status}`);
          }
        } else {
          const data = (await res.json()) as TopicData;
          if (!cancelled) setTopicData(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load content");
          // Show a graceful fallback with generated content
          if (!cancelled) {
            setTopicData({
              slug: topic,
              title: name,
              description: `Learn about ${name} — concepts, examples, and best practices.`,
              content: generateFallbackContent(name),
              difficulty: "Intermediate",
              estimatedMinutes: 10,
              quiz: generateFallbackQuiz(name),
            });
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTopic();
    return () => {
      cancelled = true;
    };
  }, [topic, name]);

  // Intersection observer for active heading
  const toc = useMemo(() => (topicData ? extractToc(topicData.content) : []), [topicData]);

  useEffect(() => {
    if (toc.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0% -70% 0%", threshold: 0 },
    );

    const headings = document.querySelectorAll("h2[id], h3[id], h4[id]");
    for (const el of headings) observer.observe(el);
    return () => observer.disconnect();
  }, [toc]);

  const handleQuizComplete = useCallback(
    (score: number) => {
      setQuizCompleted(true);
      completeTopic(topic, score);
    },
    [topic, completeTopic],
  );

  const completed = isCompleted(topic);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Back link */}
      <Link
        to="/learnit"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <span aria-hidden="true">←</span> Back to LearnIt
      </Link>

      <div className="flex gap-10">
        {/* Main content */}
        <div className="min-w-0 flex-1 space-y-8">
          {/* Hero */}
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                <div className="h-9 w-2/3 animate-pulse rounded-xl bg-muted" />
                <div className="h-5 w-full animate-pulse rounded-lg bg-muted" />
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {topicData?.title ?? name}
                  </h1>
                  {completed && (
                    <span
                      className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-600 dark:text-green-400"
                      title="You have completed this topic"
                    >
                      Completed
                    </span>
                  )}
                </div>

                {topicData?.description && (
                  <p className="text-base text-muted-foreground">{topicData.description}</p>
                )}

                <div className="flex flex-wrap gap-3">
                  {topicData?.difficulty && (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${DIFFICULTY_COLORS[topicData.difficulty] ?? DIFFICULTY_COLORS["Intermediate"]}`}
                    >
                      {topicData.difficulty}
                    </span>
                  )}
                  {topicData?.estimatedMinutes && (
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      {topicData.estimatedMinutes} min read
                    </span>
                  )}
                  {topicData?.viewCount !== undefined && (
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      {topicData.viewCount.toLocaleString()} views
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Error banner (content still shows as fallback) */}
          {error && !loading && (
            <div className="rounded-lg border border-orange-500/30 bg-orange-50/5 px-4 py-3 text-sm text-orange-600 dark:text-orange-400">
              Could not reach the API — showing generated content. {error}
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-4 animate-pulse rounded bg-muted"
                  style={{ width: `${70 + (i % 3) * 10}%` }}
                />
              ))}
            </div>
          ) : topicData ? (
            <article className="learnit-content" aria-label={`Content for ${topicData.title}`}>
              <ContentRenderer content={topicData.content} />
            </article>
          ) : null}

          {/* Interactive code blocks (rendered separately after main content) */}
          {!loading && topicData && <InteractiveCodeBlocks content={topicData.content} />}

          {/* Quiz */}
          {!loading && topicData?.quiz && topicData.quiz.length > 0 && !quizCompleted && (
            <section
              className="rounded-2xl border border-border bg-card p-6"
              aria-labelledby="quiz-heading"
            >
              <TopicQuiz
                questions={topicData.quiz}
                topicSlug={topic}
                onComplete={handleQuizComplete}
              />
            </section>
          )}

          {quizCompleted && !completed && (
            <div className="rounded-2xl border border-green-500/30 bg-green-50/5 p-6 text-center">
              <p className="text-lg font-semibold text-foreground">Quiz complete!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Progress saved. Keep exploring more topics.
              </p>
            </div>
          )}

          {/* Navigation */}
          <nav
            aria-label="Topic navigation"
            className="flex items-center justify-between border-t border-border pt-6"
          >
            {prevTopic ? (
              <Link
                to="/learnit/$topic"
                params={{ topic: prevTopic }}
                className="group flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
              >
                <span aria-hidden="true" className="text-muted-foreground group-hover:text-primary">
                  ←
                </span>
                <span>
                  <span className="block text-xs text-muted-foreground">Previous</span>
                  {displayName(prevTopic)}
                </span>
              </Link>
            ) : (
              <div />
            )}

            {nextTopic ? (
              <Link
                to="/learnit/$topic"
                params={{ topic: nextTopic }}
                className="group flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
              >
                <span className="text-right">
                  <span className="block text-xs text-muted-foreground">Next</span>
                  {displayName(nextTopic)}
                </span>
                <span aria-hidden="true" className="text-muted-foreground group-hover:text-primary">
                  →
                </span>
              </Link>
            ) : (
              <div />
            )}
          </nav>

          {/* Fallback actions */}
          <div className="flex flex-wrap gap-3 border-t border-border pt-6">
            <Link
              to="/learnit"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Explore More Topics
            </Link>
            <Link
              to="/learn"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Quiz from URL
            </Link>
          </div>
        </div>

        {/* TOC Sidebar */}
        {!loading && toc.length > 1 && (
          <aside className="hidden w-56 shrink-0 xl:block" aria-label="Table of contents">
            <TableOfContents entries={toc} activeId={activeHeading} />
          </aside>
        )}
      </div>
    </div>
  );
}

// ─── Interactive Code Blocks (extracted from rendered HTML) ──────────────────

function InteractiveCodeBlocks({ content }: { content: string }) {
  const blocks = useMemo(() => {
    const matches = [...content.matchAll(/```(\w+)?\n([\s\S]*?)```/g)];
    return matches.map((m, i) => ({
      id: i,
      lang: m[1] ?? "",
      code: m[2] ?? "",
    }));
  }, [content]);

  if (blocks.length === 0) return null;

  return (
    <section className="space-y-4" aria-label="Interactive code examples">
      <h2 className="text-xl font-bold text-foreground border-b border-border pb-2">
        Code Examples
      </h2>
      {blocks.map((block) => (
        <CodeBlock key={block.id} lang={block.lang} code={block.code} />
      ))}
    </section>
  );
}

// ─── Fallback Content Generator ───────────────────────────────────────────────

function generateFallbackContent(name: string): string {
  return `## Overview

${name} is a fundamental concept in modern software development. Understanding it well opens up many possibilities for building better systems.

## Key Concepts

### What is ${name}?

${name} refers to the set of principles, patterns, and practices that enable developers to build reliable, scalable, and maintainable systems.

### Core Principles

- **Clarity**: Code should express intent clearly
- **Reliability**: Systems should behave predictably
- **Performance**: Optimize for the common case
- **Security**: Protect data and resources by default

## Practical Example

\`\`\`typescript
// A simple example demonstrating ${name} concepts
function example(input: string): string {
  const processed = input.trim().toLowerCase();
  return processed;
}

console.log(example("  Hello World  "));
\`\`\`

## Best Practices

1. Start with clear requirements
2. Write tests before implementing
3. Refactor continuously
4. Document decisions, not just code

## Common Pitfalls

- Over-engineering solutions
- Premature optimization
- Ignoring error cases
- Skipping documentation

## Summary

Mastering ${name} takes practice, but the fundamentals remain consistent: write clear code, test thoroughly, and iterate based on feedback.
`;
}

function generateFallbackQuiz(name: string): QuizQuestion[] {
  return [
    {
      question: `What is the primary benefit of understanding ${name}?`,
      options: [
        "Faster compile times",
        "Building more reliable and maintainable systems",
        "Smaller bundle sizes",
        "Fewer dependencies",
      ],
      correctIndex: 1,
      explanation: `Understanding ${name} enables developers to build systems that are reliable, scalable, and easier to maintain over time.`,
    },
    {
      question: "Which principle emphasizes writing code that clearly expresses its intent?",
      options: ["Performance", "Security", "Clarity", "Scalability"],
      correctIndex: 2,
      explanation:
        "Clarity is the principle that code should express intent clearly, making it easier to read and maintain.",
    },
    {
      question: "What is a common pitfall when applying new concepts?",
      options: [
        "Writing too many tests",
        "Over-engineering solutions",
        "Using version control",
        "Writing documentation",
      ],
      correctIndex: 1,
      explanation:
        "Over-engineering is a common pitfall where developers add unnecessary complexity in anticipation of future requirements that may never materialize.",
    },
    {
      question: "What should you do before implementing a feature?",
      options: [
        "Deploy to production",
        "Remove all comments",
        "Write tests first (TDD)",
        "Optimize for performance",
      ],
      correctIndex: 2,
      explanation:
        "Test-Driven Development (TDD) suggests writing tests before implementation to clarify requirements and ensure correctness.",
    },
  ];
}
