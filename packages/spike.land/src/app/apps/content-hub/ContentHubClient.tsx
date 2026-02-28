"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  BookOpen,
  ChevronLeft,
  FileText,
  Mail,
  Plus,
  Search,
  Users,
} from "lucide-react";
import Link from "next/link";
import { PostList } from "./components/PostList";
import { PostEditor } from "./components/PostEditor";
import { PostPreview } from "./components/PostPreview";
import { PublishBar } from "./components/PublishBar";
import { useContentHubMcp } from "./hooks/useContentHubMcp";
import type { Post, PostStatus } from "./types";

// ---------------------------------------------------------------------------
// Seed data (static mock – replaced by MCP data once integrated)
// ---------------------------------------------------------------------------

const SEED_POSTS: Post[] = [
  {
    id: "1",
    title: "The Rise of Agentic AI Workflows",
    excerpt: "How autonomous agents are transforming software development pipelines.",
    content:
      "# The Rise of Agentic AI Workflows\n\nAutonomous agents are changing everything.\n\n## What are Agentic Workflows?\n\nAgentic workflows enable AI systems to **plan**, **execute**, and **iterate** on complex tasks without constant human intervention.\n\n## Key Benefits\n\n- Reduced manual overhead\n- Higher throughput on repetitive tasks\n- Consistent quality enforcement\n\n> The future belongs to those who build systems that build systems.\n\n```typescript\nconst agent = new Agent({ model: 'claude-opus-4-6' });\nawait agent.run('refactor the codebase');\n```",
    status: "published",
    date: "Oct 12, 2025",
    reads: "1.2K",
    comments: 42,
    tags: ["ai", "agents", "workflow"],
  },
  {
    id: "2",
    title: "Building Scalable Vector Databases with Postgres",
    excerpt: "pgvector and beyond: storing embeddings in your existing stack.",
    content:
      "# Building Scalable Vector Databases with Postgres\n\nThe pgvector extension unlocks powerful similarity search directly inside PostgreSQL.\n\n## Why pgvector?\n\nYou probably already run Postgres. Adding vector search is a single extension install rather than operating an entirely separate database service.\n\n## Getting Started\n\n```sql\nCREATE EXTENSION vector;\nCREATE TABLE items (id bigserial PRIMARY KEY, embedding vector(1536));\nCREATE INDEX ON items USING ivfflat (embedding vector_cosine_ops);\n```",
    status: "draft",
    date: "Last edited 2h ago",
    reads: "0",
    comments: 0,
    tags: ["postgres", "vector", "database"],
  },
  {
    id: "3",
    title: "Spike Land: A New Paradigm for Multi-agent Collaboration",
    excerpt: "Real-time collaboration between AI agents and humans on spike.land.",
    content:
      "# Spike Land: A New Paradigm for Multi-agent Collaboration\n\nSpike Land reimagines how developers and AI work together in shared contexts.\n\n## Shared Context Windows\n\nEvery agent on spike.land shares a **live context window** with human collaborators, enabling seamless hand-offs and joint problem solving.",
    status: "published",
    date: "Sep 28, 2025",
    reads: "850",
    comments: 15,
    tags: ["spike.land", "collaboration", "multi-agent"],
  },
  {
    id: "4",
    title: "MDX vs Markdoc: Which should you choose in 2026?",
    excerpt: "An honest comparison of the two leading component-based markdown formats.",
    content:
      "# MDX vs Markdoc: Which should you choose in 2026?\n\nBoth MDX and Markdoc allow you to embed components inside markdown. But they take very different approaches.",
    status: "scheduled",
    date: "Tomorrow, 9:00 AM",
    reads: "0",
    comments: 0,
    tags: ["mdx", "markdoc", "content"],
    scheduledAt: "2026-02-27T09:00:00",
  },
];

type NavView = "posts" | "drafts" | "newsletters" | "subscribers";

const NAV_ITEMS: Array<{
  icon: React.ComponentType<{ className?: string; }>;
  label: string;
  view: NavView;
  count: string | number;
}> = [
  { icon: BookOpen, label: "All Posts", view: "posts", count: 24 },
  { icon: FileText, label: "Drafts", view: "drafts", count: 3 },
  { icon: Mail, label: "Newsletters", view: "newsletters", count: 12 },
  { icon: Users, label: "Subscribers", view: "subscribers", count: "1.2K" },
];

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function createEmptyPost(): Post {
  return {
    id: generateId(),
    title: "",
    excerpt: "",
    content: "",
    status: "draft",
    date: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    reads: "0",
    comments: 0,
    tags: [],
  };
}

