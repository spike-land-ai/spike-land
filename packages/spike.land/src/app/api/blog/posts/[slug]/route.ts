import { NextResponse } from "next/server";

import { getPostBySlug } from "@/lib/blog/get-posts";

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * GET /api/blog/posts/[slug]
 * Returns a single blog post by slug
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { slug } = await params;

  const post = getPostBySlug(slug);

  if (!post) {
    return NextResponse.json(
      { error: "Post not found" },
      { status: 404 },
    );
  }

  // Transform to mobile app expected format
  const transformedPost = {
    slug: post.slug,
    title: post.frontmatter.title,
    excerpt: post.frontmatter.description,
    content: post.content,
    date: post.frontmatter.date,
    author: post.frontmatter.author,
    image: post.frontmatter.image,
    category: post.frontmatter.category,
    tags: post.frontmatter.tags,
    readingTime: post.readingTime,
    featured: post.frontmatter.featured,
  };

  return NextResponse.json({
    post: transformedPost,
  });
}
