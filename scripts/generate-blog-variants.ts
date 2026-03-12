import fs from "node:fs/promises";
import path from "node:path";
import { globSync } from "glob";

const PERSONAS = [
  "ai-indie",
  "classic-indie",
  "agency-dev",
  "in-house-dev",
  "ml-engineer",
  "ai-hobbyist",
  "enterprise-devops",
  "startup-devops",
  "technical-founder",
  "nontechnical-founder",
  "growth-leader",
  "ops-leader",
  "content-creator",
  "hobbyist-creator",
  "social-gamer",
  "solo-explorer",
];

async function generateVariants() {
  const blogDir = path.resolve(process.cwd(), "content/blog");
  const variantsDir = path.resolve(process.cwd(), "content/blog-variants");

  await fs.mkdir(variantsDir, { recursive: true });

  const mdxFiles = globSync("*.mdx", { cwd: blogDir });

  for (const file of mdxFiles) {
    const slug = file.replace(".mdx", "");
    const filePath = path.join(blogDir, file);
    const content = await fs.readFile(filePath, "utf-8");

    // Extract frontmatter
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    let rawPrd = content;
    if (match) {
      rawPrd = match[2].trim();
    }

    const variantsFile = path.join(variantsDir, `${slug}.json`);
    let existingVariants: Record<string, string> = {};
    try {
      existingVariants = JSON.parse(await fs.readFile(variantsFile, "utf-8"));
    } catch (e) {
      // Doesn't exist or invalid
    }

    const newVariants: Record<string, string> = {};

    console.log(`Generating variants for ${slug}...`);

    for (const persona of PERSONAS) {
      if (existingVariants[persona]) {
        newVariants[persona] = existingVariants[persona];
        continue;
      }

      // Simulate LLM generation.
      // In a real scenario, we would call an LLM API here with the rawPrd and the persona context.
      // For now, we generate a mock personalized version based on the PRD text.
      const mockPersonalization = `
> **AI Personalized View for ${persona}**

Based on your profile as a **${persona}**, here is the synthesized article:

${rawPrd.substring(0, 300)}...

*This is a dynamically generated personalized version of the raw PRD tailored specifically for the ${persona} mindset.*
      `.trim();

      newVariants[persona] = mockPersonalization;
    }

    await fs.writeFile(variantsFile, JSON.stringify(newVariants, null, 2));
    console.log(`Saved variants for ${slug} to ${variantsFile}`);
  }
}

generateVariants().catch(console.error);
