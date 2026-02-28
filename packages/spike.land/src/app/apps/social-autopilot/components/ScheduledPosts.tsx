"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Edit3,
  Facebook,
  Instagram,
  Linkedin,
  MoreVertical,
  Trash2,
  Twitter,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CalendarPost } from "./CalendarView";

interface ScheduledPostsProps {
  posts: CalendarPost[];
  selectedDate: Date | null;
  onCancelPost: (postId: string) => void;
  isLoading: boolean;
}

const PLATFORM_CONFIG: Record<
  CalendarPost["platform"],
  {
    icon: React.ComponentType<{ className?: string; }>;
    bg: string;
    text: string;
    label: string;
  }
> = {
  twitter: {
    icon: Twitter,
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    label: "Twitter",
  },
  instagram: {
    icon: Instagram,
    bg: "bg-pink-500/10",
    text: "text-pink-400",
    label: "Instagram",
  },
  linkedin: {
    icon: Linkedin,
    bg: "bg-sky-500/10",
    text: "text-sky-400",
    label: "LinkedIn",
  },
  facebook: {
    icon: Facebook,
    bg: "bg-indigo-500/10",
    text: "text-indigo-400",
    label: "Facebook",
  },
};

const STATUS_BADGE: Record<
  CalendarPost["status"],
  { label: string; className: string; }
> = {
  SCHEDULED: {
    label: "Scheduled",
    className: "bg-emerald-900/40 text-emerald-400 border-emerald-500/20",
  },
  PUBLISHED: {
    label: "Published",
    className: "bg-blue-900/40 text-blue-400 border-blue-500/20",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-zinc-800 text-zinc-600 border-zinc-700",
  },
};

function formatPostTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function PostCard(
  { post, onCancel }: { post: CalendarPost; onCancel: (id: string) => void; },
) {
  const platform = PLATFORM_CONFIG[post.platform];
  const statusBadge = STATUS_BADGE[post.status];
  const Icon = platform.icon;
  const [confirming, setConfirming] = useState(false);

  const handleCancel = () => {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    onCancel(post.id);
    setConfirming(false);
  };

  return (
    <div className="group flex gap-4 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition-all">
      {/* Platform icon */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${platform.bg}`}
      >
        <Icon className={`w-5 h-5 ${platform.text}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold ${platform.text}`}>
              {platform.label}
            </span>
            <Badge
              className={`text-[9px] px-1.5 py-0.5 border rounded-full ${statusBadge.className}`}
            >
              {statusBadge.label}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity hover:text-zinc-300 hover:bg-zinc-800"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-zinc-900 border-zinc-700 text-zinc-300"
            >
              <DropdownMenuItem className="gap-2 hover:bg-zinc-800 cursor-pointer">
                <Edit3 className="w-3.5 h-3.5" />
                Edit post
              </DropdownMenuItem>
              <DropdownMenuItem
                className={`gap-2 cursor-pointer ${
                  confirming
                    ? "bg-red-950/40 text-red-400 hover:bg-red-950/60"
                    : "hover:bg-zinc-800 text-red-400"
                }`}
                onClick={handleCancel}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {confirming ? "Click again to confirm" : "Cancel post"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2">
          {post.content}
        </p>

        <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
          <Clock className="w-3 h-3" />
          <span className="font-mono">
            {formatPostTime(new Date(post.scheduledAt))}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ScheduledPosts(
  { posts, selectedDate, onCancelPost, isLoading }: ScheduledPostsProps,
) {
  const filteredPosts = selectedDate
    ? posts.filter(p => {
      const postDate = new Date(p.scheduledAt);
      return postDate.toDateString() === selectedDate.toDateString();
    })
    : posts.slice(0, 10);

  const dateLabel = selectedDate
    ? selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
    : "Upcoming Posts";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-zinc-400" />
          {dateLabel}
        </h3>
        {filteredPosts.length > 0 && (
          <span className="text-[11px] text-zinc-600 font-mono">
            {filteredPosts.length} post{filteredPosts.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {isLoading
        ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="h-20 bg-zinc-900/40 rounded-2xl border border-zinc-800 animate-pulse"
              />
            ))}
          </div>
        )
        : filteredPosts.length === 0
        ? (
          <div className="flex flex-col items-center justify-center py-10 text-center bg-zinc-900/30 rounded-2xl border border-zinc-800 border-dashed">
            <div className="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-500">No posts scheduled</p>
            <p className="text-[11px] text-zinc-700 mt-1">
              {selectedDate
                ? "Click a time slot to compose a post"
                : "Select a date to see posts"}
            </p>
          </div>
        )
        : (
          <div className="space-y-2">
            {filteredPosts.map(post => (
              <PostCard key={post.id} post={post} onCancel={onCancelPost} />
            ))}
          </div>
        )}
    </div>
  );
}
