"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Eye,
  Filter,
  MessageSquare,
  MoreHorizontal,
  Send,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Post, PostStatus } from "../types";

interface PostListProps {
  posts: Post[];
  selectedPostId: string | null;
  onSelectPost: (post: Post) => void;
  onNewPost: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onDeletePost: (postId: string) => void;
  onPublishPost: (postId: string) => void;
}

const STATUS_CONFIG: Record<PostStatus, { label: string; className: string; }> = {
  published: {
    label: "Published",
    className: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  draft: {
    label: "Draft",
    className: "bg-zinc-700/30 text-zinc-500 border-zinc-700/30",
  },
  scheduled: {
    label: "Scheduled",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
};

const FILTER_OPTIONS: Array<{ label: string; value: PostStatus | "all"; }> = [
  { label: "All", value: "all" },
  { label: "Published", value: "published" },
  { label: "Drafts", value: "draft" },
  { label: "Scheduled", value: "scheduled" },
];

export function PostList({
  posts,
  selectedPostId,
  onSelectPost,
  onDeletePost,
  onPublishPost,
  searchQuery,
  onSearchChange,
}: PostListProps) {
  const [activeFilter, setActiveFilter] = useState<PostStatus | "all">("all");

  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchQuery === ""
      || post.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "all"
      || post.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Filter Bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/50">
        <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setActiveFilter(opt.value)}
              className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors ${
                activeFilter === opt.value
                  ? "bg-orange-500/20 text-orange-400"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-zinc-800/50">
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search posts..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 placeholder:text-zinc-600"
        />
      </div>

      {/* Post Cards */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/30">
        {filteredPosts.length === 0
          ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <p className="text-zinc-500 text-sm">No posts found</p>
              {searchQuery && (
                <p className="text-zinc-600 text-xs mt-1">
                  Try a different search term
                </p>
              )}
            </div>
          )
          : (
            filteredPosts.map(post => {
              const statusCfg = STATUS_CONFIG[post.status];
              const isSelected = post.id === selectedPostId;

              return (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => onSelectPost(post)}
                  className={`group p-4 cursor-pointer transition-all w-full text-left ${
                    isSelected
                      ? "bg-orange-500/5 border-l-2 border-orange-500"
                      : "hover:bg-zinc-900/40 border-l-2 border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${statusCfg.className}`}
                        >
                          {statusCfg.label}
                        </span>
                      </div>
                      <h3
                        className={`text-sm font-semibold truncate leading-snug ${
                          isSelected
                            ? "text-white"
                            : "text-zinc-300 group-hover:text-white"
                        }`}
                      >
                        {post.title}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5 font-mono">
                        {post.date}
                      </p>

                      {/* Stats Row */}
                      <div className="flex items-center gap-4 mt-2.5 text-[11px] text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.reads}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {post.comments}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      role="presentation"
                      onClick={e => e.stopPropagation()}
                      onKeyDown={e => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-500 hover:text-white"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-zinc-900 border-zinc-800 text-zinc-200"
                        >
                          <DropdownMenuItem
                            onClick={() => onSelectPost(post)}
                            className="gap-2 hover:bg-zinc-800 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Edit
                          </DropdownMenuItem>
                          {post.status !== "published" && (
                            <DropdownMenuItem
                              onClick={() => onPublishPost(post.id)}
                              className="gap-2 hover:bg-zinc-800 cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Publish
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator className="bg-zinc-800" />
                          <DropdownMenuItem
                            onClick={() => onDeletePost(post.id)}
                            className="gap-2 hover:bg-zinc-800 text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {post.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                      {post.tags.slice(0, 3).map(tag => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-4 border-zinc-700/50 text-zinc-500 font-normal"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </button>
              );
            })
          )}
      </div>
    </div>
  );
}
