-- Add background customization fields to Team table
ALTER TABLE "Team" 
ADD COLUMN IF NOT EXISTS "backgroundType" TEXT NOT NULL DEFAULT 'grid',
ADD COLUMN IF NOT EXISTS "backgroundColor" TEXT,
ADD COLUMN IF NOT EXISTS "gradientStartColor" TEXT,
ADD COLUMN IF NOT EXISTS "gradientEndColor" TEXT;

