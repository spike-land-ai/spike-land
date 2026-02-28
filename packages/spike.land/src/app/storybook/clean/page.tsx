"use client";

import {
  AccessibilityPanel,
  Breadcrumbs,
  CodePreview,
  ComponentSample,
  PageHeader,
  RelatedComponents,
  UsageGuide,
} from "@/components/storybook";
import { CleanAchievementGrid } from "@/components/clean/CleanAchievementGrid";
import { CleanPointsBadge } from "@/components/clean/CleanPointsBadge";
import { CleanProgressBar } from "@/components/clean/CleanProgressBar";
import { CleanStreakDisplay } from "@/components/clean/CleanStreakDisplay";
import { CleanTaskCard } from "@/components/clean/CleanTaskCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { CleaningAchievement, CleaningTask } from "@/lib/clean/types";
import type { AchievementType } from "@/lib/clean/gamification";
import { ArrowRight, Flame, Lock, Sparkles, Star, Trophy } from "lucide-react";

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const mockTasks: CleaningTask[] = [
  {
    id: "t1",
    description: "Wipe down kitchen counters and stovetop",
    category: "SURFACE",
    difficulty: "EASY",
    status: "COMPLETED",
    pointsValue: 10,
    order: 1,
    completedAt: "2026-02-25T10:15:00Z",
  },
  {
    id: "t2",
    description: "Load dishwasher and start cycle",
    category: "DISHES",
    difficulty: "QUICK",
    status: "PENDING",
    pointsValue: 5,
    order: 2,
  },
  {
    id: "t3",
    description: "Vacuum living room carpet and under sofa",
    category: "FLOOR",
    difficulty: "MEDIUM",
    status: "PENDING",
    pointsValue: 20,
    order: 3,
  },
  {
    id: "t4",
    description: "Scrub bathroom tiles and clean mirrors",
    category: "BATHROOM",
    difficulty: "EFFORT",
    status: "PENDING",
    pointsValue: 35,
    order: 4,
  },
  {
    id: "t5",
    description: "Take out recycling and trash bags",
    category: "TRASH",
    difficulty: "QUICK",
    status: "SKIPPED",
    pointsValue: 5,
    order: 5,
    skipReason: "Bins were already at the curb",
  },
  {
    id: "t6",
    description: "Sort and fold laundry basket",
    category: "LAUNDRY",
    difficulty: "MEDIUM",
    status: "PENDING",
    pointsValue: 20,
    order: 6,
  },
];

const mockAchievements: CleaningAchievement[] = [
  {
    type: "FIRST_SESSION" as AchievementType,
    name: "First Steps",
    description: "Complete your first cleaning session",
    unlockedAt: "2026-01-10T14:30:00Z",
  },
  {
    type: "THREE_DAY_STREAK" as AchievementType,
    name: "Getting Started",
    description: "3-day cleaning streak",
    unlockedAt: "2026-01-13T09:00:00Z",
  },
  {
    type: "SEVEN_DAY_STREAK" as AchievementType,
    name: "Week Warrior",
    description: "7-day cleaning streak",
    unlockedAt: "2026-02-01T18:45:00Z",
  },
  {
    type: "SPEED_DEMON" as AchievementType,
    name: "Speed Demon",
    description: "Complete a session in under 10 minutes",
    unlockedAt: "2026-02-20T08:10:00Z",
  },
  {
    type: "THIRTY_DAY_STREAK" as AchievementType,
    name: "Monthly Master",
    description: "30-day cleaning streak",
  },
  {
    type: "LEVEL_10" as AchievementType,
    name: "Cleaning Pro",
    description: "Reach level 10",
  },
  {
    type: "THOUSAND_TASKS" as AchievementType,
    name: "Task Titan",
    description: "Complete 1000 cleaning tasks",
  },
  {
    type: "LEVEL_20" as AchievementType,
    name: "Legendary Cleaner",
    description: "Reach level 20",
  },
];

