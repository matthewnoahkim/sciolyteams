-- Add background customization fields to member preferences
ALTER TABLE "MemberPreferences"
ADD COLUMN IF NOT EXISTS "backgroundType" TEXT,
ADD COLUMN IF NOT EXISTS "backgroundColor" TEXT,
ADD COLUMN IF NOT EXISTS "gradientStartColor" TEXT,
ADD COLUMN IF NOT EXISTS "gradientEndColor" TEXT,
ADD COLUMN IF NOT EXISTS "backgroundImageUrl" TEXT;

-- Ensure array fields have sane defaults for easier upserts
ALTER TABLE "MemberPreferences"
ALTER COLUMN "preferredEvents" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "avoidEvents" SET DEFAULT ARRAY[]::TEXT[];

