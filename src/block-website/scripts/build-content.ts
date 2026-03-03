import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import matter from "gray-matter";

const BLOG_DIR = resolve(process.cwd(), "../../content/blog");
const OUT_DIR = resolve(process.cwd(), "src/core");
const OUT_FILE = join(OUT_DIR, "generated-posts.ts");

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
}

buildContent().catch(console.error);
