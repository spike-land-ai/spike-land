import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/components/ui/link";

import toolsManifest from "@/lib/docs/generated/tools-manifest.json";

export const metadata: Metadata = {
  title: "MCP Tools - Documentation - spike.land",
  description:
    "Browse all MCP tools by category. Each tool is documented with parameters, types, and descriptions.",
};

function formatCategoryName(name: string): string {
  return name
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function ToolsIndexPage() {
  const { categories } = toolsManifest;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto pt-24 pb-16 px-4 max-w-5xl">
        {/* Back link */}
        <Link
          href="/docs"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Documentation
        </Link>

        {/* Header */}
        <div className="mb-12 space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold">MCP Tools</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            {toolsManifest.tools.length} tools across {categories.length}{" "}
            categories. Every platform feature exposed as an MCP tool.
          </p>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((
            category: {
              name: string;
              toolCount: number;
              description: string;
              tier: string;
            },
          ) => (
            <Link
              key={category.name}
              href={`/docs/tools/${category.name}`}
              className="group block no-underline"
            >
              <Card className="h-full bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-white/[0.08] transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {formatCategoryName(category.name)}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs tabular-nums">
                      {category.toolCount}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {category.description}
                  </p>
                  <Badge
                    variant={category.tier === "free" ? "success" : "secondary"}
                    className="text-[10px]"
                  >
                    {category.tier}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
