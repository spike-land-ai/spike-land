import { useState, useEffect } from "react";
import type { BlogPost } from "../../core/generated-posts";

type BlogMeta = Omit<BlogPost, "content">;

export function BlogListView({ linkComponent, limit, showHeader = true }: { linkComponent?: React.ComponentType<{ to: string; className?: string; children?: React.ReactNode }>; limit?: number; showHeader?: boolean }) {
  const [posts, setPosts] = useState<BlogMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/blog")
      .then((r) => r.json() as Promise<BlogMeta[]>)
      .then((data) => {
        if (limit) {
          const featured = data.filter((p) => p.featured);
          const rest = data.filter((p) => !p.featured);
          setPosts([...featured, ...rest].slice(0, limit));
        } else {
          setPosts(data);
        }
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [limit]);

  if (loading) {
    return (
      <div className={showHeader ? "max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 font-sans" : "font-sans"}>
        {showHeader && (
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h1 className="text-2xl font-display font-extrabold text-foreground tracking-tight sm:text-3xl mb-3">
              The Spike.land Blog
            </h1>
            <p className="text-base text-muted-foreground font-light">
              Thoughts on AI agents, Cloudflare Workers, and the future of coding.
            </p>
          </div>
        )}
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
          {Array.from({ length: limit ?? 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-card p-4 sm:p-5 rounded-xl border border-border">
              <div className="h-3 bg-muted rounded w-1/4 mb-3" />
              <div className="h-6 bg-muted rounded w-3/4 mb-3" />
              <div className="h-4 bg-muted rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const LinkComp = linkComponent ?? "a";

  return (
    <div className={showHeader ? "max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 font-sans" : "font-sans"}>
      {showHeader && (
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h1 className="text-2xl font-display font-extrabold text-foreground tracking-tight sm:text-3xl mb-3">
            The Spike.land Blog
          </h1>
          <p className="text-base text-muted-foreground font-light">
            Thoughts on AI agents, Cloudflare Workers, and the future of coding.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        {posts.map((post) => (
          <article key={post.slug} className="flex flex-col items-start justify-between bg-card p-4 sm:p-5 rounded-xl border border-border shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-x-3 text-xs font-medium tracking-wider uppercase mb-2">
              <time dateTime={post.date} className="text-muted-foreground/80">
                {new Date(post.date).toLocaleDateString()}
              </time>
              {post.category && (
                <>
                  <span className="text-muted-foreground/40">•</span>
                  <span className="text-primary">
                    {post.category}
                  </span>
                </>
              )}
            </div>
            <div className="group relative">
              <h3 className="text-lg sm:text-xl font-display font-bold leading-snug text-foreground group-hover:text-primary transition-colors mb-2">
                {linkComponent ? (
                  <LinkComp to={`/blog/${post.slug}`}>
                    <span className="absolute inset-0" />
                    {post.title}
                  </LinkComp>
                ) : (
                  <a href={`/blog/${post.slug}`}>
                    <span className="absolute inset-0" />
                    {post.title}
                  </a>
                )}
              </h3>
              <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {post.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
