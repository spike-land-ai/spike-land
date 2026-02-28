import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { ToolCard } from "@/components/docs/ToolCard";
import { Link } from "@/components/ui/link";
import type { DocsTool } from "@/lib/docs/types";

import toolsManifest from "@/lib/docs/generated/tools-manifest.json";

interface CategoryPageProps {
  params: Promise<{ category: string; }>;
}

export async function generateStaticParams() {
  return toolsManifest.categories.map((cat: { name: string; }) => ({
    category: cat.name,
  }));
}

export async function generateMetadata(
  { params }: CategoryPageProps,
): Promise<Metadata> {
  const { category } = await params;
  const cat = toolsManifest.categories.find((c: { name: string; }) => c.name === category);
  if (!cat) return { title: "Category Not Found" };

  const formatted = category
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    title: `${formatted} Tools - Documentation - spike.land`,
    description: cat.description,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const cat = toolsManifest.categories.find((c: { name: string; }) => c.name === category);

  if (!cat) {
    notFound();
  }

  const tools = (toolsManifest.tools as DocsTool[]).filter(
    t => t.category === category,
  );

  const formatted = category
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto pt-24 pb-16 px-4 max-w-5xl">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link
            href="/docs"
            className="hover:text-foreground transition-colors"
          >
            Docs
          </Link>
          <span className="text-white/20">/</span>
          <Link
            href="/docs/tools"
            className="hover:text-foreground transition-colors"
          >
            Tools
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-foreground">{formatted}</span>
        </nav>

        {/* Back link */}
        <Link
          href="/docs/tools"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          All Categories
        </Link>

        {/* Header */}
        <div className="mb-12 space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold">{formatted}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            {cat.description}
          </p>
          <p className="text-sm text-muted-foreground/60">
            {tools.length} tool{tools.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Tools grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map(tool => <ToolCard key={tool.name} tool={tool} />)}
        </div>
      </div>
    </div>
  );
}
