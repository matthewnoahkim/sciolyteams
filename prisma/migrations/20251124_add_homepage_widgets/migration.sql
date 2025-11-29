-- CreateEnum
CREATE TYPE "HomeWidgetType" AS ENUM ('WELCOME_MESSAGE', 'RECENT_ANNOUNCEMENTS', 'UPCOMING_EVENTS', 'TEAM_STATS', 'QUICK_ACTIONS', 'RECENT_ACTIVITY', 'UPCOMING_TESTS', 'CALENDAR_PREVIEW', 'ATTENDANCE_SUMMARY', 'FINANCE_OVERVIEW', 'IMPORTANT_LINKS', 'CUSTOM_TEXT');

-- CreateEnum
CREATE TYPE "WidgetWidth" AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'FULL');

-- CreateEnum
CREATE TYPE "WidgetHeight" AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'AUTO');

-- CreateTable
CREATE TABLE "HomePageWidget" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "widgetType" "HomeWidgetType" NOT NULL,
    "title" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "width" "WidgetWidth" NOT NULL DEFAULT 'MEDIUM',
    "height" "WidgetHeight" NOT NULL DEFAULT 'MEDIUM',
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomePageWidget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomePageWidget_teamId_idx" ON "HomePageWidget"("teamId");

-- CreateIndex
CREATE INDEX "HomePageWidget_position_idx" ON "HomePageWidget"("position");

-- CreateIndex
CREATE INDEX "HomePageWidget_isVisible_idx" ON "HomePageWidget"("isVisible");

-- AddForeignKey
ALTER TABLE "HomePageWidget" ADD CONSTRAINT "HomePageWidget_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

