-- AlterEnum: Rename TestAssignmentScope values from TEAM/SUBTEAM to CLUB/TEAM
-- This migration renames the enum values by creating a new enum and migrating data

-- Step 1: Create a new enum with the desired values
CREATE TYPE "TestAssignmentScope_new" AS ENUM ('CLUB', 'TEAM', 'PERSONAL');

-- Step 2: Alter the column to use the new enum type with data transformation
-- Map old TEAM -> new CLUB, old SUBTEAM -> new TEAM, old PERSONAL -> new PERSONAL
ALTER TABLE "TestAssignment" 
  ALTER COLUMN "assignedScope" TYPE "TestAssignmentScope_new" 
  USING (
    CASE 
      WHEN "assignedScope"::text = 'TEAM' THEN 'CLUB'::text
      WHEN "assignedScope"::text = 'SUBTEAM' THEN 'TEAM'::text
      ELSE "assignedScope"::text
    END
  )::"TestAssignmentScope_new";

-- Step 3: Drop the old enum
DROP TYPE "TestAssignmentScope";

-- Step 4: Rename the new enum to the original name
ALTER TYPE "TestAssignmentScope_new" RENAME TO "TestAssignmentScope";

