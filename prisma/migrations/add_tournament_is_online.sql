-- Add isOnline column to Tournament table
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "isOnline" BOOLEAN NOT NULL DEFAULT false;

