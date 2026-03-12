import { Link, useParams } from "@tanstack/react-router";

export function CreateAppPage() {
  const { appPath } = useParams({ strict: false }) as { appPath: string };

  const displayName = appPath
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <div className="space-y-3">
        <Link
          to="/create"
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          &larr; Back to Create
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
        <p className="text-muted-foreground">
          Open this app in the code editor to customize it, or create your own version.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/vibe-code"
          search={{ prompt: `Create a ${displayName} app` }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Open in Editor
        </Link>
        <Link
          to="/create"
          className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Create Something New
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        <p>Preview for &ldquo;{displayName}&rdquo; will load here.</p>
      </div>
    </div>
  );
}
