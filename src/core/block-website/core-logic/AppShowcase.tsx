import { Link } from "../lazy-imports/link";
import { useDevModeCopy } from "../ui/useDevModeCopy";

const categories = [
  {
    name: "Developer Tools",
    description: "Build, test, and deploy with confidence.",
    apps: [
      { name: "qa-studio", label: "QA Studio", desc: "Automated browser testing", icon: "🧪" },
      { name: "spike-review", label: "Code Review", desc: "AI-powered code review", icon: "🔍" },
      { name: "esbuild-wasm", label: "Build Tools", desc: "Browser-based compilation", icon: "⚡" },
      { name: "state-machine", label: "State Machine", desc: "Visual workflow builder", icon: "⚙️" },
    ],
  },
  {
    name: "Creative & Media",
    description: "Create images, content, and more with AI.",
    apps: [
      {
        name: "mcp-image-studio",
        label: "Image Studio",
        desc: "AI image generation & editing",
        icon: "🎨",
      },
      { name: "hackernews-mcp", label: "HackerNews", desc: "Read & discuss tech news", icon: "📰" },
    ],
  },
  {
    name: "Games & Fun",
    description: "Play and compete.",
    apps: [
      {
        name: "chess-engine",
        label: "Chess Arena",
        desc: "Play chess against AI or friends",
        icon: "♟️",
      },
    ],
  },
];

export function AppShowcase() {
  const headingCopy = useDevModeCopy(
    "Ready-to-run apps for every workflow",
    "Composable surfaces for every developer workflow",
  );
  const bodyCopy = useDevModeCopy(
    "Whether you are building software, growing a brand, or creating art, spike.land has the apps you need, powered by AI.",
    "From browser automation to media generation and orchestration, spike.land exposes deployable capabilities instead of disconnected demos.",
  );
  const browseCopy = useDevModeCopy("Browse all tools", "Inspect all capabilities");

  return (
    <section
      aria-labelledby="showcase-heading"
      className="rubik-container-wide rubik-section-compact border-t border-border"
    >
      <div>
        <header className="mx-auto mb-12 max-w-3xl text-center">
          <h2
            id="showcase-heading"
            className="mb-4 text-3xl font-semibold tracking-[-0.05em] text-foreground sm:text-4xl"
          >
            {headingCopy.text}
          </h2>
          <p className="rubik-lede mx-auto">{bodyCopy.text}</p>
        </header>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div key={category.name} className="rubik-panel flex flex-col p-6">
              <h3 className="mb-2 text-xl font-semibold tracking-[-0.03em] text-foreground">
                {category.name}
              </h3>
              <p className="mb-6 text-sm leading-7 text-muted-foreground">{category.description}</p>

              <ul className="space-y-3 flex-1">
                {category.apps.map((app) => (
                  <li key={app.name}>
                    <Link
                      href={`/tools/${app.name}`}
                      className="group block rounded-2xl border border-border bg-background/80 p-4 transition-[border-color,box-shadow] duration-200 hover:border-primary/24 hover:shadow-[var(--panel-shadow)]"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-muted text-xl"
                          role="img"
                          aria-label={app.name}
                        >
                          {app.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium tracking-[-0.02em] text-foreground group-hover:text-primary">
                            {app.label}
                          </div>
                          <div className="text-sm text-muted-foreground mt-0.5 truncate">
                            {app.desc}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        ...
        <div className="mt-16 text-center">
          <Link
            href="/tools"
            className="inline-flex items-center justify-center rounded-[calc(var(--radius-control)-0.1rem)] border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/24 hover:text-primary"
          >
            {browseCopy.text} &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
