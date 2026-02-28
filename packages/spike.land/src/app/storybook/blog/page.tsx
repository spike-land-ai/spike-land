"use client";

import {
  AccessibilityPanel,
  Breadcrumbs,
  CodePreview,
  ComponentSample,
  PageHeader,
  RelatedComponents,
  UsageGuide,
} from "@/components/storybook";
import { BlogCard, BlogHeader, Prose } from "@/components/blog";
import { BlogPoll } from "@/components/blog/BlogPoll";
import { PersonaSwitcher } from "@/components/blog/PersonaSwitcher";
import { MCPFlowDiagram } from "@/components/blog/interactive/MCPFlowDiagram";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { BlogPostFrontmatter, BlogPostMeta } from "@/lib/blog/types";

// -- Mock data for demos (no DB calls) --

const MOCK_FRONTMATTER: BlogPostFrontmatter = {
  title: "Building an AI-Powered Code Editor with MCP",
  slug: "ai-code-editor-mcp",
  description:
    "A deep dive into how spike.land uses the Model Context Protocol to connect AI agents with real-time code editing, transpilation, and deployment.",
  date: "2026-02-20",
  author: "Zoltan Erdos",
  category: "Engineering",
  tags: ["MCP", "AI", "Code Editor", "Cloudflare Workers"],
  image: "/images/og-default.png",
  featured: true,
  listed: true,
};

const MOCK_FRONTMATTER_2: BlogPostFrontmatter = {
  title: "Persona-Driven Content: Tailoring Blogs for Every Reader",
  slug: "persona-driven-content",
  description:
    "How we use onboarding personas to dynamically adapt blog articles, polls, and CTAs so every visitor sees content that resonates.",
  date: "2026-02-15",
  author: "Zoltan Erdos",
  category: "Product",
  tags: ["Personalization", "UX", "A/B Testing"],
  listed: true,
};

const MOCK_FRONTMATTER_3: BlogPostFrontmatter = {
  title: "From Monolith to Monorepo: Our Migration Story",
  slug: "monolith-to-monorepo",
  description:
    "Lessons learned migrating a Cloudflare Workers monolith into a structured Next.js monorepo with shared packages.",
  date: "2026-01-28",
  author: "Zoltan Erdos",
  category: "DevOps",
  tags: ["Monorepo", "Next.js", "Migration"],
  listed: true,
};

const MOCK_POSTS: BlogPostMeta[] = [
  {
    frontmatter: MOCK_FRONTMATTER,
    slug: MOCK_FRONTMATTER.slug,
    readingTime: "8 min read",
  },
  {
    frontmatter: MOCK_FRONTMATTER_2,
    slug: MOCK_FRONTMATTER_2.slug,
    readingTime: "5 min read",
  },
  {
    frontmatter: MOCK_FRONTMATTER_3,
    slug: MOCK_FRONTMATTER_3.slug,
    readingTime: "12 min read",
  },
];

const codeSnippets = {
  blogCard: `import { BlogCard } from "@/components/blog";
import type { BlogPostMeta } from "@/lib/blog/types";

// In a listing page
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {posts.map((post: BlogPostMeta) => (
    <BlogCard key={post.slug} post={post} />
  ))}
</div>`,
  blogHeader: `import { BlogHeader } from "@/components/blog";

// At the top of an article page
<BlogHeader
  frontmatter={post.frontmatter}
  readingTime={post.readingTime}
/>`,
  prose: `import { Prose } from "@/components/blog";

// Wrapping MDX-rendered content
<Prose>
  <h2>Section Heading</h2>
  <p>Article content with <strong>bold</strong> and <em>italic</em> text.</p>
  <ul>
    <li>List item one</li>
    <li>List item two</li>
  </ul>
  <blockquote>
    <p>A meaningful quote from the article.</p>
  </blockquote>
</Prose>`,
  blogPoll: `import { BlogPoll } from "@/components/blog/BlogPoll";

// Embedded at the end of an article
<BlogPoll slug="my-article-slug" />`,
  personaSwitcher: `import { PersonaSwitcher } from "@/components/blog/PersonaSwitcher";

// In a blog sidebar or header
<PersonaSwitcher />`,
  interactive: `import { MCPFlowDiagram } from "@/components/blog/interactive/MCPFlowDiagram";

// Embedded inline in an article
<MCPFlowDiagram />`,
};

