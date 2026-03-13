/**
 * LearnIt Index Page
 *
 * Landing page for the AI-powered wiki with:
 * - 8 category cards with icons, topic count, and difficulty range
 * - Search bar with autocomplete suggestions
 * - Popular Topics grid
 * - Recently Viewed section (localStorage)
 */

import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { useProgress } from "../../components/learnit/useProgress";

// ─── Static Data ─────────────────────────────────────────────────────────────

interface Category {
  id: string;
  label: string;
  icon: string;
  description: string;
  topicCount: number;
  difficulty: string;
  color: string;
}

const CATEGORIES: Category[] = [
  {
    id: "web-dev",
    label: "Web Development",
    icon: "🌐",
    description: "Frontend, backend, APIs, and browser tech",
    topicCount: 48,
    difficulty: "Beginner–Advanced",
    color: "from-blue-500/10 to-cyan-500/10 border-blue-500/20",
  },
  {
    id: "ai-ml",
    label: "AI & Machine Learning",
    icon: "🤖",
    description: "LLMs, transformers, RAG, and MCP protocol",
    topicCount: 36,
    difficulty: "Intermediate–Expert",
    color: "from-purple-500/10 to-pink-500/10 border-purple-500/20",
  },
  {
    id: "cloud",
    label: "Cloud",
    icon: "☁️",
    description: "Edge computing, Cloudflare Workers, serverless",
    topicCount: 32,
    difficulty: "Intermediate–Advanced",
    color: "from-sky-500/10 to-blue-500/10 border-sky-500/20",
  },
  {
    id: "devops",
    label: "DevOps",
    icon: "🔧",
    description: "CI/CD, Docker, Kubernetes, observability",
    topicCount: 28,
    difficulty: "Intermediate–Expert",
    color: "from-orange-500/10 to-amber-500/10 border-orange-500/20",
  },
  {
    id: "mobile",
    label: "Mobile",
    icon: "📱",
    description: "React Native, PWA, iOS, Android, performance",
    topicCount: 24,
    difficulty: "Beginner–Advanced",
    color: "from-green-500/10 to-emerald-500/10 border-green-500/20",
  },
  {
    id: "data",
    label: "Data",
    icon: "📊",
    description: "Databases, pipelines, analytics, warehousing",
    topicCount: 30,
    difficulty: "Beginner–Advanced",
    color: "from-yellow-500/10 to-amber-500/10 border-yellow-500/20",
  },
  {
    id: "security",
    label: "Security",
    icon: "🔒",
    description: "OAuth, JWT, API security, zero-trust",
    topicCount: 22,
    difficulty: "Intermediate–Expert",
    color: "from-red-500/10 to-rose-500/10 border-red-500/20",
  },
  {
    id: "design",
    label: "Design",
    icon: "🎨",
    description: "Design systems, Figma, UX research, accessibility",
    topicCount: 20,
    difficulty: "Beginner–Advanced",
    color: "from-fuchsia-500/10 to-pink-500/10 border-fuchsia-500/20",
  },
];

const POPULAR_TOPICS = [
  { label: "TypeScript", slug: "typescript" },
  { label: "React Hooks", slug: "react-hooks" },
  { label: "GraphQL", slug: "graphql" },
  { label: "Docker", slug: "docker" },
  { label: "Kubernetes", slug: "kubernetes" },
  { label: "WebAssembly", slug: "webassembly" },
  { label: "Rust", slug: "rust" },
  { label: "LLMs", slug: "llms" },
  { label: "MCP Protocol", slug: "mcp-protocol" },
  { label: "Edge Computing", slug: "edge-computing" },
  { label: "WebSockets", slug: "websockets" },
  { label: "OAuth 2.0", slug: "oauth-2" },
] as const;

const AUTOCOMPLETE_SUGGESTIONS = [
  "TypeScript generics",
  "React Server Components",
  "WebAssembly fundamentals",
  "Kubernetes networking",
  "JWT authentication",
  "GraphQL subscriptions",
  "Docker multi-stage builds",
  "LLM fine-tuning",
  "MCP protocol specification",
  "Edge computing patterns",
  "CSS Grid layout",
  "Service Workers API",
  "Rust ownership model",
  "SQL window functions",
  "OAuth 2.0 flows",
  "React Hooks best practices",
  "Cloudflare Workers",
  "Prompt engineering",
  "RAG architecture",
  "Zero-trust security",
];

const RECENTLY_VIEWED_KEY = "learnit-recently-viewed-v1";

interface RecentTopic {
  slug: string;
  label: string;
  viewedAt: number;
}

function loadRecentlyViewed(): RecentTopic[] {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentTopic[];
  } catch {
    return [];
  }
}

