import type { Metadata } from "next";
import { BookOpen, Code2, Layout, Map, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommentSection } from "@/components/engagement/CommentSection";
import { Link } from "@/components/ui/link";

import apiManifest from "@/lib/docs/generated/api-manifest.json";
import markdownManifest from "@/lib/docs/generated/markdown-manifest.json";
import pagesManifest from "@/lib/docs/generated/pages-manifest.json";
import toolsManifest from "@/lib/docs/generated/tools-manifest.json";

export const metadata: Metadata = {
  title: "Documentation - spike.land",
  description:
    "Everything you need to build with spike.land. Browse MCP tools, API endpoints, guides, and more.",
};

const sections = [
  {
    title: "MCP Tools",
    description: "Browse all MCP tools organized by category with full parameter documentation.",
    href: "/docs/tools",
    icon: Wrench,
    countKey: "tools" as const,
  },
  {
    title: "API Reference",
    description: "REST API endpoints for every feature, with methods and auth requirements.",
    href: "/docs/api",
    icon: Code2,
    countKey: "api" as const,
  },
  {
    title: "Guides",
    description: "In-depth guides covering setup, workflows, architecture, and best practices.",
    href: "/docs/guides",
    icon: BookOpen,
    countKey: "guides" as const,
  },
  {
    title: "Components",
    description: "UI component library built on shadcn/ui with Tailwind CSS and glass-morphism.",
    href: "/docs/components",
    icon: Layout,
    countKey: "components" as const,
  },
  {
    title: "Visual Sitemap",
    description: "Interactive map of every page and route in the platform.",
    href: "/docs/sitemap",
    icon: Map,
    countKey: "pages" as const,
  },
];

export default function DocsLandingPage() {
  const toolCount = toolsManifest.tools.length;
  const apiCount = apiManifest.length;
  const pageCount = pagesManifest.length;
  const guideCount = markdownManifest.length;

  const counts: Record<string, number> = {
    tools: toolCount,
    api: apiCount,
    guides: guideCount,
    components: 0,
    pages: pageCount,
  };

  const stats = [
    { label: "MCP Tools", value: toolCount },
    { label: "API Endpoints", value: apiCount },
    { label: "Pages", value: pageCount },
    { label: "Guides", value: guideCount },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto pt-24 pb-16 px-4 max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-16 space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent-foreground/80 to-primary/60">
            spike.land Documentation
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to build with spike.land
          </p>

          {/* Live stats */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            {stats.map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {stat.value}
                </span>
                <span className="text-sm text-muted-foreground">
                  {stat.label}
                </span>
                {i < stats.length - 1 && (
                  <span className="text-white/20 ml-1" aria-hidden="true">
                    |
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Category cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map(section => {
            const Icon = section.icon;
            const count = counts[section.countKey];
            return (
              <Link
                key={section.href}
                href={section.href}
                className="group block no-underline"
              >
                <Card className="h-full bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-white/[0.08] transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2 text-primary group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg">
                          {section.title}
                        </CardTitle>
                      </div>
                      {count != null && count > 0 && (
                        <Badge
                          variant="outline"
                          className="text-xs tabular-nums"
                        >
                          {count}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {section.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Feedback & Comments */}
        <div className="mt-16">
          <CommentSection contentType="docs" contentSlug="main" />
        </div>
      </div>
    </div>
  );
}
