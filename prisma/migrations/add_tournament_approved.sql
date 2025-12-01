-- Add approved field to Tournament table
ALTER TABLE "Tournament" ADD COLUMN "approved" BOOLEAN NOT NULL DEFAULT false;

-- Create index on approved field for faster filtering
CREATE INDEX "Tournament_approved_idx" ON "Tournament"("approved");

