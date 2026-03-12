import { Link, useParams } from "@tanstack/react-router";

export function LearnitTopicPage() {
  const { topic } = useParams({ strict: false }) as { topic: string };

  const displayName = topic
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <div className="space-y-3">
        <Link
          to="/learnit"
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          &larr; Back to Learn
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-8">
        <p className="text-muted-foreground">
          AI-generated content about <strong>{displayName}</strong> is loading...
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          This page will use the LearnIt MCP tool to generate comprehensive, structured content
          about this topic on demand.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
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
          Take a Quiz
        </Link>
      </div>
    </div>
  );
}