export default function BlogStorybookPage() {
  return (
    <div className="space-y-16 pb-20">
      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Page header */}
      <PageHeader
        title="Blog"
        description="Blog components power spike.land's content engine -- from card previews and article headers to interactive demos, persona-aware polls, and long-form prose styling."
        usage="Use BlogCard for listing pages, BlogHeader for article detail pages, and Prose to wrap rendered MDX content. Interactive demos are embedded directly in articles."
      />

      {/* Usage guidelines */}
      <UsageGuide
        dos={[
          "Use BlogCard for all post listings (homepage, category pages, search results).",
          "Wrap MDX-rendered content in Prose for consistent typography.",
          "Use BlogHeader at the top of every article detail page.",
          "Embed interactive demos (MCPFlowDiagram) inside articles for engagement.",
          "Include BlogPoll at the end of opinion/comparison articles.",
        ]}
        donts={[
          "Don't render BlogCard without a valid BlogPostMeta -- all fields are required.",
          "Don't place interactive demos outside a blog context without testing scroll behavior.",
          "Don't skip the Prose wrapper -- raw HTML from MDX will lack typographic styling.",
          "Don't use BlogHeader for non-article pages; it expects frontmatter metadata.",
        ]}
      />

      {/* BlogCard showcase */}
      <ComponentSample
        title="BlogCard"
        description="Preview card shown on listing pages. Supports featured badges, cover images, tags, and reading time."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {MOCK_POSTS.map(post => <BlogCard key={post.slug} post={post} />)}
        </div>
      </ComponentSample>

      {/* BlogCard variants */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold font-heading">Card Variants</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="glass-1">
            <CardContent className="pt-6 space-y-3">
              <Badge variant="outline">Featured + Image</Badge>
              <p className="text-sm text-muted-foreground">
                Full card with cover image, featured badge, tags, and metadata.
              </p>
              {MOCK_POSTS[0] && <BlogCard post={MOCK_POSTS[0]} />}
            </CardContent>
          </Card>

          <Card className="glass-1">
            <CardContent className="pt-6 space-y-3">
              <Badge variant="outline">No Image</Badge>
              <p className="text-sm text-muted-foreground">
                Card without a cover image. Title and description take prominence.
              </p>
              {MOCK_POSTS[1] && <BlogCard post={MOCK_POSTS[1]} />}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* BlogHeader showcase */}
      <ComponentSample
        title="BlogHeader"
        description="Full article header with title, author, date, reading time, tags, and optional featured image."
      >
        <div className="w-full max-w-3xl">
          <BlogHeader
            frontmatter={MOCK_FRONTMATTER}
            readingTime="8 min read"
          />
        </div>
      </ComponentSample>

      {/* Prose wrapper showcase */}
      <ComponentSample
        title="Prose"
        description="Typography wrapper that applies consistent blog styling to rendered MDX content."
      >
        <div className="w-full max-w-3xl">
          <Prose>
            <h2>Sample Article Section</h2>
            <p>
              The <strong>Model Context Protocol</strong>{" "}
              enables AI agents to interact with external tools through a standardised JSON-RPC
              interface. This architecture separates <em>what</em> the agent can do from{" "}
              <em>how</em> it does it.
            </p>
            <ul>
              <li>Agents discover tools dynamically at runtime</li>
              <li>Each tool exposes a typed schema for inputs and outputs</li>
              <li>Servers can be composed and multiplexed</li>
            </ul>
            <blockquote>
              <p>
                MCP is to AI agents what REST was to web services -- a shared contract that makes
                interoperability possible.
              </p>
            </blockquote>
            <pre><code>{`// Example MCP tool call
const result = await client.callTool("file_guard", {
  files: ["src/app/page.tsx"],
});`}</code></pre>
          </Prose>
        </div>
      </ComponentSample>

      {/* Interactive demos section */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold font-heading">Interactive Demos</h2>
        <p className="text-muted-foreground -mt-4">
          These animated components are embedded in blog articles to visualise technical concepts.
          They activate on scroll using intersection observers.
        </p>

        <div className="space-y-12">
          {/* MCPFlowDiagram */}
          <ComponentSample
            title="MCPFlowDiagram"
            description="Animated flow diagram showing the MCP request lifecycle: Client -> Protocol -> Server -> Tool -> Response. Activates on scroll."
          >
            <div className="w-full">
              <MCPFlowDiagram />
            </div>
          </ComponentSample>

        </div>
      </section>

      {/* PersonaSwitcher */}
      <ComponentSample
        title="PersonaSwitcher"
        description="Dropdown that lets readers switch their persona to see tailored content variants. Reads/writes the persona cookie."
      >
        <div className="w-full max-w-md">
          <PersonaSwitcher />
        </div>
      </ComponentSample>

      {/* BlogPoll */}
      <ComponentSample
        title="BlogPoll"
        description="Persona-aware poll embedded at the end of articles. Shows a question tailored to the reader's persona and displays results by persona segment."
      >
        <div className="w-full max-w-lg">
          <BlogPoll slug="storybook-demo" />
        </div>
      </ComponentSample>

      {/* Code snippets */}
      <CodePreview
        code={codeSnippets.blogCard}
        title="Usage Examples"
        tabs={[
          { label: "BlogCard", code: codeSnippets.blogCard },
          { label: "BlogHeader", code: codeSnippets.blogHeader },
          { label: "Prose", code: codeSnippets.prose },
          { label: "BlogPoll", code: codeSnippets.blogPoll },
          { label: "PersonaSwitcher", code: codeSnippets.personaSwitcher },
          { label: "Interactive", code: codeSnippets.interactive },
        ]}
      />

      {/* Component inventory */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold font-heading">Component Inventory</h2>
        <p className="text-muted-foreground -mt-4">
          All blog-related components available for use in articles and listing pages.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              name: "BlogCard",
              path: "components/blog/BlogCard.tsx",
              desc: "Post preview card for listings",
            },
            {
              name: "BlogHeader",
              path: "components/blog/BlogHeader.tsx",
              desc: "Article detail page header",
            },
            {
              name: "Prose",
              path: "components/blog/Prose.tsx",
              desc: "Typography wrapper for MDX content",
            },
            {
              name: "BlogPoll",
              path: "components/blog/BlogPoll.tsx",
              desc: "Persona-aware yes/no poll",
            },
            {
              name: "PersonaSwitcher",
              path: "components/blog/PersonaSwitcher.tsx",
              desc: "Persona selection dropdown",
            },
            {
              name: "PersonaLandingPreview",
              path: "components/blog/PersonaLandingPreview.tsx",
              desc: "CTA based on active persona",
            },
            {
              name: "MCPFlowDiagram",
              path: "components/blog/interactive/MCPFlowDiagram.tsx",
              desc: "MCP protocol flow animation",
            },
            {
              name: "RecursiveZoomDemo",
              path: "components/blog/interactive/RecursiveZoomDemo.tsx",
              desc: "Fractal zoom visualisation",
            },
            {
              name: "ModelCascadeDemo",
              path: "components/blog/interactive/ModelCascadeDemo.tsx",
              desc: "Model cascade waterfall",
            },
            {
              name: "SpikeCliDemo",
              path: "components/blog/interactive/SpikeCliDemo.tsx",
              desc: "CLI multiplexer diagram",
            },
            {
              name: "SplitScreenDemo",
              path: "components/blog/interactive/SplitScreenDemo.tsx",
              desc: "Before/after split view",
            },
            {
              name: "MDXComponents",
              path: "components/blog/MDXComponents.tsx",
              desc: "Custom MDX component overrides",
            },
            {
              name: "MDXContent",
              path: "components/blog/MDXContent.tsx",
              desc: "MDX rendering pipeline",
            },
            {
              name: "ReadAloudArticle",
              path: "components/blog/ReadAloudArticle.tsx",
              desc: "Text-to-speech article reader",
            },
          ].map(comp => (
            <Card key={comp.name} className="glass-1">
              <CardContent className="pt-4 pb-4 space-y-1">
                <code className="text-sm font-mono text-primary">
                  {comp.name}
                </code>
                <p className="text-xs text-muted-foreground">{comp.desc}</p>
                <p className="text-[10px] text-muted-foreground/60 font-mono">
                  {comp.path}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Accessibility notes */}
      <AccessibilityPanel
        notes={[
          "BlogCard uses semantic <article>-like structure with proper heading hierarchy inside Card.",
          "All images use descriptive alt text derived from the post title.",
          "BlogHeader renders a proper <header> landmark with <time> elements.",
          "Interactive demos respect prefers-reduced-motion via framer-motion defaults.",
          "BlogPoll buttons have clear labels and disabled states during submission.",
          "PersonaSwitcher uses a labeled <select> element for full keyboard navigation.",
          "Prose applies proper heading levels, list semantics, and blockquote styling.",
          "Reading time and date metadata use semantic elements for screen readers.",
        ]}
      />

      {/* Related components */}
      <RelatedComponents currentId="blog" />
    </div>
  );
}
