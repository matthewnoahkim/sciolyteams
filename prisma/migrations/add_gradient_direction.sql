-- Add gradientDirection column to Team table
ALTER TABLE "Team"
ADD COLUMN IF NOT EXISTS "gradientDirection" TEXT;

-- Add gradientDirection column to MemberPreferences table
ALTER TABLE "MemberPreferences"
ADD COLUMN IF NOT EXISTS "gradientDirection" TEXT;

-- Set default value for existing gradients (135deg is the current default)
UPDATE "Team"
SET "gradientDirection" = '135deg'
WHERE "backgroundType" = 'gradient' 
  AND "gradientDirection" IS NULL;

UPDATE "MemberPreferences"
SET "gradientDirection" = '135deg'
WHERE "backgroundType" = 'gradient' 
  AND "gradientDirection" IS NULL;

