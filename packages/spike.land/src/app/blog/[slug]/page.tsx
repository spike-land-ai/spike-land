import type { Metadata } from "next";
import { serialize } from "next-mdx-remote/serialize";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";

import { BlogHeader, Prose } from "@/components/blog";
import { BlogSupport } from "@/components/blog/BlogSupport";
import { MDXContent } from "@/components/blog/MDXContent";
import { ReadAloudArticle } from "@/components/blog/ReadAloudArticleWrapper";
import { CommentSection } from "@/components/engagement/CommentSection";
import { ContentViewStats } from "@/components/engagement/ContentViewStats";
import { Link } from "@/components/ui/link";
import {
  getAllPosts,
  getPersonaVariant,
  getPostBySlug,
  getPostSlugs,
} from "@/lib/blog/get-posts";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

// Blog posts are static MDX content — static generation at build time
// is preferred for performance and consistent hydration.
// Interactive MDX components use dynamic() with ssr:false in MDXComponents.tsx.

interface PageProps {
  params: Promise<{ slug: string; }>;
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const jar = await cookies();
  const personaSlug = jar.get("spike-persona")?.value ?? null;

  const post = (personaSlug ? getPersonaVariant(slug, personaSlug) : null)
    ?? getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found | Spike Land Blog",
    };
  }

  const { frontmatter } = post;

  return {
    title: `${frontmatter.title} | Spike Land Blog`,
    description: frontmatter.description,
    authors: [{ name: frontmatter.author }],
    keywords: frontmatter.tags,
    alternates: {
      canonical: `https://spike.land/blog/${slug}`,
    },
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.description,
      type: "article",
      url: `https://spike.land/blog/${slug}`,
      images: frontmatter.image ? [{ url: frontmatter.image }] : undefined,
      publishedTime: frontmatter.date,
      authors: [frontmatter.author],
      tags: frontmatter.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: frontmatter.title,
      description: frontmatter.description,
      images: frontmatter.image ? [frontmatter.image] : undefined,
    },
  };
}

/**
 * Generate static params for all blog posts.
 * Used for path discovery (sitemap, SEO) even with dynamic rendering.
 * Static generation is disabled due to next-mdx-remote hook requirements.
 */
export async function generateStaticParams() {
  const slugs = getPostSlugs();
  return slugs.map(slug => ({ slug }));
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const jar = await cookies();
  const personaSlug = jar.get("spike-persona")?.value ?? null;

  const post = (personaSlug ? getPersonaVariant(slug, personaSlug) : null)
    ?? getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const { frontmatter, content, readingTime } = post;

  // Serialize MDX content for client-side rendering with interactive components
  const mdxSource = await serialize(content, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        [rehypePrettyCode, {
          theme: "github-dark",
          keepBackground: true,
        }],
      ],
    },
  });

  const allPosts = getAllPosts();
  const currentIndex = allPosts.findIndex(p => p.slug === slug);
  const nextPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const prevPost = currentIndex < allPosts.length - 1
    ? allPosts[currentIndex + 1]
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: frontmatter.title,
    description: frontmatter.description,
    datePublished: frontmatter.date,
    author: {
      "@type": "Person",
      name: frontmatter.author,
    },
    publisher: {
      "@type": "Organization",
      name: "spike.land",
      url: "https://spike.land",
    },
    url: `https://spike.land/blog/${slug}`,
    ...(frontmatter.image ? { image: frontmatter.image } : {}),
    ...(frontmatter.tags ? { keywords: frontmatter.tags.join(", ") } : {}),
  };

  return (
    <div className="min-h-screen bg-grid-pattern relative">
      {/* Subtle ambient glow in the background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="relative container mx-auto px-4 sm:px-6 max-w-3xl lg:max-w-4xl pt-24 pb-20">
        {/* Back to blog */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary mb-10 transition-colors px-4 py-2 rounded-full hover:bg-primary/10 border border-transparent hover:border-primary/20"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        {/* Header */}
        <BlogHeader frontmatter={frontmatter} readingTime={readingTime} />

        <div className="mt-6 flex items-center gap-4">
          <ReadAloudArticle />
          <ContentViewStats path={`/blog/${slug}`} />
        </div>

        {/* Content */}
        <Prose className="mt-12" data-article-content>
          <MDXContent source={mdxSource} />
        </Prose>


        {/* Navigation */}
        <nav className="mt-20 pt-10 border-t border-border/50">
          <div className="flex flex-col sm:flex-row justify-between gap-6">
            {prevPost
              ? (
                <Link
                  href={`/blog/${prevPost.slug}`}
                  className="group flex-1 p-6 rounded-2xl border border-white/5 bg-background/40 backdrop-blur-sm hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
                >
                  <div className="text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2 group-hover:text-primary/80 transition-colors">
                    Previous Article
                  </div>
                  <div className="font-heading text-lg font-bold leading-tight group-hover:text-primary transition-colors">
                    {prevPost.frontmatter.title}
                  </div>
                </Link>
              )
              : <div className="flex-1" />}
            {nextPost && (
              <Link
                href={`/blog/${nextPost.slug}`}
                className="group flex-1 p-6 rounded-2xl border border-white/5 bg-background/40 backdrop-blur-sm hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 text-right"
              >
                <div className="text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2 group-hover:text-primary/80 transition-colors">
                  Next Article
                </div>
                <div className="font-heading text-lg font-bold leading-tight group-hover:text-primary transition-colors">
                  {nextPost.frontmatter.title}
                </div>
              </Link>
            )}
          </div>
        </nav>

        {/* Support & Share */}
        <BlogSupport articleSlug={slug} articleTitle={frontmatter.title} />

        {/* Comments */}
        <CommentSection contentType="blog" contentSlug={slug} />
      </article>
    </div>
  );
}
