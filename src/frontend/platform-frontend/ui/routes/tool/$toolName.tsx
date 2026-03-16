import { useParams } from "@tanstack/react-router";
import { lazy, Suspense, useEffect } from "react";
import { ArrowLeft, Loader2, Share2, Zap } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMcpTools } from "../../src/hooks/useMcp";
import { formatIdentifier } from "../../components/tool-surface/formatting";

const ToolSurface = lazy(() =>
  import("../../components/tool-surface/ToolSurface").then((m) => ({
    default: m.ToolSurface,
  })),
);

export function ToolSurfacePage() {
  const { toolName } = useParams({ strict: false });
  const { data: toolsData } = useMcpTools();
  const tool = toolsData?.tools?.find((t) => t.name === toolName);

  // Set page title dynamically
  useEffect(() => {
    if (tool) {
      document.title = `${formatIdentifier(tool.name)} — spike.land Playground`;
    }
  }, [tool]);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `${toolName} — spike.land`, url });
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="rubik-container max-w-3xl mx-auto p-6 space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/tools"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All Tools
        </Link>
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>
      </div>

      {/* Hero */}
      {tool && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {formatIdentifier(tool.name)}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="rubik-chip px-2 py-0.5 text-[10px]">{tool.category}</span>
                <code className="text-[11px] font-mono text-muted-foreground">{tool.name}</code>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{tool.description}</p>
        </div>
      )}

      {/* Playground */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <ToolSurface toolName={toolName ?? ""} defaultExpanded />
      </Suspense>

      {/* Schema.org structured data */}
      {tool && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: formatIdentifier(tool.name),
              description: tool.description,
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Web",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              url: `https://spike.land/tool/${tool.name}`,
            }),
          }}
        />
      )}
    </div>
  );
}
