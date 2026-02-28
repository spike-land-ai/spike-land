import { NextResponse } from "next/server";
import { tryCatch } from "@/lib/try-catch";

import {
  getAllPosts,
  getFeaturedPosts,
  getPersonaVariant,
  getPostsByCategory,
  getPostsByTag,
} from "@/lib/blog/get-posts";

/**
 * GET /api/blog/posts
 * Returns a list of blog posts with optional filtering
 *
 * Query parameters:
 * - category: Filter by category
 * - tag: Filter by tag
 * - featured: Filter featured posts (true/false)
 * - persona: Persona slug — when provided, tries to load persona variants
 * - page: Page number (default: 1)
 * - limit: Posts per page (default: 10)
 */
export async function GET(request: Request) {
  const { data: response, error: handlerError } = await tryCatch((async () => {
    const { data: result, error } = await tryCatch((async () => {
      const url = new URL(request.url);
      const category = url.searchParams.get("category");
      const tag = url.searchParams.get("tag");
      const featured = url.searchParams.get("featured");
      const persona = url.searchParams.get("persona");
      const page = parseInt(url.searchParams.get("page") || "1", 10);
      const limit = parseInt(url.searchParams.get("limit") || "10", 10);

      let posts;

      if (category) {
        posts = getPostsByCategory(category);
      } else if (tag) {
        posts = getPostsByTag(tag);
      } else if (featured === "true") {
        posts = getFeaturedPosts();
      } else {
        posts = getAllPosts();
      }

      // Transform to mobile app expected format
      const transformedPosts = posts.map(post => {
        // When persona is specified, try loading a persona-specific variant
        const variant = persona ? getPersonaVariant(post.slug, persona) : null;
        const fm = variant?.frontmatter ?? post.frontmatter;
        const rt = variant?.readingTime ?? post.readingTime;

        return {
          slug: post.slug,
          title: fm.title,
          excerpt: fm.description,
          content: "", // List endpoint doesn't include full content
          date: fm.date,
          author: fm.author,
          image: fm.image,
          category: fm.category,
          tags: fm.tags,
          readingTime: rt,
          featured: fm.featured,
          personalized: variant !== null,
        };
      });

      // Pagination
      const total = transformedPosts.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPosts = transformedPosts.slice(startIndex, endIndex);

      return {
        posts: paginatedPosts,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    })());

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch blog posts" },
        { status: 500 },
      );
    }

    return NextResponse.json(result);
  })());

  if (handlerError) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }

  return response;
}
