-- Rename invite code columns on Team
ALTER TABLE "Team" RENAME COLUMN "captainInviteCodeHash" TO "adminInviteCodeHash";
ALTER TABLE "Team" RENAME COLUMN "captainInviteCodeEncrypted" TO "adminInviteCodeEncrypted";

-- Update role enum value from CAPTAIN to ADMIN
ALTER TYPE "Role" RENAME VALUE 'CAPTAIN' TO 'ADMIN';

