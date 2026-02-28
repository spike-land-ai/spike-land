import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/components/ui/link";
import type { DocsApiEndpoint } from "@/lib/docs/types";
import { cn } from "@/lib/utils";
import { ArrowLeft, Globe, Lock, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import apiManifest from "@/lib/docs/generated/api-manifest.json";

const endpoints = apiManifest as DocsApiEndpoint[];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  POST: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  PUT: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  PATCH: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  DELETE: "bg-red-500/15 text-red-400 border-red-500/20",
};

function findEndpoint(segments: string[]): DocsApiEndpoint | undefined {
  const targetPath = `/api/${segments.join("/")}`;
  return endpoints.find(ep => ep.path === targetPath);
}

export function generateStaticParams(): Array<{ segments: string[]; }> {
  return endpoints
    .filter(ep => !/\[.*\]/.test(ep.path))
    .map(ep => ({
      segments: ep.path.replace(/^\/api\//, "").split("/").filter(Boolean),
    }));
}

interface PageProps {
  params: Promise<{ segments: string[]; }>;
}

export async function generateMetadata(
  { params }: PageProps,
): Promise<Metadata> {
  const { segments } = await params;
  const endpoint = findEndpoint(segments);
  if (!endpoint) {
    return { title: "Endpoint Not Found - spike.land" };
  }
  return {
    title: `${endpoint.path} - API Reference - spike.land`,
    description: endpoint.description,
  };
}

export default async function ApiEndpointDetailPage({ params }: PageProps) {
  const { segments } = await params;
  const endpoint = findEndpoint(segments);

  if (!endpoint) {
    return (
      <div className="space-y-6">
        <Link
          href="/docs/api"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to API Reference
        </Link>
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold font-heading text-foreground mb-2">
            Endpoint Not Found
          </h1>
          <p className="text-muted-foreground">
            The endpoint{" "}
            <code className="text-primary bg-white/10 px-2 py-0.5 rounded-md text-sm">
              /api/{segments.join("/")}
            </code>{" "}
            was not found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <Link
        href="/docs/api"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to API Reference
      </Link>

      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-2xl md:text-3xl font-bold font-heading font-mono tracking-tight text-foreground break-all">
          {endpoint.path}
        </h1>

        {/* Methods */}
        <div className="flex flex-wrap items-center gap-2">
          {endpoint.methods.map(method => (
            <span
              key={method}
              className={cn(
                "inline-flex items-center rounded-lg px-3 py-1 text-sm font-bold uppercase border",
                METHOD_COLORS[method]
                  ?? "bg-white/10 text-muted-foreground border-white/10",
              )}
            >
              {method}
            </span>
          ))}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Domain */}
        <Card className="bg-white/5 border border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider flex items-center gap-2">
              <Globe className="h-3.5 w-3.5" />
              Domain
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="capitalize text-sm">
              {endpoint.domain}
            </Badge>
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card className="bg-white/5 border border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              Authentication
            </CardTitle>
          </CardHeader>
          <CardContent>
            {endpoint.auth
              ? (
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-400">
                    Required
                  </span>
                </div>
              )
              : (
                <span className="text-sm font-medium text-emerald-400">
                  Public
                </span>
              )}
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <Card className="bg-white/5 border border-white/10">
        <CardHeader>
          <CardTitle className="text-lg font-bold font-heading">
            Description
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            {endpoint.description}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
