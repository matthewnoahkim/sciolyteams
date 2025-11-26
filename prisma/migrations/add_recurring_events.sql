-- Add recurrence fields to CalendarEvent
ALTER TABLE "CalendarEvent" ADD COLUMN "isRecurring" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CalendarEvent" ADD COLUMN "recurrenceRule" TEXT; -- DAILY, WEEKLY, MONTHLY, YEARLY
ALTER TABLE "CalendarEvent" ADD COLUMN "recurrenceInterval" INTEGER DEFAULT 1; -- every N days/weeks/months
ALTER TABLE "CalendarEvent" ADD COLUMN "recurrenceDaysOfWeek" INTEGER[]; -- [0,1,2,3,4,5,6] for Sun-Sat
ALTER TABLE "CalendarEvent" ADD COLUMN "recurrenceEndDate" TIMESTAMP(3); -- when recurrence ends
ALTER TABLE "CalendarEvent" ADD COLUMN "recurrenceCount" INTEGER; -- alternatively, number of occurrences
ALTER TABLE "CalendarEvent" ADD COLUMN "parentEventId" TEXT; -- link to parent recurring event
ALTER TABLE "CalendarEvent" ADD COLUMN "recurrenceExceptions" TIMESTAMP(3)[]; -- dates to skip

-- Add foreign key for parent event
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_parentEventId_fkey" FOREIGN KEY ("parentEventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add indexes
CREATE INDEX "CalendarEvent_parentEventId_idx" ON "CalendarEvent"("parentEventId");
CREATE INDEX "CalendarEvent_isRecurring_idx" ON "CalendarEvent"("isRecurring");

