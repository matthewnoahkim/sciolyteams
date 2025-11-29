-- Add subteamId column to TournamentRegistration
ALTER TABLE "TournamentRegistration" 
  ADD COLUMN IF NOT EXISTS "subteamId" TEXT;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'TournamentRegistration_subteamId_fkey'
  ) THEN
    ALTER TABLE "TournamentRegistration" 
      ADD CONSTRAINT "TournamentRegistration_subteamId_fkey" 
      FOREIGN KEY ("subteamId") REFERENCES "Subteam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Drop old unique constraint and create new one that includes subteamId
-- PostgreSQL's unique constraints treat NULL as distinct, so multiple NULLs are allowed
-- This means: one registration per tournament+team with NULL subteam, and multiple with different subteams
DROP INDEX IF EXISTS "TournamentRegistration_tournamentId_teamId_key";
DROP INDEX IF EXISTS "TournamentRegistration_tournamentId_teamId_subteamId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "TournamentRegistration_tournamentId_teamId_subteamId_key" 
  ON "TournamentRegistration"("tournamentId", "teamId", "subteamId");

-- Add index for subteamId
CREATE INDEX IF NOT EXISTS "TournamentRegistration_subteamId_idx" ON "TournamentRegistration"("subteamId");

