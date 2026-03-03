import { useState, useEffect } from "react";
import type { BlogPost } from "../../core/generated-posts";

type BlogMeta = Omit<BlogPost, "content">;

export function BlogListView() {
  const [posts, setPosts] = useState<BlogMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/blog")
      .then((r) => r.json() as Promise<BlogMeta[]>)
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight sm:text-5xl">
            The Spike.land Blog
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
            Thoughts on AI agents, Cloudflare Workers, and the future of coding.
          </p>
        </div>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-x-8 lg:gap-y-12">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight sm:text-5xl">
          The Spike.land Blog
        </h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
          Thoughts on AI agents, Cloudflare Workers, and the future of coding.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-x-8 lg:gap-y-12">
        {posts.map((post) => (
          <article key={post.slug} className="flex flex-col items-start justify-between bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-x-4 text-xs">
              <time dateTime={post.date} className="text-gray-500 dark:text-gray-400">
                {new Date(post.date).toLocaleDateString()}
              </time>
              {post.category && (
                <span className="relative z-10 rounded-full bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 font-medium text-blue-600 dark:text-blue-400">
                  {post.category}
                </span>
              )}
            </div>
            <div className="group relative">
              <h3 className="mt-3 text-xl font-semibold leading-6 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                <a href={`/blog/${post.slug}`}>
                  <span className="absolute inset-0" />
                  {post.title}
                </a>
              </h3>
              <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                {post.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
