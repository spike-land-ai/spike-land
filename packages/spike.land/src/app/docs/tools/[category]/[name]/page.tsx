import type { Metadata } from "next";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/components/ui/link";
import type { DocsTool } from "@/lib/docs/types";

import toolsManifest from "@/lib/docs/generated/tools-manifest.json";

interface ToolDetailPageProps {
  params: Promise<{ category: string; name: string; }>;
}

export async function generateStaticParams() {
  return (toolsManifest.tools as DocsTool[]).map(tool => ({
    category: tool.category,
    name: tool.name,
  }));
}

export async function generateMetadata(
  { params }: ToolDetailPageProps,
): Promise<Metadata> {
  const { category, name } = await params;
  const tool = (toolsManifest.tools as DocsTool[]).find(
    t => t.category === category && t.name === name,
  );
  if (!tool) return { title: "Tool Not Found" };

  const displayName = tool.name.replace(/_/g, " ");
  return {
    title: `${displayName} - MCP Tools - spike.land`,
    description: tool.description,
  };
}

function formatCategoryName(name: string): string {
  return name
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function ToolDetailPage({ params }: ToolDetailPageProps) {
  const { category, name } = await params;
  const tool = (toolsManifest.tools as DocsTool[]).find(
    t => t.category === category && t.name === name,
  );

  if (!tool) {
    notFound();
  }

  const displayName = tool.name.replace(/_/g, " ");
  const formattedCategory = formatCategoryName(category);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto pt-24 pb-16 px-4 max-w-4xl">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8 flex-wrap">
          <Link
            href="/docs"
            className="hover:text-foreground transition-colors"
          >
            Docs
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-white/20" />
          <Link
            href="/docs/tools"
            className="hover:text-foreground transition-colors"
          >
            Tools
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-white/20" />
          <Link
            href={`/docs/tools/${category}`}
            className="hover:text-foreground transition-colors"
          >
            {formattedCategory}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-white/20" />
          <span className="text-foreground">{displayName}</span>
        </nav>

        {/* Back links */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/docs/tools/${category}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {formattedCategory}
          </Link>
        </div>

        {/* Tool header */}
        <div className="mb-10 space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold">{displayName}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{formattedCategory}</Badge>
            <Badge variant={tool.tier === "free" ? "success" : "secondary"}>
              {tool.tier}
            </Badge>
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {tool.description}
          </p>
        </div>

        {/* Parameters */}
        {tool.parameters.length > 0
          ? (
            <Card className="bg-white/5 border border-white/10">
              <CardHeader>
                <CardTitle className="text-xl">Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Name
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Type
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Required
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tool.parameters.map(param => (
                        <tr
                          key={param.name}
                          className="border-b border-white/5 last:border-0"
                        >
                          <td className="py-3 px-4">
                            <code className="text-sm font-mono text-primary">
                              {param.name}
                            </code>
                          </td>
                          <td className="py-3 px-4">
                            <code className="text-sm font-mono text-muted-foreground">
                              {param.type}
                            </code>
                          </td>
                          <td className="py-3 px-4">
                            {param.required
                              ? (
                                <Badge
                                  variant="warning"
                                  className="text-[10px]"
                                >
                                  required
                                </Badge>
                              )
                              : (
                                <span className="text-muted-foreground/50 text-xs">
                                  optional
                                </span>
                              )}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {param.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )
          : (
            <Card className="bg-white/5 border border-white/10">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  This tool takes no parameters.
                </p>
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  );
}