// ─── Category Card ────────────────────────────────────────────────────────────

function CategoryCard({
  category,
  progress,
}: {
  category: Category;
  progress: number;
}) {
  return (
    <Link
      to="/learnit/$topic"
      params={{ topic: category.id }}
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 transition-all hover:scale-[1.02] hover:shadow-lg ${category.color}`}
    >
      <div className="flex items-start justify-between">
        <span className="text-3xl" aria-hidden="true">
          {category.icon}
        </span>
        {progress > 0 && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            {progress}%
          </span>
        )}
      </div>
      <h3 className="mt-3 font-semibold text-foreground group-hover:text-primary transition-colors">
        {category.label}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{category.description}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{category.topicCount} topics</span>
        <span className="rounded-full bg-background/50 px-2 py-0.5">{category.difficulty}</span>
      </div>
      {progress > 0 && (
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-background/50">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${progress}% complete`}
          />
        </div>
      )}
    </Link>
  );
}

// ─── Search Bar with Autocomplete ─────────────────────────────────────────────

function SearchBar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filterSuggestions = useCallback((value: string) => {
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }
    const lower = value.toLowerCase();
    const filtered = AUTOCOMPLETE_SUGGESTIONS.filter((s) =>
      s.toLowerCase().includes(lower),
    ).slice(0, 6);
    setSuggestions(filtered);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setFocusedIndex(-1);
    filterSuggestions(value);
    setShowSuggestions(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setFocusedIndex(-1);
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      e.preventDefault();
      const suggestion = suggestions[focusedIndex];
      if (suggestion) {
        setQuery(suggestion);
        setShowSuggestions(false);
      }
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const searchSlug = query.trim().toLowerCase().replace(/\s+/g, "-") || "getting-started";

  return (
    <div className="relative mx-auto max-w-2xl">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => query.trim() && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Search any topic... e.g. 'WebAssembly fundamentals'"
            aria-label="Search topics"
            aria-autocomplete="list"
            aria-expanded={showSuggestions && suggestions.length > 0}
            aria-activedescendant={
              focusedIndex >= 0 ? `suggestion-${focusedIndex}` : undefined
            }
            aria-controls="autocomplete-list"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />

          {showSuggestions && suggestions.length > 0 && (
            <ul
              ref={listRef}
              id="autocomplete-list"
              role="listbox"
              aria-label="Topic suggestions"
              className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-background shadow-lg"
            >
              {suggestions.map((suggestion, i) => (
                <li
                  key={suggestion}
                  id={`suggestion-${i}`}
                  role="option"
                  aria-selected={i === focusedIndex}
                  className={`cursor-pointer px-4 py-2.5 text-sm transition-colors ${
                    i === focusedIndex
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                  onMouseDown={() => selectSuggestion(suggestion)}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link
          to="/learnit/$topic"
          params={{ topic: searchSlug }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Search
        </Link>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function LearnitIndexPage() {
  const { getCategoryProgress, totalCompleted } = useProgress();
  const [recentlyViewed, setRecentlyViewed] = useState<RecentTopic[]>([]);

  useEffect(() => {
    setRecentlyViewed(loadRecentlyViewed());
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-14 px-4 py-10">
      {/* Hero */}
      <div className="space-y-5 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Learn Anything. Instantly.
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          AI-powered wiki that explains any topic at the depth you need. Search a topic or browse
          categories below.
        </p>
        {totalCompleted > 0 && (
          <p className="text-sm text-primary font-medium">
            {totalCompleted} topic{totalCompleted !== 1 ? "s" : ""} completed
          </p>
        )}
      </div>

      {/* Search */}
      <SearchBar />

      {/* Categories */}
      <section className="space-y-6" aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="text-2xl font-semibold">
          Categories
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              progress={getCategoryProgress(cat.id)}
            />
          ))}
        </div>
      </section>

      {/* Popular Topics */}
      <section className="space-y-6" aria-labelledby="popular-heading">
        <h2 id="popular-heading" className="text-2xl font-semibold">
          Popular Topics
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {POPULAR_TOPICS.map((topic) => (
            <Link
              key={topic.slug}
              to="/learnit/$topic"
              params={{ topic: topic.slug }}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted hover:text-primary"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                {topic.label.charAt(0)}
              </span>
              {topic.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <section className="space-y-6" aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="text-2xl font-semibold">
            Recently Viewed
          </h2>
          <div className="flex flex-wrap gap-3">
            {recentlyViewed.map((topic) => (
              <Link
                key={topic.slug}
                to="/learnit/$topic"
                params={{ topic: topic.slug }}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <span className="text-muted-foreground" aria-hidden="true">
                  ↩
                </span>
                {topic.label}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
