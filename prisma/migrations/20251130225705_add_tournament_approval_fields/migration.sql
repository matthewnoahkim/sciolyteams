-- Add approved field to Tournament table (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Tournament' AND column_name = 'approved'
  ) THEN
    ALTER TABLE "Tournament" ADD COLUMN "approved" BOOLEAN NOT NULL DEFAULT false;
    CREATE INDEX IF NOT EXISTS "Tournament_approved_idx" ON "Tournament"("approved");
  END IF;
END $$;

-- Add rejectionReason field to Tournament table (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Tournament' AND column_name = 'rejectionReason'
  ) THEN
    ALTER TABLE "Tournament" ADD COLUMN "rejectionReason" TEXT;
  END IF;
END $$;

