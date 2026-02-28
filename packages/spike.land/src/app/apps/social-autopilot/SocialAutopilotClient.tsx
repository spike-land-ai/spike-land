"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Calendar,
  ChevronLeft,
  Plus,
  Rocket,
  Settings2,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { type CalendarPost, CalendarView } from "./components/CalendarView";
import { PostComposer } from "./components/PostComposer";
import { TimeSlotGrid } from "./components/TimeSlotGrid";
import { GapDetector } from "./components/GapDetector";
import { ScheduledPosts } from "./components/ScheduledPosts";

// ---- Demo seed data (replaced by MCP data once connected) ----
const SEED_POSTS: CalendarPost[] = [
  {
    id: "post-1",
    content: "The future of AI-driven dev tools is here. Let\u2019s talk about Spike Land.",
    platform: "twitter",
    scheduledAt: (() => {
      const d = new Date();
      d.setHours(16, 15, 0, 0);
      return d;
    })(),
    status: "SCHEDULED",
  },
  {
    id: "post-2",
    content: "Visualizing complex state machines has never been easier. Check the dev-log.",
    platform: "instagram",
    scheduledAt: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d;
    })(),
    status: "SCHEDULED",
  },
  {
    id: "post-3",
    content: "Why trunk-based development with AI agents is the future of software delivery.",
    platform: "linkedin",
    scheduledAt: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      d.setHours(11, 30, 0, 0);
      return d;
    })(),
    status: "SCHEDULED",
  },
];

const SEED_GAP_DAYS: string[] = (() => {
  const gaps: string[] = [];
  const today = new Date();
  for (let i = 2; i <= 7; i++) {
    if (i === 3) continue;
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    gaps.push(d.toISOString().split("T")[0]!);
  }
  return gaps;
})();

const SEED_BEST_TIMES = [
  {
    day: "Monday",
    hour: 9,
    score: 95,
    reason: "High engagement morning window",
  },
  { day: "Wednesday", hour: 12, score: 88, reason: "Lunch break peak traffic" },
  { day: "Friday", hour: 17, score: 82, reason: "End-of-week browse session" },
];

const STATS = [
  { label: "Total Reach", value: "248.5K", trend: "+12.4%" },
  { label: "Engagement", value: "18.2K", trend: "+5.1%" },
  { label: "Daily Avg", value: "1.2K", trend: "-2.3%" },
];

type NavTab = "overview" | "calendar" | "analytics" | "boost" | "setup";

interface NavItem {
  id: NavTab;
  icon: React.ComponentType<{ className?: string; }>;
  label: string;
}

function LayoutOverlay(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "overview",
    icon: LayoutOverlay as React.ComponentType<{ className?: string; }>,
    label: "Overview",
  },
  { id: "calendar", icon: Calendar, label: "Calendar" },
  { id: "analytics", icon: BarChart3, label: "Analytics" },
  { id: "boost", icon: Rocket, label: "Boost" },
  { id: "setup", icon: Settings2, label: "Setup" },
];

