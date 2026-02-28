"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Facebook,
  Instagram,
  Linkedin,
  Send,
  Sparkles,
  Twitter,
  X,
} from "lucide-react";
import type { CalendarPost } from "./CalendarView";

interface PlatformToggle {
  id: CalendarPost["platform"];
  label: string;
  icon: React.ComponentType<{ className?: string; }>;
  color: string;
  charLimit: number;
}

const PLATFORMS: PlatformToggle[] = [
  {
    id: "twitter",
    label: "Twitter / X",
    icon: Twitter,
    color: "text-blue-400 border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20",
    charLimit: 280,
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: Instagram,
    color: "text-pink-400 border-pink-500/40 bg-pink-500/10 hover:bg-pink-500/20",
    charLimit: 2200,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
    color: "text-sky-400 border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20",
    charLimit: 3000,
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: Facebook,
    color: "text-indigo-400 border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20",
    charLimit: 63206,
  },
];

interface PostComposerProps {
  scheduledDate: Date | null;
  onSchedule: (
    content: string,
    platforms: CalendarPost["platform"][],
    scheduledAt: Date,
  ) => void;
  onClose: () => void;
}

export function PostComposer(
  { scheduledDate, onSchedule, onClose }: PostComposerProps,
) {
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<
    Set<CalendarPost["platform"]>
  >(new Set(["twitter"]));
  const [time, setTime] = useState("09:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const togglePlatform = (id: CalendarPost["platform"]) => {
    setSelectedPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const twitterSelected = selectedPlatforms.has("twitter");
  const charLimit = twitterSelected ? 280 : 3000;
  const charsRemaining = charLimit - content.length;
  const isOverLimit = charsRemaining < 0;
  const isNearLimit = charsRemaining >= 0 && charsRemaining <= 20;

  const handleSchedule = async () => {
    if (!content.trim() || isOverLimit || selectedPlatforms.size === 0) return;

    const date = scheduledDate ?? new Date();
    const [hours, minutes] = time.split(":").map(Number);
    const scheduledAt = new Date(date);
    scheduledAt.setHours(hours ?? 9, minutes ?? 0, 0, 0);

    setIsSubmitting(true);
    try {
      await onSchedule(content, Array.from(selectedPlatforms), scheduledAt);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayDate = scheduledDate
    ? scheduledDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
    : "Today";

  return (
    <div className="bg-zinc-900/80 border border-zinc-700 rounded-3xl backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Compose Post</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-zinc-500 hover:text-white hover:bg-zinc-800"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-5 space-y-5">
        {/* Platform Toggles */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
            Platforms
          </span>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => togglePlatform(id)}
                className={[
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all",
                  selectedPlatforms.has(id)
                    ? color
                    : "border-zinc-700 text-zinc-600 bg-zinc-800/40 hover:text-zinc-400",
                ].join(" ")}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Text Area */}
        <div className="space-y-1.5">
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="What's on your mind? Write your post here..."
            className="min-h-[120px] bg-zinc-800/60 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 resize-none rounded-2xl focus:border-emerald-500/60 focus:ring-emerald-500/20"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-600">
              {twitterSelected && "Twitter: 280 char limit applies"}
            </span>
            <span
              className={[
                "text-xs font-mono font-bold tabular-nums",
                isOverLimit
                  ? "text-red-400"
                  : isNearLimit
                  ? "text-yellow-400"
                  : "text-zinc-600",
              ].join(" ")}
            >
              {charsRemaining}
            </span>
          </div>
        </div>

        {/* Date & Time */}
        <div className="flex items-center gap-3 p-3 bg-zinc-800/40 rounded-2xl border border-zinc-700/60">
          <div className="flex items-center gap-2 flex-1">
            <Calendar className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-sm text-zinc-300 font-medium">
              {displayDate}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-500" />
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="bg-transparent text-sm text-zinc-300 font-mono border-0 outline-none focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Platform badges summary */}
        {selectedPlatforms.size > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
              Posting to:
            </span>
            {Array.from(selectedPlatforms).map(p => (
              <Badge
                key={p}
                className="bg-zinc-800 text-zinc-300 border-zinc-700 text-[10px] capitalize"
              >
                {p}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button
            variant="outline"
            className="flex-1 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-lg shadow-emerald-500/20 gap-2"
            onClick={handleSchedule}
            disabled={!content.trim() || isOverLimit || isSubmitting}
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? "Scheduling..." : "Schedule Post"}
          </Button>
        </div>
      </div>
    </div>
  );
}
