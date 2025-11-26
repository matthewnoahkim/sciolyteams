-- Add ownerId column to widgets so each user can manage their own layout
ALTER TABLE "HomePageWidget"
ADD COLUMN "ownerId" TEXT;

-- Create indices to speed up per-user queries
CREATE INDEX "HomePageWidget_ownerId_idx" ON "HomePageWidget" ("ownerId");
CREATE INDEX "HomePageWidget_teamId_ownerId_idx" ON "HomePageWidget" ("teamId", "ownerId");

-- Link widgets to users (cascade delete so a departing user cleans up their widgets)
ALTER TABLE "HomePageWidget"
ADD CONSTRAINT "HomePageWidget_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

