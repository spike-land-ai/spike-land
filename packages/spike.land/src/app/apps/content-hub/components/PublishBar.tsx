"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Save,
  Send,
} from "lucide-react";
import type { Post, PostStatus } from "../types";

interface PublishBarProps {
  post: Post;
  onSave: () => void;
  onPublish: () => void;
  onSchedule: (dateTime: string) => void;
  onUnpublish: () => void;
  onTogglePreview: () => void;
  isPreviewVisible: boolean;
  isSaving: boolean;
  isPublishing: boolean;
}

const STATUS_LABELS: Record<PostStatus, string> = {
  draft: "Draft",
  published: "Published",
  scheduled: "Scheduled",
};

const STATUS_COLORS: Record<PostStatus, string> = {
  draft: "text-zinc-500",
  published: "text-green-500",
  scheduled: "text-blue-500",
};

export function PublishBar({
  post,
  onSave,
  onPublish,
  onSchedule,
  onUnpublish,
  onTogglePreview,
  isPreviewVisible,
  isSaving,
  isPublishing,
}: PublishBarProps) {
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState("");

  function handleScheduleConfirm() {
    if (!scheduleDateTime) return;
    onSchedule(scheduleDateTime);
    setShowSchedule(false);
    setScheduleDateTime("");
  }

  const isPublished = post.status === "published";
  const canPublish = post.title.trim().length > 0
    && post.content.trim().length > 0;

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-800/50 bg-zinc-950/80 backdrop-blur-sm">
      {/* Left: Status & Save */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[10px] font-bold uppercase tracking-widest ${
              STATUS_COLORS[post.status]
            }`}
          >
            {STATUS_LABELS[post.status]}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          className="h-7 gap-1.5 text-zinc-400 hover:text-white text-xs"
        >
          {isSaving
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : <Save className="w-3 h-3" />}
          Save draft
        </Button>
      </div>

      {/* Right: Preview & Publish */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onTogglePreview}
          className="h-7 gap-1.5 text-zinc-400 hover:text-white text-xs"
          title={isPreviewVisible ? "Hide preview" : "Show preview"}
        >
          {isPreviewVisible
            ? <EyeOff className="w-3.5 h-3.5" />
            : <Eye className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">Preview</span>
        </Button>

        {isPublished
          ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onUnpublish}
              className="h-7 gap-1.5 border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 text-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              Unpublish
            </Button>
          )
          : (
            <div className="flex items-center">
              <Button
                size="sm"
                onClick={onPublish}
                disabled={!canPublish || isPublishing}
                className="h-7 gap-1.5 bg-orange-600 hover:bg-orange-500 text-white border-0 rounded-r-none text-xs shadow-lg shadow-orange-500/20"
                title={!canPublish ? "Add title and content to publish" : ""}
              >
                {isPublishing
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <Send className="w-3 h-3" />}
                Publish
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    disabled={!canPublish || isPublishing}
                    className="h-7 w-7 p-0 bg-orange-600 hover:bg-orange-500 text-white border-0 rounded-l-none border-l border-orange-700 text-xs shadow-lg shadow-orange-500/20"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-zinc-900 border-zinc-800 text-zinc-200 min-w-40"
                >
                  <DropdownMenuItem
                    onClick={onPublish}
                    disabled={isPublishing}
                    className="gap-2 hover:bg-zinc-800 cursor-pointer text-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Publish now
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowSchedule(true)}
                    className="gap-2 hover:bg-zinc-800 cursor-pointer text-sm"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Schedule...
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem
                    onClick={onSave}
                    className="gap-2 hover:bg-zinc-800 cursor-pointer text-sm"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Save as draft
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
      </div>

      {/* Schedule Modal */}
      {showSchedule && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-80 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              Schedule Post
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Choose when to publish this post
            </p>
            <input
              type="datetime-local"
              value={scheduleDateTime}
              onChange={e => setScheduleDateTime(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500/40 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSchedule(false)}
                className="text-zinc-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleScheduleConfirm}
                disabled={!scheduleDateTime}
                className="bg-orange-600 hover:bg-orange-500 text-white border-0"
              >
                <Clock className="w-3.5 h-3.5 mr-1.5" />
                Schedule
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
