import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

async function findMissingImages() {
  const blogDir = 'content/blog';
  const entries = await readdir(blogDir, { withFileTypes: true });
  const missing = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.mdx')) continue;
    const content = await readFile(join(blogDir, entry.name), 'utf-8');
    
    const heroImageMatch = content.match(/heroImage:\s*"([^"]+)"/);
    if (heroImageMatch) {
      const heroImagePath = heroImageMatch[1];
      // Check if there's a prompt in the first image tag
      const promptMatch = content.match(/!\[([^\]]+)\]\(([^)]+)\)/);
      if (promptMatch && promptMatch[2].includes('hero.png')) {
        missing.push({
          file: entry.name,
          heroImage: heroImagePath,
          prompt: promptMatch[1]
        });
      } else {
        missing.push({
          file: entry.name,
          heroImage: heroImagePath,
          prompt: "Professional blog hero image for " + entry.name
        });
      }
    }
  }
  console.log(JSON.stringify(missing, null, 2));
}

findMissingImages();
