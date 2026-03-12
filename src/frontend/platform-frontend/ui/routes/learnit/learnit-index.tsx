import { Link } from "@tanstack/react-router";
import { useState } from "react";

const CATEGORIES = [
  "Programming",
  "AI & Machine Learning",
  "Web Development",
  "Data Science",
  "DevOps",
  "Security",
  "Mobile Development",
  "Design",
] as const;

const POPULAR_TOPICS = [
  "TypeScript",
  "React Hooks",
  "GraphQL",
  "Docker",
  "Kubernetes",
  "WebAssembly",
  "Rust",
  "LLMs",
  "MCP Protocol",
  "Edge Computing",
  "WebSockets",
  "OAuth 2.0",
] as const;

export function LearnitIndexPage() {
  const [query, setQuery] = useState("");

  return (
    <div className="mx-auto max-w-5xl space-y-12 py-8">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Learn Anything. Instantly.
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          AI-powered wiki that explains any topic at the depth you need. Search a topic or browse
          categories below.
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any topic... e.g. 'WebAssembly fundamentals'"
            className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Link
            to="/learnit/$topic"
            params={{ topic: query || "getting-started" }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Search
          </Link>
        </div>
      </div>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Categories</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              to="/learnit/$topic"
              params={{ topic: cat.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-") }}
              className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-muted"
            >
              <h3 className="font-semibold text-foreground group-hover:text-primary">{cat}</h3>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Popular Topics</h2>
        <div className="flex flex-wrap gap-3">
          {POPULAR_TOPICS.map((topic) => (
            <Link
              key={topic}
              to="/learnit/$topic"
              params={{ topic: topic.toLowerCase().replace(/ /g, "-") }}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              {topic}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
