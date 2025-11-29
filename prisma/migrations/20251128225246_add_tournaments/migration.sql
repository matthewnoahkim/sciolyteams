-- CreateEnum
DO $$
BEGIN
  CREATE TYPE "TournamentRegistrationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Tournament" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "division" "Division" NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TournamentAdmin" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TournamentRegistration" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "registeredById" TEXT NOT NULL,
    "status" "TournamentRegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TournamentEventSelection" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentEventSelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TournamentTest" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "eventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentTest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Tournament_createdById_idx" ON "Tournament"("createdById");
CREATE INDEX IF NOT EXISTS "Tournament_date_idx" ON "Tournament"("date");
CREATE INDEX IF NOT EXISTS "Tournament_division_idx" ON "Tournament"("division");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "TournamentAdmin_tournamentId_userId_key" ON "TournamentAdmin"("tournamentId", "userId");
CREATE INDEX IF NOT EXISTS "TournamentAdmin_tournamentId_idx" ON "TournamentAdmin"("tournamentId");
CREATE INDEX IF NOT EXISTS "TournamentAdmin_userId_idx" ON "TournamentAdmin"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "TournamentRegistration_tournamentId_teamId_key" ON "TournamentRegistration"("tournamentId", "teamId");
CREATE INDEX IF NOT EXISTS "TournamentRegistration_tournamentId_idx" ON "TournamentRegistration"("tournamentId");
CREATE INDEX IF NOT EXISTS "TournamentRegistration_teamId_idx" ON "TournamentRegistration"("teamId");
CREATE INDEX IF NOT EXISTS "TournamentRegistration_registeredById_idx" ON "TournamentRegistration"("registeredById");
CREATE INDEX IF NOT EXISTS "TournamentRegistration_status_idx" ON "TournamentRegistration"("status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "TournamentEventSelection_registrationId_eventId_key" ON "TournamentEventSelection"("registrationId", "eventId");
CREATE INDEX IF NOT EXISTS "TournamentEventSelection_registrationId_idx" ON "TournamentEventSelection"("registrationId");
CREATE INDEX IF NOT EXISTS "TournamentEventSelection_eventId_idx" ON "TournamentEventSelection"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "TournamentTest_tournamentId_testId_key" ON "TournamentTest"("tournamentId", "testId");
CREATE INDEX IF NOT EXISTS "TournamentTest_tournamentId_idx" ON "TournamentTest"("tournamentId");
CREATE INDEX IF NOT EXISTS "TournamentTest_testId_idx" ON "TournamentTest"("testId");
CREATE INDEX IF NOT EXISTS "TournamentTest_eventId_idx" ON "TournamentTest"("eventId");

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentAdmin" ADD CONSTRAINT "TournamentAdmin_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TournamentAdmin" ADD CONSTRAINT "TournamentAdmin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentRegistration" ADD CONSTRAINT "TournamentRegistration_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TournamentRegistration" ADD CONSTRAINT "TournamentRegistration_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TournamentRegistration" ADD CONSTRAINT "TournamentRegistration_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentEventSelection" ADD CONSTRAINT "TournamentEventSelection_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "TournamentRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TournamentEventSelection" ADD CONSTRAINT "TournamentEventSelection_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentTest" ADD CONSTRAINT "TournamentTest_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TournamentTest" ADD CONSTRAINT "TournamentTest_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TournamentTest" ADD CONSTRAINT "TournamentTest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

