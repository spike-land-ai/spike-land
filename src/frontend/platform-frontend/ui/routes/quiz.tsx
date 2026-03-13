import { Link } from "@tanstack/react-router";

export function QuizPage() {
  return (
    <div className="rubik-container rubik-page rubik-stack">
      <section
        className="rubik-panel-strong space-y-6 p-6 text-center sm:p-10"
        aria-labelledby="quiz-heading"
      >
        <span className="rubik-eyebrow">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Knowledge &amp; Learning
        </span>
        <h1
          id="quiz-heading"
          className="text-4xl font-semibold tracking-[-0.06em] text-foreground sm:text-5xl"
        >
          Quiz
        </h1>
        <p className="rubik-lede mx-auto">
          Test your knowledge on programming, AI, and developer topics. Earn badges and track your
          learning progress.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/learnit"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all duration-200"
          >
            Start Learning
          </Link>
          <Link
            to="/apps"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-7 py-3 text-sm font-semibold text-foreground hover:border-primary/24 hover:text-primary transition-colors"
          >
            Browse Apps
          </Link>
        </div>
      </section>

      <section aria-label="Quiz categories" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { emoji: "⚛️", title: "React & TypeScript", slug: "react-typescript" },
          { emoji: "🤖", title: "AI & LLMs", slug: "ai-llms" },
          { emoji: "☁️", title: "Cloud & Edge", slug: "cloud-edge" },
          { emoji: "🔐", title: "Security", slug: "security" },
          { emoji: "🗄️", title: "Databases", slug: "databases" },
          { emoji: "🏗️", title: "Architecture", slug: "architecture" },
          { emoji: "📡", title: "APIs & MCP", slug: "apis-mcp" },
          { emoji: "🚀", title: "DevOps & CI", slug: "devops-ci" },
        ].map(({ emoji, title, slug }) => (
          <Link
            key={slug}
            to="/learnit/$topic"
            params={{ topic: slug }}
            className="group rubik-panel flex items-center gap-4 p-5 transition-colors hover:border-primary/40"
            aria-label={`Quiz: ${title}`}
          >
            <span className="text-2xl">{emoji}</span>
            <div>
              <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                {title}
              </p>
              <p className="text-xs text-muted-foreground">Start quiz</p>
            </div>
          </Link>
        ))}
      </section>

      <div className="rubik-panel p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Your Progress</h2>
        <p className="text-sm text-muted-foreground">
          Sign in to track your quiz scores, earn badges, and see your learning history.
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/24 hover:text-primary transition-colors"
          >
            Sign in to track progress
          </Link>
        </div>
      </div>
    </div>
  );
}
