-- Baseline migration for the home page widget feature.
-- Ensures enums and the backing table exist for future alterations.

DO $$
BEGIN
  CREATE TYPE "HomeWidgetType" AS ENUM (
    'WELCOME_MESSAGE',
    'RECENT_ANNOUNCEMENTS',
    'UPCOMING_EVENTS',
    'TEAM_STATS',
    'QUICK_ACTIONS',
    'RECENT_ACTIVITY',
    'UPCOMING_TESTS',
    'CALENDAR_PREVIEW',
    'ATTENDANCE_SUMMARY',
    'FINANCE_OVERVIEW',
    'IMPORTANT_LINKS',
    'CUSTOM_TEXT'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "WidgetWidth" AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'FULL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "WidgetHeight" AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'AUTO');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "HomePageWidget" (
  "id" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "widgetType" "HomeWidgetType" NOT NULL,
  "title" TEXT,
  "position" INTEGER NOT NULL DEFAULT 0,
  "width" "WidgetWidth" NOT NULL DEFAULT 'MEDIUM',
  "height" "WidgetHeight" NOT NULL DEFAULT 'MEDIUM',
  "isVisible" BOOLEAN NOT NULL DEFAULT TRUE,
  "config" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HomePageWidget_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HomePageWidget_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "HomePageWidget_teamId_idx" ON "HomePageWidget" ("teamId");
CREATE INDEX IF NOT EXISTS "HomePageWidget_position_idx" ON "HomePageWidget" ("position");
CREATE INDEX IF NOT EXISTS "HomePageWidget_isVisible_idx" ON "HomePageWidget" ("isVisible");