export function SocialAutopilotClient() {
  const [activeTab, setActiveTab] = useState<NavTab>("calendar");
  const [posts, setPosts] = useState<CalendarPost[]>(SEED_POSTS);
  const [gapDays] = useState<string[]>(SEED_GAP_DAYS);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerDate, setComposerDate] = useState<Date | null>(null);
  const [composerHour, setComposerHour] = useState<number | null>(null);

  const scheduledDate = useMemo(() => {
    if (!composerDate) return null;
    if (composerHour !== null) {
      const d = new Date(composerDate);
      d.setHours(composerHour, 0, 0, 0);
      return d;
    }
    return composerDate;
  }, [composerDate, composerHour]);

  const handleMonthChange = useCallback((direction: "prev" | "next") => {
    setCalendarDate(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + (direction === "next" ? 1 : -1));
      return next;
    });
  }, []);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleTimeSlotSelect = useCallback((hour: number) => {
    setComposerDate(selectedDate ?? new Date());
    setComposerHour(hour);
    setComposerOpen(true);
  }, [selectedDate]);

  const handleFillGap = useCallback((dateStr: string) => {
    const date = new Date(dateStr + "T09:00:00");
    setComposerDate(date);
    setComposerHour(9);
    setComposerOpen(true);
  }, []);

  const handleOpenComposer = useCallback(() => {
    setComposerDate(selectedDate ?? new Date());
    setComposerHour(null);
    setComposerOpen(true);
  }, [selectedDate]);

  const handleSchedulePost = useCallback(
    async (
      content: string,
      platforms: CalendarPost["platform"][],
      scheduledAt: Date,
    ) => {
      const newPosts: CalendarPost[] = platforms.map((platform, idx) => ({
        id: `post-${Date.now()}-${idx}`,
        content,
        platform,
        scheduledAt,
        status: "SCHEDULED" as const,
      }));
      setPosts(prev => [...prev, ...newPosts]);
      setComposerOpen(false);
    },
    [],
  );

  const handleCancelPost = useCallback((postId: string) => {
    setPosts(prev => prev.map(p => (p.id === postId ? { ...p, status: "CANCELLED" as const } : p)));
  }, []);

  const activePosts = useMemo(
    () => posts.filter(p => p.status !== "CANCELLED"),
    [posts],
  );

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Navbar */}
      <header className="h-16 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link
            href="/store"
            className="p-2 hover:bg-zinc-800 rounded-xl transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-white block">
                Social Autopilot
              </span>
              <span className="text-[10px] text-green-400 font-mono uppercase tracking-widest">
                Connected
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-lg shadow-emerald-500/20"
            onClick={handleOpenComposer}
          >
            <Plus className="w-4 h-4" />
            Compose
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Rail */}
        <aside className="w-20 border-r border-zinc-800 bg-zinc-900/40 flex flex-col items-center py-6 gap-8 overflow-y-auto flex-shrink-0">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`group relative flex flex-col items-center gap-1.5 transition-colors ${
                  isActive
                    ? "text-emerald-400"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Icon className="w-6 h-6 outline-none" />
                <span className="text-[10px] font-medium tracking-wide">
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute -right-[41.5px] w-1 h-8 bg-emerald-500 rounded-l-full shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                )}
              </button>
            );
          })}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.05),transparent)]">
          {activeTab === "overview" && (
            <OverviewTab
              posts={activePosts}
              onViewCalendar={() => setActiveTab("calendar")}
            />
          )}

          {activeTab === "calendar" && (
            <CalendarTab
              posts={activePosts}
              gapDays={gapDays}
              calendarDate={calendarDate}
              selectedDate={selectedDate}
              composerOpen={composerOpen}
              scheduledDate={scheduledDate}
              onMonthChange={handleMonthChange}
              onDateSelect={handleDateSelect}
              onTimeSlotSelect={handleTimeSlotSelect}
              onFillGap={handleFillGap}
              onSchedulePost={handleSchedulePost}
              onCloseComposer={() => setComposerOpen(false)}
              onCancelPost={handleCancelPost}
            />
          )}

          {(activeTab === "analytics" || activeTab === "boost"
            || activeTab === "setup") && <PlaceholderTab label={activeTab} />}
        </main>
      </div>
    </div>
  );
}

// ---- Sub-views ----

interface OverviewTabProps {
  posts: CalendarPost[];
  onViewCalendar: () => void;
}

function OverviewTab({ posts, onViewCalendar }: OverviewTabProps) {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STATS.map(stat => (
            <div
              key={stat.label}
              className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 flex flex-col gap-2"
            >
              <span className="text-sm font-medium text-zinc-500">
                {stat.label}
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold tracking-tight text-white">
                  {stat.value}
                </span>
                <span
                  className={`text-xs font-bold font-mono ${
                    stat.trend.startsWith("+")
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {stat.trend}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Upcoming Queue</h2>
            <Button
              variant="link"
              className="text-emerald-400"
              onClick={onViewCalendar}
            >
              View Calendar
            </Button>
          </div>
          <ScheduledPosts
            posts={posts}
            selectedDate={null}
            onCancelPost={() => undefined}
            isLoading={false}
          />
        </div>
      </div>
    </div>
  );
}

interface CalendarTabProps {
  posts: CalendarPost[];
  gapDays: string[];
  calendarDate: Date;
  selectedDate: Date | null;
  composerOpen: boolean;
  scheduledDate: Date | null;
  onMonthChange: (dir: "prev" | "next") => void;
  onDateSelect: (date: Date) => void;
  onTimeSlotSelect: (hour: number) => void;
  onFillGap: (dateStr: string) => void;
  onSchedulePost: (
    content: string,
    platforms: CalendarPost["platform"][],
    scheduledAt: Date,
  ) => Promise<void>;
  onCloseComposer: () => void;
  onCancelPost: (id: string) => void;
}

function CalendarTab({
  posts,
  gapDays,
  calendarDate,
  selectedDate,
  composerOpen,
  scheduledDate,
  onMonthChange,
  onDateSelect,
  onTimeSlotSelect,
  onFillGap,
  onSchedulePost,
  onCloseComposer,
  onCancelPost,
}: CalendarTabProps) {
  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_340px] divide-y lg:divide-y-0 lg:divide-x divide-zinc-800">
      {/* Left: Calendar + Scheduled Posts */}
      <div className="overflow-y-auto p-6 space-y-6">
        <CalendarView
          posts={posts}
          gapDays={gapDays}
          currentDate={calendarDate}
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
          onMonthChange={onMonthChange}
        />

        <ScheduledPosts
          posts={posts}
          selectedDate={selectedDate}
          onCancelPost={onCancelPost}
          isLoading={false}
        />
      </div>

      {/* Right: Sidebar (TimeSlots, GapDetector, Composer) */}
      <div className="overflow-y-auto p-6 space-y-5 bg-zinc-950/40">
        {composerOpen
          ? (
            <PostComposer
              scheduledDate={scheduledDate}
              onSchedule={onSchedulePost}
              onClose={onCloseComposer}
            />
          )
          : (
            <>
              <TimeSlotGrid
                selectedDate={selectedDate}
                scheduledPosts={posts}
                bestTimes={SEED_BEST_TIMES}
                onTimeSlotSelect={onTimeSlotSelect}
              />
              <GapDetector
                gapDays={gapDays}
                daysAhead={7}
                onFillGap={onFillGap}
                isLoading={false}
              />
            </>
          )}
      </div>
    </div>
  );
}

function PlaceholderTab({ label }: { label: string; }) {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
          <BarChart3 className="w-7 h-7 text-zinc-700" />
        </div>
        <p className="text-lg font-semibold text-zinc-300 capitalize">
          {label}
        </p>
        <p className="text-sm text-zinc-600">This section is coming soon.</p>
      </div>
    </div>
  );
}
