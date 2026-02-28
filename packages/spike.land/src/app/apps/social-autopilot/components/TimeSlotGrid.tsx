"use client";

import type { CalendarPost } from "./CalendarView";

interface BestTimeSlot {
  day: string;
  hour: number;
  score: number;
  reason: string;
}

interface TimeSlotGridProps {
  selectedDate: Date | null;
  scheduledPosts: CalendarPost[];
  bestTimes: BestTimeSlot[];
  onTimeSlotSelect: (hour: number) => void;
}

const HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

const PLATFORM_DOT: Record<CalendarPost["platform"], string> = {
  twitter: "bg-blue-500",
  instagram: "bg-pink-500",
  linkedin: "bg-sky-500",
  facebook: "bg-indigo-500",
};

export function TimeSlotGrid({
  selectedDate,
  scheduledPosts,
  bestTimes,
  onTimeSlotSelect,
}: TimeSlotGridProps) {
  const now = new Date();
  const currentHour = now.getHours();
  const isToday = selectedDate !== null
    ? selectedDate.toDateString() === now.toDateString()
    : false;

  const postsForDay = scheduledPosts.filter(p => {
    if (!selectedDate) return false;
    const postDate = new Date(p.scheduledAt);
    return postDate.toDateString() === selectedDate.toDateString();
  });

  const postsPerHour = new Map<number, CalendarPost[]>();
  for (const post of postsForDay) {
    const h = new Date(post.scheduledAt).getHours();
    const existing = postsPerHour.get(h) ?? [];
    postsPerHour.set(h, [...existing, post]);
  }

  const bestTimeHours = new Set(bestTimes.map(t => t.hour));

  const dateLabel = selectedDate
    ? selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    })
    : "Select a date";

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800">
        <h3 className="text-sm font-semibold text-white">{dateLabel}</h3>
        <p className="text-[11px] text-zinc-600 mt-0.5">
          Click a slot to compose
        </p>
      </div>

      <div className="p-4 space-y-1 max-h-[340px] overflow-y-auto">
        {HOURS.map(hour => {
          const posts = postsPerHour.get(hour) ?? [];
          const isBest = bestTimeHours.has(hour);
          const isPast = isToday && hour < currentHour;
          const isCurrent = isToday && hour === currentHour;

          return (
            <button
              key={hour}
              onClick={() => !isPast && onTimeSlotSelect(hour)}
              disabled={isPast}
              className={[
                "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all group",
                isPast
                  ? "opacity-30 cursor-not-allowed"
                  : "cursor-pointer hover:bg-zinc-800/60",
                isCurrent
                  ? "bg-emerald-900/20 border border-emerald-500/20"
                  : "",
                posts.length > 0 ? "bg-zinc-800/30" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {/* Hour label */}
              <span className="text-[11px] font-mono text-zinc-600 w-12 flex-shrink-0 tabular-nums">
                {formatHour(hour)}
              </span>

              {/* Slot bar */}
              <div className="flex-1 h-5 relative flex items-center">
                {posts.length > 0
                  ? (
                    <div className="flex items-center gap-1.5 w-full">
                      {posts.map(post => (
                        <div
                          key={post.id}
                          className={`h-2 flex-1 rounded-full ${
                            PLATFORM_DOT[post.platform]
                          } opacity-70`}
                        />
                      ))}
                    </div>
                  )
                  : (
                    <div
                      className={[
                        "h-px w-full rounded-full transition-colors",
                        isBest ? "bg-emerald-500/40" : "bg-zinc-800",
                        "group-hover:bg-zinc-700",
                      ].join(" ")}
                    />
                  )}
              </div>

              {/* Best time badge */}
              {isBest && posts.length === 0 && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                  Best
                </span>
              )}

              {/* Post count */}
              {posts.length > 0 && (
                <span className="text-[10px] font-mono text-zinc-500 flex-shrink-0">
                  {posts.length}x
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
