"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Eye, Hash, User } from "lucide-react";
import type { Post } from "../types";

interface PostPreviewProps {
  post: Post;
}

function estimateReadingTime(content: string): string {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

function renderMarkdownToHtml(markdown: string): string {
  // Basic markdown rendering for preview (headings, bold, italic, code, lists, links)
  const html = markdown
    // Escape HTML to prevent XSS
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Code blocks (before inline code)
    .replace(/```[\s\S]*?```/g, match => {
      const code = match.slice(3, -3).trim();
      return `<pre class="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-xs font-mono overflow-x-auto my-4 text-zinc-300"><code>${code}</code></pre>`;
    })
    // Inline code
    .replace(
      /`([^`]+)`/g,
      "<code class=\"bg-zinc-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono\">$1</code>",
    )
    // Headings
    .replace(
      /^# (.+)$/gm,
      "<h1 class=\"text-2xl font-bold text-white mt-8 mb-3 leading-tight\">$1</h1>",
    )
    .replace(
      /^## (.+)$/gm,
      "<h2 class=\"text-xl font-bold text-white mt-6 mb-2\">$1</h2>",
    )
    .replace(
      /^### (.+)$/gm,
      "<h3 class=\"text-lg font-semibold text-zinc-200 mt-5 mb-2\">$1</h3>",
    )
    // Bold & Italic
    .replace(
      /\*\*\*(.+?)\*\*\*/g,
      "<strong class=\"font-bold\"><em>$1</em></strong>",
    )
    .replace(
      /\*\*(.+?)\*\*/g,
      "<strong class=\"font-bold text-white\">$1</strong>",
    )
    .replace(/_(.+?)_/g, "<em class=\"italic text-zinc-300\">$1</em>")
    // Blockquote
    .replace(
      /^> (.+)$/gm,
      "<blockquote class=\"border-l-2 border-orange-500/50 pl-4 text-zinc-400 italic my-3\">$1</blockquote>",
    )
    // Unordered list items
    .replace(
      /^- (.+)$/gm,
      "<li class=\"ml-4 list-disc text-zinc-300 my-0.5\">$1</li>",
    )
    // Ordered list items
    .replace(
      /^\d+\. (.+)$/gm,
      "<li class=\"ml-4 list-decimal text-zinc-300 my-0.5\">$1</li>",
    )
    // Links
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      "<a href=\"$2\" class=\"text-orange-400 hover:text-orange-300 underline underline-offset-2\" target=\"_blank\" rel=\"noopener noreferrer\">$1</a>",
    )
    // Paragraphs (double newlines)
    .replace(/\n\n+/g, "</p><p class=\"text-zinc-300 leading-relaxed my-3\">")
    // Single newlines
    .replace(/\n/g, "<br />");

  return `<p class="text-zinc-300 leading-relaxed my-3">${html}</p>`;
}

export function PostPreview({ post }: PostPreviewProps) {
  const readingTime = estimateReadingTime(post.content);
  const isEmpty = !post.content.trim() && !post.title.trim();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Preview Header */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-zinc-800/50">
        <Eye className="w-3.5 h-3.5 text-zinc-500" />
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
          Preview
        </span>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty
          ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
              <Eye className="w-10 h-10 text-zinc-700 mb-3" />
              <p className="text-zinc-500 text-sm">
                Start writing to see the preview
              </p>
            </div>
          )
          : (
            <article className="px-6 py-6 max-w-prose mx-auto">
              {/* Article Header */}
              {post.title && (
                <header className="mb-6">
                  <h1 className="text-3xl font-bold text-white leading-tight mb-3">
                    {post.title}
                  </h1>

                  {post.excerpt && (
                    <p className="text-lg text-zinc-400 leading-relaxed mb-4">
                      {post.excerpt}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3 h-3" />
                      Author
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {readingTime}
                    </span>
                    <span>{post.date}</span>
                  </div>

                  {post.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      <Hash className="w-3 h-3 text-zinc-600" />
                      {post.tags.map(tag => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-[10px] border-zinc-700/50 text-zinc-500"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </header>
              )}

              <Separator className="bg-zinc-800/50 my-6" />

              {/* Article Body */}
              {post.content
                ? (
                  <div
                    className="prose prose-invert prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdownToHtml(post.content),
                    }}
                  />
                )
                : (
                  <p className="text-zinc-600 italic text-sm">
                    No content yet. Start writing in the editor.
                  </p>
                )}
            </article>
          )}
      </div>
    </div>
  );
}
