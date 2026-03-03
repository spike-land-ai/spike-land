import { useState, useEffect } from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import type { BlogPost } from "../../core/generated-posts";
import * as Interactive from "../interactive";

/**
 * Convert self-closing JSX/HTML tags for custom components to explicit
 * open/close pairs. HTML5 only treats void elements (img, br, hr, etc.)
 * as self-closing — `<Foo />` is parsed as `<Foo>` by rehype-raw,
 * which swallows all subsequent content as children.
 */
function fixSelfClosingTags(markdown: string): string {
  return markdown.replace(/<([A-Z][a-zA-Z]*)((?:\s+[a-zA-Z-]+=(?:"[^"]*"|'[^']*'|{[^}]*}))*)\s*\/>/g,
    (_, tag, attrs) => `<${tag}${attrs}></${tag}>`);
}

const COMPONENT_MAP = {
  convergencedemo: Interactive.ConvergenceDemo,
  dependencycascadedemo: Interactive.DependencyCascadeDemo,
  stackcollapsedemo: Interactive.StackCollapseDemo,
  agentcoordinationdemo: Interactive.AgentCoordinationDemo,
  splitscreendemo: Interactive.SplitScreenDemo,
  attentionspotlightdemo: Interactive.AttentionSpotlightDemo,
  fivelayerstackdemo: Interactive.FiveLayerStackDemo,
  darwiniantreedemo: Interactive.DarwinianTreeDemo,
  recursivezoomdemo: Interactive.RecursiveZoomDemo,
  modelcascadedemo: Interactive.ModelCascadeDemo,
  bayesianconfidencedemo: Interactive.BayesianConfidenceDemo,
  mcpterminaldemo: Interactive.MCPTerminalDemo,
  scrollstorycard: Interactive.ScrollStoryCard,
  mcpflowdiagram: Interactive.MCPFlowDiagram,
  perspectivecarousel: Interactive.PerspectiveCarousel,
  spikeclidemo: Interactive.SpikeCliDemo,
  pyramidreshapedemo: Interactive.PyramidReshapeDemo,
  testcodenamevenn: Interactive.TestCodeNameVenn,
  hourglassmodeldemo: Interactive.HourglassModelDemo,
  paradigmguilttimeline: Interactive.ParadigmGuiltTimeline,
  effortinversiondemo: Interactive.EffortInversionDemo,
  contextlayerbuilderdemo: Interactive.ContextLayerBuilderDemo,
  callout: ({ children, type }: { children?: React.ReactNode; type?: string }) => (
    <div className={`p-4 my-6 rounded-xl border ${
      type === 'info' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 text-blue-900 dark:text-blue-100' :
      'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700'
    }`}>
      {children}
    </div>
  ),
};

export function BlogPostView({ slug }: { slug: string }) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(`/api/blog/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json() as Promise<BlogPost>;
      })
      .then(setPost)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8 animate-pulse">
        <div className="text-center mb-10">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mx-auto mb-4" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-4" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Post not found</h1>
        <p className="mt-4 text-gray-600 dark:text-gray-400">The post you are looking for does not exist.</p>
        <a href="/blog" className="mt-6 inline-block text-blue-600 hover:text-blue-500">
          ← Back to Blog
        </a>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <header className="mb-10 text-center">
        <div className="flex justify-center items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <time dateTime={post.date}>{new Date(post.date).toLocaleDateString()}</time>
          {post.category && (
            <>
              <span>•</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">{post.category}</span>
            </>
          )}
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
          {post.title}
        </h1>
        {post.description && (
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {post.description}
          </p>
        )}
      </header>

      <div className="prose prose-lg dark:prose-invert max-w-none prose-img:rounded-xl prose-img:shadow-lg">
        <Markdown rehypePlugins={[rehypeRaw]} components={COMPONENT_MAP as unknown as Record<string, React.ComponentType>}>
          {fixSelfClosingTags(post.content)}
        </Markdown>
      </div>
    </article>
  );
}
