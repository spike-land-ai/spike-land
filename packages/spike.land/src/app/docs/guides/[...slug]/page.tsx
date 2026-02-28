import { Badge } from "@/components/ui/badge";
import { Link } from "@/components/ui/link";
import type { DocsGuide } from "@/lib/docs/types";
import { ArrowLeft, FileText } from "lucide-react";
import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";

import markdownManifest from "@/lib/docs/generated/markdown-manifest.json";

import { GuideContent } from "./guide-content";

const guides = markdownManifest as DocsGuide[];

function findGuide(slug: string[]): DocsGuide | undefined {
  const targetSlug = slug.join("/");
  return guides.find(g => g.slug === targetSlug);
}

export function generateStaticParams(): Array<{ slug: string[]; }> {
  return guides.map(g => ({
    slug: g.slug.split("/"),
  }));
}

interface PageProps {
  params: Promise<{ slug: string[]; }>;
}

export async function generateMetadata(
  { params }: PageProps,
): Promise<Metadata> {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide) {
    return { title: "Guide Not Found - spike.land" };
  }
  return {
    title: `${guide.title} - spike.land`,
    description: guide.excerpt.slice(0, 160),
  };
}

export default async function GuideDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const guide = findGuide(slug);

  if (!guide) {
    return (
      <div className="space-y-6">
        <Link
          href="/docs/guides"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Guides
        </Link>
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold font-heading text-foreground mb-2">
            Guide Not Found
          </h1>
          <p className="text-muted-foreground">
            The guide{" "}
            <code className="text-primary bg-white/10 px-2 py-0.5 rounded-md text-sm">
              {slug.join("/")}
            </code>{" "}
            was not found.
          </p>
        </div>
      </div>
    );
  }

  const docsRoot = path.join(process.cwd(), "docs");
  const filePath = path.join(docsRoot, guide.filePath);
  let content = "";

  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    content =
      `> Could not load content for this guide.\n\nThe file \`${guide.filePath}\` was not found at build time.`;
  }

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <Link
        href="/docs/guides"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Guides
      </Link>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/10 border border-white/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <Badge variant="outline" className="text-[10px] capitalize">
            {guide.category}
          </Badge>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold font-heading tracking-tight text-foreground">
          {guide.title}
        </h1>
      </div>

      {/* Content */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
        <GuideContent content={content} />
      </div>
    </div>
  );
}