export function ContentHubClient() {
  const [posts, setPosts] = useState<Post[]>(SEED_POSTS);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeNav, setActiveNav] = useState<NavView>("posts");
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { mutations } = useContentHubMcp();

  const selectedPost = posts.find(p => p.id === selectedPostId) ?? null;

  // ------------------------------------------------------------------
  // Post CRUD helpers
  // ------------------------------------------------------------------

  const handleNewPost = useCallback(() => {
    const post = createEmptyPost();
    setPosts(prev => [post, ...prev]);
    setSelectedPostId(post.id);
  }, []);

  const handleSelectPost = useCallback((post: Post) => {
    setSelectedPostId(post.id);
  }, []);

  const handleChangePost = useCallback(
    (updates: Partial<Post>) => {
      if (!selectedPostId) return;
      setPosts(prev => prev.map(p => (p.id === selectedPostId ? { ...p, ...updates } : p)));

      // Debounced auto-save via MCP
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setIsSaving(true);
      saveTimerRef.current = setTimeout(() => {
        setIsSaving(false);
      }, 1200);
    },
    [selectedPostId],
  );

  const handleSave = useCallback(() => {
    if (!selectedPost) return;
    setIsSaving(true);
    mutations.createPost.mutate({ post: selectedPost });
    setTimeout(() => setIsSaving(false), 800);
  }, [selectedPost, mutations.createPost]);

  const handlePublish = useCallback(() => {
    if (!selectedPostId) return;
    setIsPublishing(true);
    mutations.publishPost.mutate({ postId: selectedPostId });
    setPosts(prev =>
      prev.map(p =>
        p.id === selectedPostId
          ? { ...p, status: "published" as PostStatus }
          : p
      )
    );
    setTimeout(() => setIsPublishing(false), 800);
  }, [selectedPostId, mutations.publishPost]);

  const handleUnpublish = useCallback(() => {
    if (!selectedPostId) return;
    setPosts(prev =>
      prev.map(p => p.id === selectedPostId ? { ...p, status: "draft" as PostStatus } : p)
    );
  }, [selectedPostId]);

  const handleSchedule = useCallback(
    (dateTime: string) => {
      if (!selectedPostId) return;
      setPosts(prev =>
        prev.map(p =>
          p.id === selectedPostId
            ? { ...p, status: "scheduled" as PostStatus, scheduledAt: dateTime }
            : p
        )
      );
    },
    [selectedPostId],
  );

  const handleDeletePost = useCallback((postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    setSelectedPostId(prev => (prev === postId ? null : prev));
  }, []);

  const handlePublishFromList = useCallback(
    (postId: string) => {
      mutations.publishPost.mutate({ postId });
      setPosts(prev =>
        prev.map(p => p.id === postId ? { ...p, status: "published" as PostStatus } : p)
      );
    },
    [mutations.publishPost],
  );

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Navbar */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/store"
            className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-zinc-400" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-orange-500/10 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <span className="font-bold tracking-tight text-sm">
              Content Hub
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search content..."
              className="bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/40 w-48"
            />
          </div>
          <Button
            size="sm"
            onClick={handleNewPost}
            className="h-8 gap-1.5 bg-orange-600 hover:bg-orange-500 text-white border-0 shadow-lg shadow-orange-500/20 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            New Post
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 border-r border-zinc-800 bg-zinc-900/20 p-3 space-y-5 hidden lg:flex lg:flex-col shrink-0">
          <div className="space-y-0.5">
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest px-2 mb-1.5">
              Publishing
            </p>
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = activeNav === item.view;
              return (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => setActiveNav(item.view)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-orange-500/10 text-orange-400"
                      : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-md ${
                      isActive ? "bg-orange-500/20" : "bg-zinc-800/50"
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Analytics Quick-view */}
          <div className="mt-auto space-y-2">
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest px-2">
              Analytics
            </p>
            <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-[10px] text-zinc-500">Reads this week</p>
                  <p className="text-lg font-bold text-white">4,829</p>
                </div>
                <div className="h-7 w-14 flex items-end gap-0.5">
                  {[4, 7, 5, 9, 6, 8, 10].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-orange-500/40 rounded-t-[1px]"
                      style={{ height: `${h * 10}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                <BarChart className="w-3 h-3" />
                <span className="text-green-500 font-semibold">+12%</span> vs last week
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content: List + Editor Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Post List Panel */}
          <div
            className={`border-r border-zinc-800/50 flex flex-col overflow-hidden transition-all ${
              selectedPostId
                ? "hidden md:flex md:w-72 lg:w-80 shrink-0"
                : "flex-1"
            }`}
          >
            <PostList
              posts={posts}
              selectedPostId={selectedPostId}
              onSelectPost={handleSelectPost}
              onNewPost={handleNewPost}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onDeletePost={handleDeletePost}
              onPublishPost={handlePublishFromList}
            />
          </div>

          {/* Editor + Preview Panel */}
          {selectedPost
            ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Editor / Preview split */}
                <div className="flex-1 flex overflow-hidden">
                  {/* Editor */}
                  <div
                    className={`flex flex-col overflow-hidden ${
                      isPreviewVisible
                        ? "flex-1 border-r border-zinc-800/50"
                        : "flex-1"
                    }`}
                  >
                    <PostEditor
                      post={selectedPost}
                      onChange={handleChangePost}
                      isSaving={isSaving}
                    />
                  </div>

                  {/* Live Preview */}
                  {isPreviewVisible && (
                    <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950/30">
                      <PostPreview post={selectedPost} />
                    </div>
                  )}
                </div>

                {/* Publish Bar (sticky bottom) */}
                <PublishBar
                  post={selectedPost}
                  onSave={handleSave}
                  onPublish={handlePublish}
                  onSchedule={handleSchedule}
                  onUnpublish={handleUnpublish}
                  onTogglePreview={() => setIsPreviewVisible(v => !v)}
                  isPreviewVisible={isPreviewVisible}
                  isSaving={isSaving}
                  isPublishing={isPublishing}
                />
              </div>
            )
            : (
              /* Empty state when no post selected */
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4">
                  <FileText className="w-7 h-7 text-orange-500/60" />
                </div>
                <p className="text-zinc-400 font-semibold mb-1">
                  Select a post to edit
                </p>
                <p className="text-zinc-600 text-sm mb-5">
                  Or create a new post to get started
                </p>
                <Button
                  size="sm"
                  onClick={handleNewPost}
                  className="gap-1.5 bg-orange-600 hover:bg-orange-500 text-white border-0 shadow-lg shadow-orange-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Post
                </Button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
