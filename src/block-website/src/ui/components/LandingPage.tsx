import { LandingHero } from "./landing/LandingHero";
import { BlogListView } from "./BlogList";
import { Link } from "./ui/link";

export function LandingPage() {
  return (
    <main className="text-foreground font-sans">
      <LandingHero />

      <section
        aria-labelledby="features-heading"
        className="py-20 sm:py-24 border-t border-border bg-muted/50"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2
            id="features-heading"
            className="text-3xl font-bold tracking-tight text-foreground mb-10 text-balance"
          >
            What's in the registry
          </h2>
          <dl className="divide-y divide-border">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 py-6 first:pt-0">
              <dt className="sm:w-32 shrink-0 font-semibold text-foreground">MCP Tools</dt>
              <dd className="text-muted-foreground leading-relaxed">
                80+ tools: image gen, code compilation, HackerNews, QA automation, and more. All callable via any MCP client.
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 py-6">
              <dt className="sm:w-32 shrink-0 font-semibold text-foreground">spike-cli</dt>
              <dd className="text-muted-foreground leading-relaxed">
                Local CLI multiplexer. One JSON config. Tools load on demand. Your AI sees only what it needs for the current task.
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 py-6 last:pb-0">
              <dt className="sm:w-32 shrink-0 font-semibold text-foreground">Build your own</dt>
              <dd className="text-muted-foreground leading-relaxed">
                Write an MCP tool in the browser. Deploys to the registry on Cloudflare Workers instantly.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section
        aria-labelledby="updates-heading"
        className="py-20 sm:py-24 border-t border-border"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <header className="mb-10 flex items-baseline justify-between">
            <h2
              id="updates-heading"
              className="text-3xl font-bold tracking-tight text-foreground"
            >
              Latest
            </h2>
            <Link
              href="/blog"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              All posts &rarr;
            </Link>
          </header>

          <BlogListView limit={3} showHeader={false} />
        </div>
      </section>
    </main>
  );
}
