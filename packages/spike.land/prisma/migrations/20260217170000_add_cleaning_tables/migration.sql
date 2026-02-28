-- CreateEnum
CREATE TYPE "CleaningSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "CleaningTaskStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'SKIPPED', 'VERIFIED', 'DEFERRED');

-- CreateEnum
CREATE TYPE "CleaningTaskCategory" AS ENUM ('PICKUP', 'DISHES', 'LAUNDRY', 'SURFACES', 'FLOORS', 'TRASH', 'ORGANIZE', 'OTHER');

-- CreateEnum
CREATE TYPE "CleaningTaskDifficulty" AS ENUM ('QUICK', 'EASY', 'MEDIUM', 'EFFORT');

-- CreateEnum
CREATE TYPE "AchievementType" AS ENUM ('FIRST_SESSION', 'THREE_DAY_STREAK', 'SEVEN_DAY_STREAK', 'THIRTY_DAY_STREAK', 'HUNDRED_TASKS', 'THOUSAND_TASKS', 'SPEED_DEMON', 'ROOM_CLEAR', 'SKIP_ZERO', 'COMEBACK_KID', 'EARLY_BIRD', 'NIGHT_OWL', 'LEVEL_5', 'LEVEL_10', 'LEVEL_20');

-- CreateEnum
CREATE TYPE "CleaningReminderDay" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

-- CreateTable
CREATE TABLE "cleaning_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "CleaningSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "totalTasks" INTEGER NOT NULL DEFAULT 0,
    "completedTasks" INTEGER NOT NULL DEFAULT 0,
    "skippedTasks" INTEGER NOT NULL DEFAULT 0,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "roomLabel" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "cleaning_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cleaning_tasks" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "CleaningTaskStatus" NOT NULL DEFAULT 'PENDING',
    "category" "CleaningTaskCategory" NOT NULL DEFAULT 'OTHER',
    "difficulty" "CleaningTaskDifficulty" NOT NULL DEFAULT 'EASY',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "skippedReason" TEXT,
    "pointsValue" INTEGER NOT NULL DEFAULT 10,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "cleaning_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cleaning_streaks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "totalTasks" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "lastSessionDate" TIMESTAMP(3),

    CONSTRAINT "cleaning_streaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cleaning_achievements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementType" "AchievementType" NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "cleaning_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cleaning_reminders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "days" "CleaningReminderDay"[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "message" TEXT,

    CONSTRAINT "cleaning_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cleaning_sessions_userId_idx" ON "cleaning_sessions"("userId");

-- CreateIndex
CREATE INDEX "cleaning_sessions_status_idx" ON "cleaning_sessions"("status");

-- CreateIndex
CREATE INDEX "cleaning_sessions_date_idx" ON "cleaning_sessions"("date");

-- CreateIndex
CREATE INDEX "cleaning_tasks_sessionId_idx" ON "cleaning_tasks"("sessionId");

-- CreateIndex
CREATE INDEX "cleaning_tasks_status_idx" ON "cleaning_tasks"("status");

-- CreateIndex
CREATE UNIQUE INDEX "cleaning_streaks_userId_key" ON "cleaning_streaks"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "cleaning_achievements_userId_achievementType_key" ON "cleaning_achievements"("userId", "achievementType");

-- CreateIndex
CREATE INDEX "cleaning_achievements_userId_idx" ON "cleaning_achievements"("userId");

-- CreateIndex
CREATE INDEX "cleaning_reminders_userId_idx" ON "cleaning_reminders"("userId");

-- AddForeignKey
ALTER TABLE "cleaning_sessions" ADD CONSTRAINT "cleaning_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cleaning_tasks" ADD CONSTRAINT "cleaning_tasks_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "cleaning_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cleaning_streaks" ADD CONSTRAINT "cleaning_streaks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cleaning_achievements" ADD CONSTRAINT "cleaning_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cleaning_reminders" ADD CONSTRAINT "cleaning_reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
