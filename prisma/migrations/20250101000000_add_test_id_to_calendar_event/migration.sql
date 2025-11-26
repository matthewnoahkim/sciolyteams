-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN "testId" TEXT;

-- CreateIndex
CREATE INDEX "CalendarEvent_testId_idx" ON "CalendarEvent"("testId");

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE SET NULL ON UPDATE CASCADE;

