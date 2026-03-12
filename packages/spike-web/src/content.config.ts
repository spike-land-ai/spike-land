import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "*.mdx", base: "../../content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z
      .string()
      .or(z.date())
      .transform((val) => new Date(val)),
    author: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    featured: z.boolean().optional(),
    draft: z.boolean().optional(),
    unlisted: z.boolean().optional(),
    primer: z.string().optional(),
    heroImage: z.string().optional(),
    heroPrompt: z.string().optional(),
  }),
});

export const collections = { blog };
