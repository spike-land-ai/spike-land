import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Plug,
  Shield,
  Layers,
  FolderOpen,
  Database,
  Globe,
  Code,
  Bot,
  BarChart3,
  Lock,
  MessageSquare,
  Cloud,
  Settings,
  Copy,
  Check,
  ArrowRight,
} from "lucide-react";
import { useMcpTools } from "../../src/hooks/useMcp";

type LucideIconComponent = React.ComponentType<{
  size?: number;
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}>;

const CATEGORY_ICON_MAP: Record<string, LucideIconComponent> = {
  "File System": FolderOpen,
  Database: Database,
  Web: Globe,
  Code: Code,
  AI: Bot,
  Analytics: BarChart3,
  Auth: Lock,
  Messaging: MessageSquare,
  Storage: Cloud,
  General: Settings,
};

const FALLBACK_ICON: LucideIconComponent = Settings;

function getCategoryIcon(category: string): LucideIconComponent {
  return CATEGORY_ICON_MAP[category] ?? FALLBACK_ICON;
}

const MCP_CONFIG_SNIPPET = `{
  "mcpServers": {
    "spike-land": {
      "url": "https://spike.land/mcp"
    }
  }
}`;

const WHAT_IS_MCP_CARDS: Array<{
  icon: LucideIconComponent;
  title: string;
  body: string;
}> = [
  {
    icon: Plug,
    title: "Model Context Protocol",
    body: "An open standard by Anthropic that lets AI models connect to external tools, data sources, and services through a unified interface.",
  },
  {
    icon: Layers,
    title: "One Connection, Everything",
    body: "Connect your AI client once and get access to the entire spike.land tool registry — no per-tool configuration or separate API keys.",
  },
  {
    icon: Shield,
    title: "Secure by Default",
    body: "OAuth 2.0 device flow authentication means your credentials never leave your device. Fine-grained scopes control exactly what tools each client can use.",
  },
];

const HOW_TO_CONNECT_CARDS: Array<{
  step: number;
  title: string;
  body: React.ReactNode;
  linkTo: string;
  linkLabel: string;
}> = [
  {
    step: 1,
    title: "Device Flow Auth",
    body: (
      <>
        Open your MCP client, point it at{" "}
        <code className="rubik-signal-rail px-1.5 py-0.5 text-xs">https://spike.land/mcp</code> and
        follow the device authorization prompt.
      </>
    ),
    linkTo: "/mcp/authorize",
    linkLabel: "Authorize device",
  },
  {
    step: 2,
    title: "API Keys",
    body: "Generate a long-lived API key in your settings and pass it as a Bearer token — ideal for server-to-server integrations.",
    linkTo: "/settings",
    linkLabel: "Manage API keys",
  },
  {
    step: 3,
    title: "SDK Integration",
    body: "Use the MCP TypeScript SDK or any compatible client library. Full documentation covers all transports and auth flows.",
    linkTo: "/docs",
    linkLabel: "Read the docs",
  },
];

export function McpPage() {
  const { data, isLoading, isError } = useMcpTools();
  const [copied, setCopied] = useState(false);

  const categories = useMemo(() => {
    const tools = data?.tools ?? [];
    const map = new Map<string, number>();
    for (const tool of tools) {
      const cat = tool.category || "General";
      map.set(cat, (map.get(cat) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [data]);

  const totalTools = data?.tools?.length ?? 0;

  function handleCopy() {
    void navigator.clipboard.writeText(MCP_CONFIG_SNIPPET).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rubik-stack">
      {/* Hero */}
      <section className="rubik-panel rubik-panel-strong px-8 py-16 text-center">
        <div className="space-y-6">
          <div className="flex justify-center">
            <span className="rubik-eyebrow">
              <span
                className="h-2 w-2 rounded-full bg-green-500 animate-pulse"
                aria-hidden="true"
              />
              {isLoading ? "Loading..." : `${totalTools}+ tools live`}
            </span>
          </div>

          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            80+ AI Tools, <span className="text-primary">One Protocol</span>
          </h1>

          <p className="rubik-lede mx-auto text-center">
            spike.land&apos;s MCP registry gives every AI model instant access to web search,
            databases, code execution, and more — through a single, authenticated connection.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/apps"
              className="rounded-[--radius-control] bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Browse Apps
            </Link>
            <Link
              to="/store"
              className="rounded-[--radius-control] border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Explore Store
            </Link>
          </div>
        </div>
      </section>

      {/* Quick-start config */}
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Add to your MCP client config
        </p>

        <div className="rubik-signal-rail relative overflow-hidden">
          <div className="flex items-start justify-between gap-4 px-5 py-4">
            <pre className="flex-1 overflow-x-auto text-sm leading-relaxed text-foreground">
              <code>{MCP_CONFIG_SNIPPET}</code>
            </pre>

            <button
              type="button"
              onClick={handleCopy}
              aria-label={copied ? "Copied" : "Copy config to clipboard"}
              className="mt-0.5 flex-none rounded-lg border border-border bg-card p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {copied ? (
                <Check size={16} aria-hidden className="text-green-500" />
              ) : (
                <Copy size={16} aria-hidden />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* What is MCP */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">What is MCP?</h2>

        <div className="grid gap-6 sm:grid-cols-3">
          {WHAT_IS_MCP_CARDS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rubik-panel space-y-4 p-6">
              <span className="rubik-icon-badge">
                <Icon size={20} aria-hidden />
              </span>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tool Categories */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Tool Categories</h2>
          <Link to="/apps" className="rubik-kicker-link">
            View all
            <ArrowRight size={14} aria-hidden />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rubik-panel h-24 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : isError || categories.length === 0 ? (
          <div className="rubik-panel p-10 text-center text-muted-foreground">
            Unable to load categories.{" "}
            <Link to="/apps" className="text-primary hover:underline">
              Browse apps directly
            </Link>
            .
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map(([category, count]) => {
              const Icon = getCategoryIcon(category);
              return (
                <Link
                  key={category}
                  to="/apps"
                  className="rubik-panel group flex items-center gap-4 p-5 transition-[border-color,box-shadow] hover:border-primary/30"
                  style={{ boxShadow: "var(--panel-shadow)" }}
                >
                  <span className="rubik-icon-badge flex-none">
                    <Icon size={18} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground transition-colors group-hover:text-primary truncate">
                      {category}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {count} {count === 1 ? "tool" : "tools"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* How to Connect */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">How to Connect</h2>

        <div className="grid gap-6 lg:grid-cols-3">
          {HOW_TO_CONNECT_CARDS.map(({ step, title, body, linkTo, linkLabel }) => (
            <div key={step} className="rubik-panel space-y-4 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                {step}
              </div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              <Link to={linkTo} className="rubik-kicker-link">
                {linkLabel}
                <ArrowRight size={13} aria-hidden />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rubik-panel rubik-panel-strong px-8 py-12 text-center space-y-5">
        <h2 className="text-2xl font-bold text-foreground">Ready to give your AI superpowers?</h2>
        <p className="rubik-lede mx-auto text-center">
          Connect in minutes. No credit card required for the free tier.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/store"
            className="rounded-[--radius-control] bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get Started Free
          </Link>
          <Link
            to="/pricing"
            className="rounded-[--radius-control] border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            View Pricing
          </Link>
        </div>
      </section>
    </div>
  );
}
