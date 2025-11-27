-- Add gradientColors array column to Team table
ALTER TABLE "Team"
ADD COLUMN IF NOT EXISTS "gradientColors" TEXT[] DEFAULT '{}';

-- Add gradientColors array column to MemberPreferences table
ALTER TABLE "MemberPreferences"
ADD COLUMN IF NOT EXISTS "gradientColors" TEXT[] DEFAULT '{}';

-- Migrate existing gradientStartColor and gradientEndColor to gradientColors array
-- For Team table
UPDATE "Team"
SET "gradientColors" = ARRAY["gradientStartColor", "gradientEndColor"]
WHERE "gradientStartColor" IS NOT NULL 
  AND "gradientEndColor" IS NOT NULL
  AND "backgroundType" = 'gradient'
  AND ("gradientColors" IS NULL OR array_length("gradientColors", 1) IS NULL);

-- For MemberPreferences table
UPDATE "MemberPreferences"
SET "gradientColors" = ARRAY["gradientStartColor", "gradientEndColor"]
WHERE "gradientStartColor" IS NOT NULL 
  AND "gradientEndColor" IS NOT NULL
  AND "backgroundType" = 'gradient'
  AND ("gradientColors" IS NULL OR array_length("gradientColors", 1) IS NULL);