// ---------------------------------------------------------------------------
// Code Snippets
// ---------------------------------------------------------------------------

const codeSnippets = {
  taskCard: `import { CleanTaskCard } from "@/components/clean/CleanTaskCard";

<CleanTaskCard
  task={{
    id: "t1",
    description: "Wipe down kitchen counters",
    category: "SURFACE",
    difficulty: "EASY",
    status: "PENDING",
    pointsValue: 10,
    order: 1,
  }}
  onComplete={(id) => markComplete(id)}
  onSkip={(id, reason) => skipTask(id, reason)}
  isActive={true}
/>`,
  progressBar: `import { CleanProgressBar } from "@/components/clean/CleanProgressBar";

<CleanProgressBar
  completed={3}
  total={6}
  label="Halfway there"
/>`,
  streakDisplay: `import { CleanStreakDisplay } from "@/components/clean/CleanStreakDisplay";

<CleanStreakDisplay streak={12} bestStreak={21} />`,
  achievementGrid: `import { CleanAchievementGrid } from "@/components/clean/CleanAchievementGrid";

<CleanAchievementGrid
  achievements={[
    { type: "FIRST_SESSION", name: "First Steps",
      description: "Complete your first session",
      unlockedAt: "2026-01-10T14:30:00Z" },
    { type: "SEVEN_DAY_STREAK", name: "Week Warrior",
      description: "7-day cleaning streak" },
  ]}
/>`,
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const noop = () => {};

export default function CleanStorybookPage() {
  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="CleanSweep"
        description="CleanSweep turns mundane household chores into a rewarding game. Earn points, unlock achievements, and build streaks as you tidy up your space. These components power the gamified cleaning experience."
        usage="Use CleanSweep components to display cleaning tasks, track progress, celebrate achievements, and motivate users to maintain tidy spaces."
      />

      <UsageGuide
        dos={[
          "Use CleanTaskCard for each individual cleaning task with clear descriptions.",
          "Show progress with CleanProgressBar to give users a sense of accomplishment.",
          "Display achievements prominently to encourage continued engagement.",
          "Use the streak display to reinforce daily habits and consistency.",
          "Celebrate milestones with animated point badges and level-ups.",
        ]}
        donts={[
          "Don't overwhelm users with too many tasks at once -- keep sessions manageable.",
          "Don't show locked achievements without context about how to unlock them.",
          "Don't reset streak visuals abruptly -- use transitions for state changes.",
          "Don't use destructive styling for skip actions -- skipping should feel judgment-free.",
        ]}
      />

      {/* ----------------------------------------------------------------- */}
      {/* Task Cards                                                         */}
      {/* ----------------------------------------------------------------- */}

      <ComponentSample
        title="Task Cards"
        description="Each cleaning task is rendered as a card with a colored left border indicating its category. The active task shows action buttons while completed tasks are dimmed with a check mark."
      >
        <div className="w-full max-w-lg space-y-3">
          {mockTasks.slice(0, 4).map((task, i) => (
            <CleanTaskCard
              key={task.id}
              task={task}
              onComplete={noop}
              onSkip={noop}
              isActive={i === 1}
            />
          ))}
        </div>
      </ComponentSample>

      {/* Category legend */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold font-heading">Task Categories</h3>
        <p className="text-sm text-muted-foreground">
          Each category has a distinct left-border color so users can scan tasks at a glance.
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Surface", color: "bg-blue-400" },
            { label: "Floor", color: "bg-green-400" },
            { label: "Organize", color: "bg-purple-400" },
            { label: "Dishes", color: "bg-yellow-400" },
            { label: "Laundry", color: "bg-pink-400" },
            { label: "Trash", color: "bg-red-400" },
            { label: "Bathroom", color: "bg-cyan-400" },
            { label: "Other", color: "bg-gray-400" },
          ].map(({ label, color }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-sm"
            >
              <div className={`w-3 h-3 rounded-sm ${color}`} />
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* Task states */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold font-heading">Task States</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
          <Card className="glass-1">
            <CardContent className="pt-6 space-y-2">
              <Badge variant="default">Pending</Badge>
              <p className="text-sm text-muted-foreground">
                Awaiting action. Shows full opacity with task details.
              </p>
            </CardContent>
          </Card>
          <Card className="glass-1 border-success/20 bg-success/5">
            <CardContent className="pt-6 space-y-2">
              <Badge variant="success">Completed</Badge>
              <p className="text-sm text-muted-foreground">
                Dimmed to 60% opacity with strikethrough text and a green check.
              </p>
            </CardContent>
          </Card>
          <Card className="glass-1 border-warning/20 bg-warning/5">
            <CardContent className="pt-6 space-y-2">
              <Badge variant="warning">Skipped</Badge>
              <p className="text-sm text-muted-foreground">
                Dimmed to 40% opacity. No judgment -- users can revisit later.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Difficulty Badges                                                  */}
      {/* ----------------------------------------------------------------- */}

      <ComponentSample
        title="Difficulty Badges"
        description="Tasks carry a difficulty badge that maps to point values: QUICK (5 pts), EASY (10 pts), MEDIUM (20 pts), EFFORT (35 pts)."
      >
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex flex-col items-center gap-1">
            <Badge variant="secondary">QUICK</Badge>
            <span className="text-xs text-muted-foreground">5 pts</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Badge variant="default">EASY</Badge>
            <span className="text-xs text-muted-foreground">10 pts</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Badge variant="warning">MEDIUM</Badge>
            <span className="text-xs text-muted-foreground">20 pts</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Badge variant="destructive">EFFORT</Badge>
            <span className="text-xs text-muted-foreground">35 pts</span>
          </div>
        </div>
      </ComponentSample>

      {/* ----------------------------------------------------------------- */}
      {/* Progress Bar                                                       */}
      {/* ----------------------------------------------------------------- */}

      <ComponentSample
        title="Progress Bar"
        description="Tracks cleaning session completion. Automatically switches to a success variant with a glow effect when hitting 100%."
      >
        <div className="w-full max-w-md space-y-6">
          <CleanProgressBar
            completed={1}
            total={6}
            label="Just getting started"
          />
          <CleanProgressBar completed={3} total={6} label="Halfway there" />
          <CleanProgressBar completed={5} total={6} label="Almost done" />
          <CleanProgressBar completed={6} total={6} label="Session complete!" />
        </div>
      </ComponentSample>

      {/* ----------------------------------------------------------------- */}
      {/* Points Badge                                                       */}
      {/* ----------------------------------------------------------------- */}

      <ComponentSample
        title="Points Badge"
        description="Displays the user's current point total. Can be animated with a pulse effect to celebrate point gains."
      >
        <div className="flex flex-wrap gap-6 items-center">
          <div className="flex flex-col items-center gap-2">
            <CleanPointsBadge points={50} />
            <span className="text-xs text-muted-foreground">Starter</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <CleanPointsBadge points={500} />
            <span className="text-xs text-muted-foreground">Regular</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <CleanPointsBadge points={2500} />
            <span className="text-xs text-muted-foreground">Dedicated</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <CleanPointsBadge points={10000} animated />
            <span className="text-xs text-muted-foreground">Animated</span>
          </div>
        </div>
      </ComponentSample>

      {/* ----------------------------------------------------------------- */}
      {/* Streak Display                                                     */}
      {/* ----------------------------------------------------------------- */}

      <ComponentSample
        title="Streak Display"
        description="Shows the current consecutive cleaning streak alongside the personal best. Uses a warm orange card to evoke the 'fire' metaphor."
      >
        <div className="w-full max-w-sm space-y-4">
          <CleanStreakDisplay streak={12} bestStreak={21} />
        </div>
      </ComponentSample>

      <section className="space-y-4">
        <h3 className="text-lg font-bold font-heading">Streak Variations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <CleanStreakDisplay streak={1} bestStreak={1} />
            <p className="text-xs text-muted-foreground text-center mt-2">
              Day 1 -- fresh start
            </p>
          </div>
          <div className="space-y-1">
            <CleanStreakDisplay streak={7} bestStreak={14} />
            <p className="text-xs text-muted-foreground text-center mt-2">
              One week strong
            </p>
          </div>
          <div className="space-y-1">
            <CleanStreakDisplay streak={30} bestStreak={30} />
            <p className="text-xs text-muted-foreground text-center mt-2">
              New personal best!
            </p>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Level Indicator (inline version)                                   */}
      {/* ----------------------------------------------------------------- */}

      <ComponentSample
        title="Level Indicator"
        description="Shows the user's current level and XP progress toward the next level. Uses a glowing progress bar to emphasize momentum."
      >
        <div className="w-full max-w-md space-y-8">
          {[
            { level: 1, current: 75, next: 100, label: "75 / 100 XP" },
            { level: 5, current: 1500, next: 2000, label: "1,500 / 2,000 XP" },
            {
              level: 12,
              current: 85000,
              next: 100000,
              label: "85,000 / 100,000 XP",
            },
          ].map(({ level, current, next, label }) => (
            <div key={level} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Level {level}</span>
                </div>
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
              <Progress value={(current / next) * 100} variant="default" glow />
              <p className="text-xs text-muted-foreground">
                {(next - current).toLocaleString()} XP to Level {level + 1}
              </p>
            </div>
          ))}
        </div>
      </ComponentSample>

      {/* ----------------------------------------------------------------- */}
      {/* Achievement Grid                                                   */}
      {/* ----------------------------------------------------------------- */}

      <ComponentSample
        title="Achievement Grid"
        description="A responsive grid of unlocked and locked achievements. Unlocked achievements display a gold trophy and the date earned; locked ones show a padlock at reduced opacity."
      >
        <div className="w-full">
          <CleanAchievementGrid achievements={mockAchievements} />
        </div>
      </ComponentSample>

      {/* ----------------------------------------------------------------- */}
      {/* Skip Dialog Preview                                                */}
      {/* ----------------------------------------------------------------- */}

      <ComponentSample
        title="Skip Dialog"
        description="When a user skips a task, a gentle dialog asks for an optional reason. The tone is encouraging and judgment-free: 'Totally fine! You can come back to this later.'"
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-base">Skip this task?</CardTitle>
            <p className="text-sm text-muted-foreground">
              Totally fine! You can come back to this later. No pressure at all.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm font-medium text-foreground/80 px-1">
              &ldquo;Scrub bathroom tiles and clean mirrors&rdquo;
            </p>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-muted-foreground">
              Reason (optional) - e.g., need supplies, too tired right now...
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm">Keep it</Button>
              <Button size="sm">Skip for now</Button>
            </div>
          </CardContent>
        </Card>
      </ComponentSample>

      {/* ----------------------------------------------------------------- */}
      {/* Dashboard Preview                                                  */}
      {/* ----------------------------------------------------------------- */}

      <ComponentSample
        title="Dashboard"
        description="The main CleanSweep dashboard combines streak, points, level progress, the CTA button, and recent session history into a single motivating view."
      >
        <div className="w-full max-w-md space-y-6">
          {/* Streak + Points Row */}
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <CleanStreakDisplay streak={12} bestStreak={21} />
            </div>
            <CleanPointsBadge points={4850} />
          </div>

          {/* Level Progress */}
          <Card>
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Level 7</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  4,850 / 8,000 XP
                </span>
              </div>
              <Progress value={(4850 / 8000) * 100} variant="default" glow />
              <p className="text-xs text-muted-foreground">
                3,150 XP to Level 8
              </p>
            </CardContent>
          </Card>

          {/* Start CTA */}
          <Button
            size="lg"
            className="w-full gap-2 text-lg h-16 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-0 shadow-xl shadow-emerald-900/20"
          >
            <Sparkles className="h-6 w-6 animate-pulse" />
            <span className="font-black tracking-tight">
              START CLEANING MISSION
            </span>
            <ArrowRight className="h-6 w-6" />
          </Button>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                Mission Available
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Complete 3 tasks today to maintain your streak!
              </p>
            </div>
          </div>

          {/* Recent Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-6 pt-0">
              {[
                { tasks: 6, time: "2 hours ago", points: 95 },
                { tasks: 4, time: "Yesterday", points: 60 },
                { tasks: 8, time: "2 days ago", points: 145 },
              ].map(session => (
                <div
                  key={session.time}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{session.tasks} tasks</p>
                    <p className="text-xs text-muted-foreground">
                      {session.time}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-green-400">
                    +{session.points} pts
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </ComponentSample>

      {/* ----------------------------------------------------------------- */}
      {/* Gamification Mechanics                                             */}
      {/* ----------------------------------------------------------------- */}

      <section className="space-y-6">
        <h2 className="text-2xl font-bold font-heading">
          Gamification Mechanics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="glass-1">
            <CardContent className="pt-6 space-y-2">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                <span className="font-semibold text-sm">Points System</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tasks award 5-35 points based on difficulty. Bonus points for verification photos
                (+5), zero skips (+25), and completing all tasks (+50).
              </p>
            </CardContent>
          </Card>
          <Card className="glass-1">
            <CardContent className="pt-6 space-y-2">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-400" />
                <span className="font-semibold text-sm">Streak Bonus</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Each consecutive day adds a streak bonus equal to streak x 2. A 10-day streak earns
                20 bonus points per session.
              </p>
            </CardContent>
          </Card>
          <Card className="glass-1">
            <CardContent className="pt-6 space-y-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <span className="font-semibold text-sm">Level Thresholds</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Fibonacci-style XP thresholds: 100, 250, 500, 1K, 2K, 4K, 8K, 15K, 25K, 40K, 65K,
                100K and beyond. Each level unlocks new titles.
              </p>
            </CardContent>
          </Card>
          <Card className="glass-1">
            <CardContent className="pt-6 space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold text-sm">15 Achievements</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                From &ldquo;First Steps&rdquo; to &ldquo;Legendary Cleaner&rdquo;. Includes streak
                milestones, task count goals, speed challenges, and time-of-day badges.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Code Preview                                                       */}
      {/* ----------------------------------------------------------------- */}

      <CodePreview
        code={codeSnippets.taskCard}
        title="Usage Examples"
        tabs={[
          { label: "Task Card", code: codeSnippets.taskCard },
          { label: "Progress Bar", code: codeSnippets.progressBar },
          { label: "Streak", code: codeSnippets.streakDisplay },
          { label: "Achievements", code: codeSnippets.achievementGrid },
        ]}
      />

      {/* ----------------------------------------------------------------- */}
      {/* Accessibility                                                      */}
      {/* ----------------------------------------------------------------- */}

      <AccessibilityPanel
        notes={[
          "Task cards use semantic HTML with clear visual hierarchy for screen readers.",
          "Category colors are supplemented with text labels -- never color-only indicators.",
          "Progress bars include percentage text alongside the visual bar for assistive tech.",
          "Skip dialog is keyboard-navigable with proper focus trapping via Radix Dialog.",
          "Achievement locked/unlocked states use both icons (Trophy vs Lock) and opacity for multiple cues.",
          "All interactive elements meet the 44px minimum touch target guideline.",
          "Streak and point displays use live regions for dynamic updates.",
          "Animations respect prefers-reduced-motion via Tailwind defaults.",
        ]}
      />

      <RelatedComponents currentId="clean" />
    </div>
  );
}
