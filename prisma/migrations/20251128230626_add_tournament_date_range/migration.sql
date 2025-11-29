-- Add startDate and endDate columns, migrate existing data, then drop old date column
ALTER TABLE "Tournament" 
  ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP(3);

-- Migrate existing data: use date for both startDate and endDate
UPDATE "Tournament" 
SET 
  "startDate" = COALESCE("date", NOW()),
  "endDate" = COALESCE("date", NOW())
WHERE "startDate" IS NULL OR "endDate" IS NULL;

-- Make columns required (only if they're still nullable)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Tournament' 
    AND column_name = 'startDate' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE "Tournament" ALTER COLUMN "startDate" SET NOT NULL;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Tournament' 
    AND column_name = 'endDate' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE "Tournament" ALTER COLUMN "endDate" SET NOT NULL;
  END IF;
END $$;

-- Drop old date column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Tournament' 
    AND column_name = 'date'
  ) THEN
    ALTER TABLE "Tournament" DROP COLUMN "date";
  END IF;
END $$;

-- Update indexes
DROP INDEX IF EXISTS "Tournament_date_idx";
CREATE INDEX IF NOT EXISTS "Tournament_startDate_idx" ON "Tournament"("startDate");
CREATE INDEX IF NOT EXISTS "Tournament_endDate_idx" ON "Tournament"("endDate");

