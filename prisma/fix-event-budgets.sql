-- Fix EventBudget table: remove duplicates and drop subteamId
-- This script handles the migration from subteam-based budgets to team-based budgets

-- Step 1: Remove duplicate budgets, keeping the one with the highest maxBudget
DELETE FROM "EventBudget" a
USING "EventBudget" b
WHERE a.id < b.id
  AND a."teamId" = b."teamId"
  AND a."eventId" = b."eventId";

-- Step 2: Drop the subteamId column (if it exists)
ALTER TABLE "EventBudget" DROP COLUMN IF EXISTS "subteamId";

-- Step 3: Add unique constraint (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'EventBudget_teamId_eventId_key'
    ) THEN
        ALTER TABLE "EventBudget" 
        ADD CONSTRAINT "EventBudget_teamId_eventId_key" 
        UNIQUE ("teamId", "eventId");
    END IF;
END $$;

