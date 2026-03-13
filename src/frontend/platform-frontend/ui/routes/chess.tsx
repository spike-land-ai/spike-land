import { Link } from "@tanstack/react-router";

export function ChessPage() {
  return (
    <div className="rubik-container rubik-page rubik-stack">
      <section
        className="rubik-panel-strong space-y-6 p-6 text-center sm:p-10"
        aria-labelledby="chess-heading"
      >
        <span className="rubik-eyebrow">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Games &amp; Simulation
        </span>
        <h1
          id="chess-heading"
          className="text-4xl font-semibold tracking-[-0.06em] text-foreground sm:text-5xl"
        >
          Chess Arena
        </h1>
        <p className="rubik-lede mx-auto">
          Stateful chess gameplay with ELO ratings, challenge flows, and game history — powered by
          the spike.land chess engine MCP tools.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/apps/$appSlug"
            params={{ appSlug: "chess-engine" }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all duration-200"
          >
            Open Chess Engine
          </Link>
          <Link
            to="/apps"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-7 py-3 text-sm font-semibold text-foreground hover:border-primary/24 hover:text-primary transition-colors"
          >
            Browse All Apps
          </Link>
        </div>
      </section>

      <section aria-label="Chess features" className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: "♟",
            title: "ELO Ratings",
            desc: "Competitive ranking system tracks your progress across games.",
          },
          {
            icon: "🏆",
            title: "Challenge Mode",
            desc: "Issue and accept challenges from other players via MCP tools.",
          },
          {
            icon: "📊",
            title: "Game History",
            desc: "Full move-by-move replay and analysis of completed games.",
          },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="rubik-panel p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xl">
              {icon}
            </div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>

      <div className="rubik-panel p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Chess is powered by the{" "}
          <Link to="/apps/$appSlug" params={{ appSlug: "chess-engine" }} className="text-primary hover:underline">
            chess-engine MCP app
          </Link>
          . Open it to start playing.
        </p>
      </div>
    </div>
  );
}
