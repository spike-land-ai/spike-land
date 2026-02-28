"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CalendarPost {
  id: string;
  content: string;
  platform: "twitter" | "instagram" | "linkedin" | "facebook";
  scheduledAt: Date;
  status: "SCHEDULED" | "PUBLISHED" | "CANCELLED";
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  posts: CalendarPost[];
  isGap: boolean;
}

interface CalendarViewProps {
  posts: CalendarPost[];
  gapDays: string[];
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange: (direction: "prev" | "next") => void;
  selectedDate: Date | null;
}

const PLATFORM_COLORS: Record<CalendarPost["platform"], string> = {
  twitter: "bg-blue-500",
  instagram: "bg-pink-500",
  linkedin: "bg-sky-600",
  facebook: "bg-indigo-500",
};

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildCalendarDays(
  currentDate: Date,
  posts: CalendarPost[],
  gapDays: string[],
): CalendarDay[] {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();

  const days: CalendarDay[] = [];

  // Previous month padding
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      posts: [],
      isGap: false,
    });
  }

  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    date.setHours(0, 0, 0, 0);
    const dateStr = date.toISOString().split("T")[0]!;
    const dayPosts = posts.filter(p => {
      const postDate = new Date(p.scheduledAt);
      postDate.setHours(0, 0, 0, 0);
      return postDate.getTime() === date.getTime();
    });
    days.push({
      date,
      isCurrentMonth: true,
      isToday: date.getTime() === today.getTime(),
      posts: dayPosts,
      isGap: gapDays.includes(dateStr),
    });
  }

  // Next month padding to fill 6 rows
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      posts: [],
      isGap: false,
    });
  }

  return days;
}

export function CalendarView({
  posts,
  gapDays,
  currentDate,
  onDateSelect,
  onMonthChange,
  selectedDate,
}: CalendarViewProps) {
  const days = buildCalendarDays(currentDate, posts, gapDays);
  const monthLabel = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <h3 className="text-base font-semibold text-white">{monthLabel}</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
            onClick={() => onMonthChange("prev")}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
            onClick={() => onMonthChange("next")}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 border-b border-zinc-800">
        {DAYS_OF_WEEK.map(day => (
          <div
            key={day}
            className="py-2 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-600"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const isSelected = selectedDate !== null
            && day.date.toDateString() === selectedDate.toDateString();

          return (
            <button
              key={idx}
              onClick={() => onDateSelect(day.date)}
              className={[
                "relative min-h-[72px] p-1.5 text-left border-b border-r border-zinc-800/50 transition-colors",
                "last:border-r-0 [&:nth-child(7n)]:border-r-0",
                day.isCurrentMonth ? "hover:bg-zinc-800/40" : "opacity-30",
                isSelected
                  ? "bg-emerald-900/30 ring-1 ring-inset ring-emerald-500/40"
                  : "",
                day.isGap && day.isCurrentMonth ? "bg-red-950/20" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span
                className={[
                  "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium mb-1",
                  day.isToday
                    ? "bg-emerald-500 text-black font-bold"
                    : day.isCurrentMonth
                    ? "text-zinc-300"
                    : "text-zinc-700",
                ].join(" ")}
              >
                {day.date.getDate()}
              </span>

              {day.isGap && day.isCurrentMonth && (
                <div className="absolute top-1 right-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
                </div>
              )}

              <div className="flex flex-col gap-0.5 mt-0.5">
                {day.posts.slice(0, 2).map(post => (
                  <div
                    key={post.id}
                    className={`h-1.5 rounded-full ${PLATFORM_COLORS[post.platform]} opacity-80`}
                  />
                ))}
                {day.posts.length > 2 && (
                  <Badge className="text-[9px] px-1 py-0 h-3.5 bg-zinc-700 text-zinc-300 border-0 rounded font-mono">
                    +{day.posts.length - 2}
                  </Badge>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
