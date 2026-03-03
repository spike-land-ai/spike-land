import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import matter from "gray-matter";

const BLOG_DIR = resolve(process.cwd(), "../../content/blog");
const OUT_DIR = resolve(process.cwd(), "src/core");
const OUT_FILE = join(OUT_DIR, "generated-posts.ts");
const JSON_DIR = resolve(process.cwd(), "dist/blog");

async function buildContent() {
  console.log(`Building content from ${BLOG_DIR}...`);
  
  try {
    await mkdir(OUT_DIR, { recursive: true });
  } catch (_err) {
    // Ignore if exists
  }

  const entries = await readdir(BLOG_DIR, { withFileTypes: true });
  const posts = [];

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".mdx")) {
      const fullPath = join(BLOG_DIR, entry.name);
      const fileContent = await readFile(fullPath, "utf-8");
      
      const { data, content } = matter(fileContent);
      
      posts.push({
        slug: data.slug || entry.name.replace(".mdx", ""),
        title: data.title || entry.name,
        description: data.description || "",
        date: data.date || "",
        author: data.author || "",
        category: data.category || "",
        tags: data.tags || [],
        featured: data.featured || false,
        content: content.trim()
      });
    }
  }

  // Sort by date descending
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const tsCode = `// GENERATED FILE - DO NOT EDIT
export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
  featured: boolean;
  content: string;
}

export const posts: BlogPost[] = ${JSON.stringify(posts, null, 2)};
`;

  await writeFile(OUT_FILE, tsCode, "utf-8");
  console.log(`Generated ${posts.length} posts to ${OUT_FILE}`);

  // Also output JSON files for on-demand loading via edge API
  await mkdir(JSON_DIR, { recursive: true });

  // index.json — metadata only (no content)
  const index = posts.map(({ content: _content, ...meta }) => meta);
  await writeFile(join(JSON_DIR, "index.json"), JSON.stringify(index), "utf-8");

  // Per-slug JSON files — full post with content
  for (const post of posts) {
    await writeFile(join(JSON_DIR, `${post.slug}.json`), JSON.stringify(post), "utf-8");
  }

  console.log(`Generated ${posts.length} JSON files to ${JSON_DIR}`);
}

buildContent().catch(console.error);
