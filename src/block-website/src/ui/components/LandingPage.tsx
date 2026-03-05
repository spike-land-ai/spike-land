import { LandingHero } from "./landing/LandingHero";
import { AppShowcase } from "./landing/AppShowcase";
import { TryItNow } from "./landing/TryItNow";
import { TryItCta } from "./landing/TryItCta";
import { BlogListView } from "./BlogList";
import { Link } from "./ui/link";

export function LandingPage() {
  return (
    <div className="text-foreground font-sans">
      <LandingHero />
      
      <TryItNow />

      <AppShowcase />

      <TryItCta />

      <section
        aria-labelledby="features-heading"
        className="py-20 sm:py-24 border-t border-border bg-muted/50"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 id="features-heading" className="text-3xl font-bold tracking-tight text-foreground mb-4 text-balance">
            How it works
          </h2>
          <p className="text-muted-foreground mb-10 max-w-2xl leading-relaxed">
            spike.land connects your AI assistant to real-world tools using the{" "}
            <strong>Model Context Protocol (MCP)</strong> — an open standard that lets AI apps
            discover and use tools automatically. Think of it as a universal plug for AI.
          </p>
          <dl className="divide-y divide-border">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 py-6 first:pt-0">
              <dt className="sm:w-36 shrink-0 font-semibold text-foreground">Browse &amp; connect</dt>
              <dd className="text-muted-foreground leading-relaxed">
                Pick from our library of ready-made tools. Each one connects to your AI assistant in seconds — no coding required.
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 py-6">
              <dt className="sm:w-36 shrink-0 font-semibold text-foreground">Works everywhere</dt>
              <dd className="text-muted-foreground leading-relaxed">
                Built on the Model Context Protocol, an open standard supported by Claude, ChatGPT, Cursor, and other AI assistants. Connect once, use anywhere.
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 py-6 last:pb-0">
              <dt className="sm:w-36 shrink-0 font-semibold text-foreground">Build your own</dt>
              <dd className="text-muted-foreground leading-relaxed">
                Need something custom? Describe what you want, and our builder creates it for you. We handle hosting, security, and updates.
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
              Latest from the Blog
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

    </div>
  );
}

