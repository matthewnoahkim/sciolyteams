-- Add createdByStaffId column to ESTest table (nullable first, then update, then make NOT NULL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ESTest' AND column_name = 'createdByStaffId'
  ) THEN
    -- Add column as nullable first
    ALTER TABLE "ESTest" ADD COLUMN "createdByStaffId" TEXT;
    
    -- Update existing records to set createdByStaffId = staffId (for existing tests)
    -- This handles the case where there are already rows in the table
    UPDATE "ESTest" SET "createdByStaffId" = "staffId" WHERE "createdByStaffId" IS NULL;
    
    -- Now make it NOT NULL (this will work because we've updated all existing rows)
    ALTER TABLE "ESTest" ALTER COLUMN "createdByStaffId" SET NOT NULL;
    
    -- Add foreign key constraint for createdByStaffId (drop if exists first)
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'ESTest_createdByStaffId_fkey' 
      AND table_name = 'ESTest'
    ) THEN
      ALTER TABLE "ESTest" DROP CONSTRAINT "ESTest_createdByStaffId_fkey";
    END IF;
    
    ALTER TABLE "ESTest" 
      ADD CONSTRAINT "ESTest_createdByStaffId_fkey" 
      FOREIGN KEY ("createdByStaffId") 
      REFERENCES "TournamentStaff"("id") 
      ON DELETE CASCADE;
    
    -- Create index for createdByStaffId
    CREATE INDEX IF NOT EXISTS "ESTest_createdByStaffId_idx" ON "ESTest"("createdByStaffId");
  END IF;
END $$;

-- Update foreign key constraint name for staffId (if needed, drop and recreate with unique name)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'ESTest_staffId_fkey' 
    AND table_name = 'ESTest'
  ) THEN
    -- Drop old constraint if it exists
    ALTER TABLE "ESTest" DROP CONSTRAINT "ESTest_staffId_fkey";
  END IF;
  
  -- Add new constraint with explicit name
  ALTER TABLE "ESTest" 
    ADD CONSTRAINT "ESTest_staffId_fkey" 
    FOREIGN KEY ("staffId") 
    REFERENCES "TournamentStaff"("id") 
    ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

