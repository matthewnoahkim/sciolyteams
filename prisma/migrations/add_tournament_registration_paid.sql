-- Add paid column to TournamentRegistration table
ALTER TABLE "TournamentRegistration" ADD COLUMN IF NOT EXISTS "paid" BOOLEAN NOT NULL DEFAULT false;

