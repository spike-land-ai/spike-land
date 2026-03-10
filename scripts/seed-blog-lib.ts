/**
 * Pure functions for blog seed script. Extracted for testability.
 */
import matter from "gray-matter";
import { extractHeroMedia } from "../src/core/block-website/core-logic/blog-source.js";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  primer: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
  featured: boolean;
  draft: boolean;
  unlisted: boolean;
  heroImage: string | null;
  heroPrompt: string | null;
  content: string;
}

/**
 * Escape a string for use in a SQLite single-quoted string literal.
 * SQLite only requires doubling single quotes inside '...' literals.
 */
export function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

/**
 * Parse frontmatter + body from raw MDX content.
 * Returns null if the content has no title.
 */
export function parseMdxContent(rawContent: string, filename: string): BlogPost | null {
  const { data, content } = matter(rawContent);

  const isDraft = Boolean(data.draft);
  const isUnlisted = Boolean(data.unlisted);

  const { heroImage, heroPrompt, body } = extractHeroMedia(
    content,
    typeof data.heroImage === "string" ? data.heroImage : null,
    typeof data.heroPrompt === "string" ? data.heroPrompt : null,
  );

  return {
    slug: data.slug || filename.replace(".mdx", ""),
    title: data.title || filename,
    description: data.description || "",
    primer: data.primer || "",
    date: data.date || "",
    author: data.author || "",
    category: data.category || "",
    tags: data.tags || [],
    featured: data.featured || false,
    draft: isDraft,
    unlisted: isUnlisted,
    heroImage,
    heroPrompt,
    content: body,
  };
}

/**
 * Sort posts by date descending (newest first).
 */
export function sortByDateDesc(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Generate SQL INSERT OR REPLACE statements for an array of blog posts.
 */
export function generateSQL(posts: BlogPost[]): string {
  const statements: string[] = [];

  for (const post of posts) {
    statements.push(
      `INSERT OR REPLACE INTO blog_posts (slug, title, description, primer, date, author, category, tags, featured, draft, unlisted, hero_image, hero_prompt, content, updated_at)
VALUES ('${escapeSQL(post.slug)}', '${escapeSQL(post.title)}', '${escapeSQL(post.description)}', '${escapeSQL(post.primer)}', '${escapeSQL(post.date)}', '${escapeSQL(post.author)}', '${escapeSQL(post.category)}', '${escapeSQL(JSON.stringify(post.tags))}', ${post.featured ? 1 : 0}, ${post.draft ? 1 : 0}, ${post.unlisted ? 1 : 0}, ${post.heroImage ? `'${escapeSQL(post.heroImage)}'` : "NULL"}, ${post.heroPrompt ? `'${escapeSQL(post.heroPrompt)}'` : "NULL"}, '${escapeSQL(post.content)}', unixepoch());`,
    );
  }

  return statements.join("\n\n");
}
